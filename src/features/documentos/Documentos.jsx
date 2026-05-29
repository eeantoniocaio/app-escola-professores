import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, Folder, FileText, FileSpreadsheet, Image, File, 
  ArrowLeft, ExternalLink, Search, X, ChevronRight, AlertTriangle 
} from 'lucide-react';

const FOLDERS = [
  { 
    id: '1qjKw8m550_0lSQcPvbJLZMQVhN-VpKyh', 
    name: 'Principal', 
    desc: 'Visão geral contendo todas as pastas da E.E. Antônio Caio.',
    driveUrl: 'https://drive.google.com/drive/folders/1qjKw8m550_0lSQcPvbJLZMQVhN-VpKyh?usp=sharing'
  },
  { 
    id: '1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC', 
    name: 'Coordenação', 
    desc: 'Documentos, diretrizes pedagógicas e planejamentos da Coordenação.',
    driveUrl: 'https://drive.google.com/drive/folders/1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC?usp=sharing'
  },
  { 
    id: '1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e', 
    name: 'Direção', 
    desc: 'Comunicados oficiais, normativas e documentos da Direção Escolar.',
    driveUrl: 'https://drive.google.com/drive/folders/1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e?usp=sharing'
  },
  { 
    id: '1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C', 
    name: 'Secretaria', 
    desc: 'Modelos de documentos, requerimentos e formulários da Secretaria.',
    driveUrl: 'https://drive.google.com/drive/folders/1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C?usp=sharing'
  }
];

const MOCK_DATA = {
  '1qjKw8m550_0lSQcPvbJLZMQVhN-VpKyh': [
    { id: '1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC', name: 'COORDENAÇÃO', isFolder: true, url: '' },
    { id: '1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e', name: 'DIREÇÃO', isFolder: true, url: '' },
    { id: '1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C', name: 'SECRETARIA', isFolder: true, url: '' }
  ],
  '1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC': [
    { id: 'c1', name: 'Calendário Escolar 2026 - Oficial.pdf', isFolder: false, url: 'https://drive.google.com/drive/folders/1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC' },
    { id: 'c2', name: 'Guia de Diretrizes Pedagógicas.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC' },
    { id: 'c3', name: 'Horário de Aulas - Ensino Fundamental.xlsx', isFolder: false, url: 'https://drive.google.com/drive/folders/1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC' },
    { id: 'c4', name: 'Modelo de Plano de Aula Semanal.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1tz_75dIUPAcBiGFfvnm_xSuT63Ab7nCC' }
  ],
  '1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e': [
    { id: 'd1', name: 'Comunicado Oficial 01 - Reunião de Pais.pdf', isFolder: false, url: 'https://drive.google.com/drive/folders/1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e' },
    { id: 'd2', name: 'Regimento Interno Escolar - Consolidado.pdf', isFolder: false, url: 'https://drive.google.com/drive/folders/1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e' },
    { id: 'd3', name: 'Diretrizes de Convivência e Conduta.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e' },
    { id: 'd4', name: 'Logomarca E.E. Antônio Caio - PNG.png', isFolder: false, url: 'https://drive.google.com/drive/folders/1QEOh7m0NX4u7SQka_B11WMYhYnLC55-e' }
  ],
  '1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C': [
    { id: 's1', name: 'Requerimento de Transferência Escolar.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C' },
    { id: 's2', name: 'Ficha de Matrícula - Modelo Geral.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C' },
    { id: 's3', name: 'Formulário de Justificativa de Ausência Docente.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C' },
    { id: 's4', name: 'Declaração de Matrícula - Modelo.docx', isFolder: false, url: 'https://drive.google.com/drive/folders/1IVvSQ_MKkFfufrPdYK6B9UrUf5EY1f0C' }
  ]
};

// Mapeamento de Extensão -> Ícones e Cores (Tema Premium semelhante ao de Turmas)
const getFileIconDetails = (name, isFolder) => {
  if (isFolder) {
    return { icon: <Folder size={18} color="#1CB0F6" />, color: "#1CB0F6", bg: "#EAF7FD" };
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
  const [activeFolder, setActiveFolder] = useState(FOLDERS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para API do Google Apps Script
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiFiles, setApiFiles] = useState(null);

  // Efeito para carregar dados reais do Apps Script caso configurado
  useEffect(() => {
    const fetchFiles = async () => {
      const apiUrl = import.meta.env.VITE_DOCUMENTS_API_URL;
      if (!apiUrl) {
        setApiFiles(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}?id=${activeFolder.id}`);
        const data = await response.json();
        if (data.success) {
          setApiFiles(data.files);
        } else {
          setError(data.error || 'Erro ao carregar dados do Drive.');
        }
      } catch (err) {
        console.error('API Error:', err);
        setError('Não foi possível conectar à API de documentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [activeFolder]);

  // Lista ativa de arquivos (usa API se disponível, senão dados Mock)
  const activeFiles = apiFiles || MOCK_DATA[activeFolder.id] || [];

  // Filtrar arquivos com base no termo de busca
  const filteredFiles = activeFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item) => {
    if (item.isFolder) {
      const foundFolder = FOLDERS.find(f => f.id === item.id);
      if (foundFolder) {
        setActiveFolder(foundFolder);
        setSearchTerm('');
      } else {
        // Tratar subpastas dinâmicas
        setActiveFolder({
          id: item.id,
          name: item.name,
          desc: `Arquivos na pasta ${item.name}.`,
          driveUrl: item.url || `https://drive.google.com/drive/folders/${item.id}?usp=sharing`
        });
        setSearchTerm('');
      }
    } else {
      window.open(item.url, '_blank', 'noopener');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header (Igual a Turmas) */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
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
              <FolderOpen size={28} color="var(--color-primary)" /> Compartilhamento de Documentos
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
              Consulte e acesse os arquivos e materiais compartilhados de forma integrada.
            </p>
          </div>
        </div>
      </div>

      {/* Painel Principal (Aparência idêntica à de Turmas com fundo azul #1CB0F6) */}
      <div style={{
        background: '#1CB0F6',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Sub-Header do Painel */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)', 
          paddingBottom: '1rem', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
              <FolderOpen size={20} color="#ffffff" /> Pasta atual: {activeFolder.name}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: 0, marginTop: '0.15rem' }}>
              {activeFolder.desc}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => window.open(activeFolder.driveUrl, '_blank', 'noopener')}
              className="btn"
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
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            >
              <ExternalLink size={16} /> Abrir no Google Drive
            </button>
          </div>
        </div>

        {/* Abas Internas Estilo Turmas (Pills dentro do container azul) */}
        <div style={{ 
          display: 'flex', 
          gap: '0.35rem', 
          background: 'rgba(0, 0, 0, 0.12)', 
          padding: '0.25rem', 
          borderRadius: 'var(--radius-md)', 
          width: 'fit-content', 
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          {FOLDERS.map((folder) => {
            const isActive = activeFolder.id === folder.id;
            return (
              <button 
                key={folder.id}
                onClick={() => {
                  setActiveFolder(folder);
                  setSearchTerm('');
                }}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#1CB0F6' : '#ffffff',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {folder.name}
              </button>
            );
          })}
        </div>

        {/* Campo de Pesquisa Nica do Painel (Igual a busca por aluno) */}
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

        {/* Listagem de Arquivos/Pastas Nativa (Visual idêntico ao de Turmas) */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
            Carregando arquivos do Google Drive...
          </div>
        ) : error ? (
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '3rem 1.5rem', textAlign: 'center', color: '#b91c1c', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={36} color="#ef4444" />
            <span>{error}</span>
            <button onClick={() => setApiFiles(null)} style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: '#475569' }}>Usar Dados Offline</button>
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
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '0.85rem 1.25rem', 
                    background: '#ffffff', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition-smooth)',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                    {/* Mini Avatar / Ícone Customizado */}
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
    </div>
  );
}
