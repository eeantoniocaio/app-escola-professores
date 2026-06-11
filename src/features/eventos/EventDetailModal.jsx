import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { useToast } from '../../app/providers/ToastProvider'

export default function EventDetailModal({ event, records, professores, onClose, onSave, userRole }) {
  const { showToast } = useToast();
  // Memoize expensive computations so they don't rerun on every re-render
  const eventRecords = useMemo(() => records.filter(r => r.eventId === event.id), [records, event.id])
  const recordTeachers = useMemo(() => eventRecords.map(r => r.teacher), [eventRecords])
  const teacherOptions = useMemo(
    () => [...new Set([...professores, ...recordTeachers])].sort(),
    [professores, recordTeachers]
  )

  // Use a Set for O(1) lookup instead of array.includes() (O(n) — was causing INP issues with 39 teachers)
  const [lateSet, setLateSet] = useState(() => new Set(event.entregouForaDoPrazo || []))

  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const toggleTeacher = useCallback((teacher) => {
    setLateSet(prev => {
      const next = new Set(prev)
      next.has(teacher) ? next.delete(teacher) : next.add(teacher)
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    onSave({ ...event, entregouForaDoPrazo: [...lateSet] })
    onClose()
  }, [event, lateSet, onSave, onClose])

  const safeFormatDate = (dateStr) => {
    if (!dateStr) return 'Não informada';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return 'Data Inválida';
      return d.toLocaleDateString('pt-BR');
    } catch(e) {
      return 'Data Inválida';
    }
  };

  const handleShareEvent = async () => {
    const text = `*Gestão de Eventos - Portal de Evidências*\n\n` +
                 `*Evento:* ${event.evento}\n` +
                 `*Tipo:* ${event.tipo}\n` +
                 `*Solicitante:* ${event.quemSolicitou}\n` +
                 `*Solicitado em:* ${safeFormatDate(event.dataSolicitacao)}\n` +
                 `*Prazo de Entrega:* ${safeFormatDate(event.dataEntrega)}\n` +
                 `*Status:* ${event.finalizado ? 'Finalizado' : 'Em andamento'}`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Informações do evento copiadas para a área de transferência!', 'success');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      showToast('Erro ao copiar informações do evento', 'error');
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Detalhamento do Evento',
          text: text
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    }
  };

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
          {userRole !== 'professor' ? (
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
                  const isSelected = lateSet.has(teacher)
                  return (
                    <div
                      key={teacher}
                      className={`teacher-check-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleTeacher(teacher)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); toggleTeacher(teacher) } }}
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
                    </div>
                  )
                })}
              </div>

              {lateSet.size > 0 && (
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
                  <span>{lateSet.size} professor{lateSet.size !== 1 ? 'es' : ''} marcado{lateSet.size !== 1 ? 's' : ''} com atraso</span>
                </div>
              )}
            </div>
          ) : (
            event.entregouForaDoPrazo && event.entregouForaDoPrazo.length > 0 && (
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
                  ⚠️ Entregaram fora do prazo
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {event.entregouForaDoPrazo.map(teacher => (
                    <span key={teacher} style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      background: 'var(--pastel-pink)',
                      color: 'var(--pastel-pink-dark)'
                    }}>
                      {teacher}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* Fixed Footer */}
        <div style={{
          flexShrink: 0,
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleShareEvent}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: 'auto', flex: '0 1 auto' }}
          >
            <Share2 size={16} /> Compartilhar
          </button>

          {userRole === 'professor' ? (
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: '1 1 auto', maxWidth: '120px' }}>
              Fechar
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose} style={{ flex: '1 1 auto', maxWidth: '120px' }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} style={{ flex: '1 1 auto', maxWidth: '120px', backgroundColor: 'var(--pastel-blue)', color: 'var(--pastel-blue-dark)' }}>
                Salvar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
