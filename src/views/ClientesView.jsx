import React, { useEffect, useState } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Save,
    Search as SearchIcon
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
            <header className="header">
                <div className="header-titles">
                    <h1>Clientes</h1>
                    <p>Gerencie seus clientes</p>
                </div>
                <div className="header-actions">
                    <button className="btn-orange" onClick={() => openClientModal()}>
                        <Plus size={16} />
                        Novo Cliente
                    </button>
                </div>
            </header>

            <div className="search-section">
                <div className="search-input-wrapper">
                    <SearchIcon size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Pesquisar cliente por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-card">
                <div className="table-title-container">
                    <Users size={20} className="title-icon" />
                    <h3>Lista de Clientes</h3>
                </div>
                <div className="table-responsive">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th>Observações</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Carregando clientes...</td></tr>
                            ) : filteredClientes.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum cliente encontrado.</td></tr>
                            ) : (
                                filteredClientes.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.nome}</td>
                                        <td style={{ color: '#94a3b8' }}>{c.email || '-'}</td>
                                        <td style={{ color: '#94a3b8' }}>{c.telefone || '-'}</td>
                                        <td style={{ color: '#94a3b8' }}>{c.observacoes || '-'}</td>
                                        <td className="actions-cell">
                                            <button className="action-btn price-btn" title="Preços Personalizados" onClick={() => openPriceModal(c)}>$</button>
                                            <button className="action-btn" onClick={() => openClientModal(c)} title="Editar"><Edit3 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClient(c.id)} title="Excluir"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h2>Configurar Preços para {selectedCliente?.nome}</h2>
                                <p>Configure preços personalizados para este cliente. Deixe vazio para usar o preço padrão.</p>
                            </div>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-table-container">
                                <table className="modal-table">
                                    <thead>
                                        <tr>
                                            <th>Produto</th>
                                            <th>Preço Padrão</th>
                                            <th>Preço Personalizado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {produtos.map(p => (
                                            <tr key={p.id}>
                                                <td className="product-name-cell">{p.nome}</td>
                                                <td style={{ color: '#94a3b8' }}>{formatCurrency(p.preco_unitario)}</td>
                                                <td>
                                                    <div className="price-input-wrapper">
                                                        <input
                                                            type="text"
                                                            className="price-input"
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
