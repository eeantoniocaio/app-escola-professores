import React, { useState, useEffect, useRef } from 'react'

// Default teacher roster always available for selection
const DEFAULT_TEACHERS = [
  'Prof. Carlos Silva',
  'Profa. Regina Mendes',
  'Prof. Marcos Aurelio',
  'Profa. Juliana Lima',
  'Prof. Ricardo Ferreira',
  'Profa. Ana Paula Costa',
  'Prof. Eduardo Santos',
  'Profa. Fernanda Oliveira',
  'Prof. Lucas Carvalho',
  'Profa. Beatriz Souza',
]

export default function EventDetailModal({ event, records, onClose, onSave }) {
  // Get all teachers who submitted records for this event
  const eventRecords = records.filter(r => r.eventId === event.id)
  const recordTeachers = eventRecords.map(r => r.teacher)

  // Merge default roster with teachers who submitted records (no duplicates), sorted
  const teacherOptions = [...new Set([...DEFAULT_TEACHERS, ...recordTeachers])].sort()

  // Initialize late teachers from saved data
  const [lateTeachers, setLateTeachers] = useState(event.entregouForaDoPrazo || [])

  const overlayRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const toggleTeacher = (teacher) => {
    setLateTeachers(prev =>
      prev.includes(teacher) ? prev.filter(t => t !== teacher) : [...prev, teacher]
    )
  }

  const handleSave = () => {
    onSave({ ...event, entregouForaDoPrazo: lateTeachers })
    onClose()
  }

  const getTypeBadgeClass = (tipo) => {
    switch (tipo) {
      case 'formulário': return 'badge-aula'
      case 'email': return 'badge-reuniao'
      case 'físico': return 'badge-outro'
      default: return 'badge-outro'
    }
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        {/* Fixed Header */}
        <div className="modal-header" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Detalhes do Evento</h3>
          </div>
          <button className="btn-icon" onClick={onClose} title="Fechar" style={{ width: '32px', height: '32px', borderRadius: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Event Info Card */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`event-badge ${getTypeBadgeClass(event.tipo)}`}>{event.tipo}</span>
              {event.finalizado && (
                <span className="event-badge" style={{ backgroundColor: 'var(--pastel-green)', color: 'var(--pastel-green-dark)', fontWeight: 700 }}>
                  ✓ Finalizado
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'Outfit', color: 'var(--text-main)', margin: 0, lineHeight: 1.3 }}>
              {event.evento}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Solicitante</span>
                <p style={{ margin: '0.15rem 0 0 0' }}>{event.quemSolicitou}</p>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Prazo de Entrega</span>
                <p style={{ margin: '0.15rem 0 0 0', color: 'var(--pastel-pink-dark)', fontWeight: 600 }}>
                  {new Date(event.dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              {event.dataSolicitacao && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Solicitado em</span>
                  <p style={{ margin: '0.15rem 0 0 0' }}>
                    {new Date(event.dataSolicitacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Registros Enviados</span>
                <p style={{ margin: '0.15rem 0 0 0' }}>{eventRecords.length} evidência{eventRecords.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Late Delivery Multi-select */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.65rem'
            }}>
              ⚠️ Entregou fora do prazo
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Selecione os professores que cumpriram este evento com atraso.
            </p>

            <div className="teacher-checklist">
              {teacherOptions.map(teacher => {
                const isSelected = lateTeachers.includes(teacher)
                return (
                  <label
                    key={teacher}
                    className={`teacher-check-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTeacher(teacher)}
                  >
                    <div className={`teacher-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && (
                        <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2 7 5.5 10.5 12 3" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {teacher}
                      </span>

                    </div>
                    {isSelected && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '20px',
                        background: 'var(--pastel-pink)',
                        color: 'var(--pastel-pink-dark)',
                        whiteSpace: 'nowrap'
                      }}>
                        Fora do prazo
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {/* Summary counter */}
            {lateTeachers.length > 0 && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--pastel-pink)',
                color: 'var(--pastel-pink-dark)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span>⚠️</span>
                <span>{lateTeachers.length} professor{lateTeachers.length !== 1 ? 'es' : ''} marcado{lateTeachers.length !== 1 ? 's' : ''} com atraso</span>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div style={{
          flexShrink: 0,
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, backgroundColor: 'var(--pastel-blue)', color: 'var(--pastel-blue-dark)' }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
