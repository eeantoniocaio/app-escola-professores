import React, { useState, useEffect, useRef } from 'react'

export default function Registros({ setView, records, events, tiposEvidencia, addRecord, updateRecord, deleteRecord }) {
  const [filterTeacher, setFilterTeacher] = useState('todos')
  const [filterDate, setFilterDate] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [title, setTitle] = useState('')
  const [teacher, setTeacher] = useState('')
  const [eventId, setEventId] = useState('')
  const [date, setDate] = useState('')
  const [tipo, setTipo] = useState(tiposEvidencia[0] || '')
  const [description, setDescription] = useState('')
  const [mockFileName, setMockFileName] = useState('')
  const [mockFileSize, setMockFileSize] = useState('')
  const [status, setStatus] = useState('pendente')
  const [feedback, setFeedback] = useState('')

  const [evaluatorFeedback, setEvaluatorFeedback] = useState('')
  const [evaluatorStatus, setEvaluatorStatus] = useState('pendente')

  const formFirstInputRef = useRef(null)

  useEffect(() => {
    if (isFormModalOpen && formFirstInputRef.current) {
      const timer = setTimeout(() => formFirstInputRef.current.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isFormModalOpen])

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

  useEffect(() => {
    if (isFormModalOpen || isDetailModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isFormModalOpen, isDetailModalOpen])

  const openAddModal = () => {
    setTitle('')
    setTeacher('')
    setEventId(events[0]?.id || '')
    setDate(new Date().toISOString().split('T')[0])
    setTipo(tiposEvidencia[0] || '')
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
      setMockFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || !teacher || !eventId || !date) return
    addRecord({
      title, teacher, eventId: Number(eventId), date, tipo,
      description,
      fileName: mockFileName || 'documento.pdf',
      fileSize: mockFileSize || '1.0 MB',
      status, feedback
    })
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
    updateRecord({ ...selectedRecord, status: evaluatorStatus, feedback: evaluatorFeedback })
    setIsDetailModalOpen(false)
  }

  // Unique teachers list
  const uniqueTeachers = [...new Set(records.map(r => r.teacher))].sort()

  // Filter logic
  const filteredRecords = records.filter(rec => {
    const matchTeacher = filterTeacher === 'todos' || rec.teacher === filterTeacher
    const matchDate = !filterDate || rec.date === filterDate
    const matchTipo = filterTipo === 'todos' || rec.tipo === filterTipo
    return matchTeacher && matchDate && matchTipo
  })

  const total = records.length
  const aprovados = records.filter(r => r.status === 'aprovado').length
  const pendentes = records.filter(r => r.status === 'pendente').length
  const revisao = records.filter(r => r.status === 'revisao').length
  const getPercent = (count) => total === 0 ? 0 : Math.round((count / total) * 100)

  const getStatusLabel = (s) => {
    if (s === 'aprovado') return 'Aprovado'
    if (s === 'revisao') return 'Revisão Solicitada'
    return 'Pendente de Avaliação'
  }

  const hasActiveFilters = filterTeacher !== 'todos' || filterDate !== '' || filterTipo !== 'todos'

  const clearFilters = () => {
    setFilterTeacher('todos')
    setFilterDate('')
    setFilterTipo('todos')
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home" onClick={() => setView('home')} title="Voltar ao início">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>Registros de Evidência</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''} encontrado{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
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
          ⚠️ <strong>Atenção:</strong> Cadastre pelo menos um <strong>Evento</strong> antes de criar registros.
        </div>
      )}

      <div className="records-layout">
        {/* Sidebar */}
        <div className="records-sidebar">
          {/* Analytics */}
          <div className="sidebar-analytics">
            <h3>Visão Geral</h3>
            <div className="analytics-list">
              {[
                { label: 'Aprovados', count: aprovados, cls: 'status-aprovado', color: 'var(--pastel-green-dark)' },
                { label: 'Pendentes', count: pendentes, cls: 'status-pendente', color: 'var(--pastel-yellow-dark)' },
                { label: 'Sob Revisão', count: revisao, cls: 'status-revisao', color: 'var(--pastel-pink-dark)' },
              ].map(item => (
                <div key={item.label}>
                  <div className="analytics-item">
                    <span>{item.label} ({item.count})</span>
                    <span className={`analytics-badge ${item.cls}`}>{getPercent(item.count)}%</span>
                  </div>
                  <div className="analytics-bar-bg">
                    <div className="analytics-bar-fill" style={{ width: `${getPercent(item.count)}%`, backgroundColor: item.color }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              ℹ️ Evidências são avaliadas pela coordenação para compor a pontuação anual de progressão docente.
            </div>
          </div>

          {/* Filters Panel */}
          <div className="sidebar-analytics">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{ fontSize: '0.75rem', color: 'var(--pastel-blue-dark)', background: 'var(--pastel-blue)', border: 'none', borderRadius: '6px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Limpar
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Professor filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  👤 Professor(a)
                </label>
                <select
                  className="select-filter"
                  style={{ width: '100%' }}
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                >
                  <option value="todos">Todos os professores</option>
                  {uniqueTeachers.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Date filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  📅 Data
                </label>
                <input
                  type="date"
                  className="select-filter"
                  style={{ width: '100%', paddingRight: '0.75rem' }}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              {/* Tipo filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  🏷️ Tipo
                </label>
                <select
                  className="select-filter"
                  style={{ width: '100%' }}
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="todos">Todos os tipos</option>
                  {tiposEvidencia.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div style={{ marginTop: '1rem', padding: '0.65rem', background: 'var(--pastel-blue)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--pastel-blue-dark)', fontWeight: 600 }}>
                🔍 Mostrando {filteredRecords.length} de {total} registros
              </div>
            )}
          </div>
        </div>

        {/* Records List */}
        <div className="records-list-wrapper">
          {filteredRecords.length === 0 ? (
            <div className="no-records">
              <div className="no-records-icon">📁</div>
              <h3>Nenhum registro encontrado</h3>
              <p>Nenhuma evidência corresponde aos filtros selecionados.</p>
              {hasActiveFilters && (
                <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={clearFilters}>
                  Limpar filtros
                </button>
              )}
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
                        {rec.tipo && (
                          <span style={{ display: 'inline-block', fontSize: '0.72rem', color: 'var(--pastel-purple-dark)', background: 'var(--pastel-purple)', padding: '0.15rem 0.5rem', borderRadius: '4px', marginBottom: '0.4rem', fontWeight: 600 }}>
                            🏷️ {rec.tipo}
                          </span>
                        )}
                        {associatedEvent && (
                          <span className="record-associated-event" style={{ display: 'block' }}>
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
                      <button className="btn-icon delete" style={{ marginLeft: '0.5rem' }} onClick={() => deleteRecord(rec.id)} title="Excluir">
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

      {/* Add Record Modal */}
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
                  <input ref={formFirstInputRef} type="text" className="form-control" placeholder="Ex: Portfólio de atividades práticas do 1º Bimestre" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Professor(a) *</label>
                    <input type="text" className="form-control" placeholder="Ex: Profa. Juliana Lima" value={teacher} onChange={(e) => setTeacher(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Data da Evidência *</label>
                    <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tipo *</label>
                  <select className="form-control" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                    {tiposEvidencia.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Associar ao Evento Pedagógico *</label>
                  <select className="form-control" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.evento} ({ev.quemSolicitou})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Descrição e Contexto</label>
                  <textarea className="form-control" placeholder="Explique o que esta evidência comprova..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Anexar Documento</label>
                  <label className={`upload-dropzone ${mockFileName ? 'has-file' : ''}`}>
                    <input type="file" style={{ display: 'none' }} onChange={handleFileChangeMock} />
                    <span className="upload-icon">{mockFileName ? '📄' : '☁️'}</span>
                    <span className="upload-text">
                      {mockFileName ? `Selecionado: ${mockFileName} (${mockFileSize})` : 'Clique para selecionar PDF, JPG ou PNG'}
                    </span>
                    {!mockFileName && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Máx: 20MB</span>}
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsFormModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Registrar Evidência</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Evaluation Modal */}
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
                  <div className="detail-main">
                    <div>
                      {selectedRecord.tipo && (
                        <span style={{ display: 'inline-block', fontSize: '0.75rem', color: 'var(--pastel-purple-dark)', background: 'var(--pastel-purple)', padding: '0.2rem 0.65rem', borderRadius: '4px', marginBottom: '0.4rem', fontWeight: 600 }}>
                          🏷️ {selectedRecord.tipo}
                        </span>
                      )}
                      <span className="record-associated-event" style={{ display: 'block', fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                        🔗 Evento: {events.find(e => e.id === selectedRecord.eventId)?.evento || 'Não identificado'}
                      </span>
                      <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem', lineHeight: '1.25' }}>
                        {selectedRecord.title}
                      </h2>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                      <strong>Descrição:</strong>
                      <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {selectedRecord.description || 'Sem detalhes descritos.'}
                      </p>
                    </div>

                    <div className="detail-attachment-preview">
                      <div className="attachment-thumbnail-placeholder">📁</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedRecord.fileName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedRecord.fileSize}</div>
                      <button type="button" className="btn btn-secondary" style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => alert('Simulação: Download concluído!')}>
                        📥 Download
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="detail-meta-card">
                      <div className="detail-meta-row"><span>Professor</span><span>{selectedRecord.teacher}</span></div>
                      <div className="detail-meta-row"><span>Data</span><span>{new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>
                      <div className="detail-meta-row" style={{ border: 'none', padding: '0' }}>
                        <span>Status</span>
                        <span className={`record-status-badge status-${selectedRecord.status}`} style={{ margin: 0 }}>
                          {getStatusLabel(selectedRecord.status)}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: '0.95rem', fontFamily: 'Outfit', color: 'var(--text-main)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Avaliação Pedagógica
                      </h4>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>Definir Status</label>
                        <select className="form-control" value={evaluatorStatus} onChange={(e) => setEvaluatorStatus(e.target.value)}>
                          <option value="pendente">Pendente de Avaliação</option>
                          <option value="aprovado">Aprovado (Válido)</option>
                          <option value="revisao">Solicitar Revisão</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Parecer do Avaliador</label>
                        <textarea className="form-control" rows="4" placeholder="Digite o feedback detalhado..." value={evaluatorFeedback} onChange={(e) => setEvaluatorFeedback(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ flexShrink: 0, padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-light)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Voltar</button>
                <button type="submit" className="btn btn-primary">Registrar Avaliação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
