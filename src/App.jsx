import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Home from './components/Home'
import Eventos from './components/Eventos'
import Registros from './components/Registros'
import EventModal from './components/EventModal'
import Configuracoes from './components/Configuracoes'
import Relatorios from './components/Relatorios'
import Ocorrencias from './components/Ocorrencias'
import HistoricoOcorrencias from './components/HistoricoOcorrencias'
import Login from './components/Login'
import EnvioQuestoes from './components/EnvioQuestoes'
import logoUrl from './assets/logo.png'

export default function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('home')
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  
  const [events, setEvents] = useState([])
  const [records, setRecords] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])
  const [questoes, setQuestoes] = useState([])
  const [tiposEvento, setTiposEvento] = useState([])
  const [tiposEvidencia, setTiposEvidencia] = useState([])
  const [professores, setProfessores] = useState([])
  const [gestores, setGestores] = useState([])
  const [turmas, setTurmas] = useState([])
  const [alunos, setAlunos] = useState([]) // [{id, nome, turma}]
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
      if (data) {
        setUserRole(data.papel)
      }
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
          ocorrRes,
          questoesRes,
          profRes,
          tipEvtRes,
          tipEviRes,
          turmasRes,
          alunosRes,
          gestRes
        ] = await Promise.all([
          supabase.from('eventos').select('*').order('created_at', { ascending: false }),
          supabase.from('registros').select('*').order('created_at', { ascending: false }),
          supabase.from('ocorrencias').select('*').order('created_at', { ascending: false }),
          supabase.from('questoes').select('*').order('created_at', { ascending: false }),
          supabase.from('professores').select('nome'),
          supabase.from('tiposEvento').select('nome'),
          supabase.from('tiposEvidencia').select('nome'),
          supabase.from('turmas').select('id, nome, link').order('nome'),
          supabase.from('alunos').select('id, nome, turma').order('nome'),
          supabase.from('gestores').select('nome')
        ])

        if (evtRes.error) console.error('Erro eventos:', evtRes.error)
        else setEvents(evtRes.data || [])

        if (recRes.error) console.error('Erro registros:', recRes.error)
        else setRecords(recRes.data || [])

        if (ocorrRes.error) console.error('Erro ocorrências:', ocorrRes.error)
        else setOcorrencias(ocorrRes.data || [])

        if (questoesRes.error) console.error('Erro questões:', questoesRes.error)
        else setQuestoes(questoesRes.data || [])

        if (profRes.data) setProfessores(profRes.data.map(p => p.nome))
        if (tipEvtRes.data) setTiposEvento(tipEvtRes.data.map(t => t.nome))
        if (tipEviRes.data) setTiposEvidencia(tipEviRes.data.map(t => t.nome))
        if (turmasRes.data) setTurmas(turmasRes.data)
        if (alunosRes.data) setAlunos(alunosRes.data)
        if (gestRes.data) setGestores(gestRes.data.map(g => g.nome))
      } catch (error) {
        console.error('Erro geral ao buscar dados:', error)
        showToast('Erro ao carregar dados do banco', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [session])

  // Realtime Notifications for Ocorrencias (Gestão)
  useEffect(() => {
    if (userRole !== 'gestao') return;

    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    const channel = supabase.channel('realtime-ocorrencias')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ocorrencias' },
        (payload) => {
          setOcorrencias(prev => [payload.new, ...prev]);
          
          if ("Notification" in window && Notification.permission === "granted") {
            const audio = new Audio('/notification.ogg');
            audio.play().catch(err => console.log('Audio block by browser:', err));

            new Notification('Nova Ocorrência Registrada', {
              body: `Professor(a) ${payload.new.professor} registrou uma nova ocorrência para ${payload.new.aluno}.`,
              requireInteraction: true
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [userRole]);

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

  // Turmas
  const handleAddTurma = async (nome) => {
    const { data, error } = await supabase.from('turmas').insert([{ nome }]).select('id, nome, link')
    if (!error && data) setTurmas(prev => [...prev, data[0]].sort((a, b) => a.nome.localeCompare(b.nome)))
  }
  const handleRemoveTurma = async (nome) => {
    const { error } = await supabase.from('turmas').delete().eq('nome', nome)
    if (!error) {
      setTurmas(prev => prev.filter(t => t.nome !== nome))
      setAlunos(prev => prev.filter(a => a.turma !== nome)) // cascade cleanup
    }
  }
  const handleUpdateTurmaLink = async (id, link) => {
    const { data, error } = await supabase.from('turmas').update({ link }).eq('id', id).select('id, nome, link')
    if (!error && data) {
      setTurmas(prev => prev.map(t => t.id === id ? data[0] : t))
      showToast('Link da turma atualizado!')
    }
  }

  // Alunos
  const handleImportAlunosTurma = async (turmaNome, nomes) => {
    const inserts = nomes.map(nome => ({ nome, turma: turmaNome }))
    const { data, error } = await supabase.from('alunos').insert(inserts).select('id, nome, turma')
    if (error) {
      showToast('Erro ao importar alunos', 'error')
    } else if (data) {
      setAlunos(prev => [...prev, ...data])
      showToast(`${data.length} aluno(s) importado(s) para ${turmaNome}!`)
    }
  }
  const handleClearAlunosTurma = async (turmaNome) => {
    if (!window.confirm(`Remover todos os alunos de ${turmaNome}?`)) return
    const { error } = await supabase.from('alunos').delete().eq('turma', turmaNome)
    if (!error) {
      setAlunos(prev => prev.filter(a => a.turma !== turmaNome))
      showToast(`Lista de ${turmaNome} limpa.`, 'info')
    }
  }

  // Ocorrências
  const handleAddOcorrencia = async (novaOcorrencia) => {
    const { data, error } = await supabase.from('ocorrencias').insert([novaOcorrencia]).select()
    if (error) {
      showToast('Erro ao salvar ocorrência', 'error')
    } else if (data) {
      setOcorrencias(prev => [data[0], ...prev])
      showToast('Ocorrência registrada com sucesso!')
    }
  }
  const handleDeleteOcorrencia = async (id) => {
    if (window.confirm('Deseja excluir esta ocorrência?')) {
      const { error } = await supabase.from('ocorrencias').delete().eq('id', id)
      if (!error) {
        setOcorrencias(prev => prev.filter(o => o.id !== id))
        showToast('Ocorrência excluída.', 'info')
      }
    }
  }
  const handleUpdateOcorrencia = async (id, intervencaoGestao) => {
    const { data, error } = await supabase.from('ocorrencias').update({ intervencao_gestao: intervencaoGestao }).eq('id', id).select()
    if (error) {
      showToast('Erro ao atualizar ocorrência', 'error')
    } else if (data) {
      setOcorrencias(prev => prev.map(o => o.id === id ? data[0] : o))
      showToast('Intervenção salva com sucesso!')
    }
  }

  // Questões
  const handleAddQuestao = async (novaQuestao) => {
    const { data, error } = await supabase.from('questoes').insert([novaQuestao]).select()
    if (error) {
      showToast('Erro ao salvar questão', 'error')
    } else if (data) {
      setQuestoes(prev => [data[0], ...prev])
      showToast('Questão registrada com sucesso!')
    }
  }
  const handleDeleteQuestao = async (id) => {
    if (window.confirm('Deseja excluir esta questão?')) {
      const { error } = await supabase.from('questoes').delete().eq('id', id)
      if (!error) {
        setQuestoes(prev => prev.filter(q => q.id !== id))
        showToast('Questão excluída.', 'info')
      }
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
        
        <div className="header-actions" style={{ gap: '0.25rem' }}>
          <button className={`nav-link ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            Início
          </button>
          {userRole === 'gestao' && (
            <>
              <button className={`nav-link ${view === 'eventos' ? 'active' : ''}`} onClick={() => setView('eventos')}>
                Eventos
              </button>
              <button className={`nav-link ${view === 'registros' ? 'active' : ''}`} onClick={() => setView('registros')}>
                Registros
              </button>
              <button className={`nav-link ${view === 'relatorios' ? 'active' : ''}`} onClick={() => setView('relatorios')}>
                Relatórios
              </button>
              <button className={`nav-link ${view === 'historico-ocorrencias' ? 'active' : ''}`} onClick={() => setView('historico-ocorrencias')}>
                Histórico de Ocorrências
              </button>
            </>
          )}
          <button className={`nav-link ${view === 'mapa-de-classe' ? 'active' : ''}`} onClick={() => setView('mapa-de-classe')}>
            Mapa de Classe
          </button>
          <button className="nav-link" onClick={() => setShowOcorrenciaModal(true)}>
            Ocorrências
          </button>
          <button className={`nav-link ${view === 'envio-questoes' ? 'active' : ''}`} onClick={() => setView('envio-questoes')}>
            Reposições
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          
          {userRole === 'gestao' && (
            <button className={`nav-link ${view === 'configuracoes' ? 'active' : ''}`} onClick={() => setView('configuracoes')} title="Configurações" style={{ fontSize: '1.2rem', padding: '0.4rem' }}>
              ⚙️
            </button>
          )}
          <button className="nav-link" onClick={() => supabase.auth.signOut()} title="Sair" style={{ fontSize: '1.2rem', padding: '0.4rem' }}>
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
              <Home setView={setView} openEventModal={handleOpenEventModal} openOcorrenciaModal={() => setShowOcorrenciaModal(true)} userRole={userRole} />
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
                gestores={gestores}
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
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '2rem', margin: 0, marginBottom: '0.5rem' }}>Mapa de Classe</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Selecione uma turma para visualizar o mapa de assentos</p>
                </div>

                {turmas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Nenhuma turma cadastrada.</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vá em ⚙️ Configurações para adicionar turmas.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {turmas.map((turma, idx) => {
                      const colors = [
                        { bg: 'hsl(350, 100%, 93%)', text: 'hsl(350, 60%, 35%)' },
                        { bg: 'hsl(35, 100%, 88%)', text: 'hsl(35, 60%, 30%)' },
                        { bg: 'hsl(145, 60%, 87%)', text: 'hsl(145, 50%, 28%)' },
                        { bg: 'hsl(210, 80%, 90%)', text: 'hsl(210, 55%, 32%)' },
                        { bg: 'hsl(270, 60%, 90%)', text: 'hsl(270, 45%, 35%)' },
                        { bg: 'hsl(55, 90%, 86%)', text: 'hsl(55, 60%, 28%)' },
                      ]
                      const color = colors[idx % colors.length]
                      const hasLink = turma.link && turma.link.trim() !== ''
                      return (
                        <div
                          key={turma.id}
                          style={{
                            backgroundColor: color.bg,
                            borderRadius: '16px',
                            padding: '1.5rem',
                            cursor: hasLink ? 'pointer' : 'default',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            opacity: hasLink ? 1 : 0.7
                          }}
                          onClick={() => hasLink && window.open(turma.link, '_blank', 'noopener')}
                          onMouseOver={e => { if (hasLink) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)' } }}
                          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                          title={hasLink ? `Abrir ${turma.nome}` : 'Link não configurado'}
                        >
                          <div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color.text, fontFamily: 'Outfit, sans-serif' }}>{turma.nome}</div>
                            <div style={{ fontSize: '0.8rem', color: color.text, opacity: 0.75, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span>{hasLink ? '🔗' : '👥'}</span>
                              <span>{hasLink ? 'Clique para abrir' : 'Sem link'}</span>
                            </div>
                          </div>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.text, fontSize: '1.1rem' }}>
                            {hasLink ? '›' : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}



            {view === 'historico-ocorrencias' && userRole === 'gestao' && (
              <HistoricoOcorrencias
                setView={setView}
                ocorrencias={ocorrencias}
                professores={professores}
                turmas={turmas}
                deleteOcorrencia={handleDeleteOcorrencia}
                updateOcorrencia={handleUpdateOcorrencia}
                userRole={userRole}
              />
            )}

            {view === 'envio-questoes' && (
              <EnvioQuestoes
                setView={setView}
                professores={professores}
                turmas={turmas}
                questoes={questoes}
                addQuestao={handleAddQuestao}
                deleteQuestao={handleDeleteQuestao}
              />
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
                gestores={gestores}
                addProfessor={(n) => handleAddSetting('professores', n, setProfessores)}
                removeProfessor={(n) => handleDeleteSetting('professores', n, setProfessores)}
                importProfessores={handleImportProfessores}
                addGestor={(n) => handleAddSetting('gestores', n, setGestores)}
                removeGestor={(n) => handleDeleteSetting('gestores', n, setGestores)}

                turmas={turmas}
                addTurma={handleAddTurma}
                removeTurma={handleRemoveTurma}
                updateTurmaLink={handleUpdateTurmaLink}

                alunos={alunos}
                importAlunosTurma={handleImportAlunosTurma}
                clearAlunosTurma={handleClearAlunosTurma}
              />
            )}
          </>
        )}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio - Sistema de Avaliação Docente. Todos os direitos reservados.
      </footer>

      {showOcorrenciaModal && (
        <Ocorrencias
          onClose={() => setShowOcorrenciaModal(false)}
          professores={professores}
          turmas={turmas}
          alunos={alunos}
          addOcorrencia={handleAddOcorrencia}
        />
      )}

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
