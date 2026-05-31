import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useGlobalData } from '../../../app/providers/GlobalDataProvider';
import { supabase } from '../../services/supabase';
import logoUrl from '../../../assets/logo.png';
import { Home as HomeIcon, BarChart2, Users, PlusCircle, PenTool, Settings, LogOut, ChevronRight, Link as LinkIcon, GraduationCap, Bell, AlertTriangle, X, FolderOpen, Wrench } from 'lucide-react';

export default function MainLayout() {
  const { session, userRole, userName, linkProfileName, isMaster } = useAuth();
  const { professores, gestores, loadingData } = useGlobalData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedNameForLink, setSelectedNameForLink] = useState('');
  const [linking, setLinking] = useState(false);
  const [openOccurrencesCount, setOpenOccurrencesCount] = useState(0);
  const [activePopup, setActivePopup] = useState(null);

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

  useEffect(() => {
    if (userRole !== 'gestao') return;

    const fetchOpenCount = async () => {
      try {
        const { data, error } = await supabase
          .from('ocorrencias')
          .select('id')
          .or('status.eq.Em aberto,status.is.null');
        if (data) {
          setOpenOccurrencesCount(data.length);
        }
      } catch (err) {
        console.error('Erro ao buscar ocorrências em aberto:', err);
      }
    };

    fetchOpenCount();

    const channel = supabase.channel('realtime-ocorrencias-layout')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ocorrencias' },
        (payload) => {
          setOpenOccurrencesCount(prev => prev + 1);

          const studentNames = payload.new.alunos && payload.new.alunos.length > 0 
            ? payload.new.alunos.join(', ') 
            : 'aluno(a)';

          setActivePopup({
            id: payload.new.id,
            title: 'Nova Ocorrência Registrada',
            body: `Professor(a) ${payload.new.professor} registrou uma ocorrência para ${studentNames}.`,
            turma: payload.new.turma || ''
          });

          const audio = new Audio('/notification.ogg');
          audio.play().catch(err => console.log('Audio block by browser:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ocorrencias' },
        () => {
          fetchOpenCount();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'ocorrencias' },
        () => {
          fetchOpenCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  useEffect(() => {
    if (activePopup) {
      const timer = setTimeout(() => {
        setActivePopup(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activePopup]);

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
          

          <Link to="/turmas" className={`nav-link ${isActive('/turmas')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <GraduationCap size={18} /> Turmas
          </Link>

          <Link to="/mapa-classe" className={`nav-link ${isActive('/mapa-classe')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Users size={18} /> Mapa de Classe
          </Link>

          <Link to="/documentos" className={`nav-link ${isActive('/documentos')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <FolderOpen size={18} /> Documentos
          </Link>

          {(userRole === 'gestao' || userRole === 'tecnico' || userRole === 'secretaria' || userRole === 'professor') && (
            <Link to="/equipamentos" className={`nav-link ${isActive('/equipamentos')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <Wrench size={18} /> Equipamentos
            </Link>
          )}
          
          {userRole !== 'secretaria' && userRole !== 'tecnico' && (
            <Link to="/ocorrencias/nova" className={`nav-link ${isActive('/ocorrencias/nova')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <PlusCircle size={18} /> Ocorrências
            </Link>
          )}
          
          {userRole === 'gestao' && (
            <button 
              className="nav-link" 
              onClick={() => { setIsMobileMenuOpen(false); navigate('/ocorrencias'); }}
              title="Notificações de Ocorrências" 
              style={{ padding: '0.4rem', position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <Bell size={20} />
              {openOccurrencesCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--color-danger)',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 5px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  minWidth: '15px',
                  textAlign: 'center',
                  boxShadow: '0 0 0 2px var(--bg-card)'
                }}>
                  {openOccurrencesCount}
                </span>
              )}
            </button>
          )}
          
          <div className="nav-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          
          {isMaster && (
            <Link to="/configuracoes" className={`nav-link ${isActive('/configuracoes')}`} onClick={() => setIsMobileMenuOpen(false)} title="Configurações" style={{ padding: '0.4rem' }}>
              <Settings size={20} />
            </Link>
          )}
          
          <button className="nav-link" onClick={handleLogout} title="Sair" style={{ padding: '0.4rem' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Pop-up de Ocorrência em Tempo Real */}
      {activePopup && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          borderLeft: '6px solid var(--color-danger)',
          boxShadow: 'var(--shadow-lg)',
          width: '320px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          borderTop: '1px solid var(--border-light)',
          borderRight: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              <span>{activePopup.title}</span>
            </div>
            <button 
              onClick={() => setActivePopup(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
            {activePopup.body}
            {activePopup.turma && <strong style={{ display: 'block', marginTop: '0.25rem' }}>Turma: {activePopup.turma}</strong>}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button 
              onClick={() => {
                setActivePopup(null);
                navigate('/ocorrencias');
              }}
              style={{
                background: 'var(--color-danger)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={e => e.currentTarget.style.filter = 'none'}
            >
              Visualizar
            </button>
          </div>
        </div>
      )}

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
