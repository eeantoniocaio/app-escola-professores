import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link as LinkIcon, ChevronRight, ArrowLeft } from 'lucide-react';
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

const getTurmaTextColor = () => '#ffffff';

const getTurmaSubtextColor = () => 'rgba(255, 255, 255, 0.8)';

const getChevronBg = () => 'rgba(255, 255, 255, 0.2)';

export default function MapaClasse() {
  const navigate = useNavigate();
  const { turmas } = useGlobalData();

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
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
              <Users size={28} color="var(--color-primary)" /> Mapa de Classe
            </h2>
          </div>
        </div>
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
            const textColor = getTurmaTextColor(turma.nome);
            const subtextColor = getTurmaSubtextColor(turma.nome);
            const chevronBg = getChevronBg(turma.nome);
            
            return (
              <div
                key={turma.id}
                className={`flex justify-between items-center p-6 rounded-[10px] border border-white/10 shadow-sm transition-all duration-200 will-change-transform [backface-visibility:hidden] [transform:translate3d(0,0,0)] ${
                  hasLink ? 'cursor-pointer md:hover:-translate-y.5 md:hover:shadow-md' : 'cursor-default opacity-65'
                }`}
                style={{
                  backgroundColor: cardColor
                }}
                onClick={() => hasLink && window.open(turma.link, '_blank', 'noopener')}
                title={hasLink ? `Abrir ${turma.nome}` : 'Link não configurado'}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: textColor }}>{turma.nome}</div>
                  <div style={{ fontSize: '0.85rem', color: subtextColor, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {hasLink ? <LinkIcon size={14} /> : <Users size={14} />}
                    <span>{hasLink ? 'Clique para abrir' : 'Sem link'}</span>
                  </div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: chevronBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }}>
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
