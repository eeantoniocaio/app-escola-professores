import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import EventDetailModal from './EventDetailModal';
import EventModal from './EventModal';
import { PlusCircle, Calendar, AlertCircle, CheckCircle2, Circle, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useEventos } from './hooks/useEventos';
import { useRegistros } from '../registros/hooks/useRegistros';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';

export default function Eventos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const { events, deleteEvent, updateEvent, addEvent, toggleEventFinalizado, loading } = useEventos();
  const { records } = useRegistros();
  const { professores, tiposEvento } = useGlobalData();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isNovoModalOpen = location.pathname === '/eventos/novo';
  const eventToEdit = id ? events.find(e => e.id?.toString() === id) : null;
  const isEditModalOpen = location.pathname.includes('/editar/') && eventToEdit;

  const closeModals = () => navigate('/eventos');

  const getTypeBadgeStyle = (tipo) => {
    switch (tipo) {
      case 'formulário': return { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' };
      case 'email': return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' };
      case 'físico': return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' };
      default: return { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' };
    }
  };

  const handleCardClick = (e, ev) => {
    if (e.target.closest('button')) return;
    setSelectedEvent(ev);
  };

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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando eventos...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} title="Voltar ao início" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Gestão de Eventos</h2>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/eventos/novo')}>
          <PlusCircle size={18} /> Novo Evento
        </button>
      </div>

      <div className="eventos-layout">
        <div className="events-list-container">
          {events.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Calendar size={48} /></div>
              <h3 style={{ marginBottom: '0.5rem' }}>Nenhum evento registrado</h3>
              <p style={{ color: 'var(--text-muted)' }}>Clique no botão "Novo Evento" no topo para cadastrar seu primeiro evento pedagógico.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {events.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '230px',
                    border: ev.finalizado ? '1px solid var(--color-success)' : '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition-smooth)',
                    opacity: ev.finalizado ? 0.85 : 1,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onClick={(e) => handleCardClick(e, ev)}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  title="Clique para ver detalhes"
                >
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ ...getTypeBadgeStyle(ev.tipo), padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {ev.tipo}
                        </span>
                        {ev.finalizado && (
                          <span style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                            Finalizado
                          </span>
                        )}
                        {ev.entregouForaDoPrazo?.length > 0 && (
                          <span style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={12} /> {ev.entregouForaDoPrazo.length} atraso{ev.entregouForaDoPrazo.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/eventos/editar/${ev.id}`); }} title="Editar Evento" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                          <Pencil size={18} />
                        </button>
                        <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} title="Excluir Evento" style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{ev.evento}</h3>
                  </div>

                  <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Solicitante:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{ev.quemSolicitou}</span></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Solicitado em:</strong> <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{safeFormatDate(ev.dataSolicitacao)}</span></div>
                      <div style={{ color: 'var(--color-danger)', fontWeight: 600 }}><strong>Prazo de Entrega:</strong> {safeFormatDate(ev.dataEntrega)}</div>
                    </div>

                    <button
                      className="btn"
                      style={{
                        width: '100%',
                        marginTop: '1rem',
                        backgroundColor: ev.finalizado ? 'var(--color-success-bg)' : '#FFFFFF',
                        color: ev.finalizado ? 'var(--color-success)' : 'var(--text-muted)',
                        border: `1px solid ${ev.finalizado ? 'var(--color-success)' : 'var(--border-light)'}`,
                      }}
                      onClick={(e) => { e.stopPropagation(); toggleEventFinalizado(ev.id); }}
                      title={ev.finalizado ? 'Reabrir Evento' : 'Marcar como Finalizado'}
                    >
                      {ev.finalizado ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {ev.finalizado ? 'Finalizado' : 'Marcar como Finalizado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          records={records || []}
          professores={professores || []}
          onClose={() => setSelectedEvent(null)}
          onSave={(updatedEvent) => {
            updateEvent(updatedEvent);
            setSelectedEvent(null);
          }}
        />
      )}

      {(isNovoModalOpen || isEditModalOpen) && (
        <EventModal
          isOpen={true}
          onClose={closeModals}
          onSave={isEditModalOpen ? updateEvent : addEvent}
          tiposEvento={tiposEvento}
          professores={professores}
          eventToEdit={eventToEdit}
        />
      )}
    </div>
  );
}
