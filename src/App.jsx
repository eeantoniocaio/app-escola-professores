import React, { useState, useEffect } from 'react'
import Home from './components/Home'
import Eventos from './components/Eventos'
import Registros from './components/Registros'
import EventModal from './components/EventModal'

// Default high-fidelity mock data to match the new Events schema
const initialEvents = [
  {
    id: 1,
    dataSolicitacao: "2026-05-10",
    evento: "Entrega do Plano de Trabalho Docente (PTD)",
    tipo: "formulário",
    quemSolicitou: "Direção Escolar",
    dataEntrega: "2026-05-18"
  },
  {
    id: 2,
    dataSolicitacao: "2026-05-12",
    evento: "Envio de Notas do 1º Bimestre",
    tipo: "email",
    quemSolicitou: "Coordenação Pedagógica",
    dataEntrega: "2026-05-20"
  },
  {
    id: 3,
    dataSolicitacao: "",
    evento: "Diário de Classe Físico Assinado",
    tipo: "físico",
    quemSolicitou: "Secretaria Escolar",
    dataEntrega: "2026-05-25"
  }
]

const initialRecords = [
  {
    id: 1,
    title: "Plano de Aula Experimental & Relatório de Atividade",
    teacher: "Prof. Carlos Silva",
    eventId: 1,
    date: "2026-05-13",
    description: "Documento contendo o roteiro da prática de laboratório, objetivos pedagógicos, materiais utilizados e fotos das anotações dos grupos de estudantes durante o experimento de ciências.",
    fileName: "relatorio_aula_ciencias.pdf",
    fileSize: "2.4 MB",
    status: "aprovado",
    feedback: "Excelente plano de aula. A atividade prática de extração de DNA do morango foi muito engajadora e os relatórios anexados comprovam a eficácia e absorção do conteúdo pelos alunos."
  },
  {
    id: 2,
    title: "Ata da Reunião de Acompanhamento das Turmas",
    teacher: "Profa. Regina Mendes",
    eventId: 2,
    date: "2026-05-16",
    description: "Ata de deliberações do conselho de classe, listando as dificuldades mapeadas por disciplina, os alunos elegíveis para o plano de reforço e as metodologias de engajamento acordadas.",
    fileName: "ata_conselho_1EM.pdf",
    fileSize: "1.2 MB",
    status: "pendente",
    feedback: ""
  },
  {
    id: 3,
    title: "Cronograma de Projetos e Protótipos da Feira",
    teacher: "Prof. Marcos Aurelio",
    eventId: 3,
    date: "2026-05-17",
    description: "Planilha de distribuição de orientadores e cronograma de entregas semanais dos protótipos para a Feira de Inovação Científica.",
    fileName: "cronograma_feira_inovacao.xlsx",
    fileSize: "850 KB",
    status: "revisao",
    feedback: "O cronograma precisa de ajustes simples. Favor incluir os horários das bancas examinadoras externas e detalhar a distribuição física dos estandes na quadra."
  }
]

export default function App() {
  // Navigation State: 'home', 'eventos', 'registros'
  const [view, setView] = useState('home')
  
  // States to control the global Event modal (creation/editing)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  
  // Data States
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('escola_events')
    return saved ? JSON.parse(saved) : initialEvents
  })
  
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('escola_records')
    return saved ? JSON.parse(saved) : initialRecords
  })

  // Toast Notification State
  const [toast, setToast] = useState(null)

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('escola_events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('escola_records', JSON.stringify(records))
  }, [records])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Modal open/close handlers
  const handleOpenEventModal = (event = null) => {
    setEventToEdit(event)
    setIsEventModalOpen(true)
  }

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
    setEventToEdit(null)
  }

  // Events CRUD handlers
  const handleAddEvent = (newEvent) => {
    const created = {
      ...newEvent,
      id: Date.now()
    }
    setEvents(prev => [created, ...prev])
    showToast('Evento pedagógico registrado com sucesso!')
  }

  const handleUpdateEvent = (updatedEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
    showToast('Evento pedagógico atualizado com sucesso!')
  }

  const handleDeleteEvent = (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este evento? Todos os registros de evidências associados a ele continuarão no sistema.')) {
      setEvents(prev => prev.filter(e => e.id !== id))
      showToast('Evento pedagógico excluído com sucesso.', 'info')
    }
  }

  const toggleEventFinalizado = (id) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const nextState = !e.finalizado
        showToast(nextState ? 'Evento finalizado com sucesso!' : 'Evento reaberto com sucesso!', nextState ? 'success' : 'info')
        return { ...e, finalizado: nextState }
      }
      return e
    }))
  }

  // Records CRUD handlers
  const handleAddRecord = (newRecord) => {
    const created = {
      ...newRecord,
      id: Date.now()
    }
    setRecords(prev => [created, ...prev])
    showToast('Evidência docente submetida com sucesso!')
  }

  const handleUpdateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r))
    showToast('Avaliação pedagógica salva com sucesso!')
  }

  const handleDeleteRecord = (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este registro de evidência?')) {
      setRecords(prev => prev.filter(r => r.id !== id))
      showToast('Registro de evidência excluído com sucesso.', 'info')
    }
  }

  // Statistics
  const pendingRecordsCount = records.filter(r => r.status === 'pendente').length

  return (
    <div className="app-container">
      {/* Central Header navigation */}
      <header className="header">
        <div className="header-brand" onClick={() => setView('home')}>
          <div className="logo-icon">👩‍🏫</div>
          <div className="brand-title">
            <h1>Portal de Evidências</h1>
            <p>E.E. Antônio Caio — Coordenação Pedagógica</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`btn ${view === 'home' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('home')}
          >
            Início
          </button>
          <button 
            className={`btn ${view === 'eventos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('eventos')}
          >
            Eventos
          </button>
          <button 
            className={`btn ${view === 'registros' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('registros')}
          >
            Registros
          </button>
        </div>
      </header>

      {/* Main workspace container */}
      <main className="main-content">
        {view === 'home' && (
          <Home 
            setView={setView} 
            openEventModal={handleOpenEventModal}
          />
        )}
        
        {view === 'eventos' && (
          <Eventos
            setView={setView}
            events={events}
            records={records}
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
            addRecord={handleAddRecord}
            updateRecord={handleUpdateRecord}
            deleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* Footer information */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 'auto' }}>
        © {new Date().getFullYear()} E.E. Antônio Caio - Sistema de Avaliação Docente. Todos os direitos reservados.
      </footer>

      {/* Global Event Form Pop-up Modal */}
      {isEventModalOpen && (
        <EventModal 
          isOpen={isEventModalOpen}
          eventToEdit={eventToEdit}
          onClose={handleCloseEventModal}
          onSave={(eventData) => {
            if (eventToEdit) {
              handleUpdateEvent({ ...eventData, id: eventToEdit.id })
            } else {
              handleAddEvent(eventData)
            }
            handleCloseEventModal()
          }}
        />
      )}

      {/* Action Toasts */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'info' ? 'ℹ️' : '✨'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
