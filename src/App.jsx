import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import MobileBottomMenu from './components/MobileBottomMenu'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './views/Dashboard'
import DividasFixas from './views/DividasFixas'
import PedidosAPagarPET from './views/PedidosAPagarPET'
import Login from './views/Login'
import Categorias from './views/Categorias'
import PedidosView from './views/PedidosView'
import ClientesView from './views/ClientesView'
import DespesasView from './views/DespesasView'
import NovoPedidoView from './views/NovoPedidoView'
import EstoqueView from './views/EstoqueView'
import CalendarioPagamentos from './views/CalendarioPagamentos'
import ProducaoView from './views/ProducaoView'
import { User, AlertCircle, FileCheck2, Clock, LogOut, ChevronDown } from 'lucide-react'
import { supabase } from './lib/supabase'

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wsa_user');
      console.log('App initialized. Saved user exists:', !!savedUser);
      if (!savedUser || savedUser === 'undefined' || savedUser === 'null') return null;
      return JSON.parse(savedUser);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('wsa_user');
      return null;
    }
  });

  const now = new Date();
  const [globalMonth, setGlobalMonth] = useState(now.getMonth());
  const [globalYear, setGlobalYear] = useState(now.getFullYear());
  const [businessUnit, setBusinessUnit] = useState('PEAD');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUnitDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    console.log('App State - ActiveView:', activeView, 'User:', user?.email || 'None');
  }, [activeView, user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('wsa_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('wsa_user');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderView = () => {
    const commonProps = {
      selectedMonth: globalMonth,
      setSelectedMonth: setGlobalMonth,
      selectedYear: globalYear,
      setSelectedYear: setGlobalYear,
      businessUnit
    };

    try {
      switch (activeView) {
        case 'dashboard':
          return <Dashboard onNavigate={setActiveView} {...commonProps} />;
        case 'novo-pedido':
          return <NovoPedidoView businessUnit={businessUnit} />;
        case 'dividas':
          return businessUnit === 'PET' 
            ? <PedidosAPagarPET {...commonProps} />
            : <DividasFixas {...commonProps} />;
        case 'categorias':
          return <Categorias businessUnit={businessUnit} /> ;
        case 'clientes':
          return <ClientesView user={user} businessUnit={businessUnit} />;
        case 'despesas':
          return <DespesasView {...commonProps} />;
        case 'pendentes':
          return <PedidosView status="pendente" title="Pedidos Pendentes" icon={AlertCircle} {...commonProps} />;
        case 'pagos':
          return <PedidosView status="pago" title="Pedidos Pagos" icon={FileCheck2} {...commonProps} />;
        case 'a-receber':
          return <PedidosView status="a_receber" title="Pedidos a Receber" icon={Clock} {...commonProps} />;
        case 'estoque':
          return <EstoqueView businessUnit={businessUnit} />;
        case 'calendario':
          return <CalendarioPagamentos {...commonProps} />;
        case 'lucro':
          return <ProducaoView {...commonProps} />;
        default:
          return (
            <div style={{ padding: '2.5rem' }}>
              <h1>Em breve</h1>
              <p>Esta tela está em desenvolvimento.</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Render error:', error);
      return (
        <div style={{ padding: '2.5rem', background: '#fff', color: '#000', minHeight: '100vh', zIndex: 9999 }}>
          <h1 style={{ color: 'red', marginBottom: '1rem' }}>Erro ao renderizar view</h1>
          <p><strong>Configuração:</strong> View: {activeView}</p>
          <p><strong>Mensagem:</strong> {error.message}</p>
          <pre style={{ background: '#eee', padding: '1rem', marginTop: '1rem', overflow: 'auto' }}>
            {error.stack}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} businessUnit={businessUnit} />
      <MobileBottomMenu activeView={activeView} setActiveView={setActiveView} businessUnit={businessUnit} />
      <main className="main-content">
        <div className="top-bar">
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowUnitDropdown(!showUnitDropdown)}
              style={{ 
                background: 'transparent', border: 'none', color: '#fff', 
                fontWeight: '800', fontSize: '1.2rem', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0
              }}
            >
              {businessUnit === 'PEAD' ? 'WSA GARRAFA PEAD' : 'WSA GARRAFAS PET'}
              <ChevronDown size={18} style={{ transform: showUnitDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {showUnitDropdown && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, 
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px', padding: '0.5rem', marginTop: '0.8rem', zIndex: 100,
                minWidth: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                <div 
                  onClick={() => { setBusinessUnit('PEAD'); setShowUnitDropdown(false); }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  style={{ 
                    padding: '0.8rem 1rem', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold',
                    color: businessUnit === 'PEAD' ? '#f59e0b' : '#e2e8f0', transition: '0.2s'
                  }}
                >
                  WSA GARRAFA PEAD
                </div>
                <div 
                  onClick={() => { setBusinessUnit('PET'); setShowUnitDropdown(false); }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  style={{ 
                    padding: '0.8rem 1rem', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold',
                    color: businessUnit === 'PET' ? '#f59e0b' : '#e2e8f0', transition: '0.2s'
                  }}
                >
                  WSA GARRAFAS PET
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="icon-btn" title="Perfil"><User size={20} /></button>
            <button className="icon-btn logout-btn" title="Sair" onClick={handleLogout}>
              <LogOut size={20} color="#ef4444" />
            </button>
          </div>
        </div>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
