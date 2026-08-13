import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useGlobalData } from '../../../app/providers/GlobalDataProvider';
import { supabase } from '../../services/supabase';
import logoUrl from '../../../assets/logo.png';
import { Home as HomeIcon, BarChart2, Users, PlusCircle, PenTool, Settings, LogOut, ChevronRight, Link as LinkIcon, GraduationCap, Bell, AlertTriangle, X, FolderOpen, Wrench, User, Camera, UploadCloud, BookOpen } from 'lucide-react';
import { useToast } from '../../../app/providers/ToastProvider';
import ErrorBoundary from '../ErrorBoundary';

export default function MainLayout() {
  const { session, userRole, userName, avatarUrl, updateAvatarUrl, linkProfileName, isMaster } = useAuth();
  const { professores, gestores, secretarias, tecnicos, loadingData } = useGlobalData();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedNameForLink, setSelectedNameForLink] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'gestao':
        return 'Gestor(a)';
      case 'secretaria':
        return 'Secretaria';
      case 'tecnico':
        return 'Técnico';
      case 'professor':
        return 'Professor(a)';
      case 'agente':
        return 'Agente';
      case 'biblioteca':
        return 'Biblioteca';
      default:
        return role || 'Usuário';
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem válida.', 'warning');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session?.user?.id || 'anonymous'}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const success = await updateAvatarUrl(publicUrl);
      if (success) {
        showToast('Foto de perfil atualizada com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar foto de perfil no banco.', 'error');
      }
    } catch (err) {
      console.error('Erro no upload do avatar:', err);
      showToast('Erro ao carregar a foto.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };
  const [linking, setLinking] = useState(false);
  const [openOccurrencesCount, setOpenOccurrencesCount] = useState(0);
  const [openHelpRequestsCount, setOpenHelpRequestsCount] = useState(0);
  const [docNotifications, setDocNotifications] = useState([]);
  const [dismissedDocIds, setDismissedDocIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_doc_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activePopup, setActivePopup] = useState(null);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

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
      showToast('Erro ao vincular conta. Tente novamente.', 'error');
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
    if (userRole !== 'tecnico') return;

    const fetchHelpCount = async () => {
      try {
        const { data, error } = await supabase
          .from('solicitacoes_ajuda')
          .select('id')
          .eq('status', 'Pendente');
        if (data) {
          setOpenHelpRequestsCount(data.length);
        }
      } catch (err) {
        console.error('Erro ao buscar solicitações de ajuda pendentes:', err);
      }
    };

    fetchHelpCount();

    const channel = supabase.channel('realtime-solicitacoes-layout')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solicitacoes_ajuda' },
        (payload) => {
          setOpenHelpRequestsCount(prev => prev + 1);

          setActivePopup({
            id: payload.new.id,
            type: 'ajuda',
            title: 'Solicitação de Ajuda',
            body: `Professor(a) ${payload.new.professor} solicita ajuda na ${payload.new.sala}.`,
            descricao: payload.new.descricao
          });

          const audio = new Audio('/notification.ogg');
          audio.play().catch(err => console.log('Audio block by browser:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'solicitacoes_ajuda' },
        () => {
          fetchHelpCount();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'solicitacoes_ajuda' },
        () => {
          fetchHelpCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  useEffect(() => {
    if (userRole !== 'professor') return;

    const fetchDocNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notificacoes_documentos')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setDocNotifications(data);
        }
      } catch (err) {
        console.error('Erro ao buscar notificações de documentos:', err);
      }
    };

    fetchDocNotifications();

    const channel = supabase.channel('realtime-doc-notifications-layout')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes_documentos' },
        (payload) => {
          setDocNotifications(prev => [payload.new, ...prev]);

          setActivePopup({
            id: payload.new.id,
            type: 'documento',
            title: `Novo Aviso: ${payload.new.pasta}`,
            body: payload.new.titulo,
            descricao: payload.new.descricao
          });

          const audio = new Audio('/notification.ogg');
          audio.play().catch(err => console.log('Audio block by browser:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificacoes_documentos' },
        () => {
          fetchDocNotifications();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notificacoes_documentos' },
        () => {
          fetchDocNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const handleDismissDocNotif = (id) => {
    const updated = [...dismissedDocIds, id];
    setDismissedDocIds(updated);
    localStorage.setItem('dismissed_doc_notifications', JSON.stringify(updated));
  };

  const activeDocNotifications = docNotifications.filter(n => !dismissedDocIds.includes(n.id));

  useEffect(() => {
    if (activePopup) {
      const timer = setTimeout(() => {
        setActivePopup(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activePopup]);

  useEffect(() => {
    if (!isNotificationDropdownOpen) return;
    const handleClose = () => setIsNotificationDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isNotificationDropdownOpen]);

  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleClose = (e) => {
      if (e.target.closest('.profile-dropdown-container')) return;
      setIsProfileDropdownOpen(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isProfileDropdownOpen]);

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
          

          {userRole !== 'agente' && (
            <Link to="/turmas" className={`nav-link ${isActive('/turmas')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <GraduationCap size={18} /> Turmas
            </Link>
          )}

          <Link to="/mapa-classe" className={`nav-link ${isActive('/mapa-classe')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Users size={18} /> Mapa de Classe
          </Link>

          <Link to="/documentos" className={`nav-link ${isActive('/documentos')}`} onClick={() => setIsMobileMenuOpen(false)}>
            <FolderOpen size={18} /> Documentos
          </Link>

          {(userRole === 'gestao' || userRole === 'biblioteca' || userRole === 'secretaria') && (
            <Link to="/biblioteca" className={`nav-link ${isActive('/biblioteca')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <BookOpen size={18} /> Biblioteca
            </Link>
          )}

          {(userRole === 'gestao' || userRole === 'tecnico' || userRole === 'secretaria' || userRole === 'professor') && (
            <Link to="/equipamentos" className={`nav-link ${isActive('/equipamentos')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <Wrench size={18} /> Equipamentos
            </Link>
          )}
          
          {userRole !== 'secretaria' && userRole !== 'tecnico' && (
            <Link to="/ocorrencias" className={`nav-link ${isActive('/ocorrencias')}`} onClick={() => setIsMobileMenuOpen(false)}>
              <PlusCircle size={18} /> Ocorrências
            </Link>
          )}
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className="nav-link" 
              onClick={(e) => {
                if (userRole === 'gestao') {
                  setIsMobileMenuOpen(false);
                  navigate('/ocorrencias');
                } else if (userRole === 'tecnico') {
                  setIsMobileMenuOpen(false);
                  navigate('/equipamentos?tab=solicitacoes');
                } else {
                  e.stopPropagation();
                  setIsNotificationDropdownOpen(prev => !prev);
                }
              }}
              title="Notificações" 
              style={{ padding: '0.4rem', position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <Bell size={20} />
              {userRole === 'gestao' && openOccurrencesCount > 0 && (
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
              {userRole === 'tecnico' && openHelpRequestsCount > 0 && (
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
                  {openHelpRequestsCount}
                </span>
              )}
              {userRole === 'professor' && activeDocNotifications.length > 0 && (
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
                  {activeDocNotifications.length}
                </span>
              )}
            </button>
            {isNotificationDropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '280px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.85rem',
                  zIndex: 1000,
                  textAlign: 'left',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                {userRole === 'professor' ? (
                  activeDocNotifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>
                      Nenhuma notificação no momento.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Notificações</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => { setIsNotificationDropdownOpen(false); navigate('/documentos'); }}>Ver todas</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {activeDocNotifications.map(notif => (
                          <div key={notif.id} style={{ display: 'flex', gap: '0.35rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#FFC800', color: 'white', padding: '1px 4px', borderRadius: '3px' }}>
                                  {notif.pasta}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={notif.titulo}>
                                  {notif.titulo}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.2 }}>
                                {notif.descricao}
                              </p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDismissDocNotif(notif.id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '0 0.15rem', alignSelf: 'flex-start' }}
                              title="Descartar"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>
                    Nenhuma notificação no momento.
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="nav-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          
          {/* Menu de Perfil / Dropdown */}
          {userName && (
            <div className="profile-dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileDropdownOpen(prev => !prev);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '30px',
                  transition: 'var(--transition-smooth)',
                  outline: 'none'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} color="var(--text-light)" />
                  )}
                </div>
                <span className="profile-header-name" style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {userName}
                </span>
              </button>

              {isProfileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '260px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '1.25rem',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  animation: 'fadeIn 0.2s ease-out',
                  textAlign: 'center'
                }}>
                  {/* Foto de Perfil Grande */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={36} color="var(--text-light)" />
                        )}
                      </div>
                      
                      {/* Botão de Upload da Câmera */}
                      <label 
                        htmlFor="avatar-upload" 
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: 'var(--color-primary)',
                          color: '#ffffff',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.9)'}
                        onMouseOut={e => e.currentTarget.style.filter = 'none'}
                        title="Alterar foto de perfil"
                      >
                        <Camera size={14} />
                      </label>
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {userName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--bg-secondary)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', width: 'fit-content', margin: '0 auto' }}>
                        {getRoleDisplayName(userRole)}
                      </span>
                    </div>
                  </div>

                  <div className="nav-divider" style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '0 -1.25rem' }}></div>

                  {/* Links de Ação */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
                    {(isMaster || userRole === 'gestao' || userRole === 'secretaria') && (
                      <Link 
                        to="/configuracoes" 
                        onClick={() => setIsProfileDropdownOpen(false)} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.88rem',
                          color: 'var(--text-main)',
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                      >
                        <Settings size={16} /> Configurações
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.88rem',
                        color: 'var(--color-danger)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogOut size={16} /> Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
          borderLeft: `6px solid ${activePopup.type === 'documento' ? '#FFC800' : 'var(--color-danger)'}`,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: activePopup.type === 'documento' ? '#FFC800' : 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem' }}>
              {activePopup.type === 'documento' ? <Bell size={16} /> : <AlertTriangle size={16} />}
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
                if (activePopup.type === 'ajuda') {
                  navigate('/equipamentos?tab=solicitacoes');
                } else if (activePopup.type === 'documento') {
                  navigate('/documentos');
                } else {
                  navigate('/ocorrencias');
                }
              }}
              style={{
                background: activePopup.type === 'documento' ? '#FFC800' : 'var(--color-danger)',
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
                {userRole === 'gestao' && 'Para gerenciar o portal, selecione o seu nome de Gestor(a) para vincular à sua conta de e-mail.'}
                {userRole === 'professor' && 'Para ver e gerenciar suas ocorrências, boas práticas e reposições, selecione o seu nome de Professor(a) para vincular à sua conta de e-mail.'}
                {userRole === 'secretaria' && 'Para gerenciar o portal e emitir avisos, selecione o seu nome de profissional da Secretaria para vincular à sua conta de e-mail.'}
                {userRole === 'tecnico' && 'Para receber e gerenciar chamados de suporte, selecione o seu nome de Técnico para vincular à sua conta de e-mail.'}
                {userRole !== 'gestao' && userRole !== 'professor' && userRole !== 'secretaria' && userRole !== 'tecnico' && 'Para acessar o portal, selecione o seu nome para vincular à sua conta de e-mail.'}
              </p>
              {loadingData ? (
                <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Carregando opções...</div>
              ) : (
                <form onSubmit={handleLinkProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                      {userRole === 'gestao' && 'Seu nome de Gestor(a)'}
                      {userRole === 'professor' && 'Seu nome de Professor(a)'}
                      {userRole === 'secretaria' && 'Seu nome (Secretaria)'}
                      {userRole === 'tecnico' && 'Seu nome (Técnico)'}
                      {userRole !== 'gestao' && userRole !== 'professor' && userRole !== 'secretaria' && userRole !== 'tecnico' && 'Seu nome'} <span style={{ color: '#ef4444' }}>*</span>
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
                      {userRole === 'gestao' && gestores.map(g => <option key={g} value={g}>{g}</option>)}
                      {userRole === 'professor' && professores.map(p => <option key={p} value={p}>{p}</option>)}
                      {userRole === 'secretaria' && secretarias && secretarias.map(s => <option key={s} value={s}>{s}</option>)}
                      {userRole === 'tecnico' && tecnicos && tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
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
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        )}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio. Todos os direitos reservados.
      </footer>
    </div>
  );
}
