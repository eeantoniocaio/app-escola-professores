import React, { useEffect } from 'react';
import { X, Calendar, User, BookOpen, Users, Bookmark, Check } from 'lucide-react';

export default function QuestaoDetailModal({ questao, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!questao) return null;

  const letrasAlternativas = ['A', 'B', 'C', 'D', 'E'].slice(0, questao.num_alternativas || 4);

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
            <span>📝</span> Detalhes da Questão
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
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{questao.professor}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BookOpen size={18} style={{ color: '#3b82f6' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Disciplina</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{questao.disciplina}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={18} style={{ color: '#10b981' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Turma</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{questao.turma}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={18} style={{ color: '#f59e0b' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Data de Envio</span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                  {new Date(questao.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            {questao.habilidade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bookmark size={18} style={{ color: '#8b5cf6' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Habilidade</span>
                  <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>{questao.habilidade}</span>
                </div>
              </div>
            )}
            {questao.alternativa_correta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Check size={18} style={{ color: '#10b981' }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Alt. Correta</span>
                  <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700 }}>Alternativa {questao.alternativa_correta}</span>
                </div>
              </div>
            )}
          </div>

          {/* Enunciado */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enunciado</h4>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '1rem', 
              color: '#334155', 
              lineHeight: 1.6,
              background: '#ffffff',
              padding: '0.5rem 0'
            }}>
              {questao.enunciado}
            </div>
          </div>

          {/* Imagem (if present) */}
          {(questao.imagem_base64 || questao.imagem_url) && (
            <div>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imagem de Apoio</h4>
              <div style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'center',
                padding: '1rem'
              }}>
                <img 
                  src={questao.imagem_url || questao.imagem_base64} 
                  alt="Apoio da questão" 
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} 
                />
              </div>
            </div>
          )}

          {/* Alternativas */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alternativas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {letrasAlternativas.map(letra => {
                const isCorrect = letra === questao.alternativa_correta;
                return (
                  <div 
                    key={letra} 
                    style={{ 
                      display: 'flex', 
                      gap: '0.85rem', 
                      padding: '0.85rem 1.1rem', 
                      background: isCorrect ? '#f0fdf4' : '#f8fafc', 
                      borderRadius: '10px', 
                      border: isCorrect ? '1.5px solid #22c55e' : '1px solid #f1f5f9',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{ fontWeight: 800, color: isCorrect ? '#16a34a' : '#64748b', fontSize: '0.95rem', minWidth: '20px' }}>{letra})</span>
                    <span style={{ fontSize: '0.95rem', color: isCorrect ? '#15803d' : '#334155', fontWeight: isCorrect ? 600 : 400, lineHeight: 1.5, flex: 1 }}>
                      {questao.alternativas?.[letra] || '—'}
                    </span>
                    {isCorrect && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                        Correta
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
