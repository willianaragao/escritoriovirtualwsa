import React from 'react';
import {
    LayoutDashboard,
    FilePlus2,
    AlertCircle,
    FileCheck2,
    Clock,
    Users,
    Tag,
    Banknote,
    TrendingDown,
    Calendar,
    Package,
    LineChart,
    Database
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        {
            group: "Menu Principal", items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
            ]
        },
        {
            group: "Pedidos", items: [
                { id: 'novo-pedido', label: 'Novo Pedido', icon: FilePlus2 },
                { id: 'pendentes', label: 'Pendentes', icon: AlertCircle },
                { id: 'pagos', label: 'Pagos', icon: FileCheck2 },
                { id: 'a-receber', label: 'A receber', icon: Clock }
            ]
        },
        {
            group: "Cadastros", items: [
                { id: 'clientes', label: 'Clientes', icon: Users },
                { id: 'categorias', label: 'Categorias', icon: Tag }
            ]
        },
        {
            group: "Financeiro", items: [
                { id: 'despesas', label: 'Despesas', icon: Banknote },
                { id: 'dividas', label: 'Dívidas fixas', icon: TrendingDown },
                { id: 'calendario', label: 'Calendário de Pagamentos', icon: Calendar }
            ]
        },
        {
            group: "Estoque", items: [
                { id: 'estoque', label: 'Controle de estoque', icon: Package },
                { id: 'lucro', label: 'Controle de Lucro', icon: LineChart }
            ]
        },
        {
            group: "Configurações", items: [
                { id: 'config', label: 'Migrar Dados', icon: Database }
            ]
        }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">W</div>
                <div className="brand-name">
                    <h2>WSA Dashboard</h2>
                    <span>Fábrica de Garrafas</span>
                </div>
            </div>

            <nav>
                {navItems.map((group, idx) => (
                    <div key={idx} className="nav-group">
                        <span className="nav-label">{group.group}</span>
                        {group.items.map(item => (
                            <a
                                key={item.id}
                                href="#"
                                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveView(item.id);
                                }}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </a>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
