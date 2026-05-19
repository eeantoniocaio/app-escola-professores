import React, { useState, useEffect, useRef } from 'react'

export default function Registros({ setView, records, events, tiposEvidencia, professores = [], addRecord, updateRecord, deleteRecord }) {
  const [filterTeacher, setFilterTeacher] = useState('todos')
  const [filterDate, setFilterDate] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

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
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isFormModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isFormModalOpen])

  const openAddModal = () => {
    setEditingId(null)
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

  const openEditModal = (rec) => {
    setEditingId(rec.id)
    setTitle(rec.title || '')
    setTeacher(rec.teacher || '')
    setEventId(rec.eventId || '')
    setDate(rec.date || '')
    setTipo(rec.tipo || tiposEvidencia[0] || '')
    setDescription(rec.description || '')
    setMockFileName(rec.fileName || '')
    setMockFileSize(rec.fileSize || '')
    setStatus(rec.status || 'pendente')
    setFeedback(rec.feedback || '')
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
    if (!teacher || !date) return
    const recordData = {
      title: tipo, teacher, eventId: null, date, tipo,
      description,
      fileName: mockFileName || 'documento.pdf',
      fileSize: mockFileSize || '1.0 MB',
      status, feedback
    }

    if (editingId) {
      updateRecord({ ...recordData, id: editingId })
    } else {
      addRecord(recordData)
    }
    setIsFormModalOpen(false)
  }





  // Filter logic
  const filteredRecords = records.filter(rec => {
    const matchTeacher = filterTeacher === 'todos' || rec.teacher === filterTeacher
    const matchDate = !filterDate || rec.date === filterDate
    const matchTipo = filterTipo === 'todos' || rec.tipo === filterTipo
    return matchTeacher && matchDate && matchTipo
  })

  const safeFormatDate = (dateStr) => {
    if (!dateStr) return 'Sem data'
    try {
      const d = new Date(dateStr + 'T00:00:00')
      if (isNaN(d.getTime())) return 'Data Inválida'
      return d.toLocaleDateString('pt-BR')
    } catch(e) {
      return 'Data Inválida'
    }
  }

  const total = records.length

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
      </div>



      {/* Controls Panel (Filters & Add Button) */}
      <div className="controls-panel" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, alignItems: 'flex-end' }}>
          {/* Professor filter */}
          <div style={{ flex: '1 1 200px' }}>
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
              {professores.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div style={{ flex: '1 1 150px' }}>
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
          <div style={{ flex: '1 1 200px' }}>
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

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1rem', height: 'fit-content' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={openAddModal} style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Novo Registro
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div style={{ marginBottom: '1.5rem', padding: '0.65rem', background: 'var(--pastel-blue)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--pastel-blue-dark)', fontWeight: 600, display: 'inline-block' }}>
          🔍 Mostrando {filteredRecords.length} de {total} registros
        </div>
      )}

      {/* Records List */}
      <div>
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
                          <span>{safeFormatDate(rec.date)}</span>
                        </div>
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

                      <button className="btn-icon" onClick={() => openEditModal(rec)} title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.995.995 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
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

      {/* Add Record Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3>{editingId ? 'Editar Registro de Evidência' : 'Novo Registro de Evidência'}</h3>
              <button className="btn-icon" onClick={() => setIsFormModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>



                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Professor(a) *</label>
                    <select ref={formFirstInputRef} className="form-control" value={teacher} onChange={(e) => setTeacher(e.target.value)} required>
                      <option value="">Selecione um professor</option>
                      {professores.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Salvar Alterações' : 'Registrar Evidência'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}
