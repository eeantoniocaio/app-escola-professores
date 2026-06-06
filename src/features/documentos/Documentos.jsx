import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Folder, FileText, FileSpreadsheet, Image, File, 
  ArrowLeft, ExternalLink, Search, X, ChevronRight, AlertTriangle,
  RefreshCw, LogOut, Bell
} from 'lucide-react';
import { useGoogleAuth } from '../../app/providers/GoogleAuthProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { supabase } from '../../shared/services/supabase';
import { useToast } from '../../app/providers/ToastProvider';
import logger from '../../shared/utils/logger';

// Mapeamento de Extensão -> Ícones e Cores (Tema Premium semelhante ao de Turmas)
const getFileIconDetails = (name, isFolder) => {
  if (isFolder) {
    return { icon: <Folder size={18} color="#FFC800" />, color: "#FFC800", bg: "#FFF9E6" };
  }
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: <FileText size={18} color="#ef4444" />, color: "#ef4444", bg: "#fee2e2" };
    case 'xlsx':
    case 'xls':
    case 'csv':
    case 'gsheet':
      return { icon: <FileSpreadsheet size={18} color="#10b981" />, color: "#10b981", bg: "#ecfdf5" };
    case 'docx':
    case 'doc':
    case 'gdoc':
    case 'odt':
      return { icon: <FileText size={18} color="#3b82f6" />, color: "#3b82f6", bg: "#eff6ff" };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return { icon: <Image size={18} color="#8b5cf6" />, color: "#8b5cf6", bg: "#f5f3ff" };
    default:
      return { icon: <File size={18} color="#64748b" />, color: "#64748b", bg: "#f8fafc" };
  }
};

export default function Documentos() {
  const navigate = useNavigate();
  const { accessToken, loginGoogle, logoutGoogle, googleAccount, isConfigured } = useGoogleAuth();
  const { userRole, userName } = useAuth();
  const { showToast } = useToast();
  
  const [rootFolder, setRootFolder] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [navStack, setNavStack] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados do Modal de Notificação
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyFolder, setNotifyFolder] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyDescription, setNotifyDescription] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Notificações recebidas (para Professores)
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_doc_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (userRole === 'professor') {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const { data, error } = await supabase
            .from('notificacoes_documentos')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setNotifications(data || []);
        } catch (err) {
          logger.error('Erro ao buscar notificações de documentos:', err);
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
    }
  }, [userRole]);

  const handleDismissNotification = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_doc_notifications', JSON.stringify(updated));
  };

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  // Auto-autenticação Google ao entrar na página de Documentos
  useEffect(() => {
    if (isConfigured && !accessToken) {
      loginGoogle();
    }
  }, [isConfigured, accessToken, loginGoogle]);

  // 1. Definir a pasta raiz com o ID fornecido pelo usuário
  useEffect(() => {
    if (!accessToken) {
      setRootFolder(null);
      setActiveFolder(null);
      setFilesList([]);
      return;
    }

    const MASTER_FOLDER_ID = '12Yhu49ccFTIHhTylOREMJQ8CZX6vJDlA';
    const folder = { id: MASTER_FOLDER_ID, name: 'Principal' };
    setRootFolder(folder);
    setActiveFolder(folder);
    setNavStack([]); // Reseta a pilha de navegação ao atualizar/reconectar
  }, [accessToken, refreshTrigger]);

  // 2. Buscar arquivos e subpastas dentro da pasta ativa
  useEffect(() => {
    if (!accessToken || !activeFolder?.id) return;

    const fetchFolderContents = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = encodeURIComponent(`'${activeFolder.id}' in parents and trashed = false`);
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink)&pageSize=100`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        if (!response.ok) throw new Error('Falha ao listar arquivos da pasta.');
        const data = await response.json();
        
        if (data.files) {
          const mapped = data.files.map(file => ({
            id: file.id,
            name: file.name,
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
            url: file.webViewLink
          }));
          
          // Ordenar: pastas primeiro, depois por nome
          mapped.sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setFilesList(mapped);
        }
      } catch (err) {
        logger.error('Erro ao listar arquivos:', err);
        setError('Erro ao carregar conteúdo da pasta.');
      } finally {
        setLoading(false);
      }
    };

    fetchFolderContents();
  }, [accessToken, activeFolder, refreshTrigger]);

  // Filtrar arquivos com base no termo de busca
  const filteredFiles = filesList.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item) => {
    if (item.isFolder) {
      setNavStack(prev => [...prev, { id: item.id, name: item.name }]);
      setActiveFolder({ id: item.id, name: item.name });
      setSearchTerm('');
    } else {
      window.open(item.url, '_blank', 'noopener');
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyFolder || !notifyTitle.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    setIsSendingNotification(true);
    try {
      const { error } = await supabase.from('notificacoes_documentos').insert([{
        titulo: notifyTitle.trim(),
        descricao: notifyDescription.trim(),
        pasta: notifyFolder,
        remetente: userName || 'Gestor'
      }]);
      if (error) throw error;
      
      showToast('Notificação enviada aos professores com sucesso!', 'success');
      setIsNotifyModalOpen(false);
      setNotifyFolder('');
      setNotifyTitle('');
      setNotifyDescription('');
    } catch (err) {
      logger.error('Erro ao enviar notificação:', err);
      showToast('Erro ao enviar a notificação. Tente novamente.', 'error');
    } finally {
      setIsSendingNotification(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn-back-home"
            onClick={() => navigate('/')}
            title="Voltar ao início"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FolderOpen size={28} color="#FFC800" /> Compartilhamento de Documentos
            </h2>
          </div>
        </div>

        {/* Botão de Enviar Notificação (Apenas Gestão e Secretaria) */}
        {(userRole === 'gestao' || userRole === 'secretaria') && (
          <button 
            onClick={() => setIsNotifyModalOpen(true)}
            className="transition-all duration-200 md:hover:translate-y-[-1.5px] md:hover:shadow-md"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: '#FF4B4B',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Bell size={16} /> Enviar notificação
          </button>
        )}
      </div>

      {/* Painel Principal */}
      <div style={{
        background: '#FFC800',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {!accessToken ? (
          /* Estado A: Não Autenticado */
          <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ height: '36px' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Drive</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Acesse seus Documentos no Google Drive</h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', lineHeight: 1.4 }}>
                Conecte sua conta Google para visualizar e abrir as pastas e documentos compartilhados diretamente do seu Google Drive.
              </p>
            </div>
            <button 
              className="btn transition-all duration-200 md:hover:bg-[#f8f9fa] md:hover:translate-y-[-1px]" 
              onClick={loginGoogle} 
              style={{ 
                padding: '0.75rem 1.5rem', 
                fontWeight: 700,
                backgroundColor: '#ffffff',
                border: '1px solid #dadce0',
                color: '#3c4043',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
                cursor: 'pointer',
                borderRadius: '24px',
                fontSize: '0.9rem'
              }}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" style={{ height: '18px' }} />
              Conectar Conta Google
            </button>
          </div>
        ) : (
          /* Estado B: Autenticado */
          <div>
            {/* Cabeçalho de Controle de Acesso */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {googleAccount?.picture && (
                  <img 
                    src={googleAccount.picture} 
                    alt="" 
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                )}
                Conectado como: <strong>{googleAccount?.name || googleAccount?.email}</strong>
              </span>
              <button onClick={logoutGoogle} style={{ background: 'none', border: 'none', color: '#ff8a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <LogOut size={14} /> Desconectar
              </button>
            </div>

            {/* Cabeçalho da Pasta e Ações */}
            {activeFolder && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1.5rem', 
                paddingBottom: '1rem', 
                flexWrap: 'wrap', 
                gap: '1rem' 
              }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                    <FolderOpen size={20} color="#ffffff" /> Pasta: {activeFolder.name}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: 0, marginTop: '0.15rem' }}>
                    Visualizando os arquivos armazenados na pasta do Google Drive.
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={handleRefresh}
                    disabled={loading}
                    className="btn transition-all duration-200 md:hover:bg-white/30"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      margin: 0,
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      boxShadow: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={loading ? 'spin-animation' : ''} /> Recarregar
                  </button>
                  <button 
                    onClick={() => window.open(activeFolder.url || `https://drive.google.com/drive/folders/${activeFolder.id}?usp=sharing`, '_blank', 'noopener')}
                    className="btn transition-all duration-200 md:hover:bg-white/30"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      margin: 0,
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#ffffff',
                      boxShadow: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={16} /> Abrir no Drive
                  </button>
                </div>
              </div>
            )}

            {/* Caminho de Navegação (Breadcrumbs) */}
            {rootFolder && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: '#ffffff', 
                fontSize: '0.9rem', 
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                background: 'rgba(0, 0, 0, 0.15)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span 
                  onClick={() => {
                    setNavStack([]);
                    setActiveFolder(rootFolder);
                    setSearchTerm('');
                  }}
                  className="cursor-pointer hover:underline"
                  style={{ fontWeight: navStack.length === 0 ? 700 : 500 }}
                >
                  Documentos (Raiz)
                </span>
                {navStack.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight size={14} style={{ opacity: 0.7 }} />
                    <span 
                      onClick={() => {
                        setNavStack(prev => prev.slice(0, index + 1));
                        setActiveFolder({ id: folder.id, name: folder.name });
                        setSearchTerm('');
                      }}
                      className="cursor-pointer hover:underline"
                      style={{ 
                        fontWeight: index === navStack.length - 1 ? 700 : 500 
                      }}
                    >
                      {folder.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Painel de Notificações para Professores */}
            {userRole === 'professor' && activeNotifications.length > 0 && (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC800', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <Bell size={18} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Avisos da Coordenação / Direção / Secretaria</span>
                  <span style={{ fontSize: '0.75rem', background: '#FFC800', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 700, marginLeft: 'auto' }}>
                    {activeNotifications.length} novo(s)
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {activeNotifications.map(notif => (
                    <div key={notif.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#FFC800', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                            {notif.pasta}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {notif.titulo}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginLeft: 'auto' }}>
                            {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
                          {notif.descricao}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDismissNotification(notif.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-light)',
                          padding: '0 0.25rem',
                          alignSelf: 'flex-start'
                        }}
                        title="Descartar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de Pesquisa */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome do documento ou pasta..."
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                  boxSizing: 'border-box'
                }}
              />
              <Search style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', width: '18px', height: '18px' }} />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Listagem de Arquivos/Pastas */}
            {loading ? (
              <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '4rem 1rem', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={28} className="spin-animation" color="#FFC800" />
                <span>Carregando arquivos do Google Drive...</span>
              </div>
            ) : error ? (
              <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '3rem 1.5rem', textAlign: 'center', color: '#b91c1c', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={36} color="#ef4444" />
                <span>{error}</span>
                <button onClick={handleRefresh} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RefreshCw size={12} /> Tentar Novamente
                </button>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
                Nenhum arquivo ou pasta encontrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredFiles.map((item) => {
                  const details = getFileIconDetails(item.name, item.isFolder);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center justify-between p-[0.85rem_1.25rem] bg-white rounded-[10px] border border-white/10 shadow-sm md:hover:translate-y-[-1.5px] md:hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: details.bg,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {details.icon}
                        </div>

                        <span style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: 600, 
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name}
                        </span>
                      </div>

                      {/* Ação à direita */}
                      <div style={{ marginLeft: '1rem', flexShrink: 0 }}>
                        {item.isFolder ? (
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: '#f1f5f9', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'var(--text-light)' 
                          }}>
                            <ChevronRight size={16} />
                          </div>
                        ) : (
                          <button 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${details.color}`,
                              background: details.bg,
                              color: details.color,
                              cursor: 'pointer'
                            }}
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: ENVIAR NOTIFICAÇÃO ── */}
      {isNotifyModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setIsNotifyModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Bell size={20} color="#FFC800" /> Enviar Notificação aos Professores
              </h3>
              <button className="btn-icon" onClick={() => setIsNotifyModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendNotification} style={{ margin: 0 }}>
              <div className="modal-body" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Seleção da pasta <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <select
                    value={notifyFolder}
                    onChange={(e) => setNotifyFolder(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit'
                    }}
                    required
                  >
                    <option value="">Selecione a pasta...</option>
                    <option value="Coordenação">Coordenação</option>
                    <option value="Direção">Direção</option>
                    <option value="Secretaria">Secretaria</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Título da notificação <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    placeholder="Digite o título da notificação"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Descrição
                  </label>
                  <textarea 
                    value={notifyDescription}
                    onChange={(e) => setNotifyDescription(e.target.value)}
                    placeholder="Descreva a mensagem para os professores..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontFamily: 'inherit',
                      minHeight: '120px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{
                padding: '1.25rem 2rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg-secondary)',
                borderBottomLeftRadius: 'var(--radius-md)',
                borderBottomRightRadius: 'var(--radius-md)'
              }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNotifyModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.65rem 1.25rem' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSendingNotification} style={{
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  background: '#FF4B4B',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  opacity: isSendingNotification ? 0.7 : 1
                }}>
                  {isSendingNotification ? 'Enviando...' : 'Salvar e Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
