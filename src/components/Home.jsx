import React from 'react';

export default function Home({ setView, openEventModal }) {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="welcome-section" style={{ marginBottom: '3rem' }}>
        <h2>Painel de Evidências</h2>
        <p>Utilize o menu superior para navegar entre Eventos e Registros.</p>
      </div>
    </div>
  );
}
