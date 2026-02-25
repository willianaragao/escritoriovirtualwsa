import React, { useEffect, useState } from 'react';
import {
    Tag,
    Plus,
    Calendar,
    ChevronDown,
    Edit3,
    Trash2,
    DollarSign,
    Receipt,
    ShoppingBag,
    Car,
    Fuel,
    Wifi,
    Coffee,
    MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Categorias.css';

const iconMap = {
    'Money': DollarSign,
    'DollarSign': DollarSign,
    'Receipt': Receipt,
    'ShoppingBag': ShoppingBag,
    'Car': Car,
    'Vehicle': Car,
    'Fuel': Fuel,
    'Wifi': Wifi,
    'Coffee': Coffee,
    'MoreHorizontal': MoreHorizontal
};

const colorMap = {
    '#10b981': { name: 'Verde', class: 'emerald' },
    '#ef4444': { name: 'Vermelho', class: 'red' },
    '#3b82f6': { name: 'Azul', class: 'blue' },
    '#f59e0b': { name: 'Laranja', class: 'amber' },
    '#8b5cf6': { name: 'Roxo', class: 'violet' }
};

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategorias = async () => {
            try {
                const { data, error } = await supabase
                    .from('categorias')
                    .select('*')
                    .order('nome', { ascending: true });

                if (error) throw error;
                setCategorias(data || []);
            } catch (err) {
                console.error('Error fetching categorias:', err);
            } finally {
                setLoading(false);
            }
        };
        loadCategorias();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    const getIcon = (iconName) => {
        const Icon = iconMap[iconName] || Tag;
        return <Icon size={18} />;
    };

    const getColorInfo = (hex) => {
        return colorMap[hex] || { name: 'Personalizado', class: 'custom' };
    };

    return (
        <div className="categorias-view-container">
            <header className="header">
                <div className="header-titles">
                    <h1>Categorias</h1>
                    <p>Gerencie as categorias do sistema</p>
                </div>
                <div className="header-actions">
                    <button className="btn-orange">
                        <Plus size={16} />
                        Nova Categoria
                    </button>
                </div>
            </header>

            <div className="table-card">
                <div className="table-title-area">
                    <Tag size={20} className="tag-icon" />
                    <h3>Lista de Categorias</h3>
                </div>
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Ícone</th>
                            <th>Cor</th>
                            <th>Data de Criação</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
                        ) : categorias.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Nenhuma categoria encontrada.</td></tr>
                        ) : (
                            categorias.map((cat) => {
                                const colorInfo = getColorInfo(cat.cor);
                                return (
                                    <tr key={cat.id}>
                                        <td>
                                            <div className="cell-with-icon">
                                                <span style={{ color: cat.cor }}>{getIcon(cat.icone)}</span>
                                                <span style={{ fontWeight: 600 }}>{cat.nome}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell-with-icon" style={{ color: '#94a3b8' }}>
                                                {getIcon(cat.icone)}
                                                <span>{cat.icone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="color-badge">
                                                <div className="color-dot" style={{ backgroundColor: cat.cor }}></div>
                                                <span>{colorInfo.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>{formatDate(cat.created_at)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="action-btn edit"><Edit3 size={16} /></button>
                                            <button className="action-btn delete"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Categorias;
