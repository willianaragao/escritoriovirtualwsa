import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Users, 
    DollarSign, 
    Package, 
    FilePlus2, 
    AlertCircle, 
    FileCheck2, 
    Clock, 
    Tag, 
    Banknote, 
    TrendingDown, 
    Calendar, 
    LineChart, 
    X 
} from 'lucide-react';
import './MobileBottomMenu.css';

const MobileBottomMenu = ({ activeView, setActiveView, businessUnit }) => {
    const [openCategory, setOpenCategory] = useState(null);

    const categories = [
        {
            id: 'dashboard',
            label: 'Início',
            icon: LayoutDashboard,
            items: null // Directly navigates
        },
        {
            id: 'pedidos',
            label: 'Pedidos',
            icon: ShoppingCart,
            items: [
                { id: 'novo-pedido', label: 'Novo Pedido', icon: FilePlus2 },
                { id: 'pendentes', label: 'Pendentes', icon: AlertCircle },
                { id: 'pagos', label: 'Pagos', icon: FileCheck2 },
                { id: 'a-receber', label: 'A receber', icon: Clock }
            ]
        },
        {
            id: 'cadastros',
            label: 'Cadastros',
            icon: Users,
            items: [
                { id: 'clientes', label: 'Clientes', icon: Users },
                { id: 'categorias', label: 'Categorias', icon: Tag }
            ]
        },
        {
            id: 'financeiro',
            label: 'Financeiro',
            icon: DollarSign,
            items: [
                { id: 'despesas', label: 'Despesas', icon: Banknote },
                { id: 'dividas', label: businessUnit === 'PET' ? 'Pedidos a Pagar' : 'Dívidas fixas', icon: TrendingDown },
                { id: 'calendario', label: 'Calendários', icon: Calendar }
            ]
        },
        {
            id: 'estoque',
            label: 'Estoque',
            icon: Package,
            items: [
                { id: 'estoque', label: 'Controle de Estoque', icon: Package },
                { id: 'lucro', label: 'Controle de Lucro', icon: LineChart }
            ]
        }
    ];

    const toggleCategory = (cat) => {
        if (!cat.items) {
            // Se não tem submenu, navega direto e fecha qualquer overlay
            setActiveView(cat.id);
            setOpenCategory(null);
        } else {
            // Se tem submenu, abre/fecha ele
            if (openCategory === cat.id) {
                setOpenCategory(null);
            } else {
                setOpenCategory(cat.id);
            }
        }
    };

    const handleNavigate = (viewId) => {
        setActiveView(viewId);
        setOpenCategory(null);
    };

    return (
        <div className="mobile-bottom-menu">
            {/* Pop-up para as subcategorias */}
            {openCategory && (
                <div className="mobile-submenu-overlay" onClick={() => setOpenCategory(null)}>
                    <div className="mobile-submenu-content" onClick={e => e.stopPropagation()}>
                        <div className="mobile-submenu-header">
                            <h3>{categories.find(c => c.id === openCategory)?.label}</h3>
                            <button onClick={() => setOpenCategory(null)} className="close-submenu-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mobile-submenu-items">
                            {categories.find(c => c.id === openCategory)?.items.map(item => (
                                <button
                                    key={item.id}
                                    className={`mobile-submenu-item ${activeView === item.id ? 'active' : ''}`}
                                    onClick={() => handleNavigate(item.id)}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Principal na Barra Inferior */}
            <div className="mobile-bottom-bar">
                {categories.map(cat => {
                    const isActive = activeView === cat.id || (cat.items && cat.items.some(sub => sub.id === activeView));
                    
                    return (
                        <button
                            key={cat.id}
                            className={`mobile-bottom-btn ${(openCategory === cat.id || isActive) ? 'active-cat' : ''}`}
                            onClick={() => toggleCategory(cat)}
                        >
                            <cat.icon size={22} className="mobile-btn-icon" />
                            <span className="mobile-btn-label">{cat.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default MobileBottomMenu;
