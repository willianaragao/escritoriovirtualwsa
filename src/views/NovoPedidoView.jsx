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

const NovoPedidoView = () => {
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
    const [quantities, setQuantities] = useState({});
    const [customPrices, setCustomPrices] = useState({});

    /* ---- Carrinho ---- */
    const [cart, setCart] = useState([]);

    /* ---- Parcelas ---- */
    const [numeroParcelas, setNumeroParcelas] = useState(1);
    const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState('');
    const [intervaloDias, setIntervaloDias] = useState(7);

    /* ---- Finalização ---- */
    const [status, setStatus] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [userId, setUserId] = useState(null);

    /* ---- Load ---- */
    useEffect(() => {
        loadClientes();
        loadProdutos();
        supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (clienteRef.current && !clienteRef.current.contains(e.target))
                setShowClienteDrop(false);
            if (paymentRef.current && !paymentRef.current.contains(e.target))
                setShowPaymentDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const loadClientes = async () => {
        const { data } = await supabase.from('clientes').select('id, nome').order('nome');
        setClientes(data || []);
    };

    const loadProdutos = async () => {
        const { data } = await supabase.from('produtos').select('*').order('nome');
        const prods = data || [];
        setProdutos(prods);
        const q = {}, cp = {};
        prods.forEach(p => { q[p.id] = 1; cp[p.id] = p.preco_unitario; });
        setQuantities(q);
        setCustomPrices(cp);
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
    const parcelaValue = numeroParcelas > 1 ? cartTotal / numeroParcelas : cartTotal;

    /* ---- Installments preview ---- */
    const parcelas = (() => {
        if (numeroParcelas <= 1 || !dataPrimeiraParcela) return [];
        return Array.from({ length: numeroParcelas }, (_, i) => ({
            n: i + 1,
            data: addDays(dataPrimeiraParcela, i * intervaloDias),
            valor: parcelaValue,
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
                <div className="np-section-title"><Package size={18} /> Catálogo de Produtos</div>
                {produtos.length === 0 ? (
                    <div className="np-empty">Nenhum produto cadastrado.</div>
                ) : (
                    <div className="np-catalog-grid">
                        {produtos.map(prod => {
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
                                    <div className="np-card-meta">
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
                                        <th>Preço Unit.</th>
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
                        <div className="np-total-row">
                            <span>Total do Pedido</span>
                            <span className="np-total-val">{fmt(cartTotal)}</span>
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
                                {parcelas.map(p => (
                                    <div key={p.n} className="np-parcela-row">
                                        <span className="np-parcela-n">Parcela {p.n}:</span>
                                        <span className="np-parcela-info">
                                            {fmtDate(p.data)} — {fmt(p.valor)}
                                        </span>
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
