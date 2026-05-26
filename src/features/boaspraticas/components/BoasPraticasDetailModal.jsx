import React, { useEffect } from 'react';
import { X, Calendar, User, Users, Bookmark, FileText, ExternalLink } from 'lucide-react';

export default function BoasPraticasDetailModal({ praticas, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!praticas) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(15,23,42,0.5)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        padding: '1rem' 
      }} 
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div 
        style={{ 
          background: 'white', 
          borderRadius: '20px', 
          width: '100%', 
          maxWidth: '650px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '90vh',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⭐</span> Detalhes da Boa Prática
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Metadata Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            padding: '1.25rem', 
            background: '#f8fafc', 
            borderRadius: '14px', 
            border: '1px solid #e2e8f0' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={18} style={{ color: '#0ea5e9' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Professor(a)</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{praticas.professor}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={18} style={{ color: '#10b981' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Série / Turma</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{praticas.serie}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={18} style={{ color: '#f59e0b' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Data de Realização</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  {new Date(praticas.data_realizacao + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {praticas.habilidade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bookmark size={18} style={{ color: '#8b5cf6' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Habilidade</span>
                  <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{praticas.habilidade}</span>
                </div>
              </div>
            )}
          </div>

          {/* Relato */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relato da Prática</h4>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '1rem', 
              color: '#334155', 
              lineHeight: 1.6,
              background: '#ffffff',
              padding: '0.5rem 0'
            }}>
              {praticas.relato}
            </div>
          </div>

          {/* Link Drive (if present) */}
          {praticas.link_drive && (
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link de Apoio (Drive)</h4>
              <a 
                href={praticas.link_drive} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  textDecoration: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: '1.5px solid #bae6fd',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#bae6fd'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              >
                <FileText size={18} /> Acessar Recursos do Drive <ExternalLink size={14} />
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button 
            onClick={onClose} 
            style={{
              background: '#f1f5f9',
              border: 'none',
              padding: '0.65rem 2rem',
              color: '#1e293b',
              fontWeight: 600,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            Fechar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
