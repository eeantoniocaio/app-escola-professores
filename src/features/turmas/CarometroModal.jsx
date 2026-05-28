import React from 'react';
import { X, RefreshCw, AlertTriangle, Camera, User, BadgeAlert } from 'lucide-react';
import useCarometro from '../../hooks/useCarometro';
import { findPhotoInMap } from '../../services/photoService';

export default function CarometroModal({ aluno, isOpen, onClose }) {
  const { photosMap, loading, error, handleRefresh, needsAuth, loginMicrosoft } = useCarometro(aluno?.turma);

  if (!isOpen || !aluno) return null;

  const photoUrl = findPhotoInMap(aluno.nome, photosMap);

  // Iniciais do Aluno
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1150 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Cabeçalho */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <Camera size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Crachá do Aluno
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="modal-body" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-card) 100%)' }}>
          
          {needsAuth ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2rem 1rem', textAlign: 'center' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" style={{ height: '32px' }} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Conectar ao OneDrive</h4>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  É necessário conectar sua conta Microsoft para carregar a foto do aluno.
                </p>
              </div>
              <button 
                onClick={loginMicrosoft}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
              >
                Conectar Conta Microsoft
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
              <RefreshCw size={36} className="spin-animation" color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Consultando arquivo de fotos no OneDrive...</span>
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '2rem 1.5rem 1.5rem',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Detalhe estético no topo do crachá */}
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '8px', 
                background: 'linear-gradient(90deg, var(--color-primary) 0%, #a855f7 100%)'
              }} />

              {/* Foto Principal */}
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #ffffff',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: photoUrl ? 'transparent' : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                position: 'relative'
              }}>
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={`Foto de ${aluno.nome}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = 'var(--color-primary)';
                      const initials = document.createElement('span');
                      initials.innerText = getInitials(aluno.nome);
                      initials.style.color = '#ffffff';
                      initials.style.fontWeight = 'bold';
                      initials.style.fontSize = '2.5rem';
                      e.target.parentElement.appendChild(initials);
                    }}
                  />
                ) : (
                  <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '2.5rem' }}>
                    {getInitials(aluno.nome)}
                  </span>
                )}
              </div>

              {/* Informações do Aluno */}
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                {aluno.nome}
              </h4>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.4rem', 
                alignItems: 'center',
                width: '100%',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '1rem',
                marginTop: '0.5rem'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Turma: <strong style={{ color: 'var(--text-main)' }}>{aluno.turma}</strong>
                </div>
                {aluno.email && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    E-mail: <strong>{aluno.email}</strong>
                  </div>
                )}
              </div>

              {/* Status do Arquivo de Fotos */}
              {error && (
                <div style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--color-warning-bg)', 
                  border: '1px solid var(--color-warning)', 
                  color: 'var(--color-warning)', 
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  lineHeight: '1.3'
                }}>
                  <BadgeAlert size={16} style={{ flexShrink: 0 }} />
                  <span>Foto não encontrada. Crie a pasta <strong>Carômetro/{aluno.turma}</strong> no OneDrive com a foto do aluno.</span>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
          {!needsAuth && (
            <button 
              className="btn" 
              onClick={handleRefresh} 
              disabled={loading}
              style={{ margin: '0 auto 0 0', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-card)' }}
            >
              <RefreshCw size={12} className={loading ? 'spin-animation' : ''} />
              <span>Recarregar</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose} style={{ margin: 0, padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
