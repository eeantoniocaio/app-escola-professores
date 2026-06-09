import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Folder, FileText, FileSpreadsheet, Image, File, 
  ArrowLeft, ExternalLink, Search, X, ChevronRight, AlertTriangle,
  RefreshCw, LogOut, Library
} from 'lucide-react';
import { useGoogleAuth } from '../../app/providers/GoogleAuthProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import logger from '../../shared/utils/logger';

// Mapping extension -> Icons and Colors
const getFileIconDetails = (name, isFolder) => {
  if (isFolder) {
    return { icon: <Folder size={18} color="#4F46E5" />, color: "#4F46E5", bg: "#EEF2FF" };
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

export default function Acervo() {
  const navigate = useNavigate();
  const { accessToken, loginGoogle, logoutGoogle, googleAccount, isConfigured } = useGoogleAuth();
  const { userRole } = useAuth();
  
  const [rootFolder, setRootFolder] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [navStack, setNavStack] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-authentication Google upon entry
  useEffect(() => {
    if (isConfigured && !accessToken) {
      loginGoogle();
    }
  }, [isConfigured, accessToken, loginGoogle]);

  // 1. Define Root Folder for Acervo
  useEffect(() => {
    if (!accessToken) {
      setRootFolder(null);
      setActiveFolder(null);
      setFilesList([]);
      return;
    }

    const ACERVO_FOLDER_ID = '1UTzJZPvjGx9A2Y2w4ei8nE0X9L0gqpSk';
    const folder = { id: ACERVO_FOLDER_ID, name: 'Principal' };
    setRootFolder(folder);
    setActiveFolder(folder);
    setNavStack([]);
  }, [accessToken, refreshTrigger]);

  // 2. Fetch files/folders inside the active folder
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
          
          mapped.sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setFilesList(mapped);
        }
      } catch (err) {
        logger.error('Erro ao listar arquivos do acervo:', err);
        setError('Erro ao carregar conteúdo da pasta.');
      } finally {
        setLoading(false);
      }
    };

    fetchFolderContents();
  }, [accessToken, activeFolder, refreshTrigger]);

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
              <Library size={28} color="#4F46E5" /> Acervo
            </h2>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{
        background: '#4F46E5',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {!accessToken ? (
          /* State A: Not Authenticated */
          <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ height: '36px' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Drive</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Acesse o Acervo no Google Drive</h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', lineHeight: 1.4 }}>
                Conecte sua conta Google para visualizar e abrir as pastas e documentos compartilhados do Acervo diretamente.
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
          /* State B: Authenticated */
          <div>
            {/* Access control header */}
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

            {/* Folder Header */}
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
                    Visualizando os arquivos armazenados na pasta do Google Drive do Acervo.
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

            {/* Breadcrumbs */}
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
                  Acervo (Raiz)
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

            {/* Search Input */}
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

            {/* File/Folder Listing */}
            {loading ? (
              <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '4rem 1rem', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={28} className="spin-animation" color="#4F46E5" />
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

                      {/* Right side action */}
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
    </div>
  );
}
