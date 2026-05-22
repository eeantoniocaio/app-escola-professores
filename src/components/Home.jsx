import React, { useState } from 'react';
import BoasPraticasModal from './BoasPraticasModal';

export default function Home({ setView, openEventModal, openOcorrenciaModal, userRole, professores = [], turmas = [] }) {
  const [isBoasPraticasOpen, setIsBoasPraticasOpen] = useState(false);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Painel de Evidências</h2>
        <p style={{ color: 'var(--text-muted)' }}>Acesse rapidamente as principais áreas do sistema.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {userRole === 'gestao' && (
          <>
            <button 
              onClick={() => openEventModal()}
              style={{ 
                padding: '2rem', 
                borderRadius: 'var(--radius-lg)', 
                border: 'none', 
                background: 'var(--pastel-green)', 
                color: 'var(--pastel-green-dark)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                width: '200px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '2.5rem' }}>➕</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Novo Evento</span>
            </button>

            <button 
              onClick={() => setView('eventos')}
              style={{ 
                padding: '2rem', 
                borderRadius: 'var(--radius-lg)', 
                border: 'none', 
                background: 'var(--pastel-blue)', 
                color: '#2d6b77',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                width: '200px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '2.5rem' }}>📅</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Eventos</span>
            </button>
          </>
        )}
        {userRole === 'gestao' && (
          <button 
            onClick={() => setView('registros')}
            style={{ 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              border: 'none', 
              background: '#E6E6FA', 
              color: '#4a3f8a',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '200px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '2.5rem' }}>📁</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Registros</span>
          </button>
        )}

        {userRole === 'gestao' && (
          <button 
            onClick={() => setView('relatorios')}
            style={{ 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              border: 'none', 
              background: '#F2CA7E', 
              color: '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '200px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '2.5rem' }}>📊</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Relatórios</span>
          </button>
        )}

        {userRole === 'gestao' && (
          <button 
            onClick={() => setView('historico-ocorrencias')}
            style={{ 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              border: 'none', 
              background: '#A7D0D9', 
              color: '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              width: '200px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '2.5rem' }}>🛡️</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: '#1a1a1a' }}>Histórico de Ocorrências</span>
          </button>
        )}

        <button 
          onClick={() => setView('mapa-de-classe')}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: '#F2BBC9', 
            color: '#1a1a1a',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            width: '200px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '2.5rem' }}>🗺️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Mapa de Classe</span>
        </button>

        <button 
          onClick={() => openOcorrenciaModal()}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: '#FFFACD', 
            color: '#1a1a1a',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            width: '200px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: '#1a1a1a' }}>Ocorrências em Sala de Aula</span>
        </button>

        <button 
          onClick={() => setView('envio-questoes')}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: '#97F294', 
            color: '#1a1a1a',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            width: '200px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '2.5rem' }}>📝</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: '#1a1a1a' }}>Envio de questões para recuperação de ausências</span>
        </button>

        <button 
          onClick={() => setIsBoasPraticasOpen(true)}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: '#8B5CF6', 
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            width: '200px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '2.5rem' }}>🌟</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: 'white' }}>Boas Práticas</span>
        </button>
      </div>

      <BoasPraticasModal 
        isOpen={isBoasPraticasOpen} 
        onClose={() => setIsBoasPraticasOpen(false)} 
        professores={professores}
        turmas={turmas}
      />
    </div>
  );
}
