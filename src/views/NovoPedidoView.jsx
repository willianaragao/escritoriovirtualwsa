import React, { useEffect, useState, useRef } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    UserPlus,
    Package,
    Check,
    ChevronDown,
    User,
    Coins,
    CreditCard,
    Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './NovoPedidoView.css';

const PAYMENT_OPTIONS = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'Pix' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cheque', label: 'Cheque' },
];

const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'parcialmente_pago', label: 'Parcialmente Pago' },
    { value: 'a_receber', label: 'A receber' },
];

/* Add days to a date string yyyy-mm-dd */
const addDays = (dateStr, days) => {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

const fmtDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const NovoPedidoView = ({ businessUnit, user }) => {
    /* ---- Clientes ---- */
    const [clientes, setClientes] = useState([]);
    const [clienteSearch, setClienteSearch] = useState('');
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [showClienteDrop, setShowClienteDrop] = useState(false);
    const [showPaymentDrop, setShowPaymentDrop] = useState(false);
    const clienteRef = useRef(null);
    const paymentRef = useRef(null);

    /* ---- Produtos ---- */
    const [produtos, setProdutos] = useState([]);
    const [prodSearch, setProdSearch] = useState(''); // Added product search state
    const [quantities, setQuantities] = useState({});
    const [customPrices, setCustomPrices] = useState({});
    const [customCosts, setCustomCosts] = useState({});

    /* ---- Carrinho ---- */
    const [cart, setCart] = useState([]);

    /* ---- Parcelas ---- */
    const [numeroParcelas, setNumeroParcelas] = useState(1);
    const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState('');
    const [intervaloDias, setIntervaloDias] = useState(7);
    const [manualParcelas, setManualParcelas] = useState([]);
    const [editingParc, setEditingParc] = useState({ index: -1, value: '' });

    /* ---- Finalização ---- */
    const [status, setStatus] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [userId, setUserId] = useState(user?.id || null);

    /* ---- Load ---- */
    useEffect(() => {
        loadClientes();
        loadProdutos();
        if (!userId && user) setUserId(user.id);
    }, [user]);

    useEffect(() => {
        const handler = (e) => {
            if (clienteRef.current && !clienteRef.current.contains(e.target))
                setShowClienteDrop(false);
            if (paymentRef.current && !paymentRef.current.contains(e.target))
                setShowPaymentDrop(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const loadClientes = async () => {
        const { data } = await supabase.from('clientes').select('id, nome').order('nome');
        setClientes(data || []);
    };

    const loadProdutos = async () => {
        const { data } = await supabase.from('produtos').select('*').order('nome');
        const prods = data || [];
        setProdutos(prods);
        const q = {}, cp = {}, cc = {};
        prods.forEach(p => { 
            q[p.id] = 1; 
            cp[p.id] = p.preco_unitario; 
            cc[p.id] = p.custo_producao || 0; 
        });
        setQuantities(q);
        setCustomPrices(cp);
        setCustomCosts(cc);
    };

    /* ---- Load Custom Prices ---- */
    useEffect(() => {
        const updatePrices = async () => {
            if (!selectedCliente) {
                // If no client selected, use default prices from products
                const cp = {};
                produtos.forEach(p => { cp[p.id] = p.preco_unitario; });
                setCustomPrices(cp);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('clientes_produtos_precos')
                    .select('*')
                    .eq('cliente_id', selectedCliente.id);

                if (error) throw error;

                const cp = {};
                // Start with default prices
                produtos.forEach(p => { cp[p.id] = p.preco_unitario; });

                // Override with custom prices if they exist
                if (data && data.length > 0) {
                    data.forEach(item => {
                        cp[item.produto_id] = item.preco_personalizado;
                    });
                }

                setCustomPrices(cp);

                // Optional: Update prices of items already in cart?
                // The user request emphasizes "na seleçao dos produtos" (in the product selection),
                // but usually you want the cart to reflect the selected customer's prices too.
                setCart(currentCart => currentCart.map(item => ({
                    ...item,
                    preco: cp[item.produto.id] ?? item.produto.preco_unitario
                })));

            } catch (err) {
                console.error('Erro ao carregar preços personalizados:', err);
            }
        };

        if (produtos.length > 0) {
            updatePrices();
        }
    }, [selectedCliente, produtos]);

    /* ---- Helpers ---- */
    const fmt = val => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
    );

    const cartTotal = cart.reduce((s, i) => s + i.qty * i.preco, 0);

    useEffect(() => {
        const count = Number(numeroParcelas) || 1;
        const currentSum = manualParcelas.reduce((a, b) => a + b, 0);

        if (manualParcelas.length !== count || Math.abs(currentSum - cartTotal) > 0.01) {
            const each = cartTotal / count;
            setManualParcelas(Array.from({ length: count }, () => each));
        }
    }, [numeroParcelas, cartTotal]);

    const handleManualParcChange = (index, val) => {
        setEditingParc({ index, value: val });
        const cleanVal = val.replace(',', '.');
        const newVal = parseFloat(cleanVal) || 0;
        const newManuals = [...manualParcelas];
        newManuals[index] = newVal;

        const count = newManuals.length;
        if (index < count - 1) {
            let sumBefore = 0;
            for (let i = 0; i <= index; i++) sumBefore += newManuals[i];
            const remaining = cartTotal - sumBefore;
            const remainingCount = count - (index + 1);
            const each = remainingCount > 0 ? remaining / remainingCount : 0;
            for (let i = index + 1; i < count; i++) {
                newManuals[i] = each;
            }
        }
        setManualParcelas(newManuals);
    };

    const PET_ORDER = [
        '500ml Pet Redonda c/100',
        '500ml Pet Quadrada c/100',
        '300ml Pet Redonda c/100',
        '200ml Pet Redonda c/100',
        '1Litro Pet Redonda c/50'
    ];

    const filteredProdutos = produtos.filter(p => {
        const matchSearch = p.nome.toLowerCase().includes(prodSearch.toLowerCase());
        const isPet = p.nome.toUpperCase().includes('PET');
        if (businessUnit === 'PET') return matchSearch && isPet;
        return matchSearch && !isPet;
    }).sort((a, b) => {
        if (businessUnit === 'PET') {
            let idxA = PET_ORDER.indexOf(a.nome);
            let idxB = PET_ORDER.indexOf(b.nome);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
        }
        return 0;
    });

    /* ---- Installments preview ---- */
    const parcelas = (() => {
        if (numeroParcelas <= 0 || !dataPrimeiraParcela) return [];
        return manualParcelas.map((val, i) => ({
            n: i + 1,
            data: addDays(dataPrimeiraParcela, i * intervaloDias),
            valor: val,
        }));
    })();

    /* ---- Cart ---- */
    const addToCart = (produto) => {
        const qty = quantities[produto.id] || 1;
        const preco = customPrices[produto.id] ?? produto.preco_unitario;
        setCart(prev => {
            const ex = prev.find(i => i.produto.id === produto.id);
            if (ex) return prev.map(i => i.produto.id === produto.id ? { ...i, qty: i.qty + qty, preco } : i);
            return [...prev, { produto, qty, preco }];
        });
    };

    const removeFromCart = id => setCart(p => p.filter(i => i.produto.id !== id));

    const updateCartQty = (id, val) => {
        const n = typeof val === 'number' ? val : parseInt(val, 10);
        if (isNaN(n) || n < 1) return;
        setCart(p => p.map(i => i.produto.id === id ? { ...i, qty: n } : i));
    };

    const incQty = id => setQuantities(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) + 1) }));
    const decQty = id => setQuantities(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) - 1) }));
    const setQty = (id, v) => { const n = parseInt(v, 10); if (!isNaN(n)) setQuantities(q => ({ ...q, [id]: Math.max(1, n) })); };
    const onWheel = (e, id) => { e.preventDefault(); e.deltaY < 0 ? incQty(id) : decQty(id); };

    const handleUpdateGlobalCost = async (prodId, val) => {
        const n = parseFloat(val) || 0;
        setCustomCosts(prev => ({ ...prev, [prodId]: n }));
        
        // Update database
        const { error } = await supabase.from('produtos').update({ custo_producao: n }).eq('id', prodId);
        if (error) console.error('Erro ao atualizar custo global:', error);

        // Update local cart if product is in it
        setCart(prev => prev.map(item => {
            if (item.produto.id === prodId) {
                return { ...item, produto: { ...item.produto, custo_producao: n } };
            }
            return item;
        }));
    };

    /* ---- Save ---- */
    const handleSalvar = async () => {
        if (!selectedCliente) { alert('Selecione um cliente.'); return; }
        if (cart.length === 0) { alert('Adicione pelo menos um produto.'); return; }
        if (!status) { alert('Selecione o status do pedido.'); return; }
        if (!formaPagamento) { alert('Selecione a forma de pagamento.'); return; }

        setSaving(true);
        try {
            const condicoes = {
                formaPagamento,
                numeroParcelas,
                dataPrimeiraParcela: dataPrimeiraParcela || '',
                intervaloDias: Number(intervaloDias),
                valoresParcelas: manualParcelas,
            };

            const { data: ped, error: pedErr } = await supabase
                .from('pedidos')
                .insert([{
                    user_id: userId,
                    cliente_id: selectedCliente.id,
                    data_pedido: new Date().toISOString().split('T')[0],
                    data_entrega: dataEntrega || null,
                    status,
                    valor_total: cartTotal,
                    condicoes_pagamento: condicoes,
                    observacoes: observacoes || null,
                    numero_parcelas: numeroParcelas,
                    parcelas_pagas: status === 'pago' ? numeroParcelas : 0,
                    business_unit: businessUnit,
                }])
                .select()
                .single();

            if (pedErr) throw pedErr;

            const itens = cart.map(item => ({
                pedido_id: ped.id,
                produto_id: item.produto.id,
                quantidade: item.qty,
                preco_unitario: item.preco,
                subtotal: item.qty * item.preco,
            }));

            const { error: iErr } = await supabase.from('pedidos_produtos').insert(itens);
            if (iErr) throw iErr;

            // NEW: Automatically create a supplier payable for PET based on cost or full value
            // User requested: "todo pedido que estiver em a receber deve ir para a pagar tambem!"
            if (businessUnit === 'PET' && status === 'a_receber') {
                const custoTotal = cart.reduce((s, i) => s + i.qty * (Number(i.produto.custo_producao) || 0), 0);
                const valorAPagar = custoTotal > 0 ? custoTotal : cartTotal;

                const mesRef = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const { error: cErr } = await supabase.from('pedidos_a_pagar_pet').insert([{
                    user_id: userId,
                    descricao: `Custo Ped #${ped.id} - ${selectedCliente.nome}`,
                    vencimento: condicoes.dataPrimeiraParcela ? parseInt(condicoes.dataPrimeiraParcela.split('-')[2], 10) : new Date().getDate(),
                    valor: valorAPagar,
                    valor_pago: 0,
                    ativa: true,
                    paga: false,
                    categoria: 'Fornecedor PET',
                    tipo: 'mensal',
                    mes_referencia: mesRef
                }]);
                if (cErr) console.error('Erro ao registrar Pedido a Pagar', cErr);
            }

            const nomeCli = selectedCliente.nome;
            setCart([]); setSelectedCliente(null); setClienteSearch('');
            setObservacoes(''); setDataEntrega(''); setNumeroParcelas(1);
            setFormaPagamento(''); setStatus(''); setDataPrimeiraParcela(''); setIntervaloDias(30);
            setSuccessMsg(`Pedido de ${nomeCli} registrado com sucesso! (${STATUS_OPTIONS.find(s => s.value === status)?.label})`);
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar pedido: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const showBottom = cart.length > 0;

    return (
        <div className="np-container">

            {/* HEADER */}
            <header className="np-header">
                <div className="np-header-left">
                    <h1>Novo Pedido</h1>
                    <p>Selecione o cliente e adicione produtos ao pedido</p>
                </div>
                {cart.length > 0 && (
                    <div className="np-cart-badge">
                        <ShoppingCart size={17} />
                        <span>{cart.reduce((s, i) => s + i.qty, 0)} item(s) — {fmt(cartTotal)}</span>
                    </div>
                )}
            </header>

            {/* SUCCESS TOAST */}
            {successMsg && (
                <div className="np-toast">
                    <Check size={16} /> {successMsg}
                </div>
            )}

            {/* CLIENT */}
            <div className="np-section">
                <div className="np-section-title">
                    <User size={18} /> Selecionar Cliente
                </div>
                <div className="np-client-wrap" ref={clienteRef}>
                    <div className="np-search-box">
                        <Search size={15} className="np-si" />
                        <input
                            type="text"
                            className="np-search-input"
                            placeholder="Pesquisar cliente..."
                            value={clienteSearch}
                            onChange={e => { setClienteSearch(e.target.value); setShowClienteDrop(true); }}
                            onFocus={() => setShowClienteDrop(true)}
                        />
                    </div>
                    <div className="np-select-rel">
                        <button
                            className={`np-client-btn ${selectedCliente ? 'sel' : ''}`}
                            onClick={() => setShowClienteDrop(v => !v)}
                        >
                            <span>{selectedCliente ? selectedCliente.nome : 'Escolha um cliente'}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showClienteDrop && filteredClientes.length > 0 && (
                            <div className="np-dropdown">
                                {filteredClientes.map(c => (
                                    <button
                                        key={c.id}
                                        className={`np-drop-opt ${selectedCliente?.id === c.id ? 'active' : ''}`}
                                        onClick={() => { setSelectedCliente(c); setClienteSearch(''); setShowClienteDrop(false); }}
                                    >
                                        {c.nome}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="np-btn-orange">
                        <UserPlus size={15} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* CATALOG */}
            <div className="np-section">
                <div className="np-catalog-header">
                    <div className="np-section-title"><Package size={18} /> Catálogo de Produtos</div>
                    <div className="np-prod-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Buscar produto no catálogo..."
                            value={prodSearch}
                            onChange={e => setProdSearch(e.target.value)}
                        />
                    </div>
                </div>
                {filteredProdutos.length === 0 ? (
                    <div className="np-empty">Nenhum produto encontrado.</div>
                ) : (
                    <div className={`np-catalog-grid ${businessUnit === 'PET' ? 'pet-mode' : ''}`}>
                        {filteredProdutos.map(prod => {
                            const qty = quantities[prod.id] || 1;
                            const preco = customPrices[prod.id] ?? prod.preco_unitario;
                            const inCart = cart.some(i => i.produto.id === prod.id);
                            return (
                                <div key={prod.id} className={`np-card ${inCart ? 'in-cart' : ''}`}>
                                    {inCart && (
                                        <button className="np-card-del" onClick={() => removeFromCart(prod.id)} title="Remover">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                    <div className="np-card-name">{prod.nome}</div>
                                    <div className="np-card-meta" style={businessUnit === 'PET' ? { flexDirection: 'column', alignItems: 'stretch', gap: '8px' } : {}}>
                                        {businessUnit === 'PET' ? (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="np-card-unit">{prod.tipo || 'un'}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {/* CUSTO COLUMN */}
                                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {/* Unit Custo */}
                                                        <div>
                                                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Custo</div>
                                                            <div className="np-price-row" style={{ width: '100%' }}>
                                                                <span className="np-price-lbl" style={{ color: '#64748b', fontSize: '0.75rem' }}>R$</span>
                                                                <input
                                                                    type="number"
                                                                    className="np-price-inp"
                                                                    value={customCosts[prod.id] ?? prod.custo_producao}
                                                                    min="0" step="0.01"
                                                                    onChange={e => handleUpdateGlobalCost(prod.id, e.target.value)}
                                                                    style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Total Custo */}
                                                        <div>
                                                            <div style={{ fontSize: '0.63rem', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', opacity: 0.8 }}>Custo Total</div>
                                                            <div className="np-price-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '0 4px', borderRadius: '6px', width: '100%' }}>
                                                                <span className="np-price-lbl" style={{ color: '#475569', fontSize: '0.70rem' }}>R$</span>
                                                                <input
                                                                    type="text"
                                                                    className="np-price-inp"
                                                                    value={Number((customCosts[prod.id] ?? prod.custo_producao ?? 0) * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    disabled
                                                                    style={{ color: '#64748b', background: 'transparent', width: '100%', padding: '0.35rem 0.2rem', border: '1px solid transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VENDA COLUMN */}
                                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {/* Unit Venda */}
                                                        <div>
                                                            <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Venda</div>
                                                            <div className="np-price-row" style={{ width: '100%' }}>
                                                                <span className="np-price-lbl" style={{ color: '#f59e0b', fontSize: '0.75rem' }}>R$</span>
                                                                <input
                                                                    type="number"
                                                                    className="np-price-inp"
                                                                    value={preco}
                                                                    min="0" step="0.01"
                                                                    onChange={e => setCustomPrices(cp => ({ ...cp, [prod.id]: parseFloat(e.target.value) || 0 }))}
                                                                    style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {/* Total Venda */}
                                                        <div>
                                                            <div style={{ fontSize: '0.63rem', color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', opacity: 0.8 }}>Venda Total</div>
                                                            <div className="np-price-row" style={{ background: 'rgba(245,158,11,0.04)', padding: '0 4px', borderRadius: '6px', width: '100%' }}>
                                                                <span className="np-price-lbl" style={{ color: '#d97706', fontSize: '0.70rem' }}>R$</span>
                                                                <input
                                                                    type="text"
                                                                    className="np-price-inp"
                                                                    value={Number(preco * qty).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    disabled
                                                                    style={{ color: '#f59e0b', background: 'transparent', width: '100%', padding: '0.35rem 0.2rem', border: '1px solid transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="np-card-unit">{prod.tipo || 'un'}</span>
                                                <div className="np-price-row">
                                                    <span className="np-price-lbl">R$</span>
                                                    <input
                                                        type="number"
                                                        className="np-price-inp"
                                                        value={preco}
                                                        min="0" step="0.01"
                                                        onChange={e => setCustomPrices(cp => ({ ...cp, [prod.id]: parseFloat(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="np-qty-lbl">Quantidade</div>
                                    <div className="np-qty-row">
                                        <button className="np-qbtn" onClick={() => decQty(prod.id)}><Minus size={13} /></button>
                                        <input
                                            type="number"
                                            className="np-qty-inp"
                                            value={qty} min={1}
                                            onChange={e => setQty(prod.id, e.target.value)}
                                            onWheel={e => onWheel(e, prod.id)}
                                        />
                                        <button className="np-qbtn" onClick={() => incQty(prod.id)}><Plus size={13} /></button>
                                    </div>
                                    <button
                                        className={`np-add-btn ${inCart ? 'added' : ''}`}
                                        onClick={() => addToCart(prod)}
                                    >
                                        <ShoppingCart size={14} />
                                        {inCart ? 'Adicionar mais' : 'Adicionar'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ===== ORDER SUMMARY + PAYMENT + FINALIZE (appear when cart has items) ===== */}
            {showBottom && (
                <>
                    {/* ITENS DO PEDIDO */}
                    <div className="np-section">
                        <div className="np-section-title">
                            <ShoppingCart size={18} /> Itens do Pedido
                        </div>
                        <div className="np-order-table-wrap">
                            <table className="np-order-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Quantidade</th>
                                        <th>Venda Unit.</th>
                                        <th>Custo Unit.</th>
                                        <th>Lucro</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.produto.id}>
                                            <td className="np-ot-name">{item.produto.nome}</td>
                                            <td>
                                                <div className="np-inline-qty">
                                                    <button className="np-qbtn sm" onClick={() => updateCartQty(item.produto.id, item.qty - 1)}><Minus size={11} /></button>
                                                    <input
                                                        type="number"
                                                        className="np-qty-inp sm"
                                                        value={item.qty}
                                                        min={1}
                                                        onChange={e => updateCartQty(item.produto.id, e.target.value)}
                                                    />
                                                    <button className="np-qbtn sm" onClick={() => updateCartQty(item.produto.id, item.qty + 1)}><Plus size={11} /></button>
                                                </div>
                                            </td>
                                            <td className="np-ot-muted">{fmt(item.preco)}</td>
                                            <td className="np-ot-muted" style={{ color: '#94a3b8' }}>
                                                {fmt(item.produto.custo_producao || item.produto.preco_custo || 0)}
                                            </td>
                                            <td className="np-ot-sub" style={{ color: '#10b981' }}>
                                                {fmt((item.preco - (Number(item.produto.custo_producao) || Number(item.produto.preco_custo) || 0)) * item.qty)}
                                            </td>
                                            <td className="np-ot-sub">{fmt(item.qty * item.preco)}</td>
                                            <td>
                                                <button className="np-ot-del" onClick={() => removeFromCart(item.produto.id)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="np-total-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total do Pedido</span>
                                <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{fmt(cartTotal)}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Custo Total</span>
                                <span style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {fmt(cart.reduce((s, i) => s + i.qty * (Number(customCosts[i.produto.id] ?? i.produto.custo_producao) || 0), 0))}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600 }}>Lucro Real</span>
                                <span className="np-total-val" style={{ color: '#10b981', fontSize: '1.4rem' }}>
                                    {fmt(cartTotal - cart.reduce((s, i) => s + i.qty * (Number(customCosts[i.produto.id] ?? i.produto.custo_producao ?? i.produto.preco_custo) || 0), 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CONDIÇÕES DE PAGAMENTO */}
                    <div className="np-section">
                        <div className="np-section-title">
                            <Coins size={18} /> Condições de Pagamento
                        </div>
                        <div className="np-payment-grid">
                            <div className="np-field">
                                <label>Número de Parcelas</label>
                                <input
                                    type="number" min={1} max={60}
                                    className="np-input"
                                    value={numeroParcelas}
                                    onChange={e => setNumeroParcelas(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>
                            <div className="np-field">
                                <label>Data da Primeira Parcela</label>
                                <input
                                    type="date"
                                    className="np-input"
                                    value={dataPrimeiraParcela}
                                    onChange={e => setDataPrimeiraParcela(e.target.value)}
                                />
                            </div>
                            <div className="np-field">
                                <label>Intervalo entre Parcelas (dias)</label>
                                <input
                                    type="number" min={1}
                                    className="np-input"
                                    value={intervaloDias}
                                    onChange={e => setIntervaloDias(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>
                        </div>

                        {/* Parcelas preview */}
                        {parcelas.length > 0 && (
                            <div className="np-parcelas-preview">
                                <div className="np-parcelas-title">Previsão de Parcelas:</div>
                                {parcelas.map((p, idx) => (
                                    <div key={p.n} className="np-parcela-row" style={{ alignItems: 'center' }}>
                                        <span className="np-parcela-n">Parcela {p.n}:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{fmtDate(p.data)}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '6px' }}>R$</span>
                                                <input
                                                    type="text"
                                                    className="np-parc-edit-input"
                                                    value={editingParc.index === idx ? editingParc.value : p.valor.toFixed(2).replace('.', ',')}
                                                    onChange={(e) => handleManualParcChange(idx, e.target.value)}
                                                    onBlur={() => setEditingParc({ index: -1, value: '' })}
                                                    style={{
                                                        background: 'none',
                                                        border: '#none',
                                                        color: '#f8fafc',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        width: '100px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* FINALIZAÇÃO */}
                    <div className="np-section">
                        <div className="np-section-title">
                            <CreditCard size={18} /> Finalização do Pedido
                        </div>

                        <div className="np-field">
                            <label>Status do pedido</label>
                            <div className="np-status-options">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`np-status-opt ${status === opt.value ? 'active' : ''}`}
                                        onClick={() => setStatus(opt.value)}
                                    >
                                        <span className={`np-status-dot dot-${opt.value}`} />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="np-field">
                            <label>Forma de pagamento</label>
                            <div className="np-pay-dropdown" ref={paymentRef}>
                                <button
                                    type="button"
                                    className={`np-pay-trigger ${formaPagamento ? 'sel' : ''}`}
                                    onClick={() => setShowPaymentDrop(v => !v)}
                                >
                                    <span>{formaPagamento ? PAYMENT_OPTIONS.find(o => o.value === formaPagamento)?.label : 'Selecione a forma de pagamento'}</span>
                                    <ChevronDown size={14} className={`np-pay-chev ${showPaymentDrop ? 'open' : ''}`} />
                                </button>
                                {showPaymentDrop && (
                                    <div className="np-pay-list">
                                        {PAYMENT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`np-pay-item ${formaPagamento === opt.value ? 'active' : ''}`}
                                                onClick={() => { setFormaPagamento(opt.value); setShowPaymentDrop(false); }}
                                            >
                                                <span className="np-pay-check">{formaPagamento === opt.value ? '✓' : ''}</span>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="np-field">
                            <label>Data de entrega (opcional)</label>
                            <input
                                type="date"
                                className="np-input"
                                value={dataEntrega}
                                onChange={e => setDataEntrega(e.target.value)}
                            />
                        </div>

                        <div className="np-field" style={{ marginTop: '0.25rem' }}>
                            <label>Observações</label>
                            <textarea
                                className="np-textarea"
                                rows={3}
                                placeholder="Observações opcionais..."
                                value={observacoes}
                                onChange={e => setObservacoes(e.target.value)}
                            />
                        </div>

                        <button
                            className="np-save-btn"
                            onClick={handleSalvar}
                            disabled={saving}
                        >
                            <Save size={16} />
                            {saving ? 'Salvando...' : 'Salvar Pedido'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NovoPedidoView;
