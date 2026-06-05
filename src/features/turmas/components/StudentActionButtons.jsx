import React from 'react';
import { FileText, Calendar, Clipboard, Camera, Users } from 'lucide-react';
import { findPhotoInMap } from '@/services/photoService';

export default function StudentActionButtons({
  aluno,
  userRole,
  isConfigured,
  accessToken,
  loginGoogle,
  showToast,
  photosMap,
  onOpenFicha,
  onOpenFrequencia,
  onOpenCarometro
}) {
  const photoUrl = findPhotoInMap(aluno.nome, photosMap);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button 
        onClick={() => onOpenFicha(aluno)}
        title="Ficha do Aluno"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #F59E0B',
          background: '#FEF3C7',
          color: '#d97706',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)'
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#FDE68A'; e.currentTarget.style.borderColor = '#B45309'; e.currentTarget.style.color = '#B45309'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.color = '#d97706'; }}
      >
        <FileText size={16} />
      </button>

      {userRole !== 'tecnico' && (
        <button 
          onClick={() => {
            onOpenFrequencia(aluno);
            if (isConfigured && !accessToken) {
              loginGoogle();
            }
          }}
          title="Frequência"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #10B981',
            background: '#ECFDF5',
            color: '#10B981',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#D1FAE5'; e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}
        >
          <Calendar size={16} />
        </button>
      )}

      {userRole !== 'tecnico' && (
        <button 
          onClick={() => showToast('Em desenvolvimento.', 'info')}
          title="Notas"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #3B82F6',
            background: '#EFF6FF',
            color: '#3B82F6',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
        >
          <Clipboard size={16} />
        </button>
      )}

      <button 
        onClick={() => {
          onOpenCarometro(aluno);
          if (isConfigured && !accessToken) {
            loginGoogle();
          }
        }}
        title="Carômetro"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #8B5CF6',
          background: '#F5F3FF',
          color: '#8B5CF6',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)'
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#EDE9FE'; e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6'; }}
      >
        {photoUrl ? <Camera size={16} /> : <Users size={16} />}
      </button>
    </div>
  );
}
