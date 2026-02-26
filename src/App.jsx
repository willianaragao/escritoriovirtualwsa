import React, { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './views/Dashboard'
import DividasFixas from './views/DividasFixas'
import Login from './views/Login'
import Categorias from './views/Categorias'
import PedidosView from './views/PedidosView'
import ClientesView from './views/ClientesView'
import DespesasView from './views/DespesasView'
import NovoPedidoView from './views/NovoPedidoView'
import EstoqueView from './views/EstoqueView'
import CalendarioPagamentos from './views/CalendarioPagamentos'
import { Menu, User, AlertCircle, FileCheck2, Clock, LogOut } from 'lucide-react'
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
    try {
      switch (activeView) {
        case 'dashboard':
          return <Dashboard onNavigate={setActiveView} />;
        case 'novo-pedido':
          return <NovoPedidoView />;
        case 'dividas':
          return <DividasFixas />;
        case 'categorias':
          return <Categorias />;
        case 'clientes':
          return <ClientesView />;
        case 'despesas':
          return <DespesasView />;
        case 'pendentes':
          return <PedidosView status="pendente" title="Pedidos Pendentes" icon={AlertCircle} />;
        case 'pagos':
          return <PedidosView status="pago" title="Pedidos Pagos" icon={FileCheck2} />;
        case 'a-receber':
          return <PedidosView status="a_receber" title="Pedidos a Receber" icon={Clock} />;
        case 'estoque':
          return <EstoqueView />;
        case 'calendario':
          return <CalendarioPagamentos />;
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
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="main-content">
        <div className="top-bar">
          <button className="icon-btn"><Menu size={20} /></button>
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
