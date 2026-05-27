import React from 'react';
import { Users, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';

const GRADE_COLORS = {
  '6': '#1CB0F6', // Macaw
  '7': '#FF4B4B', // Cardinal
  '8': '#FFC800', // Bee
  '9': '#FF9600', // Fox
  '1': '#CE82FF', // Beetle
  '2': '#2B70C9', // Humpback
  '3': '#58CC02'  // Feather Green
};

const getTurmaColor = (nome) => {
  const match = nome.match(/^(\d+)/);
  if (match) {
    const num = match[1];
    return GRADE_COLORS[num] || 'var(--color-primary)';
  }
  return 'var(--color-primary)';
};

export default function Turmas() {
  const { turmas } = useGlobalData();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>Mapa de Classe</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Selecione uma turma para visualizar o mapa de assentos</p>
      </div>

      {turmas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Users size={48} /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Nenhuma turma cadastrada.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vá em Configurações para adicionar turmas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {turmas.map((turma) => {
            const hasLink = turma.link && turma.link.trim() !== '';
            const cardColor = getTurmaColor(turma.nome);
            return (
              <div
                key={turma.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderLeft: `4px solid ${cardColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  cursor: hasLink ? 'pointer' : 'default',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'var(--transition-smooth)',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: hasLink ? 1 : 0.75
                }}
                onClick={() => hasLink && window.open(turma.link, '_blank', 'noopener')}
                onMouseOver={e => { if (hasLink) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = cardColor } }}
                onMouseOut={e => { if (hasLink) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-light)' } }}
                title={hasLink ? `Abrir ${turma.nome}` : 'Link não configurado'}
              >
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>{turma.nome}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {hasLink ? <LinkIcon size={14} /> : <Users size={14} />}
                    <span>{hasLink ? 'Clique para abrir' : 'Sem link'}</span>
                  </div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cardColor }}>
                  {hasLink ? <ChevronRight size={18} /> : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
