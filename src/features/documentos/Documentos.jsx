import React from 'react';
import { FolderOpen, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Documentos() {
  const driveUrl = "https://drive.google.com/drive/folders/1qjKw8m550_0lSQcPvbJLZMQVhN-VpKyh?usp=sharing";
  const embedUrl = "https://drive.google.com/embeddedfolderview?id=1qjKw8m550_0lSQcPvbJLZMQVhN-VpKyh#grid";

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>Documentos Compartilhados</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Pasta de arquivos da Secretaria e Coordenação da E.E. Antônio Caio.
          </p>
        </div>
      </div>

      {/* Faixa de Informação e Fallback */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#f0f9ff', 
        border: '1px solid #bae6fd', 
        padding: '1rem 1.5rem', 
        borderRadius: '12px',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '280px' }}>
          <ShieldCheck size={24} style={{ color: '#0284c7', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1', lineHeight: 1.45 }}>
            <strong>Dica de Acesso:</strong> Se a visualização abaixo não carregar ou pedir login na sua conta Google (como @prof ou @servidor), você pode clicar no botão ao lado para abrir a pasta diretamente no Google Drive.
          </p>
        </div>
        <a 
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            padding: '0.65rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 10px rgba(14, 165, 233, 0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(14, 165, 233, 0.3)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(14, 165, 233, 0.25)';
          }}
        >
          <span>Abrir no Google Drive</span>
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Container do Iframe do Google Drive */}
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
          title="Pasta de Documentos Google Drive"
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
