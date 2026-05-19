import React from 'react';

export default function Home({ setView, openEventModal, userRole }) {
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
                color: 'var(--pastel-blue-dark)',
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
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Eventos</span>
            </button>
          </>
        )}
        <button 
          onClick={() => setView('registros')}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: 'var(--pastel-purple)', 
            color: 'var(--pastel-purple-dark)',
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
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Registros</span>
        </button>

        {userRole === 'gestao' && (
          <button 
            onClick={() => setView('relatorios')}
            style={{ 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)', 
              border: 'none', 
              background: 'var(--pastel-orange)', 
              color: 'var(--pastel-orange-dark)',
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
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Relatórios</span>
          </button>
        )}

        <button 
          onClick={() => setView('mapa-de-classe')}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: 'var(--pastel-pink)', 
            color: 'var(--pastel-pink-dark)',
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
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Mapa de Classe</span>
        </button>

        <button 
          onClick={() => setView('ocorrencias')}
          style={{ 
            padding: '2rem', 
            borderRadius: 'var(--radius-lg)', 
            border: 'none', 
            background: 'var(--pastel-yellow)', 
            color: 'var(--pastel-yellow-dark)',
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
          <span style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>Ocorrências em Sala de Aula</span>
        </button>
      </div>
    </div>
  );
}
