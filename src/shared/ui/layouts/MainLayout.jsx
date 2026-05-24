import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { supabase } from '../../services/supabase';
import logoUrl from '../../../assets/logo.png';
import { Home as HomeIcon, Calendar, BookOpen, BarChart2, ShieldAlert, Users, PlusCircle, PenTool, Settings, LogOut, ChevronRight, Link as LinkIcon } from 'lucide-react';

export default function MainLayout() {
  const { session, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logoUrl} alt="Logo" style={{ height: '44px', objectFit: 'contain' }} />
          <div className="brand-title">
            <h1>Portal de Evidências</h1>
            <p>E.E. Antônio Caio — Coordenação Pedagógica</p>
          </div>
        </div>
        
        <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Alternar menu">
          <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{ gap: '0.25rem' }}>
          <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <HomeIcon size={18} /> Início
          </Link>
          
          {userRole === 'gestao' && (
            <>
              <Link to="/eventos" className={`nav-link ${isActive('/eventos')}`} onClick={() => setIsMobileMenuOpen(false)}>
                <Calendar size={18} /> Eventos
              </Link>
              <Link to="/registros" className={`nav-link ${isActive('/registros')}`} onClick={() => setIsMobileMenuOpen(false)}>
                <BookOpen size={18} /> Registros
              </Link>
              <Link to="/relatorios" className={`nav-link ${isActive('/relatorios')}`} onClick={() => setIsMobileMenuOpen(false)}>
                <BarChart2 size={18} /> Relatórios
              </Link>
              <Link to="/ocorrencias" className={`nav-link ${isActive('/ocorrencias')}`} onClick={() => setIsMobileMenuOpen(false)}>
                <ShieldAlert size={18} /> Ocorrências (Histórico)
              </Link>
            </>
          )}
          
          <Link to="/turmas" className={`nav-link ${isActive('/turmas')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Users size={18} /> Mapa de Classe
          </Link>
          
          {/* We'll use a local state or dedicated route for New Ocorrencia */}
          <Link to="/ocorrencias/nova" className={`nav-link ${isActive('/ocorrencias/nova')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <PlusCircle size={18} /> Ocorrências
          </Link>
          
          <Link to="/reposicoes" className={`nav-link ${isActive('/reposicoes')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <PenTool size={18} /> Reposições
          </Link>
          
          <div className="nav-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          
          {userRole === 'gestao' && (
            <Link to="/configuracoes" className={`nav-link ${isActive('/configuracoes')}`} onClick={() => setIsMobileMenuOpen(false)} title="Configurações" style={{ padding: '0.4rem' }}>
              <Settings size={20} />
            </Link>
          )}
          
          <button className="nav-link" onClick={handleLogout} title="Sair" style={{ padding: '0.4rem' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio - Sistema de Avaliação Docente. Todos os direitos reservados.
      </footer>
    </div>
  );
}
