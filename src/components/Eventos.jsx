import React, { useState } from 'react'
import EventDetailModal from './EventDetailModal'

export default function Eventos({ setView, events, records, deleteEvent, openEventModal, toggleEventFinalizado, updateEvent }) {
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Color badges based on type
  const getTypeBadgeClass = (tipo) => {
    switch (tipo) {
      case 'formulário': return 'badge-aula'   // Pastel Blue
      case 'email': return 'badge-reuniao'      // Pastel Purple
      case 'físico': return 'badge-outro'       // Pastel Orange
      default: return 'badge-outro'
    }
  }

  // Open detail modal on card click (ignore action button clicks)
  const handleCardClick = (e, ev) => {
    // Don't open modal if user clicked a button inside the card
    if (e.target.closest('button')) return
    setSelectedEvent(ev)
  }

  const safeFormatDate = (dateStr) => {
    if (!dateStr) return 'Não informada'
    try {
      const d = new Date(dateStr + 'T00:00:00')
      if (isNaN(d.getTime())) return 'Data Inválida'
      return d.toLocaleDateString('pt-BR')
    } catch(e) {
      return 'Data Inválida'
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* View Header with title and Novo Evento action button */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home" onClick={() => setView('home')} title="Voltar ao início">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h2>Gestão de Eventos</h2>
        </div>

        {/* Floating action to add new event */}
        <button
          className="btn btn-primary"
          onClick={() => openEventModal()}
          style={{ gap: '0.4rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem', backgroundColor: 'var(--pastel-green)', color: 'var(--pastel-green-dark)' }}
        >
          <span>➕</span>
          <span>Novo Evento</span>
        </button>
      </div>

      <div className="eventos-layout" style={{ display: 'block' }}>
        <div className="events-list-container" style={{ width: '100%' }}>
          {events.length === 0 ? (
            <div className="no-records" style={{ padding: '4rem 2rem' }}>
              <div className="no-records-icon">📅</div>
              <h3>Nenhum evento registrado</h3>
              <p>Clique no botão "+ Novo Evento" no topo para cadastrar seu primeiro evento pedagógico.</p>
            </div>
          ) : (
            <div className="eventos-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {events.map(ev => (
                <div
                  key={ev.id}
                  className="event-card"
                  style={{
                    minHeight: '230px',
                    border: ev.finalizado ? '1px solid hsl(145, 60%, 75%)' : '1px solid var(--border-light)',
                    boxShadow: ev.finalizado ? '0 4px 12px rgba(46, 125, 50, 0.05)' : 'var(--shadow-sm)',
                    transition: 'all 0.3s ease',
                    opacity: ev.finalizado ? 0.9 : 1,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleCardClick(e, ev)}
                  title="Clique para ver detalhes"
                >
                  <div>
                    <div className="event-header">
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`event-badge ${getTypeBadgeClass(ev.tipo)}`}>
                          {ev.tipo}
                        </span>
                        {ev.finalizado && (
                          <span className="event-badge" style={{ backgroundColor: 'var(--pastel-green)', color: 'var(--pastel-green-dark)', fontWeight: 700 }}>
                            ✓ Finalizado
                          </span>
                        )}
                        {ev.entregouForaDoPrazo?.length > 0 && (
                          <span className="event-badge" style={{ backgroundColor: 'var(--pastel-pink)', color: 'var(--pastel-pink-dark)', fontWeight: 700 }}>
                            ⚠️ {ev.entregouForaDoPrazo.length} atraso{ev.entregouForaDoPrazo.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="event-actions">
                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEventModal(ev) }} title="Editar Evento">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id) }} title="Excluir Evento">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="event-title" style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{ev.evento}</h3>
                  </div>

                  <div className="event-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', borderTop: 'none', paddingTop: '0.5rem' }}>
                    <div className="event-info-item">
                      <strong>Solicitante:</strong> <span style={{ color: 'var(--text-main)' }}>{ev.quemSolicitou}</span>
                    </div>
                    <div className="event-info-item">
                      <strong>Solicitado em:</strong> <span>{safeFormatDate(ev.dataSolicitacao)}</span>
                    </div>
                    <div className="event-info-item" style={{ color: 'var(--pastel-pink-dark)', fontWeight: 600, marginBottom: '0.5rem' }}>
                      <strong>Prazo de Entrega:</strong> <span>{safeFormatDate(ev.dataEntrega)}</span>
                    </div>

                    {/* Finalizado Action Button */}
                    <button
                      className={`btn ${ev.finalizado ? 'btn-success' : 'btn-secondary'}`}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: ev.finalizado ? 'var(--pastel-green)' : 'transparent',
                        color: ev.finalizado ? 'var(--pastel-green-dark)' : 'var(--text-muted)',
                        border: ev.finalizado ? 'none' : '1px solid var(--border-light)',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)'
                      }}
                      onClick={(e) => { e.stopPropagation(); toggleEventFinalizado(ev.id) }}
                      title={ev.finalizado ? 'Reabrir Evento' : 'Marcar como Finalizado'}
                    >
                      <span>{ev.finalizado ? '✅' : '⬜'}</span>
                      <span>Finalizado</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          records={records || []}
          onClose={() => setSelectedEvent(null)}
          onSave={(updatedEvent) => {
            updateEvent(updatedEvent)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}
