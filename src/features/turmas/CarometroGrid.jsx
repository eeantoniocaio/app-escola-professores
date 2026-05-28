import React from 'react';
import { Camera, RefreshCw, AlertTriangle, User } from 'lucide-react';
import { normalizeStudentName } from '../../services/photoService';

export default function CarometroGrid({ students, photosMap, loading, error, onRefresh, needsAuth, onLogin }) {
  
  // Extrai as iniciais do nome do aluno
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Cores consistentes para avatares sem foto baseada no nome
  const getAvatarColor = (name) => {
    const colors = [
      '#EF4444', // Red
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#6366F1', // Indigo
      '#8B5CF6', // Violet
      '#EC4899', // Pink
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Renderiza aviso caso necessite de autenticação
  if (needsAuth) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 1.5rem', 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px dashed var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        marginTop: '1rem'
      }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" style={{ height: '36px' }} />
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Conectar ao OneDrive</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.4 }}>
            Conecte sua conta Microsoft para carregar e exibir as fotos dos alunos a partir da pasta <strong>Carômetro</strong> no seu OneDrive.
          </p>
        </div>
        <button 
          onClick={onLogin}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: '0.65rem 1.25rem' }}
        >
          Conectar Conta Microsoft
        </button>
      </div>
    );
  }

  // Renderiza Skeleton Loaders elegantes durante a busca
  if (loading && Object.keys(photosMap).length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            style={{ 
              background: 'var(--bg-card)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-light)', 
              padding: '1rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ width: '80%', height: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ width: '40%', height: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // Renderiza aviso caso haja erro ao carregar as fotos
  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 1.5rem', 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px dashed var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
          <AlertTriangle size={28} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Pasta de Fotos Indisponível</h4>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.4 }}>
            {error} Certifique-se de que a pasta raiz no seu OneDrive se chama exatamente <strong>Carômetro</strong> e possui uma subpasta correspondente para esta turma.
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: 'var(--bg-secondary)' }}
        >
          <RefreshCw size={14} /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Barra de Ações Rápidas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Exibindo {students.length} foto(s)
        </span>
        <button 
          onClick={onRefresh}
          className="btn-icon-label"
          disabled={loading}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-primary)', 
            cursor: 'pointer', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          <span>Sincronizar Fotos</span>
        </button>
      </div>

      {/* Grid de Cards dos Alunos */}
      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Nenhum aluno matriculado nesta turma para exibir.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {students.map((aluno, index) => {
            const normalizedName = normalizeStudentName(aluno.nome);
            const photoUrl = photosMap[normalizedName];

            return (
              <div 
                key={aluno.id}
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid var(--border-light)', 
                  padding: '1.25rem 1rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  position: 'relative',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  overflow: 'hidden'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                
                {/* Badge do Número de Chamada */}
                <span style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  left: '8px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  #{String(index + 1).padStart(2, '0')}
                </span>

                {/* Avatar da Foto */}
                <div style={{ 
                  width: '96px', 
                  height: '96px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: photoUrl ? 'transparent' : getAvatarColor(aluno.nome),
                  border: photoUrl ? '2px solid var(--color-primary)' : 'none',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
                  marginBottom: '1rem',
                  transition: 'border-color 0.2s'
                }}>
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={`Foto de ${aluno.nome}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s' 
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      onError={(e) => {
                        // Fallback em caso de erro ao renderizar imagem do link temporário
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = getAvatarColor(aluno.nome);
                        const initials = document.createElement('span');
                        initials.innerText = getInitials(aluno.nome);
                        initials.style.color = '#ffffff';
                        initials.style.fontWeight = 'bold';
                        initials.style.fontSize = '1.75rem';
                        e.target.parentElement.appendChild(initials);
                      }}
                    />
                  ) : (
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.75rem' }}>
                      {getInitials(aluno.nome)}
                    </span>
                  )}
                </div>

                {/* Nome do Aluno */}
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: 'var(--text-main)', 
                  textAlign: 'center',
                  lineHeight: '1.25',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  height: '2.5rem',
                  width: '100%'
                }}>
                  {aluno.nome}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
