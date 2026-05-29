import React, { useState } from 'react';
import { Folder, FolderOpen, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';

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
  const [activeFolder, setActiveFolder] = useState(FOLDERS[0]);

  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${activeFolder.id}#grid`;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>Documentos Compartilhados</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Pasta de arquivos e materiais compartilhados da unidade escolar.
        </p>
      </div>

      {/* Navegação de Pastas Nativa */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        {FOLDERS.map((folder) => {
          const isActive = activeFolder.id === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder)}
              style={{
                background: isActive ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)' : 'white',
                border: isActive ? 'none' : '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'left',
                boxShadow: isActive ? '0 8px 20px rgba(14, 165, 233, 0.2)' : '0 2px 8px rgba(0,0,0,0.01)',
                transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
                color: isActive ? 'white' : '#1e293b',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                if (!isActive) e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.05)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (!isActive) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.01)';
              }}
            >
              <div style={{
                color: isActive ? 'white' : 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isActive ? <FolderOpen size={28} /> : <Folder size={28} />}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {folder.name}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: isActive ? 0.8 : 0.6, marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Clique para abrir
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Faixa de Descrição da Pasta Ativa */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#f8fafc', 
        border: '1px solid var(--border-light)', 
        padding: '1rem 1.5rem', 
        borderRadius: '12px',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '280px' }}>
          <FolderOpen size={20} style={{ color: '#0ea5e9', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.45 }}>
            <strong>Pasta atual: {activeFolder.name}</strong> — {activeFolder.desc}
          </p>
        </div>
        <a 
          href={activeFolder.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: '1px solid #cbd5e1',
            color: '#475569',
            textDecoration: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'background-color 0.2s, color 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#1e293b';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <span>Abrir no Google Drive</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Container do IFrame do Google Drive */}
      <div style={{
        width: '100%',
        height: '750px',
        background: 'white',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <iframe 
          src={embedUrl} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={`Pasta de Documentos Google Drive - ${activeFolder.name}`}
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
