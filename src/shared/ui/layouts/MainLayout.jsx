import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useGlobalData } from '../../../app/providers/GlobalDataProvider';
import { supabase } from '../../services/supabase';
import logoUrl from '../../../assets/logo.png';
import { Home as HomeIcon, Calendar, BookOpen, BarChart2, ShieldAlert, Users, PlusCircle, PenTool, Settings, LogOut, ChevronRight, Link as LinkIcon } from 'lucide-react';

export default function MainLayout() {
  const { session, userRole, userName, linkProfileName } = useAuth();
  const { professores, gestores, loadingData } = useGlobalData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedNameForLink, setSelectedNameForLink] = useState('');
  const [linking, setLinking] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleLinkProfile = async (e) => {
    e.preventDefault();
    if (!selectedNameForLink) return;
    setLinking(true);
    const success = await linkProfileName(selectedNameForLink);
    setLinking(false);
    if (!success) {
      alert('Erro ao vincular conta. Tente novamente.');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logoUrl} alt="Logo" style={{ height: '44px', objectFit: 'contain' }} />
          <div className="brand-title">
            <h1>Portal de Evidências</h1>
            <p>E.E. Antônio Caio</p>
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
              <Link to="/ocorrencias" className={`nav-link ${isActive('/ocorrencias')}`} onClick={() => setIsMobileMenuOpen(false)}>
                <ShieldAlert size={18} /> Histórico de Ocorrências
              </Link>
            </>
          )}
          
          <Link to="/turmas" className={`nav-link ${isActive('/turmas')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Users size={18} /> Mapa de Classe
          </Link>
          
          <Link to="/ocorrencias/nova" className={`nav-link ${isActive('/ocorrencias/nova')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <PlusCircle size={18} /> Ocorrências
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
        {!userName ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
              border: '1px solid #f1f5f9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>👋</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0' }}>Identifique-se</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
                {userRole === 'gestao' 
                  ? 'Para gerenciar o portal, selecione o seu nome de Gestor(a) para vincular à sua conta de e-mail.'
                  : 'Para ver e gerenciar suas ocorrências, boas práticas e reposições, selecione o seu nome de Professor(a) para vincular à sua conta de e-mail.'}
              </p>
              {loadingData ? (
                <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Carregando opções...</div>
              ) : (
                <form onSubmit={handleLinkProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                      {userRole === 'gestao' ? 'Seu nome de Gestor(a)' : 'Seu nome de Professor(a)'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={selectedNameForLink}
                      onChange={e => setSelectedNameForLink(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '0.95rem',
                        color: '#1e293b',
                        outline: 'none',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Selecione...</option>
                      {userRole === 'gestao' 
                        ? gestores.map(g => <option key={g} value={g}>{g}</option>)
                        : professores.map(p => <option key={p} value={p}>{p}</option>)
                      }
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedNameForLink || linking}
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.8rem 1.5rem',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: (!selectedNameForLink || linking) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedNameForLink || linking) ? 0.6 : 1,
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => { if (selectedNameForLink && !linking) e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {linking ? 'Vinculando...' : 'Confirmar e Continuar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio. Todos os direitos reservados.
      </footer>
    </div>
  );
}
