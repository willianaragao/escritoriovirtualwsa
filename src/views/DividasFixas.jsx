import React, { useEffect, useState } from 'react';
import {
    Calendar,
    ChevronDown,
    Edit3,
    Trash2,
    Plus,
    X,
    Check,
    Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DividasFixas.css';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Maio 2026 é o mês template — fonte da verdade das dívidas fixas
const TEMPLATE_MONTH = '2026-05';

const EMPTY_FORM = {
    descricao: '',
    vencimento: '',
    valor: '',
    ativa: true,
    paga: false,
    observacoes: ''
};

const DividasFixas = ({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, businessUnit, user }) => {
    const now = new Date();
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const [dividas, setDividas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingIsTemplate, setEditingIsTemplate] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    const userId = user?.id || user?.user?.id;
    const mesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const isViewingTemplate = mesRef === TEMPLATE_MONTH;

    useEffect(() => {
        fetchDividas();
    }, [selectedMonth, selectedYear, businessUnit]);

    const fetchDividas = async () => {
        if (businessUnit === 'PET') {
            setDividas([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const currentMesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

            // Busca sempre o template de Maio
            const { data: templateData, error: templateError } = await supabase
                .from('dividas_fixas_wsa')
                .select('*')
                .eq('mes_referencia', TEMPLATE_MONTH)
                .order('vencimento', { ascending: true });
            if (templateError) throw templateError;

            // Se estamos em Maio, mostra direto
            if (currentMesRef === TEMPLATE_MONTH) {
                setDividas(templateData || []);
                return;
            }

            // Para outros meses: busca os registros específicos daquele mês
            const { data: monthData, error: monthError } = await supabase
                .from('dividas_fixas_wsa')
                .select('*')
                .eq('mes_referencia', currentMesRef);
            if (monthError) throw monthError;

            // Monta mapa por descrição dos registros do mês corrente
            const monthMap = {};
            (monthData || []).forEach(d => { monthMap[d.descricao] = d; });

            // Mescla: template como base (paga=false), sobreposto pelo registro do mês se existir
            const merged = (templateData || []).map(template => {
                if (monthMap[template.descricao]) {
                    return monthMap[template.descricao];
                }
                // Dívida ainda não tocada neste mês: exibe do template, mas sempre não paga
                return { ...template, paga: false, _is_template: true };
            });

            setDividas(merged);
        } catch (err) {
            console.error('Erro ao buscar dívidas:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalMensal = dividas
        .filter(d => !d.paga && d.ativa !== false)
        .reduce((acc, d) => acc + (d.valor || d.valor_mensal || 0), 0);

    const filteredDividas = dividas.filter(d => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            (d.descricao || '').toLowerCase().includes(term) ||
            (d.observacoes || '').toLowerCase().includes(term)
        );
    });

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
        setEditingIsTemplate(false);
        setForm({ ...EMPTY_FORM });
        setIsModalOpen(true);
    };

    const openEdit = (d) => {
        setEditingId(d.id);
        setEditingIsTemplate(!!d._is_template);
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

    const handleDelete = async (d) => {
        // Se é um registro de template sendo visualizado em outro mês
        if (d._is_template) {
            alert('Esta dívida vem do template (Maio). Para excluí-la de todos os meses, acesse o mês de Maio.');
            return;
        }
        if (!confirm(`Excluir "${d.descricao}"?`)) return;
        const { error } = await supabase.from('dividas_fixas_wsa').delete().eq('id', d.id);
        if (error) { alert('Erro ao excluir.'); return; }
        fetchDividas();
    };

    const handleTogglePago = async (d) => {
        const currentMesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

        try {
            if (!d._is_template && d.mes_referencia === currentMesRef) {
                // Registro já específico deste mês: só atualiza o status
                const { error } = await supabase
                    .from('dividas_fixas_wsa')
                    .update({ paga: !d.paga })
                    .eq('id', d.id);
                if (error) throw error;
            } else {
                // É um template (Maio). Cria um clone para este mês com o status alterado.
                const { id, created_at, updated_at, _is_template, ...rest } = d;
                const payload = {
                    ...rest,
                    mes_referencia: currentMesRef,
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
            alert(`Erro ao alterar status: ${err.message || 'Erro desconhecido'}`);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.descricao.trim()) { alert('Informe a descrição.'); return; }
        if (!form.valor || isNaN(parseFloat(form.valor))) { alert('Informe um valor válido.'); return; }
        if (form.vencimento === '' || isNaN(Number(form.vencimento))) { alert('Informe o dia de vencimento (1-31).'); return; }

        setSaving(true);
        try {
            const currentMesRef = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            const payload = {
                user_id: userId,
                descricao: form.descricao.trim(),
                vencimento: Number(form.vencimento),
                valor: parseFloat(form.valor),
                ativa: form.ativa,
                paga: form.paga,
                observacoes: form.observacoes || null,
                categoria: 'Fixa',
                tipo: 'mensal',
                mes_referencia: currentMesRef
            };

            let err;
            if (editingId && !editingIsTemplate) {
                // Edição de registro específico deste mês
                ({ error: err } = await supabase.from('dividas_fixas_wsa').update(payload).eq('id', editingId));
            } else {
                // Nova dívida ou edição de template: cria registro para este mês
                ({ error: err } = await supabase.from('dividas_fixas_wsa').insert([payload]));
            }
            if (err) throw err;
            setIsModalOpen(false);
            fetchDividas();
        } catch (err) {
            console.error('Erro detalhado ao salvar dívida:', err);
            alert(`Erro ao salvar dívida: ${err.message || 'Verifique se todos os campos estão corretos.'}`);
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
                {/* Botão "+" compacto */}
                <button
                    className="df-btn-nova-mobile"
                    onClick={openNew}
                    disabled={businessUnit === 'PET'}
                    aria-label="Nova Dívida Fixa"
                >
                    <Plus size={20} />
                </button>
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

            {/* ===== TOTAL ROW ===== */}
            <div className="df-totals-row">
                <div className="df-total-card">
                    <span className="df-total-label">Saldo Devedor (Aberto)</span>
                    <span className="df-total-value">{formatCurrency(totalMensal)}</span>
                </div>
            </div>

            {/* ===== SEARCH BAR ===== */}
            <div className="df-search-row">
                <div className="df-search-box">
                    <Search size={16} className="df-search-icon" />
                    <input
                        type="text"
                        className="df-search-input"
                        placeholder="Pesquisar dívida fixa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="df-search-clear"
                            onClick={() => setSearchTerm('')}
                            aria-label="Limpar pesquisa"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
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
                                <td colSpan="6" className="df-empty">Carregando...</td>
                            </tr>
                        ) : dividas.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="df-empty">Nenhuma dívida cadastrada.</td>
                            </tr>
                        ) : filteredDividas.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="df-empty">Nenhuma dívida encontrada para "{searchTerm}".</td>
                            </tr>
                        ) : filteredDividas.map((d) => {
                            const status = getStatusInfo(d);
                            return (
                                <tr key={d.id} className={d.paga ? 'df-row-paga' : ''}>
                                    <td className="df-td-desc" data-label="Descrição">{d.descricao}</td>
                                    <td className="df-td-venc" data-label="Vencimento">{d.vencimento ?? '-'}</td>
                                    <td data-label="Status">
                                        <span
                                            className={`df-badge ${status.cls}`}
                                            onClick={() => handleTogglePago(d)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="df-td-valor" data-label="Valor">{formatCurrency(d.valor || d.valor_mensal)}</td>
                                    <td className="df-td-pago-toggle" data-label="Pago">
                                        <button
                                            className={`df-btn-check ${d.paga ? 'checked' : ''}`}
                                            onClick={() => handleTogglePago(d)}
                                        >
                                            <Check size={14} />
                                        </button>
                                    </td>
                                    <td className="df-td-actions" data-label="Ações">
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
                                                onClick={() => handleDelete(d)}
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
                            <h2>{editingId && !editingIsTemplate ? 'Editar Dívida Fixa' : 'Nova Dívida Fixa'}</h2>
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
                                    required
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
                                        required
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
                                        required
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
                                            className={`df-toggle-btn ${form.ativa && !form.paga ? 'active-green' : ''}`}
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
                                    {saving ? 'Salvando...' : (editingId && !editingIsTemplate) ? 'Salvar Alterações' : 'Cadastrar'}
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
