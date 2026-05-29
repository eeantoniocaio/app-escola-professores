import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, ExternalLink, ArrowLeft } from 'lucide-react';

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

export default function Documentos() {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState(FOLDERS[0]);

  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${activeFolder.id}#grid`;

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
              Consulte e faça o download dos arquivos compartilhados pela Secretaria e Equipe Gestora.
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
                onClick={() => setActiveFolder(folder)}
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

        {/* Visualização da Pasta Embutida (Semelhante ao Carômetro) */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius-md)', 
          padding: '0', 
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          height: '750px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <iframe 
            src={embedUrl} 
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={`Pasta de Documentos Google Drive - ${activeFolder.name}`}
            allow="autoplay; encrypted-media"
          />
        </div>
      </div>
    </div>
  );
}
