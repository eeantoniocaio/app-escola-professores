import React from 'react'

export default function Home({ setView, openEventModal }) {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Welcome Banner */}
      <div className="welcome-section" style={{ marginBottom: '3rem' }}>
        <h2>Painel de Evidências</h2>
      </div>

      {/* Three Prominent Buttons for Quick Actions */}
      <div className="home-buttons-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Events Button */}
        <div className="rect-pastel-button eventos" onClick={() => setView('eventos')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/>
          </svg>
          <span>Eventos</span>
        </div>

        {/* New Event Button */}
        <div className="rect-pastel-button novo-evento" onClick={() => openEventModal()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-2-7h-4v-4h-2v4H7v2h4v4h2v-4h4v-2z"/>
          </svg>
          <span>Novo Evento</span>
        </div>

        {/* Evidence Records Button */}
        <div className="rect-pastel-button registros" onClick={() => setView('registros')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span>Registros</span>
        </div>
      </div>
    </div>
  )
}
