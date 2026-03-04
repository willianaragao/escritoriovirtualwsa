import React, { useEffect, useState } from 'react';
import {
    Calendar,
    ChevronDown,
    Edit3,
    Trash2,
    Plus,
    X,
    Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DividasFixas.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const EMPTY_FORM = {
    descricao: '',
    vencimento: '',
    valor: '',
    ativa: true,
    paga: false,
    observacoes: ''
};

const DividasFixas = ({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear }) => {
    const now = new Date();
    // Removed local selectedMonth/Year
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const [dividas, setDividas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
    }, []);

    useEffect(() => {
        fetchDividas();
    }, [selectedMonth, selectedYear]);

    const fetchDividas = async () => {
        setLoading(true);
        try {
            const mesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

            // Tenta buscar dividas com mes_referencia ou sem ele (fallback)
            const { data, error } = await supabase
                .from('dividas_fixas_wsa')
                .select('*')
                .or(`mes_referencia.eq.${mesRef},mes_referencia.is.null`)
                .order('vencimento', { ascending: true });

            if (error) throw error;

            const mapByDesc = {};
            data.forEach(d => {
                if (!d.mes_referencia) mapByDesc[d.descricao] = d;
            });
            data.forEach(d => {
                if (d.mes_referencia === mesRef) mapByDesc[d.descricao] = d;
            });
            setDividas(Object.values(mapByDesc));
        } catch (err) {
            console.error('Erro ao buscar dívidas:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalMensal = dividas
        .filter(d => !d.paga && d.ativa !== false)
        .reduce((acc, d) => acc + (d.valor || d.valor_mensal || 0), 0);

    const formatCurrency = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const getStatusInfo = (d) => {
        if (d.paga) return { label: 'Pago', cls: 'badge-pago' };
        if (d.ativa !== false) return { label: 'Ativa', cls: 'badge-ativa' };
        return { label: 'Inativa', cls: 'badge-inativa' };
    };

    /* ---- Month Picker ---- */
    const monthLabel = `${MONTHS[selectedMonth]} de ${selectedYear}`;
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    /* ---- CRUD ---- */
    const openNew = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setIsModalOpen(true);
    };

    const openEdit = (d) => {
        setEditingId(d.id);
        setForm({
            descricao: d.descricao || '',
            vencimento: d.vencimento ?? '',
            valor: d.valor ?? d.valor_mensal ?? '',
            ativa: d.ativa !== false,
            paga: !!d.paga,
            observacoes: d.observacoes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id, desc) => {
        if (!confirm(`Excluir "${desc}"?`)) return;
        const { error } = await supabase.from('dividas_fixas_wsa').delete().eq('id', id);
        if (error) { alert('Erro ao excluir.'); return; }
        fetchDividas();
    };

    const handleTogglePago = async (d) => {
        const mesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

        try {
            if (d.mes_referencia === mesRef) {
                // It's already a monthly specific record, just switch its status
                const { error } = await supabase
                    .from('dividas_fixas_wsa')
                    .update({ paga: !d.paga })
                    .eq('id', d.id);
                if (error) throw error;
            } else {
                // It's a MASTER record (null reference). 
                // We create a CLONE for this month with the new status.
                const { id, created_at, updated_at, ...rest } = d;
                const payload = {
                    ...rest,
                    mes_referencia: mesRef,
                    paga: !d.paga
                };
                const { error } = await supabase
                    .from('dividas_fixas_wsa')
                    .insert([payload]);
                if (error) throw error;
            }
            fetchDividas();
        } catch (err) {
            console.error('Error toggling payment:', err);
            alert('Erro ao alterar status de pagamento.');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.descricao.trim()) { alert('Informe a descrição.'); return; }
        if (!form.valor || isNaN(parseFloat(form.valor))) { alert('Informe um valor válido.'); return; }
        setSaving(true);
        try {
            const mesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            const payload = {
                user_id: userId,
                descricao: form.descricao.trim(),
                vencimento: form.vencimento !== '' ? Number(form.vencimento) : null,
                valor: parseFloat(form.valor),
                ativa: form.ativa,
                paga: form.paga,
                observacoes: form.observacoes || null,
                categoria: 'Fixa',
                tipo: 'mensal',
                mes_referencia: mesRef
            };

            let err;
            if (editingId) {
                ({ error: err } = await supabase.from('dividas_fixas_wsa').update(payload).eq('id', editingId));
            } else {
                ({ error: err } = await supabase.from('dividas_fixas_wsa').insert([payload]));
            }
            if (err) throw err;
            setIsModalOpen(false);
            fetchDividas();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar dívida.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="df-container">

            {/* ===== HEADER ===== */}
            <header className="df-header">
                <div className="df-header-left">
                    <h1>Dívidas Fixas</h1>
                    <p>Compromissos mensais recorrentes</p>
                </div>
                <div className="df-header-right">
                    {/* Month selector */}
                    <div className="df-month-selector" style={{ position: 'relative' }}>
                        <button
                            className="df-month-btn"
                            onClick={() => setShowMonthPicker(v => !v)}
                        >
                            <Calendar size={15} />
                            <span>{monthLabel}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showMonthPicker && (
                            <div className="df-month-popup">
                                <div className="df-month-year-row">
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            className={`df-year-btn ${y === selectedYear ? 'active' : ''}`}
                                            onClick={() => setSelectedYear(y)}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                                <div className="df-month-grid">
                                    {MONTHS.map((m, idx) => (
                                        <button
                                            key={m}
                                            className={`df-month-pill ${idx === selectedMonth ? 'active' : ''}`}
                                            onClick={() => { setSelectedMonth(idx); setShowMonthPicker(false); }}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== TOTAL + BUTTON ROW ===== */}
            <div className="df-totals-row">
                <div className="df-total-card">
                    <span className="df-total-label">Saldo Devedor (Aberto)</span>
                    <span className="df-total-value">{formatCurrency(totalMensal)}</span>
                </div>
                <button className="df-btn-nova" onClick={openNew}>
                    <Plus size={16} />
                    Nova Dívida Fixa
                </button>
            </div>

            {/* ===== TABLE ===== */}
            <div className="df-table-wrapper">
                <table className="df-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Valor Mensal</th>
                            <th>Pago</th>
                            <th className="df-th-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="df-empty">Carregando...</td>
                            </tr>
                        ) : dividas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="df-empty">Nenhuma dívida cadastrada.</td>
                            </tr>
                        ) : dividas.map((d) => {
                            const status = getStatusInfo(d);
                            return (
                                <tr key={d.id}>
                                    <td className="df-td-desc">{d.descricao}</td>
                                    <td className="df-td-venc">{d.vencimento ?? '-'}</td>
                                    <td>
                                        <span
                                            className={`df-badge ${status.cls}`}
                                            onClick={() => handleTogglePago(d)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="df-td-valor">{formatCurrency(d.valor || d.valor_mensal)}</td>
                                    <td className="df-td-pago-toggle">
                                        <button
                                            className={`df-btn-check ${d.paga ? 'checked' : ''}`}
                                            onClick={() => handleTogglePago(d)}
                                        >
                                            <Check size={14} />
                                        </button>
                                    </td>
                                    <td className="df-td-actions">
                                        <div className="df-actions">
                                            <button
                                                className="df-action-btn df-edit-btn"
                                                title="Editar"
                                                onClick={() => openEdit(d)}
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                className="df-action-btn df-delete-btn"
                                                title="Excluir"
                                                onClick={() => handleDelete(d.id, d.descricao)}
                                            >
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

            {/* ===== MODAL ===== */}
            {isModalOpen && (
                <div className="df-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="df-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="df-modal-header">
                            <h2>{editingId ? 'Editar Dívida Fixa' : 'Nova Dívida Fixa'}</h2>
                            <button className="df-modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="df-modal-form">
                            {/* Descrição */}
                            <div className="df-field">
                                <label>Descrição</label>
                                <input
                                    type="text"
                                    className="df-input"
                                    placeholder="Ex: Aluguel, Internet, Salário do Lucas..."
                                    value={form.descricao}
                                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            {/* Vencimento + Valor (side by side) */}
                            <div className="df-row-2col">
                                <div className="df-field">
                                    <label>Dia de Vencimento</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="df-input"
                                        placeholder="Ex: 15"
                                        value={form.vencimento}
                                        onChange={e => setForm({ ...form, vencimento: e.target.value })}
                                    />
                                </div>
                                <div className="df-field">
                                    <label>Valor Mensal (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="df-input"
                                        placeholder="0,00"
                                        value={form.valor}
                                        onChange={e => setForm({ ...form, valor: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="df-row-2col">
                                <div className="df-field">
                                    <label>Status</label>
                                    <div className="df-toggle-group">
                                        <button
                                            type="button"
                                            className={`df-toggle-btn ${form.ativa ? 'active-green' : ''}`}
                                            onClick={() => setForm({ ...form, ativa: true, paga: false })}
                                        >
                                            Ativa
                                        </button>
                                        <button
                                            type="button"
                                            className={`df-toggle-btn ${form.paga ? 'active-amber' : ''}`}
                                            onClick={() => setForm({ ...form, paga: true, ativa: true })}
                                        >
                                            Pago
                                        </button>
                                        <button
                                            type="button"
                                            className={`df-toggle-btn ${!form.ativa && !form.paga ? 'active-gray' : ''}`}
                                            onClick={() => setForm({ ...form, ativa: false, paga: false })}
                                        >
                                            Inativa
                                        </button>
                                    </div>
                                </div>
                                <div className="df-field">
                                    <label>Observações</label>
                                    <input
                                        type="text"
                                        className="df-input"
                                        placeholder="Opcional..."
                                        value={form.observacoes}
                                        onChange={e => setForm({ ...form, observacoes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="df-modal-footer">
                                <button
                                    type="button"
                                    className="df-btn-cancel"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="df-btn-save"
                                    disabled={saving}
                                >
                                    <Check size={15} />
                                    {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DividasFixas;
