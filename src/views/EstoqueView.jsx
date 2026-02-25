import React, { useState, useEffect } from 'react';
import {
    Plus, Package, Target, Wallet, AlertCircle,
    Calendar, ChevronDown, Edit3, Trash2,
    Check, TrendingUp, TrendingDown, Clock, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './EstoqueView.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const fmt = val => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const EstoqueView = () => {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const [loading, setLoading] = useState(true);

    // Data States
    const [dynamicStock, setDynamicStock] = useState([
        { id: 1, nome: 'Garrafa 500ml', inicial: 0, produzido: 0, vendido: 0, atual: 0 },
        { id: 2, nome: 'Garrafa 450ml', inicial: 0, produzido: 0, vendido: 0, atual: 0 },
        { id: 3, nome: 'Garrafa 300ml', inicial: 0, produzido: 0, vendido: 0, atual: 0 },
        { id: 4, nome: 'Garrafa 1 Litro', inicial: 0, produzido: 0, vendido: 0, atual: 0 },
    ]);

    const [manualStock, setManualStock] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Manual Stock
            const { data: mData } = await supabase.from('produtos').select('*').order('nome');
            const manual = (mData || []).map(p => ({
                id: p.id,
                nome: p.nome,
                qty: p.estoque_atual || 0,
                custo: p.preco_unitario || 0,
                status: (p.estoque_atual || 0) < 10 ? 'Baixo' : 'Normal'
            }));
            setManualStock(manual);

            // 2. Fetch Orders for the period
            const { data: pData } = await supabase
                .from('pedidos')
                .select('id, data_pedido, valor_total, status, clientes(nome)')
                .order('data_pedido', { ascending: false });

            const periodOrders = (pData || []).filter(p => {
                if (!p.data_pedido) return false;
                const d = new Date(p.data_pedido + 'T12:00:00');
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
            });

            // 3. Fetch Items to calculate volumes
            const orderIds = periodOrders.map(o => o.id);
            let items = [];
            if (orderIds.length > 0) {
                const { data: iData } = await supabase
                    .from('pedidos_produtos')
                    .select('*, produtos(nome)')
                    .in('pedido_id', orderIds);
                items = iData || [];
            }

            const mappedOrders = periodOrders.map(o => {
                const oItems = items.filter(it => it.pedido_id === o.id);
                const getVol = (pattern) => oItems
                    .filter(it => it.produtos?.nome?.toLowerCase().includes(pattern))
                    .reduce((acc, it) => acc + (it.quantidade || 0), 0);

                return {
                    id: o.id,
                    data: o.data_pedido.split('-').reverse().join('/'),
                    cliente: o.clientes?.nome || 'N/A',
                    v500: getVol('500ml'),
                    v450: getVol('450ml'),
                    v300: getVol('300ml'),
                    v1l: getVol('1 litro') || getVol('1l'),
                    total: o.valor_total || 0,
                    status: o.status // keep original status for badge logic
                };
            });
            setOrders(mappedOrders);

            // 4. Update Dynamic Stock
            setDynamicStock(prev => prev.map(ds => {
                const pattern = ds.nome.toLowerCase().replace('garrafa ', '');
                const sold = items.filter(it => it.produtos?.nome?.toLowerCase().includes(pattern))
                    .reduce((acc, it) => acc + (it.quantidade || 0), 0);

                const manualItem = manual.find(m => m.nome.toLowerCase().includes(pattern));
                const inicial = manualItem ? manualItem.qty : 0;

                return { ...ds, inicial, vendido: sold, atual: inicial - sold };
            }));

        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalProduzido = dynamicStock.reduce((acc, item) => acc + item.produzido, 0);
    const totalVendido = dynamicStock.reduce((acc, item) => acc + item.vendido, 0);
    const totalSaldo = dynamicStock.reduce((acc, item) => acc + item.atual, 0);
    const valorTotalEstoque = manualStock.reduce((acc, item) => acc + (item.qty * item.custo), 0);

    const monthLabel = `${MONTHS[selectedMonth]} de ${selectedYear}`;
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div className="est-container">
            {/* ── Header ── */}
            <header className="est-header">
                <div className="est-header-left">
                    <h1>Controle de Estoque</h1>
                    <p>Gestão de produtos e matéria-prima</p>
                </div>
                <button className="est-btn-orange">
                    <Plus size={16} /> Novo Item
                </button>
            </header>

            {/* ── Section 1: Dynamic Stock ── */}
            <div className="est-card">
                <div className="est-card-header">
                    <div className="est-card-title">
                        <Package size={20} color="#3b82f6" />
                        <span>Controle de Estoque Dinâmico</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Valor Total do Estoque</span>
                            <strong style={{ display: 'block', color: '#f59e0b', fontSize: '1.1rem' }}>{fmt(valorTotalEstoque)}</strong>
                        </div>
                        <div className="pv-month-selector" style={{ position: 'relative' }}>
                            <button className="pv-month-btn" onClick={() => setShowMonthPicker(v => !v)}>
                                <Calendar size={14} />
                                <span>{monthLabel}</span>
                                <ChevronDown size={14} />
                            </button>
                            {showMonthPicker && (
                                <div className="pv-month-popup">
                                    <div className="pv-year-row">
                                        {years.map(y => (
                                            <button key={y} className={`pv-year-btn ${y === selectedYear ? 'active' : ''}`} onClick={() => setSelectedYear(y)}>{y}</button>
                                        ))}
                                    </div>
                                    <div className="pv-month-grid">
                                        {MONTHS.map((m, idx) => (
                                            <button key={m} className={`pv-month-pill ${idx === selectedMonth ? 'active' : ''}`} onClick={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}>
                                                {m.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="est-indicators-grid">
                    {dynamicStock.map(p => (
                        <div key={p.id} className="est-prod-card">
                            <div className="est-prod-label">{p.nome}</div>
                            <div className="est-prod-value">{p.atual}</div>
                            <div className="est-prod-formula">{p.inicial} + {p.produzido} - {p.vendido}</div>
                        </div>
                    ))}
                </div>

                <div className="est-summary-row">
                    <div className="est-sum-card">
                        <div className="est-sum-label"><TrendingUp size={14} style={{ marginRight: 6 }} /> Produzido</div>
                        <div className="est-sum-val green">{totalProduzido}</div>
                    </div>
                    <div className="est-sum-card">
                        <div className="est-sum-label"><TrendingDown size={14} style={{ marginRight: 6 }} /> Vendido</div>
                        <div className="est-sum-val red">{totalVendido}</div>
                    </div>
                    <div className="est-sum-card">
                        <div className="est-sum-label"><Target size={14} style={{ marginRight: 6 }} /> Saldo Total</div>
                        <div className="est-sum-val orange">{totalSaldo}</div>
                    </div>
                </div>

                <div className="est-table-wrap">
                    <table className="est-table">
                        <thead>
                            <tr>
                                <th>Tipo de Garrafa</th>
                                <th>Estoque Inicial</th>
                                <th><TrendingUp size={12} /> Produzido</th>
                                <th><TrendingDown size={12} /> Vendido</th>
                                <th>Saldo Atual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dynamicStock.map(p => (
                                <tr key={p.id}>
                                    <td className="est-td-bold">{p.nome}</td>
                                    <td className="est-td-blue">{p.inicial}</td>
                                    <td className="est-td-green">+{p.produzido}</td>
                                    <td className="est-td-red">-{p.vendido}</td>
                                    <td><span className="est-badge est-badge-green">{p.atual}</span></td>
                                </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid rgba(255,255,255,0.05)' }}>
                                <td className="est-td-bold">TOTAL</td>
                                <td className="est-td-blue">{dynamicStock.reduce((a, b) => a + b.inicial, 0)}</td>
                                <td className="est-td-green">+{totalProduzido}</td>
                                <td className="est-td-red">-{totalVendido}</td>
                                <td><span className="est-badge est-badge-green">{totalSaldo}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#475569', marginTop: '1.5rem', textAlign: 'center' }}>
                    * Saldo = Estoque Cadastrado + Produção (mês) - Vendas (mês)
                </p>
            </div>

            {/* ── Section 2: Manual Stock ── */}
            <div className="est-card">
                <div className="est-card-title" style={{ marginBottom: '0.2rem' }}>
                    <span>Estoque Cadastrado Manualmente</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem' }}>Itens adicionados manualmente ao estoque</p>

                <div className="est-table-wrap">
                    <table className="est-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Custo Médio Unitário</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manualStock.map(m => (
                                <tr key={m.id}>
                                    <td className="est-td-bold">{m.nome}</td>
                                    <td className="est-td-muted">{m.qty}</td>
                                    <td className="est-td-muted">{fmt(m.custo)}</td>
                                    <td><span className="est-badge est-badge-gray">{m.status}</span></td>
                                    <td className="est-td-bold">{fmt(m.qty * m.custo)}</td>
                                    <td className="est-actions">
                                        <button className="est-action-btn"><Edit3 size={14} /></button>
                                        <button className="est-action-btn del"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Section 3: Orders Summary ── */}
            <div className="est-card">
                <div className="est-card-header">
                    <div className="est-card-title">
                        <ShoppingCart size={18} />
                        <span>Pedidos Emitidos</span>
                    </div>
                </div>

                <div className="est-order-summary">
                    <div className="est-order-sum-item"><span>500ml</span><strong>{orders.reduce((acc, o) => acc + o.v500, 0)}</strong></div>
                    <div className="est-order-sum-item"><span>450ml</span><strong>{orders.reduce((acc, o) => acc + o.v450, 0)}</strong></div>
                    <div className="est-order-sum-item"><span>300ml</span><strong>{orders.reduce((acc, o) => acc + o.v300, 0)}</strong></div>
                    <div className="est-order-sum-item"><span>1 Litro</span><strong>{orders.reduce((acc, o) => acc + o.v1l, 0)}</strong></div>
                    <div className="est-total-box">
                        <span>Valor Total</span>
                        <strong>{fmt(orders.reduce((acc, o) => acc + o.total, 0))}</strong>
                    </div>
                </div>

                <div className="est-table-wrap">
                    <table className="est-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>500ml</th>
                                <th>450ml</th>
                                <th>300ml</th>
                                <th>1 Litro</th>
                                <th>Valor Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => {
                                const STATUS_MAP = {
                                    'pago': { label: 'Pago', cls: 'pago' },
                                    'pendente': { label: 'Pendente', cls: 'pendente' },
                                    'a_receber': { label: 'A Receber', cls: 'receber' },
                                    'parcialmente_pago': { label: 'A Receber', cls: 'receber' },
                                    'aguardando_pagamento': { label: 'A Receber', cls: 'receber' },
                                };
                                const badge = STATUS_MAP[o.status] || { label: 'Pendente', cls: 'pendente' };

                                return (
                                    <tr key={o.id}>
                                        <td className="est-td-muted">{o.data}</td>
                                        <td className="est-td-bold">{o.cliente}</td>
                                        <td className="est-td-muted">{o.v500 || '-'}</td>
                                        <td className="est-td-muted">{o.v450 || '-'}</td>
                                        <td className="est-td-muted">{o.v300 || '-'}</td>
                                        <td className="est-td-muted">{o.v1l || '-'}</td>
                                        <td className="est-td-bold">{fmt(o.total)}</td>
                                        <td><span className={`est-badge est-badge-${badge.cls}`}>{badge.label}</span></td>
                                    </tr>
                                );
                            })}

                            {orders.length > 0 && (
                                <tr className="est-table-total-row">
                                    <td colSpan={2} className="est-td-total-label">TOTAL DO MÊS</td>
                                    <td className="est-td-bold">{orders.reduce((acc, o) => acc + o.v500, 0)}</td>
                                    <td className="est-td-bold">{orders.reduce((acc, o) => acc + o.v450, 0)}</td>
                                    <td className="est-td-bold">{orders.reduce((acc, o) => acc + o.v300, 0)}</td>
                                    <td className="est-td-bold">{orders.reduce((acc, o) => acc + o.v1l, 0)}</td>
                                    <td className="est-td-total-value">{fmt(orders.reduce((acc, o) => acc + o.total, 0))}</td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Internal icon for shopping cart as it was not imported in the top list but used below
const ShoppingCart = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);

export default EstoqueView;
