import React, { useState, useEffect, useRef } from 'react'

export default function Registros({ setView, records, events, addRecord, updateRecord, deleteRecord }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterEventId, setFilterEventId] = useState('todos')
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [teacher, setTeacher] = useState('')
  const [eventId, setEventId] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [mockFileName, setMockFileName] = useState('')
  const [mockFileSize, setMockFileSize] = useState('')
  const [status, setStatus] = useState('pendente')
  const [feedback, setFeedback] = useState('')

  // Evaluator fast review state
  const [evaluatorFeedback, setEvaluatorFeedback] = useState('')
  const [evaluatorStatus, setEvaluatorStatus] = useState('pendente')

  const formFirstInputRef = useRef(null)

  // Autofocus the first input when the form modal opens
  useEffect(() => {
    if (isFormModalOpen && formFirstInputRef.current) {
      const timer = setTimeout(() => {
        formFirstInputRef.current.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isFormModalOpen])

  // Escape key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFormModalOpen(false)
        setIsDetailModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (isFormModalOpen || isDetailModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isFormModalOpen, isDetailModalOpen])

  const openAddModal = () => {
    setTitle('')
    setTeacher('')
    setEventId(events[0]?.id || '')
    setDate(new Date().toISOString().split('T')[0])
    setDescription('')
    setMockFileName('')
    setMockFileSize('')
    setStatus('pendente')
    setFeedback('')
    setIsFormModalOpen(true)
  }

  const handleFileChangeMock = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMockFileName(file.name)
      // Format file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setMockFileSize(`${sizeMB} MB`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || !teacher || !eventId || !date) return

    const recordData = {
      title,
      teacher,
      eventId: Number(eventId),
      date,
      description,
      fileName: mockFileName || 'planejamento_anual.pdf',
      fileSize: mockFileSize || '1.4 MB',
      status,
      feedback
    }

    addRecord(recordData)
    setIsFormModalOpen(false)
  }

  const openDetailModal = (record) => {
    setSelectedRecord(record)
    setEvaluatorStatus(record.status)
    setEvaluatorFeedback(record.feedback || '')
    setIsDetailModalOpen(true)
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!selectedRecord) return

    const updated = {
      ...selectedRecord,
      status: evaluatorStatus,
      feedback: evaluatorFeedback
    }

    updateRecord(updated)
    setIsDetailModalOpen(false)
  }

  // Filter logic
  const filteredRecords = records.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(search.toLowerCase()) ||
                          rec.teacher.toLowerCase().includes(search.toLowerCase()) ||
                          rec.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || rec.status === filterStatus
    const matchesEvent = filterEventId === 'todos' || rec.eventId === Number(filterEventId)
    return matchesSearch && matchesStatus && matchesEvent
  })

  // Statistics calculations
  const total = records.length
  const aprovados = records.filter(r => r.status === 'aprovado').length
  const pendentes = records.filter(r => r.status === 'pendente').length
  const revisao = records.filter(r => r.status === 'revisao').length

  const getPercent = (count) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'aprovado': return 'Aprovado'
      case 'revisao': return 'Revisão Solicitada'
      default: return 'Pendente de Avaliação'
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* View Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home" onClick={() => setView('home')} title="Voltar ao início">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h2>Registros de Evidência</h2>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} disabled={events.length === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Novo Registro
        </button>
      </div>

      {events.length === 0 && (
        <div className="toast toast-success" style={{ background: 'var(--pastel-orange-dark)', position: 'relative', right: '0', bottom: '0', margin: '0 0 2rem 0', width: '100%' }}>
          ⚠️ <strong>Atenção:</strong> Você precisa cadastrar pelo menos um <strong>Evento</strong> antes de poder criar novos Registros de Evidência.
        </div>
      )}

      {/* Main Grid View Layout with Sidebar Analytics */}
      <div className="records-layout">
        {/* Sidebar Statistics & Quick Summary */}
        <div className="records-sidebar">
          <div className="sidebar-analytics">
            <h3>Visão Geral</h3>
            
            <div className="analytics-list">
              <div>
                <div className="analytics-item">
                  <span>Aprovados ({aprovados})</span>
                  <span className="analytics-badge status-aprovado">{getPercent(aprovados)}%</span>
                </div>
                <div className="analytics-bar-bg">
                  <div className="analytics-bar-fill status-aprovado" style={{ width: `${getPercent(aprovados)}%`, backgroundColor: 'var(--pastel-green-dark)' }}></div>
                </div>
              </div>

              <div>
                <div className="analytics-item">
                  <span>Pendentes ({pendentes})</span>
                  <span className="analytics-badge status-pendente">{getPercent(pendentes)}%</span>
                </div>
                <div className="analytics-bar-bg">
                  <div className="analytics-bar-fill status-pendente" style={{ width: `${getPercent(pendentes)}%`, backgroundColor: 'var(--pastel-yellow-dark)' }}></div>
                </div>
              </div>

              <div>
                <div className="analytics-item">
                  <span>Sob Revisão ({revisao})</span>
                  <span className="analytics-badge status-revisao">{getPercent(revisao)}%</span>
                </div>
                <div className="analytics-bar-bg">
                  <div className="analytics-bar-fill status-revisao" style={{ width: `${getPercent(revisao)}%`, backgroundColor: 'var(--pastel-pink-dark)' }}></div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              ℹ️ Evidências são avaliadas pela coordenação para compor a pontuação anual de progressão docente.
            </div>
          </div>
        </div>

        {/* Records Listing & Filtering */}
        <div className="records-list-wrapper">
          {/* Controls */}
          <div className="controls-panel" style={{ margin: '0' }}>
            <div className="filters-group">
              <div className="search-input-wrapper">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Buscar evidência ou professor..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>

              <select 
                className="select-filter" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="aprovado">Aprovados</option>
                <option value="pendente">Pendentes</option>
                <option value="revisao">Revisão Solicitada</option>
              </select>

              <select 
                className="select-filter" 
                value={filterEventId} 
                onChange={(e) => setFilterEventId(e.target.value)}
              >
                <option value="todos">Todos os Eventos</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.evento}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid list of Evidence */}
          {filteredRecords.length === 0 ? (
            <div className="no-records">
              <div className="no-records-icon">📁</div>
              <h3>Nenhum registro encontrado</h3>
              <p>Nenhuma evidência docente cadastrada corresponde aos filtros de pesquisa selecionados.</p>
            </div>
          ) : (
            <div className="records-grid">
              {filteredRecords.map(rec => {
                const associatedEvent = events.find(e => e.id === rec.eventId)
                return (
                  <div key={rec.id} className="record-card">
                    <div>
                      <div className="record-header">
                        <div className="record-meta">
                          <span className="record-teacher">{rec.teacher}</span>
                          <span>{new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span className={`record-status-badge status-${rec.status}`}>
                          {getStatusLabel(rec.status)}
                        </span>
                      </div>
                      
                      <div className="record-body">
                        {associatedEvent && (
                          <span className="record-associated-event">
                            🔗 {associatedEvent.evento}
                          </span>
                        )}
                        <h3 className="record-title">{rec.title}</h3>
                        <p className="record-desc">{rec.description || 'Sem detalhes descritos para esta evidência.'}</p>
                        
                        {rec.fileName && (
                          <span className="record-attachment-indicator">
                            📎 {rec.fileName} ({rec.fileSize})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="record-footer">
                      <button className="btn btn-secondary" style={{ padding: '0.45rem 1rem', width: '100%', fontSize: '0.85rem' }} onClick={() => openDetailModal(rec)}>
                        Avaliar Evidência
                      </button>
                      <button className="btn-icon delete" style={{ marginLeft: '0.5rem' }} onClick={() => deleteRecord(rec.id)} title="Excluir Registro">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add New Record Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3>Novo Registro de Evidência</h3>
              <button className="btn-icon" onClick={() => setIsFormModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Título da Evidência *</label>
                  <input 
                    ref={formFirstInputRef}
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Portfólio de atividades práticas do 1º Bimestre" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', margin: 0 }}>
                  <div>
                    <label>Professor Titular *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Profa. Juliana Lima" 
                      value={teacher} 
                      onChange={(e) => setTeacher(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label>Data da Evidência *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Associar ao Evento Pedagógico *</label>
                  <select 
                    className="form-control" 
                    value={eventId} 
                    onChange={(e) => setEventId(e.target.value)}
                    required
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.evento} ({ev.quemSolicitou})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Descrição e Contexto da Evidência</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Explique o que esta evidência comprova, como foi realizada a atividade, objetivos pedagógicos..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                </div>

                {/* Simulated File Upload Dropzone */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Anexar Documento de Comprovação</label>
                  <label className={`upload-dropzone ${mockFileName ? 'has-file' : ''}`}>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChangeMock} 
                    />
                    <span className="upload-icon">
                      {mockFileName ? '📄' : '☁️'}
                    </span>
                    <span className="upload-text">
                      {mockFileName ? `Arquivo selecionado: ${mockFileName} (${mockFileSize})` : 'Clique aqui para selecionar ou arraste o arquivo PDF, JPG, PNG'}
                    </span>
                    {!mockFileName && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Máx: 20MB</span>}
                  </label>
                </div>
              </div>
              
              <div className="modal-footer" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-light)', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsFormModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Registrar Evidência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal & Evaluation Screen */}
      {isDetailModalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '750px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3>Ficha Técnica da Evidência</h3>
              <button className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '1.5rem' }}>
                <div className="record-detail-grid">
                  {/* Left Side: Record Info */}
                  <div className="detail-main">
                    <div>
                      <span className="record-associated-event" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                        🔗 Evento: {events.find(e => e.id === selectedRecord.eventId)?.evento || 'Evento não identificado'}
                      </span>
                      <h2 style={{ fontSize: '1.6rem', marginTop: '0.5rem', marginBottom: '0.75rem', lineHeight: '1.25' }}>
                        {selectedRecord.title}
                      </h2>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                      <strong>Descrição e Contexto:</strong>
                      <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                        {selectedRecord.description || 'Sem detalhes descritos para esta evidência.'}
                      </p>
                    </div>

                    <div className="detail-attachment-preview">
                      <div className="attachment-thumbnail-placeholder">
                        📁
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedRecord.fileName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedRecord.fileSize}</div>
                      <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => alert('Simulação: Download concluído com sucesso!')}>
                        📥 Download do Arquivo
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Metadata & Posterior Evaluation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="detail-meta-card">
                      <div className="detail-meta-row">
                        <span>Professor</span>
                        <span>{selectedRecord.teacher}</span>
                      </div>
                      <div className="detail-meta-row">
                        <span>Cadastrado em</span>
                        <span>{new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="detail-meta-row" style={{ border: 'none', padding: '0' }}>
                        <span>Status Atual</span>
                        <span className={`record-status-badge status-${selectedRecord.status}`} style={{ margin: '0' }}>
                          {getStatusLabel(selectedRecord.status)}
                        </span>
                      </div>
                    </div>

                    {/* Coordinator Evaluation Panel (Crucial for User's Goal of Evaluators) */}
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: '0.95rem', fontFamily: 'Outfit', color: 'var(--text-main)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Avaliação Pedagógica
                      </h4>
                      
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>Definir Status</label>
                        <select 
                          className="form-control" 
                          value={evaluatorStatus} 
                          onChange={(e) => setEvaluatorStatus(e.target.value)}
                        >
                          <option value="pendente">Pendente de Avaliação</option>
                          <option value="aprovado">Aprovado (Válido)</option>
                          <option value="revisao">Solicitar Revisão/Ajustes</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: '0' }}>
                        <label style={{ fontSize: '0.75rem' }}>Parecer do Avaliador</label>
                        <textarea 
                          className="form-control" 
                          rows="4"
                          placeholder="Digite o feedback detalhado, pontos fortes observados ou ajustes necessários..."
                          value={evaluatorFeedback}
                          onChange={(e) => setEvaluatorFeedback(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-light)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                  Voltar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
