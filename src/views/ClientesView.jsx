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
    FileText,
    MessageCircle
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
    const [waChoiceVisible, setWaChoiceVisible] = useState(false);
    const [priceCategory, setPriceCategory] = useState('PEAD'); // 'PEAD' or 'PET'
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        setWaChoiceVisible(false);
        setPriceCategory('PEAD');
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';

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

    const closePriceModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = 'auto';
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

    const handleSendPricesWhatsApp = (type) => { // type: 'pead', 'pet', 'both'
        if (!selectedCliente) return;

        const tel = selectedCliente.telefone || '';
        const cleanTel = tel.replace(/\D/g, '');
        if (!cleanTel) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        let msg = `*TABELA DE PREÇOS ATUALIZADA - ${selectedCliente.nome.toUpperCase()}*\n\n`;

        if (type === 'pead' || type === 'both') {
            const peadProds = produtos.filter(p => !p.nome.toUpperCase().includes('PET'));
            if (peadProds.length > 0) {
                msg += `*📦 UNIDADE PEAD:*\n`;
                msg += `----------------------------------\n`;
                peadProds.forEach(p => {
                    const priceRaw = customPrices[p.id];
                    const price = (priceRaw !== undefined && priceRaw !== '') 
                        ? parseFloat(priceRaw.toString().replace(',', '.')) 
                        : p.preco_unitario;
                    msg += `🔹 ${p.nome}: *${formatCurrency(price)}*\n`;
                });
                msg += `\n`;
            }
        }

        if (type === 'pet' || type === 'both') {
            const petProds = produtos.filter(p => p.nome.toUpperCase().includes('PET')).sort((a,b) => {
                const PET_ORDER = ['500ml Pet Redonda c/100', '500ml Pet Quadrada c/100', '300ml Pet Redonda c/100', '200ml Pet Redonda c/100', '1Litro Pet Redonda c/50'];
                let idxA = PET_ORDER.indexOf(a.nome);
                let idxB = PET_ORDER.indexOf(b.nome);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
            if (petProds.length > 0) {
                msg += `*📦 UNIDADE PET:*\n`;
                msg += `----------------------------------\n`;
                petProds.forEach(p => {
                    const priceRaw = customPrices[p.id];
                    const price = (priceRaw !== undefined && priceRaw !== '') 
                        ? parseFloat(priceRaw.toString().replace(',', '.')) 
                        : p.preco_unitario;
                    msg += `🔹 ${p.nome}: *${formatCurrency(price)}*\n`;
                });
                msg += `\n`;
            }
        }

        msg += `----------------------------------\n`;
        msg += `_Preços válidos para o período atual._\n`;
        msg += `_Qualquer dúvida, estamos à disposição!_`;

        const url = `https://api.whatsapp.com/send?phone=55${cleanTel}&text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        setWaChoiceVisible(false);
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
                    <div className="modal-content price-custom-modal">
                        <div className="modal-header">
                            <div>
                                <h2>Configurar Preços para {selectedCliente?.nome}</h2>
                                <p>Configure preços personalizados para este cliente. Deixe vazio para usar o preço padrão.</p>
                            </div>
                            <button className="btn-close" onClick={closePriceModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body price-modal-body">
                            {isMobile ? (
                                <>
                                    {/* Mobile Tabbed View */}
                                    <div className="price-tabs">
                                        <button 
                                            className={`price-tab ${priceCategory === 'PEAD' ? 'active' : ''}`}
                                            onClick={() => setPriceCategory('PEAD')}
                                        >
                                            Garrafas PEAD
                                        </button>
                                        <button 
                                            className={`price-tab ${priceCategory === 'PET' ? 'active' : ''}`}
                                            onClick={() => setPriceCategory('PET')}
                                        >
                                            Garrafas PET
                                        </button>
                                    </div>

                                    {priceCategory === 'PEAD' && (
                                        <div className="price-section-mobile">
                                            <table className="modal-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Padrão</th>
                                                        <th>Novo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produtos.filter(p => !p.nome.toUpperCase().includes('PET')).map(p => (
                                                        <tr key={p.id}>
                                                            <td className="product-name-cell">{p.nome}</td>
                                                            <td style={{ color: '#94a3b8' }}>{formatCurrency(p.preco_unitario)}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    placeholder="R$ 0,00"
                                                                    value={customPrices[p.id] || ''}
                                                                    onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {priceCategory === 'PET' && (
                                        <div className="price-section-mobile">
                                            <table className="modal-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Padrão</th>
                                                        <th>Novo</th>
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
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    placeholder="R$ 0,00"
                                                                    value={customPrices[p.id] || ''}
                                                                    onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Desktop Full View */}
                                    <div className="price-section-row pead-row">
                                        <div className="price-table-col">
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
                                                            <td>{formatCurrency(p.preco_unitario)}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    placeholder="Preço Personalizado"
                                                                    value={customPrices[p.id] || ''}
                                                                    onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="price-image-col">
                                            <span className="table-label pead">Tabela PEAD</span>
                                            <img src="/images/tabela_pead.png" alt="Tabela PEAD" />
                                        </div>
                                    </div>

                                    <div className="price-section-row pet-row" style={{ marginTop: '2.5rem' }}>
                                        <div className="price-table-col">
                                            <table className="modal-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Preço Padrão</th>
                                                        <th>Preço Personalizado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Same PET sorting as mobile */}
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
                                                            <td>{formatCurrency(p.preco_unitario)}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    placeholder="Preço Personalizado"
                                                                    value={customPrices[p.id] || ''}
                                                                    onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: e.target.value })}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="price-image-col">
                                            <span className="table-label pet">Tabela PET</span>
                                            <img src="/images/tabela_pet.png" alt="Tabela PET" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer price-modal-footer">
                            <div className="main-modal-actions">
                                <div className="whatsapp-actions-container">
                                    {!waChoiceVisible ? (
                                        <button className="btn-wa-main" onClick={() => setWaChoiceVisible(true)}>
                                            <MessageCircle size={18} />
                                            <span>Enviar Tabela</span>
                                        </button>
                                    ) : (
                                        <div className="whatsapp-choice-overlay">
                                            <div className="wa-choice-header">
                                                <span className="wa-label">Qual tabela enviar?</span>
                                                <button className="btn-close-wa" onClick={() => setWaChoiceVisible(false)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="whatsapp-grid-actions">
                                                <button className="btn-wa-option pead" onClick={() => handleSendPricesWhatsApp('pead')}>
                                                    PEAD
                                                </button>
                                                <button className="btn-wa-option pet" onClick={() => handleSendPricesWhatsApp('pet')}>
                                                    PET
                                                </button>
                                                <button className="btn-wa-option both" onClick={() => handleSendPricesWhatsApp('both')}>
                                                    AMBAS
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className="btn-save" onClick={() => { handleSavePrices(); document.body.style.overflow = 'auto'; }} disabled={saving}>
                                    <Save size={18} />
                                    {saving ? 'Salvando...' : 'Salvar Preços'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesView;
