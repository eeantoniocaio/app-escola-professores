import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Home from './components/Home'
import Eventos from './components/Eventos'
import Registros from './components/Registros'
import EventModal from './components/EventModal'
import Configuracoes from './components/Configuracoes'
import Relatorios from './components/Relatorios'
import Login from './components/Login'
import logoUrl from './assets/logo.png'

export default function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('home')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  
  const [events, setEvents] = useState([])
  const [records, setRecords] = useState([])
  const [tiposEvento, setTiposEvento] = useState([])
  const [tiposEvidencia, setTiposEvidencia] = useState([])
  const [professores, setProfessores] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('perfis').select('papel').eq('id', userId).maybeSingle()
      if (data) setUserRole(data.papel)
    } catch (err) {
      console.error('Error fetching role:', err)
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch initial data from Supabase
  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          evtRes,
          recRes,
          profRes,
          tipEvtRes,
          tipEviRes
        ] = await Promise.all([
          supabase.from('eventos').select('*').order('created_at', { ascending: false }),
          supabase.from('registros').select('*').order('created_at', { ascending: false }),
          supabase.from('professores').select('nome'),
          supabase.from('tiposEvento').select('nome'),
          supabase.from('tiposEvidencia').select('nome')
        ])

        if (evtRes.error) console.error('Erro eventos:', evtRes.error)
        else setEvents(evtRes.data || [])

        if (recRes.error) console.error('Erro registros:', recRes.error)
        else setRecords(recRes.data || [])

        if (profRes.data) setProfessores(profRes.data.map(p => p.nome))
        if (tipEvtRes.data) setTiposEvento(tipEvtRes.data.map(t => t.nome))
        if (tipEviRes.data) setTiposEvidencia(tipEviRes.data.map(t => t.nome))
      } catch (error) {
        console.error('Erro geral ao buscar dados:', error)
        showToast('Erro ao carregar dados do banco', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [session])

  const handleOpenEventModal = (event = null) => {
    setEventToEdit(event)
    setIsEventModalOpen(true)
  }

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
    setEventToEdit(null)
  }

  // Events
  const handleAddEvent = async (newEvent) => {
    const { data, error } = await supabase.from('eventos').insert([newEvent]).select()
    if (error) {
      showToast('Erro ao salvar evento', 'error')
    } else if (data) {
      setEvents(prev => [data[0], ...prev])
      showToast('Evento pedagógico registrado com sucesso!')
    }
  }

  const handleUpdateEvent = async (updatedEvent) => {
    const { id, created_at, ...updateData } = updatedEvent
    const { data, error } = await supabase.from('eventos').update(updateData).eq('id', id).select()
    if (error) {
      showToast('Erro ao atualizar evento', 'error')
    } else if (data) {
      setEvents(prev => prev.map(e => e.id === id ? data[0] : e))
      showToast('Evento pedagógico atualizado com sucesso!')
    }
  }

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este evento?')) {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) {
        showToast('Erro ao excluir evento', 'error')
      } else {
        setEvents(prev => prev.filter(e => e.id !== id))
        showToast('Evento pedagógico excluído com sucesso.', 'info')
      }
    }
  }

  const toggleEventFinalizado = async (id) => {
    const event = events.find(e => e.id === id)
    if (!event) return
    const nextState = !event.finalizado
    const { data, error } = await supabase.from('eventos').update({ finalizado: nextState }).eq('id', id).select()
    if (error) {
      showToast('Erro ao atualizar status', 'error')
    } else if (data) {
      setEvents(prev => prev.map(e => e.id === id ? data[0] : e))
      showToast(nextState ? 'Evento finalizado com sucesso!' : 'Evento reaberto com sucesso!', nextState ? 'success' : 'info')
    }
  }

  // Records
  const handleAddRecord = async (newRecord) => {
    const { data, error } = await supabase.from('registros').insert([newRecord]).select()
    if (error) {
      showToast('Erro ao salvar evidência', 'error')
    } else if (data) {
      setRecords(prev => [data[0], ...prev])
      showToast('Evidência docente submetida com sucesso!')
    }
  }

  const handleUpdateRecord = async (updatedRecord) => {
    const { id, created_at, ...updateData } = updatedRecord
    const { data, error } = await supabase.from('registros').update(updateData).eq('id', id).select()
    if (error) {
      showToast('Erro ao atualizar evidência', 'error')
    } else if (data) {
      setRecords(prev => prev.map(r => r.id === id ? data[0] : r))
      showToast('Avaliação pedagógica salva com sucesso!')
    }
  }

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este registro de evidência?')) {
      const { error } = await supabase.from('registros').delete().eq('id', id)
      if (error) {
        showToast('Erro ao excluir registro', 'error')
      } else {
        setRecords(prev => prev.filter(r => r.id !== id))
        showToast('Registro de evidência excluído com sucesso.', 'info')
      }
    }
  }

  // Settings sync
  const handleAddSetting = async (table, nome, stateSetter) => {
    const { data, error } = await supabase.from(table).insert([{ nome }]).select()
    if (!error && data) stateSetter(prev => [...prev, data[0].nome])
  }
  const handleDeleteSetting = async (table, nome, stateSetter) => {
    const { error } = await supabase.from(table).delete().eq('nome', nome)
    if (!error) stateSetter(prev => prev.filter(i => i !== nome))
  }
  const handleImportProfessores = async (nomes) => {
    const inserts = nomes.map(nome => ({ nome }))
    const { data, error } = await supabase.from('professores').insert(inserts).select()
    if (!error && data) {
      setProfessores(prev => [...prev, ...data.map(d => d.nome)])
      showToast(`${data.length} professores importados!`)
    }
  }

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Verificando autenticação...</div>
  if (!session) return <Login setSession={setSession} />

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand" onClick={() => setView('home')}>
          <div className="logo-icon">
            <img src={logoUrl} alt="Logo" className="logo-img" />
          </div>
          <div className="brand-title">
            <h1>Portal de Evidências</h1>
            <p>E.E. Antônio Caio — Coordenação Pedagógica</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className={`btn ${view === 'home' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('home')}>
            Início
          </button>
          {userRole === 'gestao' && (
            <button className={`btn ${view === 'eventos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('eventos')}>
              Eventos
            </button>
          )}
          <button className={`btn ${view === 'registros' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('registros')}>
            Registros
          </button>
          {userRole === 'gestao' && (
            <button className={`btn ${view === 'relatorios' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('relatorios')}>
              Relatórios
            </button>
          )}
          <button className={`btn ${view === 'mapa-de-classe' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('mapa-de-classe')}>
            Mapa de Classe
          </button>
          <button className={`btn ${view === 'ocorrencias' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('ocorrencias')}>
            Ocorrências
          </button>
          {userRole === 'gestao' && (
            <button className={`btn ${view === 'configuracoes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('configuracoes')} title="Configurações" style={{ padding: '0.5rem', fontSize: '1.2rem', minWidth: '40px' }}>
              ⚙️
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()} title="Sair" style={{ padding: '0.5rem', fontSize: '1.2rem', minWidth: '40px' }}>
            🚪
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando dados...</div>
        ) : (
          <>
            {view === 'home' && (
              <Home setView={setView} openEventModal={handleOpenEventModal} userRole={userRole} />
            )}
            
            {view === 'eventos' && userRole === 'gestao' && (
              <Eventos
                setView={setView}
                events={events}
                records={records}
                professores={professores}
                deleteEvent={handleDeleteEvent}
                openEventModal={handleOpenEventModal}
                toggleEventFinalizado={toggleEventFinalizado}
                updateEvent={handleUpdateEvent}
              />
            )}

            {view === 'registros' && (
              <Registros 
                setView={setView} 
                records={records} 
                events={events}
                tiposEvidencia={tiposEvidencia}
                professores={professores}
                addRecord={handleAddRecord}
                updateRecord={handleUpdateRecord}
                deleteRecord={handleDeleteRecord}
              />
            )}

            {view === 'relatorios' && userRole === 'gestao' && (
              <Relatorios 
                setView={setView} 
                records={records} 
                events={events}
                professores={professores}
                tiposEvento={tiposEvento}
                tiposEvidencia={tiposEvidencia}
              />
            )}

            {view === 'mapa-de-classe' && (
              <div style={{ animation: 'fadeIn 0.5s ease-out', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>Mapa de Classe</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>Turma:</label>
                    <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}>
                      <option value="">Todas as turmas</option>
                      <option value="6A">6º Ano A</option>
                      <option value="7A">7º Ano A</option>
                      <option value="8A">8º Ano A</option>
                      <option value="9A">9º Ano A</option>
                      <option value="1A">1ª Série A</option>
                      <option value="2A">2ª Série A</option>
                      <option value="3A">3ª Série A</option>
                    </select>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Módulo em desenvolvimento...</p>
                </div>
              </div>
            )}

            {view === 'ocorrencias' && (
              <div style={{ animation: 'fadeIn 0.5s ease-out', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>Ocorrências em Sala de Aula</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>Turma:</label>
                    <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}>
                      <option value="">Todas as turmas</option>
                      <option value="6A">6º Ano A</option>
                      <option value="7A">7º Ano A</option>
                      <option value="8A">8º Ano A</option>
                      <option value="9A">9º Ano A</option>
                      <option value="1A">1ª Série A</option>
                      <option value="2A">2ª Série A</option>
                      <option value="3A">3ª Série A</option>
                    </select>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Módulo em desenvolvimento...</p>
                </div>
              </div>
            )}

            {view === 'configuracoes' && userRole === 'gestao' && (
              <Configuracoes 
                setView={setView}
                tiposEvento={tiposEvento} 
                addTipoEvento={(n) => handleAddSetting('tiposEvento', n, setTiposEvento)}
                removeTipoEvento={(n) => handleDeleteSetting('tiposEvento', n, setTiposEvento)}
                
                tiposEvidencia={tiposEvidencia} 
                addTipoEvidencia={(n) => handleAddSetting('tiposEvidencia', n, setTiposEvidencia)}
                removeTipoEvidencia={(n) => handleDeleteSetting('tiposEvidencia', n, setTiposEvidencia)}
                
                professores={professores} 
                addProfessor={(n) => handleAddSetting('professores', n, setProfessores)}
                removeProfessor={(n) => handleDeleteSetting('professores', n, setProfessores)}
                importProfessores={handleImportProfessores}
              />
            )}
          </>
        )}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio - Sistema de Avaliação Docente. Todos os direitos reservados.
      </footer>

      {isEventModalOpen && (
        <EventModal 
          isOpen={isEventModalOpen}
          eventToEdit={eventToEdit}
          tiposEvento={tiposEvento}
          onClose={handleCloseEventModal}
      onSave={async (eventData) => {
            if (eventToEdit) {
              await handleUpdateEvent({ ...eventData, id: eventToEdit.id, created_at: eventToEdit.created_at })
            } else {
              await handleAddEvent(eventData)
            }
            handleCloseEventModal()
          }}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'info' ? 'ℹ️' : '✨'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
