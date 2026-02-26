import React, { useState, useEffect } from 'react';
import {
    Calendar, Search, ChevronDown,
    AlertCircle, FileCheck2, Clock,
    TrendingUp, ArrowRightLeft, MessageCircle, MoreHorizontal
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

const CalendarioPagamentos = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
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

    useEffect(() => {
        fetchParcelas();
    }, []);

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
                        status: pStatus
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
            s.geralVal += p.valor;
            s.geralCount++;

            if (p.status === 'pago') {
                s.recebidoVal += p.valor;
                s.recebidoCount++;
            } else if (p.status === 'vencido') {
                s.vencidoVal += p.valor;
                s.vencidoCount++;
                s.aReceberVal += p.valor;
                s.aReceberCount++;
            } else {
                s.aReceberVal += p.valor;
                s.aReceberCount++;
            }
        });

        setStats(s);
    };

    const filtered = parcelas.filter(p => {
        // Month/Year filter
        const [y, m] = p.vencimento.split('-');
        const sameMonth = parseInt(y) === selectedYear && (parseInt(m) - 1) === selectedMonth;
        if (!sameMonth) return false;

        // Search terminology
        if (searchTerm && !p.cliente.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // Tab filter
        if (activeTab === 'pendentes' && !['pendente', 'vencido'].includes(p.status)) return false;
        if (activeTab === 'vencidas' && p.status !== 'vencido') return false;
        if (activeTab === 'pagas' && p.status !== 'pago') return false;

        return true;
    });

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
        </div>
    );
};

export default CalendarioPagamentos;
