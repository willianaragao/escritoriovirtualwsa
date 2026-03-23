import React, { useEffect, useState } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Save,
    Search as SearchIcon,
    DollarSign,
    Phone,
    Mail,
    User,
    FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ClientesView.css';

const ClientesView = ({ user }) => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [produtos, setProdutos] = useState([]);
    const [customPrices, setCustomPrices] = useState({});
    const [saving, setSaving] = useState(false);
    const [savingClient, setSavingClient] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [clientForm, setClientForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        observacoes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: clientsData, error: clientErr } = await supabase
                .from('clientes')
                .select('*')
                .order('nome', { ascending: true });

            if (clientErr) throw clientErr;
            setClientes(clientsData || []);

            const { data: prodData } = await supabase
                .from('produtos')
                .select('*')
                .order('nome', { ascending: true });

            setProdutos(prodData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openPriceModal = async (cliente) => {
        setSelectedCliente(cliente);
        setIsModalOpen(true);
        // Fetch existing custom prices for this cliente
        try {
            const { data, error } = await supabase
                .from('clientes_produtos_precos')
                .select('*')
                .eq('cliente_id', cliente.id);

            if (error) throw error;

            const pricesMap = {};
            data?.forEach(p => {
                pricesMap[p.produto_id] = p.preco_personalizado;
            });
            setCustomPrices(pricesMap);
        } catch (err) {
            console.error('Error fetching custom prices:', err);
            setCustomPrices({});
        }
    };

    const openClientModal = (cliente = null) => {
        if (cliente) {
            setSelectedCliente(cliente);
            setClientForm({
                nome: cliente.nome || '',
                email: cliente.email || '',
                telefone: cliente.telefone || '',
                observacoes: cliente.observacoes || ''
            });
        } else {
            setSelectedCliente(null);
            setClientForm({
                nome: '',
                email: '',
                telefone: '',
                observacoes: ''
            });
        }
        setIsClientModalOpen(true);
    };

    const handleSaveClient = async () => {
        if (!clientForm.nome) {
            alert('O nome do cliente é obrigatório.');
            return;
        }

        setSavingClient(true);
        try {
            if (selectedCliente) {
                // Update
                const { error } = await supabase
                    .from('clientes')
                    .update({
                        ...clientForm,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedCliente.id);

                if (error) throw error;
                alert('Cliente atualizado com sucesso!');
            } else {
                // Insert
                const { error } = await supabase
                    .from('clientes')
                    .insert([{
                        ...clientForm,
                        user_id: user?.id
                    }]);

                if (error) throw error;
                alert('Cliente cadastrado com sucesso!');
            }
            setIsClientModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error saving client:', err);
            alert('Erro ao salvar cliente.');
        } finally {
            setSavingClient(false);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('Cliente excluído com sucesso!');
            fetchData();
        } catch (err) {
            console.error('Error deleting client:', err);
            alert('Erro ao excluir cliente. Verifique se existem pedidos vinculados a ele.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSavePrices = async () => {
        if (!selectedCliente) return;
        setSaving(true);
        try {
            // Logic: UPSERT into clientes_produtos_precos
            const upsertData = Object.entries(customPrices).map(([prodId, price]) => ({
                cliente_id: selectedCliente.id,
                produto_id: prodId,
                preco_personalizado: parseFloat(price) || 0
            }));

            // First delete existing to avoid complications with unique constraints if they aren't set up perfectly
            await supabase.from('clientes_produtos_precos').delete().eq('cliente_id', selectedCliente.id);

            if (upsertData.length > 0) {
                const { error } = await supabase.from('clientes_produtos_precos').insert(upsertData);
                if (error) throw error;
            }

            setIsModalOpen(false);
            alert('Preços salvos com sucesso!');
        } catch (err) {
            console.error('Error saving prices:', err);
            alert('Erro ao salvar preços.');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const filteredClientes = (clientes || []).filter(c =>
        c.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="clientes-view-container">
            <header className="header" style={{ padding: '0 2.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-titles">
                    <h1>Clientes</h1>
                    <p>Gerencie seus clientes de forma sofisticada</p>
                </div>
                <div className="header-actions">
                    <button className="btn-lux-primary" onClick={() => openClientModal()}>
                        <Plus size={18} />
                        Novo Cliente
                    </button>
                </div>
            </header>

            <div className="search-section" style={{ padding: '0 2.5rem', marginBottom: '2.5rem' }}>
                <div className="lux-search-wrapper">
                    <SearchIcon size={20} className="lux-search-icon" />
                    <input
                        type="text"
                        className="lux-search-input"
                        placeholder="Busque clientes por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="lux-search-glow"></div>
                </div>
            </div>

            <div className="clients-list-wrapper" style={{ padding: '0 2.5rem' }}>
                {loading ? (
                    <div className="empty-lux-state">
                        <div className="spinner-lux"></div>
                        <p>Carregando carteira de clientes...</p>
                    </div>
                ) : filteredClientes.length === 0 ? (
                    <div className="empty-lux-state">
                        <User size={48} className="empty-icon" />
                        <h3>Nenhum cliente encontrado</h3>
                        <p>Ainda não há clientes correspondentes à sua busca.</p>
                        <button className="btn-lux-outline" onClick={() => openClientModal()}>Adicionar Primeiro Cliente</button>
                    </div>
                ) : (
                    <div className="lux-clients-grid">
                        {filteredClientes.map((c) => {
                            const initials = c.nome ? c.nome.substring(0, 2).toUpperCase() : '👤';
                            return (
                                <div className="lux-client-card" key={c.id}>
                                    <div className="lux-card-glow"></div>
                                    <div className="card-top">
                                        <div className="client-avatar-lux">
                                            {initials}
                                        </div>
                                        <div className="client-info-lux">
                                            <h4>{c.nome}</h4>
                                            <div className="contact-pills">
                                                {c.telefone && <span className="pill"><Phone size={12}/> {c.telefone}</span>}
                                                {c.email && <span className="pill email-pill"><Mail size={12}/> {c.email}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card-middle">
                                        <div className="obs-box">
                                            <FileText size={14} className="obs-icon" />
                                            <p>{c.observacoes || 'Nenhuma observação cadastrada no perfil deste cliente.'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="card-actions-lux">
                                        <button className="action-lux-btn price" onClick={() => openPriceModal(c)} title="Tabela Personalizada">
                                            <DollarSign size={16} />
                                            <span>Preços</span>
                                        </button>
                                        <div className="right-actions">
                                            <button className="action-lux-btn edit" onClick={() => openClientModal(c)} title="Editar Prerfil">
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="action-lux-btn delete" onClick={() => handleDeleteClient(c.id)} title="Excluir Definitivamente">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Client Registration/Edit Modal */}
            {isClientModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h2>{selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                                <p>{selectedCliente ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}</p>
                            </div>
                            <button className="modal-close" onClick={() => setIsClientModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nome Completo*</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: João Silva"
                                    value={clientForm.nome}
                                    onChange={(e) => setClientForm({ ...clientForm, nome: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="email@exemplo.com"
                                        value={clientForm.email}
                                        onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="(00) 00000-0000"
                                        value={clientForm.telefone}
                                        onChange={(e) => setClientForm({ ...clientForm, telefone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Alguma observação importante sobre o cliente..."
                                    value={clientForm.observacoes}
                                    onChange={(e) => setClientForm({ ...clientForm, observacoes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsClientModalOpen(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSaveClient} disabled={savingClient}>
                                <Save size={18} />
                                {savingClient ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Customization Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '950px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>Configurar Preços para {selectedCliente?.nome}</h2>
                                <p>Configure preços personalizados para este cliente. Deixe vazio para usar o preço padrão.</p>
                            </div>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '85vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {/* PEAD Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <table className="modal-table">
                                        <thead>
                                            <tr>
                                                <th>Produto</th>
                                                <th>Preço Padrão</th>
                                                <th>Preço Personalizado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produtos.filter(p => !p.nome.toUpperCase().includes('PET')).map(p => (
                                                <tr key={p.id}>
                                                    <td className="product-name-cell">{p.nome}</td>
                                                    <td style={{ color: '#94a3b8' }}>{formatCurrency(p.preco_unitario)}</td>
                                                    <td>
                                                        <div className="price-input-wrapper">
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                style={{ paddingRight: '2.5rem' }}
                                                                placeholder="Deixe vazio para preço padrão"
                                                                value={customPrices[p.id] || ''}
                                                                onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                            />
                                                            {customPrices[p.id] && (
                                                                <button className="clear-input-btn" onClick={() => {
                                                                    const newPrices = { ...customPrices };
                                                                    delete newPrices[p.id];
                                                                    setCustomPrices(newPrices);
                                                                }}>
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ width: '320px', flexShrink: 0, textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tabela PEAD</span>
                                    <img src="/images/tabela_pead.png" alt="Tabela PEAD" style={{ width: '100%', height: '260px', objectFit: 'cover', objectPosition: 'center 85%', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', marginTop: '0.5rem' }} />
                                </div>
                            </div>

                            {/* PET Section */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <table className="modal-table">
                                        <thead>
                                            <tr>
                                                <th>Produto</th>
                                                <th>Preço Padrão</th>
                                                <th>Preço Personalizado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produtos.filter(p => p.nome.toUpperCase().includes('PET')).sort((a,b) => {
                                                const PET_ORDER = ['500ml Pet Redonda c/100', '500ml Pet Quadrada c/100', '300ml Pet Redonda c/100', '200ml Pet Redonda c/100', '1Litro Pet Redonda c/50'];
                                                let idxA = PET_ORDER.indexOf(a.nome);
                                                let idxB = PET_ORDER.indexOf(b.nome);
                                                if (idxA === -1) idxA = 999;
                                                if (idxB === -1) idxB = 999;
                                                return idxA - idxB;
                                            }).map(p => (
                                                <tr key={p.id}>
                                                    <td className="product-name-cell">{p.nome}</td>
                                                    <td style={{ color: '#94a3b8' }}>{formatCurrency(p.preco_unitario)}</td>
                                                    <td>
                                                        <div className="price-input-wrapper">
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                style={{ paddingRight: '2.5rem' }}
                                                                placeholder="Deixe vazio para preço padrão"
                                                                value={customPrices[p.id] || ''}
                                                                onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                            />
                                                            {customPrices[p.id] && (
                                                                <button className="clear-input-btn" onClick={() => {
                                                                    const newPrices = { ...customPrices };
                                                                    delete newPrices[p.id];
                                                                    setCustomPrices(newPrices);
                                                                }}>
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ width: '320px', flexShrink: 0, textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tabela PET</span>
                                    <img src="/images/tabela_pet.png" alt="Tabela PET" style={{ width: '100%', height: '310px', objectFit: 'cover', objectPosition: 'center 85%', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', marginTop: '0.5rem' }} />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSavePrices} disabled={saving}>
                                <Save size={18} />
                                {saving ? 'Salvando...' : 'Salvar Preços'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesView;
