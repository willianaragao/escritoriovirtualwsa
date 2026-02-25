import React, { useEffect, useState } from 'react';
import {
    Search, Calendar, ChevronDown,
    MessageCircle, Edit3, Trash2,
    X, Check, Loader, CreditCard, Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './PedidosView.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'parcialmente_pago', label: 'Parcialmente Pago' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
];

const PAYMENT_OPTIONS = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'Pix' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cheque', label: 'Cheque' },
];

const STATUS_BADGE = {
    pendente: { label: 'Pendente', cls: 'pv-badge-pendente' },
    pago: { label: 'Pago', cls: 'pv-badge-pago' },
    a_receber: { label: 'A receber', cls: 'pv-badge-receber' },
    parcialmente_pago: { label: 'Parcialmente Pago', cls: 'pv-badge-parcial' },
    aguardando_pagamento: { label: 'Aguardando Pagamento', cls: 'pv-badge-aguardando' },
};

const TOTAL_COLOR = {
    pendente: '#f59e0b',
    pago: '#10b981',
    a_receber: '#3b82f6',
    parcialmente_pago: '#a78bfa',
    aguardando_pagamento: '#fb923c',
};

const A_RECEBER_STATUSES = ['a_receber', 'parcialmente_pago', 'aguardando_pagamento'];

const fmt = val =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

/* ============================================================ */
const PedidosView = ({ status, title }) => {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    /* ---- Edit modal state ---- */
    const [editPedido, setEditPedido] = useState(null);
    const [editItens, setEditItens] = useState([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);

    // Payment fields
    const [eParcelas, setEParcelas] = useState(1);
    const [eData, setEData] = useState('');
    const [eIntervalo, setEIntervalo] = useState(7);
    const [eForma, setEForma] = useState('');
    const [eStatus, setEStatus] = useState('');
    const [eObs, setEObs] = useState('');
    const [eEntrega, setEEntrega] = useState('');

    /* ---- Fetch pedidos ---- */
    useEffect(() => {
        const fetchPedidos = async () => {
            setLoading(true);
            try {
                const query = supabase
                    .from('pedidos')
                    .select('*, clientes(nome, telefone)')
                    .order('data_pedido', { ascending: false });

                if (status === 'a_receber') {
                    query.in('status', A_RECEBER_STATUSES);
                } else {
                    query.eq('status', status);
                }

                const { data, error } = await query;
                if (error) throw error;

                const filtered = (data || []).map(p => ({
                    ...p,
                    data_pedido: p.data_pedido ? p.data_pedido.split('T')[0] : null
                })).filter(p => {
                    if (!p.data_pedido) return false;
                    const d = new Date(p.data_pedido + 'T12:00:00');
                    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
                });

                setPedidos(filtered);
                setTotal(filtered.reduce((acc, p) => acc + (p.valor_total || 0), 0));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPedidos();
    }, [status, selectedMonth, selectedYear]);

    /* ---- WhatsApp ---- */
    const handleWhatsApp = async (pedido) => {
        const tel = pedido.clientes?.telefone || '';
        const cleanTel = tel.replace(/\D/g, '');
        if (!cleanTel) {
            alert('Este cliente não possui telefone cadastrado.');
            return;
        }

        // Fetch items for the specific order
        const { data: itens, error } = await supabase
            .from('pedidos_produtos')
            .select('quantidade, preco_unitario, subtotal, produtos(nome)')
            .eq('pedido_id', pedido.id);

        if (error) {
            console.error('Error fetching items for WhatsApp:', error);
            alert('Erro ao carregar detalhes do pedido para o WhatsApp.');
            return;
        }

        const statusLabel = STATUS_BADGE[pedido.status]?.label || 'Pendente';
        const statusEmoji = pedido.status === 'pago' ? '✅'
            : pedido.status === 'pendente' ? '⏳'
                : pedido.status === 'parcialmente_pago' ? '🌗'
                    : '⏳';

        const dataFmt = formatDate(pedido.data_pedido);
        const forma = typeof pedido.condicoes_pagamento === 'object'
            ? pedido.condicoes_pagamento?.formaPagamento || 'N/A'
            : pedido.condicoes_pagamento || 'N/A';

        let produtosText = '';
        (itens || []).forEach(it => {
            const pName = it.produtos?.nome || 'Produto';
            produtosText += `* ${it.quantidade}x ${pName} - ${fmt(it.preco_unitario)} = ${fmt(it.subtotal)}\n`;
        });

        const msg = `PEDIDO - ${pedido.clientes?.nome}\n\n` +
            `Data: ${dataFmt}\n` +
            `Status: ${statusLabel} ${statusEmoji}\n\n` +
            `Produtos:\n${produtosText}\n` +
            `Forma de Pagamento: ${forma}\n` +
            `Valor Total: ${fmt(pedido.valor_total)}`;

        const url = `https://wa.me/55${cleanTel}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    /* ---- Helpers ---- */
    const formatDate = str => {
        if (!str) return '-';
        const [y, m, d] = str.split('T')[0].split('-');
        return `${d}/${m}/${y}`;
    };

    const filteredList = pedidos.filter(p =>
        (p.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTotal = filteredList.reduce((acc, p) => acc + (p.valor_total || 0), 0);

    /* ---- Delete ---- */
    const handleDelete = async (pedido) => {
        if (!window.confirm(`Excluir o pedido de "${pedido.clientes?.nome || 'este cliente'}"? Ação irreversível.`)) return;
        try {
            await supabase.from('pedidos_produtos').delete().eq('pedido_id', pedido.id);
            const { error } = await supabase.from('pedidos').delete().eq('id', pedido.id);
            if (error) throw error;
            setPedidos(prev => prev.filter(p => p.id !== pedido.id));
            setTotal(prev => prev - (pedido.valor_total || 0));
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    /* ---- Open edit modal ---- */
    const openEdit = async (pedido) => {
        setEditPedido(pedido);
        setEditLoading(true);
        setEditItens([]);

        // Pre-fill payment fields from stored condições
        const cond = pedido.condicoes_pagamento || {};
        setEParcelas(pedido.numero_parcelas || cond.numeroParcelas || 1);
        setEData(cond.dataPrimeiraParcela || '');
        setEIntervalo(cond.intervaloDias || 7);
        setEForma(cond.formaPagamento || '');
        setEStatus(pedido.status || '');
        setEObs(pedido.observacoes || '');
        setEEntrega(pedido.data_entrega ? pedido.data_entrega.split('T')[0] : '');

        try {
            const { data, error } = await supabase
                .from('pedidos_produtos')
                .select('*, produtos(nome)')
                .eq('pedido_id', pedido.id);
            if (error) throw error;
            setEditItens((data || []).map(it => ({
                ...it,
                qty: it.quantidade,
                price: it.preco_unitario,
            })));
        } catch (err) {
            alert('Erro ao carregar itens: ' + err.message);
            setEditPedido(null);
        } finally {
            setEditLoading(false);
        }
    };

    const closeEdit = () => {
        setEditPedido(null);
        setEditItens([]);
    };

    const updateEditItem = (id, field, value) => {
        setEditItens(prev => prev.map(it =>
            it.id === id ? { ...it, [field]: value } : it
        ));
    };

    const editTotal = editItens.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);
    const parcelaVal = eParcelas > 1 ? editTotal / eParcelas : editTotal;
    const parcelasPreview = eParcelas > 1 && eData
        ? Array.from({ length: eParcelas }, (_, i) => ({
            n: i + 1,
            data: addDays(eData, i * Number(eIntervalo)),
            val: parcelaVal,
        }))
        : [];

    /* ---- Save edit ---- */
    const saveEdit = async () => {
        if (!editPedido) return;
        setEditSaving(true);
        try {
            // 1. Update each item in pedidos_produtos
            for (const it of editItens) {
                const qty = Number(it.qty) || 1;
                const price = Number(it.price) || 0;
                const { error } = await supabase
                    .from('pedidos_produtos')
                    .update({ quantidade: qty, preco_unitario: price, subtotal: qty * price })
                    .eq('id', it.id);
                if (error) throw error;
            }

            // 2. Build new condicoes_pagamento
            const condicoes = {
                formaPagamento: eForma,
                numeroParcelas: Number(eParcelas),
                dataPrimeiraParcela: eData || '',
                intervaloDias: Number(eIntervalo),
            };

            // 3. Update pedido row
            const { error: pedErr } = await supabase
                .from('pedidos')
                .update({
                    valor_total: editTotal,
                    status: eStatus,
                    observacoes: eObs || null,
                    data_entrega: eEntrega || null,
                    numero_parcelas: Number(eParcelas),
                    parcelas_pagas: eStatus === 'pago' ? Number(eParcelas) : (editPedido.parcelas_pagas || 0),
                    condicoes_pagamento: condicoes,
                })
                .eq('id', editPedido.id);
            if (pedErr) throw pedErr;

            // 4. Reflect changes locally
            setPedidos(prev => prev.map(p =>
                p.id === editPedido.id
                    ? { ...p, valor_total: editTotal, status: eStatus, condicoes_pagamento: condicoes }
                    : p
            ));
            setTotal(prev => prev - (editPedido.valor_total || 0) + editTotal);
            closeEdit();
        } catch (err) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setEditSaving(false);
        }
    };

    const monthLabel = `${MONTHS[selectedMonth]} de ${selectedYear}`;
    const totalColor = TOTAL_COLOR[status] || '#f59e0b';
    const colSpan = status === 'a_receber' ? 8 : 7;

    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="pv-container">

            {/* ===== HEADER ===== */}
            <header className="pv-header">
                <div className="pv-header-left"><h1>{title}</h1></div>
                <div className="pv-header-right">
                    <div className="pv-month-selector" style={{ position: 'relative' }}>
                        <button className="pv-month-btn" onClick={() => setShowMonthPicker(v => !v)}>
                            <Calendar size={15} />
                            <span>{monthLabel}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showMonthPicker && (
                            <div className="pv-month-popup">
                                <div className="pv-year-row">
                                    {years.map(y => (
                                        <button key={y}
                                            className={`pv-year-btn ${y === selectedYear ? 'active' : ''}`}
                                            onClick={() => setSelectedYear(y)}>{y}</button>
                                    ))}
                                </div>
                                <div className="pv-month-grid">
                                    {MONTHS.map((m, idx) => (
                                        <button key={m}
                                            className={`pv-month-pill ${idx === selectedMonth ? 'active' : ''}`}
                                            onClick={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}>
                                            {m.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== TOTAL + SEARCH ===== */}
            <div className="pv-totals-row">
                <div className="pv-total-card">
                    <span className="pv-total-label">Total de {title}</span>
                    <span className="pv-total-value" style={{ color: totalColor }}>{fmt(filteredTotal)}</span>
                </div>
                <div className="pv-search-wrapper">
                    <Search size={15} className="pv-search-icon" />
                    <input type="text" className="pv-search-input" placeholder="Buscar cliente..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="pv-table-wrapper">
                <table className="pv-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Data</th>
                            <th>Itens</th>
                            <th>Forma de Pagamento</th>
                            {status === 'a_receber' && <th>Parcelas</th>}
                            <th>Total</th>
                            <th>Status</th>
                            <th className="pv-th-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={colSpan} className="pv-empty">Carregando pedidos...</td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan={colSpan} className="pv-empty">Nenhum pedido encontrado.</td></tr>
                        ) : filteredList.map(p => {
                            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pendente;
                            return (
                                <tr key={p.id}>
                                    <td className="pv-td-cliente">{p.clientes?.nome || 'Cliente não identificado'}</td>
                                    <td className="pv-td-muted">{formatDate(p.data_pedido)}</td>
                                    <td className="pv-td-muted">{p.itens_count || 0} produto(s)</td>
                                    <td className="pv-td-muted">
                                        {typeof p.condicoes_pagamento === 'object'
                                            ? p.condicoes_pagamento?.formaPagamento || 'N/A'
                                            : p.condicoes_pagamento || 'N/A'}
                                    </td>
                                    {status === 'a_receber' && (
                                        <td className="pv-td-muted">
                                            {typeof p.condicoes_pagamento === 'object'
                                                ? `${p.condicoes_pagamento?.numeroParcelas || 1}x`
                                                : '1x'}
                                        </td>
                                    )}
                                    <td className="pv-td-valor">{fmt(p.valor_total)}</td>
                                    <td><span className={`pv-badge ${badge.cls}`}>{badge.label}</span></td>
                                    <td className="pv-td-actions">
                                        <div className="pv-actions">
                                            <button className="pv-action-btn pv-whatsapp-btn" title="WhatsApp"
                                                onClick={() => handleWhatsApp(p)}>
                                                <MessageCircle size={15} />
                                            </button>
                                            <button className="pv-action-btn pv-edit-btn" title="Editar"
                                                onClick={() => openEdit(p)}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button className="pv-action-btn pv-delete-btn" title="Excluir"
                                                onClick={() => handleDelete(p)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ===== EDIT MODAL ===== */}
            {editPedido && (
                <div className="pv-modal-overlay" onClick={closeEdit}>
                    <div className="pv-modal pv-modal-wide" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="pv-modal-header">
                            <div>
                                <h2 className="pv-modal-title">Editar Pedido</h2>
                                <p className="pv-modal-sub">{editPedido.clientes?.nome || 'Cliente não identificado'}</p>
                            </div>
                            <button className="pv-modal-close" onClick={closeEdit}><X size={18} /></button>
                        </div>

                        {/* Body */}
                        <div className="pv-modal-body">
                            {editLoading ? (
                                <div className="pv-modal-load">
                                    <Loader size={28} className="pv-spin" />
                                    <span>Carregando...</span>
                                </div>
                            ) : (
                                <div className="pv-edit-sections">

                                    {/* ── Itens ── */}
                                    <div className="pv-edit-section">
                                        <div className="pv-edit-section-title">
                                            <Package size={15} /> Itens do Pedido
                                        </div>
                                        {editItens.length === 0 ? (
                                            <p className="pv-modal-empty">Nenhum item encontrado.</p>
                                        ) : (
                                            <table className="pv-edit-table">
                                                <thead>
                                                    <tr>
                                                        <th>Produto</th>
                                                        <th>Qtd</th>
                                                        <th>Preço Unit.</th>
                                                        <th>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {editItens.map(it => (
                                                        <tr key={it.id}>
                                                            <td className="pv-eit-name">{it.produtos?.nome || '-'}</td>
                                                            <td>
                                                                <input type="number" min="1" className="pv-eit-inp"
                                                                    value={it.qty}
                                                                    onChange={e => updateEditItem(it.id, 'qty', e.target.value)} />
                                                            </td>
                                                            <td>
                                                                <input type="number" min="0" step="0.01" className="pv-eit-inp"
                                                                    value={it.price}
                                                                    onChange={e => updateEditItem(it.id, 'price', e.target.value)} />
                                                            </td>
                                                            <td className="pv-eit-sub">
                                                                {fmt(Number(it.qty) * Number(it.price))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <div className="pv-edit-subtotal">
                                            <span>Total dos itens</span>
                                            <strong>{fmt(editTotal)}</strong>
                                        </div>
                                    </div>

                                    {/* ── Condições de Pagamento ── */}
                                    <div className="pv-edit-section">
                                        <div className="pv-edit-section-title">
                                            <CreditCard size={15} /> Condições de Pagamento
                                        </div>

                                        <div className="pv-edit-grid3">
                                            <div className="pv-edit-field">
                                                <label>Nº de parcelas</label>
                                                <input type="number" min="1" className="pv-edit-input"
                                                    value={eParcelas}
                                                    onChange={e => setEParcelas(Number(e.target.value) || 1)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Data da 1ª parcela</label>
                                                <input type="date" className="pv-edit-input"
                                                    value={eData}
                                                    onChange={e => setEData(e.target.value)} />
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Intervalo (dias)</label>
                                                <input type="number" min="1" className="pv-edit-input"
                                                    value={eIntervalo}
                                                    onChange={e => setEIntervalo(Number(e.target.value) || 1)} />
                                            </div>
                                        </div>

                                        <div className="pv-edit-field">
                                            <label>Forma de pagamento</label>
                                            <select className="pv-edit-select" value={eForma} onChange={e => setEForma(e.target.value)}>
                                                <option value="">Selecione...</option>
                                                {PAYMENT_OPTIONS.map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Preview de parcelas */}
                                        {parcelasPreview.length > 0 && (
                                            <div className="pv-parc-preview">
                                                <div className="pv-parc-title">Preview das parcelas</div>
                                                {parcelasPreview.map(p => (
                                                    <div key={p.n} className="pv-parc-row">
                                                        <span className="pv-parc-n">{p.n}ª</span>
                                                        <span className="pv-parc-info">
                                                            {p.data ? p.data.split('-').reverse().join('/') : '-'}
                                                            {' — '}
                                                            {fmt(p.val)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Finalização ── */}
                                    <div className="pv-edit-section">
                                        <div className="pv-edit-section-title">
                                            <Check size={15} /> Finalização
                                        </div>
                                        <div className="pv-edit-grid2">
                                            <div className="pv-edit-field">
                                                <label>Status</label>
                                                <select className="pv-edit-select" value={eStatus} onChange={e => setEStatus(e.target.value)}>
                                                    <option value="">Selecione...</option>
                                                    {STATUS_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="pv-edit-field">
                                                <label>Data de entrega</label>
                                                <input type="date" className="pv-edit-input"
                                                    value={eEntrega}
                                                    onChange={e => setEEntrega(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="pv-edit-field">
                                            <label>Observações</label>
                                            <textarea className="pv-edit-textarea" rows={3}
                                                value={eObs} placeholder="Observações opcionais..."
                                                onChange={e => setEObs(e.target.value)} />
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!editLoading && (
                            <div className="pv-modal-footer">
                                <div className="pv-modal-total">
                                    <span>Total atualizado</span>
                                    <strong>{fmt(editTotal)}</strong>
                                </div>
                                <div className="pv-modal-actions">
                                    <button className="pv-modal-cancel" onClick={closeEdit}>Cancelar</button>
                                    <button className="pv-modal-save" onClick={saveEdit} disabled={editSaving}>
                                        {editSaving
                                            ? <><Loader size={14} className="pv-spin" /> Salvando...</>
                                            : <><Check size={14} /> Salvar Alterações</>}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
};

export default PedidosView;
