import React, { useEffect, useState, useRef } from 'react';
import {
    Calendar,
    Search,
    Plus,
    Edit3,
    Trash2,
    ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DespesasView.css';

const CATEGORY_COLORS = {
    'Combustivel': { bg: '#1e3a5f', color: '#60a5fa', dot: '#3b82f6' },
    'Contas': { bg: '#1a3a2a', color: '#34d399', dot: '#10b981' },
    'Manutenção': { bg: '#3a2a1a', color: '#fb923c', dot: '#f97316' },
    'Inss': { bg: '#2a1a3a', color: '#a78bfa', dot: '#8b5cf6' },
    'Internet': { bg: '#1a3a2a', color: '#34d399', dot: '#10b981' },
    'Alimentação': { bg: '#3a2a1a', color: '#fb923c', dot: '#f97316' },
    'Retirada de Lucro': { bg: '#3a1a2a', color: '#f472b6', dot: '#db2777' }, // Pink theme for profit withdrawal
};

const PAYMENT_ICONS = {
    'dinheiro': { dot: '#f59e0b', label: 'Dinheiro' },
    'pix': { dot: '#10b981', label: 'PIX' },
    'cartao': { dot: '#3b82f6', label: 'Cartão' },
    'boleto': { dot: '#ef4444', label: 'Boleto' },
};

// Helpers
const today = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
};

const getDateRange = (period) => {
    const now = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    switch (period) {
        case 'Hoje':
            return { from: fmt(now), to: fmt(now) };
        case 'Ontem': {
            const y = new Date(now); y.setDate(y.getDate() - 1);
            return { from: fmt(y), to: fmt(y) };
        }
        case 'Semana': {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            return { from: fmt(start), to: fmt(now) };
        }
        case 'Mês': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: fmt(start), to: fmt(now) };
        }
        case 'Ano': {
            const start = new Date(now.getFullYear(), 0, 1);
            return { from: fmt(start), to: fmt(now) };
        }
        default:
            return null;
    }
};

const PERIODS = ['Hoje', 'Ontem', 'Semana', 'Mês', 'Ano'];

const DespesasView = () => {
    const [despesas, setDespesas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activePeriod, setActivePeriod] = useState('Mês');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [total, setTotal] = useState(0);
    const calendarRef = useRef(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // null = new, string = edit
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);
    const [form, setForm] = useState({
        descricao: '',
        categoria: '',
        valor: '',
        meio_pagamento: 'dinheiro',
        data: new Date().toISOString().split('T')[0],
        observacoes: ''
    });

    const [dbCategories, setDbCategories] = useState([]);

    useEffect(() => {
        fetchDespesas();
        fetchCategories();
        supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
    }, [activePeriod, customFrom, customTo, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase.from('categorias').select('*').order('nome');
            if (error) throw error;
            setDbCategories(data || []);
        } catch (err) {
            console.error('Erro ao buscar categorias:', err);
        }
    };

    // Close calendar popup on outside click
    useEffect(() => {
        const handler = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchDespesas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('despesas')
                .select('*')
                .order('data', { ascending: false });

            if (error) throw error;

            // 1. Normalize categories right at the source
            const normalizedData = (data || []).map(d => {
                let cat = d.categoria || 'Outros';
                if (cat === 'Alimentaçao') cat = 'Alimentação';
                if (cat === 'Internert') cat = 'Internet';
                return { ...d, categoria: cat };
            });

            // 2. Unique categories from normalized data (ensures clean filter list)
            const cats = [...new Set(normalizedData.map(d => d.categoria))].sort();
            setCategories(cats);

            // 3. Determine date range
            let from = null, to = null;
            if (activePeriod === 'Custom') {
                from = customFrom;
                to = customTo;
            } else {
                const range = getDateRange(activePeriod);
                if (range) { from = range.from; to = range.to; }
            }

            // 4. Filter normalized data
            const filtered = normalizedData.filter(d => {
                if (!d.data) return false;
                const dateStr = d.data.split('T')[0];
                const matchDate = (!from || dateStr >= from) && (!to || dateStr <= to);
                const matchCat = !selectedCategory || d.categoria === selectedCategory;
                return matchDate && matchCat;
            });

            setDespesas(filtered);
            setTotal(filtered.reduce((sum, d) => sum + (d.valor || 0), 0));
        } catch (err) {
            console.error('Error fetching despesas:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const s = dateStr.split('T')[0];
        const [year, month, day] = s.split('-');
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const getCategoryStyle = (cat) => {
        const dbCat = dbCategories.find(c => c.nome === cat);
        if (dbCat && dbCat.cor) {
            // Helper to handle lighter/darker shades if needed, 
            // but the table provides a direct color.
            return { bg: `${dbCat.cor}20`, color: dbCat.cor, dot: dbCat.cor };
        }
        return CATEGORY_COLORS[cat] || { bg: '#1e293b', color: '#94a3b8', dot: '#64748b' };
    };

    const getPaymentInfo = (meio) => {
        const key = (meio || '').toLowerCase();
        return PAYMENT_ICONS[key] || { dot: '#64748b', label: meio || 'N/A' };
    };

    const filteredList = despesas.filter(d =>
        d.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        const { error } = await supabase.from('despesas').delete().eq('id', id);
        if (error) { alert('Erro ao excluir.'); return; }
        fetchDespesas();
    };

    const applyCustomRange = () => {
        setActivePeriod('Custom');
        setShowCalendar(false);
    };

    const openModal = () => {
        setEditingId(null);
        setForm({
            descricao: '',
            categoria: '',
            valor: '',
            meio_pagamento: 'dinheiro',
            data: new Date().toISOString().split('T')[0],
            observacoes: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (d) => {
        setEditingId(d.id);
        setForm({
            descricao: d.descricao || '',
            categoria: d.categoria || '',
            valor: d.valor ?? '',
            meio_pagamento: (d.meio_pagamento || 'dinheiro').toLowerCase(),
            data: (d.data || '').split('T')[0],
            observacoes: d.observacoes || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveDespesa = async (e) => {
        e.preventDefault();
        if (!form.descricao.trim()) { alert('Informe a descrição.'); return; }
        if (!form.valor || isNaN(parseFloat(form.valor))) { alert('Informe um valor válido.'); return; }
        setSaving(true);
        try {
            let normalizedCat = form.categoria || 'Outros';
            if (normalizedCat === 'Alimentaçao') normalizedCat = 'Alimentação';
            if (normalizedCat === 'Internert') normalizedCat = 'Internet';

            const payload = {
                user_id: userId,
                descricao: form.descricao.trim(),
                categoria: normalizedCat,
                valor: parseFloat(form.valor),
                meio_pagamento: form.meio_pagamento,
                data: form.data,
                observacoes: form.observacoes || null
            };

            let error;
            if (editingId) {
                // UPDATE
                ({ error } = await supabase.from('despesas').update(payload).eq('id', editingId));
            } else {
                // INSERT
                ({ error } = await supabase.from('despesas').insert([payload]));
            }

            if (error) throw error;
            setIsModalOpen(false);
            setEditingId(null);
            fetchDespesas();
        } catch (err) {
            console.error(err);
            alert(editingId ? 'Erro ao atualizar despesa.' : 'Erro ao cadastrar despesa.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="despesas-container">
            {/* Header */}
            <header className="despesas-header">
                <div className="despesas-header-left">
                    <h1>Despesas</h1>
                    <p>Controle completo de despesas</p>
                </div>
                <div className="despesas-header-right">
                    {/* Category Filter */}
                    <div className="despesas-select-wrapper">
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="despesas-select"
                        >
                            <option value="">Todas as categorias</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="select-chevron" />
                    </div>

                    {/* Period Filter Bar */}
                    <div className="period-filter-bar">
                        {PERIODS.map(p => (
                            <button
                                key={p}
                                className={`period-btn ${activePeriod === p ? 'active' : ''}`}
                                onClick={() => setActivePeriod(p)}
                            >
                                {p}
                            </button>
                        ))}

                        {/* Calendar icon for custom range */}
                        <div className="period-calendar-wrapper" ref={calendarRef}>
                            <button
                                className={`period-btn period-calendar-btn ${activePeriod === 'Custom' ? 'active' : ''}`}
                                onClick={() => setShowCalendar(v => !v)}
                                title="Período personalizado"
                            >
                                <Calendar size={14} />
                            </button>
                            {showCalendar && (
                                <div className="calendar-popup">
                                    <label>De:
                                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                                    </label>
                                    <label>Até:
                                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                                    </label>
                                    <button className="apply-range-btn" onClick={applyCustomRange}>Aplicar</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* New Expense Button */}
                    <button className="btn-nova-despesa" onClick={openModal}>
                        <Plus size={16} />
                        Nova Despesa
                    </button>
                </div>
            </header>

            {/* Total Card */}
            <div className="despesas-total-card">
                <div className="despesas-total-left">
                    <span className="despesas-total-icon">💰</span>
                    <span className="despesas-total-label">Total em Despesas</span>
                </div>
                <span className="despesas-total-value">{formatCurrency(total)}</span>
            </div>

            {/* Table Card */}
            <div className="despesas-table-card">
                <div className="despesas-search-row">
                    <div className="despesas-search-wrapper">
                        <Search size={15} className="despesas-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar despesa..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="despesas-search-input"
                        />
                    </div>
                </div>

                <div className="despesas-table-responsive">
                    <table className="despesas-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Pagamento</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="despesas-empty">Carregando despesas...</td></tr>
                            ) : filteredList.length === 0 ? (
                                <tr><td colSpan="6" className="despesas-empty">Nenhuma despesa encontrada.</td></tr>
                            ) : filteredList.map(d => {
                                const catStyle = getCategoryStyle(d.categoria);
                                const payInfo = getPaymentInfo(d.meio_pagamento);
                                return (
                                    <tr key={d.id}>
                                        <td className="despesas-date">{formatDate(d.data)}</td>
                                        <td className="despesas-desc">{d.descricao}</td>
                                        <td>
                                            <span className="category-badge"
                                                style={{ background: catStyle.bg, color: catStyle.color }}>
                                                <span className="category-dot" style={{ background: catStyle.dot }} />
                                                {d.categoria}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="payment-badge">
                                                <span className="payment-dot" style={{ background: payInfo.dot }} />
                                                {payInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="despesas-valor">{formatCurrency(d.valor)}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="despesas-actions">
                                                <button
                                                    className="action-btn-icon edit-btn"
                                                    title="Editar"
                                                    onClick={() => openEditModal(d)}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button className="action-btn-icon delete-btn" title="Excluir"
                                                    onClick={() => handleDelete(d.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== MODAL NOVA DESPESA ========== */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveDespesa} className="modal-form">
                            {/* Descrição */}
                            <div className="modal-field">
                                <label>Descrição</label>
                                <input
                                    type="text"
                                    className="modal-input focused"
                                    placeholder="Ex: Matéria-prima, Salários, etc."
                                    value={form.descricao}
                                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            {/* Categoria */}
                            <div className="modal-field">
                                <label>Categoria</label>
                                <div className="modal-select-wrapper">
                                    <select
                                        className="modal-select"
                                        value={form.categoria}
                                        onChange={e => setForm({ ...form, categoria: e.target.value })}
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {dbCategories.map(c => (
                                            <option key={c.id} value={c.nome}>{c.nome}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={15} className="modal-select-chevron" />
                                </div>
                            </div>

                            {/* Valor */}
                            <div className="modal-field">
                                <label>Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="modal-input"
                                    placeholder="0,00"
                                    value={form.valor}
                                    onChange={e => setForm({ ...form, valor: e.target.value })}
                                />
                            </div>

                            {/* Meio de Pagamento */}
                            <div className="modal-field">
                                <label>Meio de Pagamento</label>
                                <div className="modal-select-wrapper">
                                    <select
                                        className="modal-select"
                                        value={form.meio_pagamento}
                                        onChange={e => setForm({ ...form, meio_pagamento: e.target.value })}
                                    >
                                        <option value="dinheiro">💵 Dinheiro</option>
                                        <option value="pix">⚡ PIX</option>
                                        <option value="cartao">💳 Cartão</option>
                                    </select>
                                    <ChevronDown size={15} className="modal-select-chevron" />
                                </div>
                            </div>

                            {/* Data */}
                            <div className="modal-field">
                                <label>Data</label>
                                <input
                                    type="date"
                                    className="modal-input"
                                    value={form.data}
                                    onChange={e => setForm({ ...form, data: e.target.value })}
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancelar"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-cadastrar"
                                    disabled={saving}
                                >
                                    <Plus size={16} />
                                    {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Despesa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DespesasView;

