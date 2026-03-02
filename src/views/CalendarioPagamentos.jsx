import React, { useState, useEffect } from 'react';
import {
    Calendar, Search, ChevronDown,
    AlertCircle, FileCheck2, Clock,
    TrendingUp, ArrowRightLeft, MessageCircle, MoreHorizontal,
    DollarSign, X, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CalendarioPagamentos.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const addDays = (dateStr, days) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

const CalendarioPagamentos = ({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear }) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    // Removed local selectedMonth/Year
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [activeTab, setActiveTab] = useState('todas'); // todas, pendentes, vencidas, pagas
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [parcelas, setParcelas] = useState([]);

    const [stats, setStats] = useState({
        aReceberVal: 0,
        aReceberCount: 0,
        recebidoVal: 0,
        recebidoCount: 0,
        vencidoVal: 0,
        vencidoCount: 0,
        geralVal: 0,
        geralCount: 0
    });

    const [payModal, setPayModal] = useState({ open: false, item: null });
    const [refMonth, setRefMonth] = useState('');
    const [paymentSaving, setPaymentSaving] = useState(false);

    useEffect(() => {
        fetchParcelas();
    }, [selectedMonth, selectedYear]);

    const fetchParcelas = async () => {
        setLoading(true);
        try {
            // Fetch all orders with a client relationship
            const { data: allPedidos, error } = await supabase
                .from('pedidos')
                .select('*, clientes(nome, telefone)')
                .order('data_pedido', { ascending: false });

            if (error) throw error;

            const allExpanded = [];

            (allPedidos || []).forEach(p => {
                const numParc = Number(p.numero_parcelas) || 0;

                // Rule: Must have installments and an explicit first installment date
                const cond = p.condicoes_pagamento || {};
                const dataBase = cond.dataPrimeiraParcela;

                if (numParc <= 0 || !dataBase) return;

                const pPagas = Number(p.parcelas_pagas) || 0;
                const valTotal = Number(p.valor_total) || 0;
                const precoParc = valTotal / numParc;
                const intervalo = Number(cond.intervaloDias) || 30;

                for (let i = 1; i <= numParc; i++) {
                    const vencimento = addDays(dataBase, (i - 1) * intervalo);
                    if (!vencimento) continue;

                    let pStatus = 'pendente';
                    let dataPagamento = null;

                    if (p.status === 'pago') {
                        pStatus = 'pago';
                        dataPagamento = p.data_pagamento || p.updated_at?.split('T')[0] || vencimento;
                    } else if (i <= pPagas) {
                        pStatus = 'pago';
                        // For partials, we use order data_pagamento as a proxy or vencimento
                        dataPagamento = p.data_pagamento || vencimento;
                    } else if (vencimento < todayStr) {
                        pStatus = 'vencido';
                    }

                    allExpanded.push({
                        id: `${p.id}-p${i}`,
                        pedidoId: p.id,
                        cliente: p.clientes?.nome || 'Cliente não identificado',
                        telefone: p.clientes?.telefone,
                        parcela: i,
                        totalParcelas: numParc,
                        valor: precoParc,
                        vencimento,
                        dataPagamento,
                        status: pStatus,
                        mesRef: p.mes_referencia // Add this line
                    });
                }
            });

            setParcelas(allExpanded);
            updateStats(allExpanded);
        } catch (err) {
            console.error('Erro ao expandir parcelas:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (list) => {
        const s = {
            aReceberVal: 0, aReceberCount: 0,
            recebidoVal: 0, recebidoCount: 0,
            vencidoVal: 0, vencidoCount: 0,
            geralVal: 0, geralCount: 0
        };

        list.forEach(p => {
            // Check if status is globally overdue
            const isVencidoGlobal = p.status === 'vencido';

            // Month/Year matching logic (for non-overdue stats)
            const d = new Date(p.vencimento + 'T12:00:00');
            let pMonth = d.getMonth();
            let pYear = d.getFullYear();

            if (p.mesRef) {
                const refIdx = MONTHS.findIndex(m => m.toLowerCase() === p.mesRef.toLowerCase());
                if (refIdx !== -1) pMonth = refIdx;
            }

            const isSamePeriod = pMonth === selectedMonth && pYear === selectedYear;

            // Stats Logic:
            // 1. Total Vencido is always global
            if (isVencidoGlobal) {
                s.vencidoVal += p.valor;
                s.vencidoCount++;
            }

            // 2. Other stats and General total respect the selected period
            if (isSamePeriod) {
                s.geralVal += p.valor;
                s.geralCount++;

                if (p.status === 'pago') {
                    s.recebidoVal += p.valor;
                    s.recebidoCount++;
                } else if (p.status === 'pendente') {
                    s.aReceberVal += p.valor;
                    s.aReceberCount++;
                } else if (p.status === 'vencido') {
                    // Already added to vencidoVal, but also add to aReceber as it's something to collect
                    s.aReceberVal += p.valor;
                    s.aReceberCount++;
                }
            }
        });

        setStats(s);
    };

    const filtered = parcelas.filter(p => {
        const isVencido = p.status === 'vencido';

        // Month/Year matching logic
        const d = new Date(p.vencimento + 'T12:00:00');
        let pMonth = d.getMonth();
        let pYear = d.getFullYear();

        if (p.mesRef) {
            const refIdx = MONTHS.findIndex(m => m.toLowerCase() === p.mesRef.toLowerCase());
            if (refIdx !== -1) pMonth = refIdx;
        }

        const matchesPeriod = pMonth === selectedMonth && pYear === selectedYear;

        // Rule: Show if matches period OR if it's overdue and tab is 'vencidas' (or 'todas'/'pendentes'?)
        // The user specifically asked for "nos pedidos vencidos", so we prioritize the 'vencidas' tab.
        if (activeTab === 'vencidas') {
            if (!isVencido) return false;
            // Overdue items show regardless of month
        } else {
            // For other tabs, respect the period
            if (!matchesPeriod) return false;

            // Sub-filters for other tabs
            if (activeTab === 'pendentes' && !['pendente', 'vencido'].includes(p.status)) return false;
            if (activeTab === 'pagas' && p.status !== 'pago') return false;
        }

        return true;
    });

    const handleOpenPayModal = (p) => {
        setPayModal({ open: true, item: p });
        setRefMonth(MONTHS[selectedMonth].toLowerCase());
    };

    const handleConfirmPayment = async () => {
        if (!payModal.item) return;
        setPaymentSaving(true);

        try {
            const pId = payModal.item.pedidoId;

            // 1. Get original order to see current status and parcelas
            const { data: pedido, error: fetchErr } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', pId)
                .single();

            if (fetchErr) throw fetchErr;

            const totalParc = Number(pedido.numero_parcelas) || 1;
            const currentPagas = Number(pedido.parcelas_pagas) || 0;
            const incrementedPagas = Math.max(currentPagas + 1, payModal.item.parcela);

            const valTotal = Number(pedido.valor_total) || 0;
            const valParc = valTotal / totalParc;
            const totalRecebidoCalculado = valParc * incrementedPagas;

            const updates = {
                parcelas_pagas: incrementedPagas,
                mes_referencia: refMonth,
                data_pagamento: new Date().toISOString().split('T')[0]
            };

            // Sync with conditions to avoid stale dashboard values
            if (pedido.condicoes_pagamento) {
                updates.condicoes_pagamento = {
                    ...pedido.condicoes_pagamento,
                    valor_recebido: totalRecebidoCalculado
                };
            }

            // If all installments paid, mark whole order as paid
            if (incrementedPagas >= totalParc) {
                updates.status = 'pago';
            } else {
                updates.status = 'parcialmente_pago';
            }

            const { error: updateErr } = await supabase
                .from('pedidos')
                .update(updates)
                .eq('id', pId);

            if (updateErr) throw updateErr;

            setPayModal({ open: false, item: null });
            fetchParcelas();
        } catch (err) {
            console.error('Erro ao processar pagamento:', err);
            alert('Erro ao processar pagamento.');
        } finally {
            setPaymentSaving(false);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div className="cal-container">
            <header className="cal-header">
                <div>
                    <h1>Calendário de Pagamentos</h1>
                    <p>Visualize todas as parcelas a receber</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="cal-stats-grid">
                <div className="cal-stat-card blue">
                    <div className="cal-stat-main">
                        <div>
                            <span>Total a Receber</span>
                            <h3>{fmt(stats.aReceberVal)}</h3>
                            <small>{stats.aReceberCount} parcelas pendentes</small>
                        </div>
                        <Clock size={20} className="cal-stat-icon" />
                    </div>
                </div>
                <div className="cal-stat-card green">
                    <div className="cal-stat-main">
                        <div>
                            <span>Total Recebido</span>
                            <h3>{fmt(stats.recebidoVal)}</h3>
                            <small>{stats.recebidoCount} parcelas pagas</small>
                        </div>
                        <FileCheck2 size={20} className="cal-stat-icon" />
                    </div>
                </div>
                <div className="cal-stat-card red highlight">
                    <div className="cal-stat-main">
                        <div>
                            <span>Total Vencido</span>
                            <h3>{fmt(stats.vencidoVal)}</h3>
                            <small>{stats.vencidoCount} parcelas vencidas</small>
                        </div>
                        <AlertCircle size={20} className="cal-stat-icon" />
                    </div>
                </div>
                <div className="cal-stat-card gray">
                    <div className="cal-stat-main">
                        <div>
                            <span>Total Geral</span>
                            <h3>{fmt(stats.geralVal)}</h3>
                            <small>{stats.geralCount} parcelas no total</small>
                        </div>
                        <TrendingUp size={20} className="cal-stat-icon" />
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="cal-filters-row">
                <div className="cal-month-wrap">
                    <button className="cal-filter-btn" onClick={() => setShowMonthPicker(!showMonthPicker)}>
                        <Calendar size={16} />
                        <span>{MONTHS[selectedMonth]} de {selectedYear}</span>
                        <ChevronDown size={14} className={showMonthPicker ? 'open' : ''} />
                    </button>
                    {showMonthPicker && (
                        <div className="cal-month-picker">
                            <div className="cal-mp-years">
                                {years.map(y => (
                                    <button key={y} className={y === selectedYear ? 'act' : ''} onClick={() => setSelectedYear(y)}>{y}</button>
                                ))}
                            </div>
                            <div className="cal-mp-months">
                                {MONTHS.map((m, i) => (
                                    <button key={m} className={i === selectedMonth ? 'act' : ''}
                                        onClick={() => { setSelectedMonth(i); setShowMonthPicker(false); }}>
                                        {m.substring(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="cal-tabs">
                    <button className={activeTab === 'todas' ? 'active' : ''} onClick={() => setActiveTab('todas')}>Todas</button>
                    <button className={activeTab === 'pendentes' ? 'active' : ''} onClick={() => setActiveTab('pendentes')}>Pendentes</button>
                    <button className={`tab-danger ${activeTab === 'vencidas' ? 'active' : ''}`} onClick={() => setActiveTab('vencidas')}>
                        <AlertCircle size={14} /> Vencidas ({stats.vencidoCount})
                    </button>
                    <button className={activeTab === 'pagas' ? 'active' : ''} onClick={() => setActiveTab('pagas')}>Pagas</button>
                </div>
            </div>

            <div className="cal-search-bar">
                <Search size={16} className="cal-search-icon" />
                <input
                    type="text"
                    placeholder="Buscar por cliente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="cal-table-card">
                <div className="cal-table-header">
                    <Calendar size={18} />
                    <h3>Parcelas Cadastradas</h3>
                </div>

                <div className="cal-table-overflow">
                    <table className="cal-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Parcela</th>
                                <th>Valor</th>
                                <th>Data Vencimento</th>
                                <th>Data Pagamento</th>
                                <th>Status</th>
                                <th className="cal-th-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="cal-empty">Carregando parcelas...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" className="cal-empty">Nenhuma parcela encontrada para este período.</td></tr>
                            ) : (
                                filtered.map(p => (
                                    <tr key={p.id}>
                                        <td className="cal-td-name">{p.cliente}</td>
                                        <td>
                                            <span className="cal-parcela-badge">
                                                Parcela {p.parcela}
                                            </span>
                                        </td>
                                        <td className="cal-td-val">{fmt(p.valor)}</td>
                                        <td className="cal-td-date">{p.vencimento.split('-').reverse().join('/')}</td>
                                        <td className="cal-td-date">{p.dataPagamento ? p.dataPagamento.split('-').reverse().join('/') : '-'}</td>
                                        <td>
                                            <span className={`cal-status-badge ${p.status}`}>
                                                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="cal-td-actions">
                                            <div className="cal-actions">
                                                {p.status !== 'pago' && (
                                                    <button
                                                        className="cal-action-btn pay"
                                                        title="Pagar"
                                                        onClick={() => handleOpenPayModal(p)}
                                                    >
                                                        <DollarSign size={14} />
                                                    </button>
                                                )}
                                                <button className="cal-action-btn" title="WhatsApp">
                                                    <MessageCircle size={14} />
                                                </button>
                                                <button className="cal-action-btn" title="Detalhes">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {payModal.open && (
                <div className="cal-modal-overlay" onClick={() => setPayModal({ open: false, item: null })}>
                    <div className="cal-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="cal-modal-header">
                            <h2>Confirmar Pagamento</h2>
                            <button className="cal-modal-close" onClick={() => setPayModal({ open: false, item: null })}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="cal-modal-body">
                            <p>Deseja marcar a <strong>Parcela {payModal.item?.parcela}</strong> de <strong>{payModal.item?.cliente}</strong> como paga?</p>
                            <div className="cal-modal-info">
                                <span>Valor: {fmt(payModal.item?.valor)}</span>
                            </div>

                            <div className="cal-field">
                                <label>Mês de Referência (Dashboard)</label>
                                <select
                                    className="cal-input"
                                    value={refMonth}
                                    onChange={e => setRefMonth(e.target.value)}
                                >
                                    {MONTHS.map(m => (
                                        <option key={m} value={m.toLowerCase()}>{m}</option>
                                    ))}
                                </select>
                                <small>Este pagamento será contabilizado neste mês no dashboard.</small>
                            </div>
                        </div>

                        <div className="cal-modal-footer">
                            <button className="cal-btn-cancel" onClick={() => setPayModal({ open: false, item: null })}>
                                Cancelar
                            </button>
                            <button className="cal-btn-confirm" onClick={handleConfirmPayment} disabled={paymentSaving}>
                                {paymentSaving ? 'Processando...' : (
                                    <>
                                        <Check size={16} /> Confirmar Pagamento
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioPagamentos;
