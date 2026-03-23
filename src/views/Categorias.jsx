import React, { useEffect, useState } from 'react';
import {
    Tag, Plus, ChevronDown, Edit3, Trash2, X,
    DollarSign, Receipt, ShoppingBag, Car, Fuel, Wifi, Coffee, MoreHorizontal, Save, Sparkles, Droplet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Categorias.css';

const iconMap = {
    'DollarSign': DollarSign,
    'Receipt': Receipt,
    'ShoppingBag': ShoppingBag,
    'Car': Car,
    'Fuel': Fuel,
    'Wifi': Wifi,
    'Coffee': Coffee,
    'Tag': Tag,
    'MoreHorizontal': MoreHorizontal
};

const colorMap = [
    { hex: '#10b981', name: 'Esmeralda', label: 'Verde' },
    { hex: '#f43f5e', name: 'Carmim', label: 'Rosa' },
    { hex: '#ef4444', name: 'Ruby', label: 'Vermelho' },
    { hex: '#f59e0b', name: 'Âmbar', label: 'Laranja' },
    { hex: '#3b82f6', name: 'Oceano', label: 'Azul' },
    { hex: '#8b5cf6', name: 'Ametista', label: 'Roxo' },
    { hex: '#ec4899', name: 'Pink', label: 'Rosa Claro' },
    { hex: '#14b8a6', name: 'Turquesa', label: 'Teal' },
    { hex: '#f87171', name: 'Salmão', label: 'Vermelho Claro' }
];

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [form, setForm] = useState({ nome: '', icone: 'Tag', cor: '#f59e0b' });
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    const loadCategorias = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('categorias').select('*').order('nome', { ascending: true });
            if (error) throw error;
            setCategorias(data || []);
        } catch (err) {
            console.error('Error fetching categorias:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategorias();
        supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
    }, []);

    const openCreate = () => {
        setForm({ nome: '', icone: 'Tag', cor: '#f59e0b' });
        setEditingCat(null);
        setModalOpen(true);
    };

    const openEdit = (cat) => {
        setForm({ nome: cat.nome, icone: cat.icone || 'Tag', cor: cat.cor || '#f59e0b' });
        setEditingCat(cat);
        setModalOpen(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja remover a categoria "${name}"?`)) return;
        try {
            const { error } = await supabase.from('categorias').delete().eq('id', id);
            if (error) throw error;
            setCategorias(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) { alert('Preencha o nome da categoria.'); return; }
        
        setSaving(true);
        try {
            if (editingCat) {
                const { error } = await supabase.from('categorias').update({
                    nome: form.nome,
                    icone: form.icone,
                    cor: form.cor
                }).eq('id', editingCat.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('categorias').insert([{
                    nome: form.nome,
                    icone: form.icone,
                    cor: form.cor,
                    user_id: userId
                }]);
                if (error) throw error;
            }
            setModalOpen(false);
            loadCategorias();
        } catch (err) {
            alert('Erro ao salvar categoria: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const getIcon = (iconName, size = 18) => {
        const Icon = iconMap[iconName] || Tag;
        return <Icon size={size} />;
    };

    const getColorName = (hex) => {
        const match = colorMap.find(c => c.hex.toLowerCase() === hex.toLowerCase());
        return match ? match.name : 'Personalizada';
    };

    return (
        <div className="cat-view-container">
            <header className="cat-header">
                <div className="cat-header-titles">
                    <h1>Categorias UI MAX <Sparkles size={18} style={{ color: '#f59e0b', marginLeft: '8px' }}/></h1>
                    <p>Luxuoso e Responsivo — Configure os grupos de despesas da sua empresa.</p>
                </div>
                <div className="cat-header-actions">
                    <button className="cat-btn-orange" onClick={openCreate}>
                        <Plus size={16} /> Nova Categoria
                    </button>
                </div>
            </header>

            <div className="cat-glass-card">
                <div className="cat-table-title">
                    <div className="cat-tt-icon"><Tag size={20} /></div>
                    <h3>Gerenciador de Categorias</h3>
                </div>
                
                <div className="cat-table-wrapper">
                    <table className="cat-table">
                        <thead>
                            <tr>
                                <th>Nome e Rótulo</th>
                                <th>Ícone</th>
                                <th>Paleta / Cor</th>
                                <th>Data de Registro</th>
                                <th style={{ textAlign: 'right' }}>Gerenciar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="cat-empty"><div className="cat-spinner" /> Carregando base de dados...</td></tr>
                            ) : categorias.length === 0 ? (
                                <tr><td colSpan="5" className="cat-empty">Você ainda não castrou categorias exclusivas.</td></tr>
                            ) : (
                                categorias.map((cat) => (
                                    <tr key={cat.id}>
                                        <td>
                                            <div className="cat-cell-name">
                                                <div className="cat-icon-blob" style={{ background: `${cat.cor}1A`, color: cat.cor, border: `1px solid ${cat.cor}33` }}>
                                                    {getIcon(cat.icone)}
                                                </div>
                                                <span className="cat-hero-text">{cat.nome}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cat-cell-ghost">
                                                {getIcon(cat.icone, 16)} <span>{cat.icone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cat-color-badge" style={{ backgroundColor: `${cat.cor}1A`, borderColor: `${cat.cor}4D` }}>
                                                <div className="cat-color-dot" style={{ backgroundColor: cat.cor, boxShadow: `0 0 6px ${cat.cor}` }}></div>
                                                <span style={{ color: cat.cor }}>{getColorName(cat.cor)}</span>
                                            </div>
                                        </td>
                                        <td className="cat-cell-muted">{formatDate(cat.created_at)}</td>
                                        <td>
                                            <div className="cat-actions-row">
                                                <button className="cat-action-btn edit" onClick={() => openEdit(cat)} title="Editar Categoria">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button className="cat-action-btn delete" onClick={() => handleDelete(cat.id, cat.nome)} title="Excluir Categoria">
                                                    <Trash2 size={16} />
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

            {/* MODAL */}
            {modalOpen && (
                <div className="cat-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="cat-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="cat-modal-header">
                            <div>
                                <h2>{editingCat ? 'Editar Categoria Existente' : 'Criar Nova Categoria'}</h2>
                                <p>Preencha os dados e escolha um visual único.</p>
                            </div>
                            <button className="cat-modal-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        
                        <form className="cat-modal-body" onSubmit={handleSave}>
                            <div className="cat-form-group">
                                <label>Nome da Categoria</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="cat-input"
                                    placeholder="Ex: Combustível, Hardware, Alimentação..."
                                    value={form.nome} 
                                    onChange={e => setForm({ ...form, nome: e.target.value })} 
                                />
                            </div>

                            <div className="cat-flex-row">
                                <div className="cat-form-group" style={{ flex: 1 }}>
                                    <label>Escolher Ícone</label>
                                    <div className="cat-icon-picker">
                                        {Object.keys(iconMap).map(iconName => (
                                            <button 
                                                type="button" 
                                                key={iconName}
                                                className={`cat-icon-opt ${form.icone === iconName ? 'selected' : ''}`}
                                                onClick={() => setForm({ ...form, icone: iconName })}
                                            >
                                                {getIcon(iconName, 18)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="cat-preview-box" style={{ background: `${form.cor}1A`, borderColor: `${form.cor}4D` }}>
                                    <span style={{ color: form.cor }}>{getIcon(form.icone, 28)}</span>
                                </div>
                            </div>
                            
                            <div className="cat-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Droplet size={14}/> Paleta UI MAX</label>
                                <div className="cat-color-grid">
                                    {colorMap.map(c => (
                                        <button 
                                            type="button"
                                            key={c.hex}
                                            className={`cat-color-choice ${form.cor === c.hex ? 'selected' : ''}`}
                                            style={{ backgroundColor: c.hex, boxShadow: form.cor === c.hex ? `0 0 12px ${c.hex}` : 'none' }}
                                            onClick={() => setForm({ ...form, cor: c.hex })}
                                            title={c.name}
                                        />
                                    ))}
                                    {/* Custom hex integration placeholder if needed */}
                                    <input 
                                        type="color" 
                                        className="cat-color-picker-native" 
                                        value={form.cor} 
                                        onChange={e => setForm({ ...form, cor: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="cat-modal-footer">
                                <button type="button" className="cat-btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="cat-btn-save" disabled={saving}>
                                    {saving ? 'Gravando...' : <><Save size={16}/> Salvar no Sistema</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categorias;
