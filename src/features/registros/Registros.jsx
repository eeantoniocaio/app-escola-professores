import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegistros } from './hooks/useRegistros'
import { useEventos } from '../eventos/hooks/useEventos'
import { useGlobalData } from '../../app/providers/GlobalDataProvider'
import { useAuth } from '../../app/providers/AuthProvider'
import { PlusCircle, Calendar, Pencil, Trash2, ArrowLeft, User, Shield, Tag, Search, FolderOpen, Paperclip, Briefcase, UploadCloud, FileText, X, Link as LinkIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react'

export default function Registros() {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord } = useRegistros();
  const { events } = useEventos();
  const { gestores, professores, tiposEvidencia } = useGlobalData();
  const [filterTeacher, setFilterTeacher] = useState('todos')
  const [filterGestor, setFilterGestor] = useState('todos')
  const [filterDate, setFilterDate] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [title, setTitle] = useState('')
  const [teacher, setTeacher] = useState('')
  const [eventId, setEventId] = useState('')
  const [date, setDate] = useState('')
  const [tipo, setTipo] = useState(tiposEvidencia[0] || '')
  const [gestor, setGestor] = useState('')
  const [description, setDescription] = useState('')
  const [mockFileName, setMockFileName] = useState('')
  const [mockFileSize, setMockFileSize] = useState('')
  const [status, setStatus] = useState('pendente')
  const [feedback, setFeedback] = useState('')

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})

  const formFirstInputRef = useRef(null)

  useEffect(() => {
    if (isFormModalOpen && formFirstInputRef.current && currentStep === 1) {
      const timer = setTimeout(() => formFirstInputRef.current.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isFormModalOpen, currentStep])

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
    setGestor(userName || '')
    setDescription('')
    setMockFileName('')
    setMockFileSize('')
    setStatus('pendente')
    setFeedback('')
    setCurrentStep(1)
    setErrors({})
    setIsFormModalOpen(true)
  }

  const openEditModal = (rec) => {
    setEditingId(rec.id)
    setTitle(rec.title || '')
    setTeacher(rec.teacher || '')
    setEventId(rec.eventId || '')
    setDate(rec.date || '')
    setTipo(rec.tipo || tiposEvidencia[0] || '')
    setGestor(rec.gestor || '')
    setDescription(rec.description || '')
    setMockFileName(rec.fileName || '')
    setMockFileSize(rec.fileSize || '')
    setStatus(rec.status || 'pendente')
    setFeedback(rec.feedback || '')
    setCurrentStep(1)
    setErrors({})
    setIsFormModalOpen(true)
  }

  const handleFileChangeMock = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMockFileName(file.name)
      setMockFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`)
    }
  }

  const validateStep = (step) => {
    const e = {}
    if (step === 1) {
      if (!teacher) e.teacher = 'Campo obrigatório'
      if (!date) e.date = 'Campo obrigatório'
      if (!tipo) e.tipo = 'Campo obrigatório'
      if (!gestor) e.gestor = 'Campo obrigatório'
    }
    return e
  }

  const handleNextStep = () => {
    const errs = validateStep(currentStep)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1)
    setErrors({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validateStep(currentStep)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    const recordData = {
      title: tipo, teacher, eventId: null, date, tipo,
      gestor: gestor || userName || '',
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
    const matchGestor = filterGestor === 'todos' || rec.gestor === filterGestor
    const matchDate = !filterDate || rec.date === filterDate
    const matchTipo = filterTipo === 'todos' || rec.tipo === filterTipo
    return matchTeacher && matchGestor && matchDate && matchTipo
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
  const hasActiveFilters = filterTeacher !== 'todos' || filterGestor !== 'todos' || filterDate !== '' || filterTipo !== 'todos'

  const clearFilters = () => {
    setFilterTeacher('todos')
    setFilterGestor('todos')
    setFilterDate('')
    setFilterTipo('todos')
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} title="Voltar ao início" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Registros de Evidência</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
              {filteredRecords.length} registro{filteredRecords.length !== 1 ? 's' : ''} encontrado{filteredRecords.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Panel (Filters & Add Button) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-6 bg-white border border-gray-200 rounded-[12px] shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-4 flex-1">
          {/* Professor filter */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              <User size={14} /> Professor(a)
            </label>
            <select
              className="select-filter"
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
            >
              <option value="todos">Todos os professores</option>
              {professores.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Gestor filter */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              <Shield size={14} /> Gestor(a)
            </label>
            <select
              className="select-filter"
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              value={filterGestor}
              onChange={(e) => setFilterGestor(e.target.value)}
            >
              <option value="todos">Todos os gestores</option>
              {gestores.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              <Calendar size={14} /> Data
            </label>
            <input
              type="date"
              className="select-filter"
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {/* Tipo filter */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              <Tag size={14} /> Tipo
            </label>
            <select
              className="select-filter"
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
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
              className="btn btn-secondary w-full sm:w-auto"
              style={{ padding: '0.6rem 1rem', height: 'fit-content' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex justify-end">
          <button className="btn btn-primary w-full md:w-auto" onClick={openAddModal} style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}>
            <PlusCircle size={18} /> Novo Registro
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} /> Mostrando {filteredRecords.length} de {total} registros
        </div>
      )}

      {/* Records List */}
      <div>
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><FolderOpen size={48} /></div>
            <h3 style={{ marginBottom: '0.5rem' }}>Nenhum registro encontrado</h3>
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma evidência corresponde aos filtros selecionados.</p>
            {hasActiveFilters && (
              <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredRecords.map(rec => {
              const associatedEvent = events.find(e => e.id === rec.eventId)
              return (
                <div key={rec.id} style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-smooth)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem 1.5rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>{rec.teacher}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12} /> {safeFormatDate(rec.date)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn-icon" onClick={() => openEditModal(rec)} title="Editar" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon delete" onClick={() => deleteRecord(rec.id)} title="Excluir" style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {rec.tipo && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                          <Tag size={12} /> {rec.tipo}
                        </span>
                      )}
                      {rec.gestor && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-main)', background: 'var(--bg-secondary)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                          <Briefcase size={12} /> {rec.gestor}
                        </span>
                      )}
                    </div>
                    
                    {associatedEvent && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                        <LinkIcon size={14} /> {associatedEvent.evento}
                      </span>
                    )}
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{rec.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{rec.description || 'Sem detalhes descritos para esta evidência.'}</p>
                    
                  </div>
                  
                  {rec.fileName && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Paperclip size={14} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{rec.fileName}</span> <span style={{ flexShrink: 0, opacity: 0.7 }}>({rec.fileSize})</span>
                    </div>
                  )}
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
            <div className="modal-header" style={{ flexShrink: 0, borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingId ? 'Editar Registro de Evidência' : 'Novo Registro de Evidência'}</h3>
              <button className="btn-icon" onClick={() => setIsFormModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            
            {/* Progress indicator */}
            <div style={{ padding: '0.5rem 4rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {[
                { num: 1, label: 'Dados Iniciais' },
                { num: 2, label: 'Detalhes' },
                { num: 3, label: 'Anexos' }
              ].map((step, idx, arr) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const color = isCompleted ? 'var(--color-success)' : (isCurrent ? '#3b82f6' : 'var(--border-light)');
                const textColor = isCompleted ? 'var(--color-success)' : (isCurrent ? '#3b82f6' : 'var(--text-muted)');
                const bgColor = isCompleted || isCurrent ? color : 'var(--bg-secondary)';
                
                return (
                  <React.Fragment key={step.num}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, color: (isCompleted || isCurrent) ? '#fff' : 'var(--text-muted)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}>
                        {isCompleted ? <Check size={20} strokeWidth={3} /> : step.num}
                      </div>
                      <span style={{ position: 'absolute', top: '44px', fontSize: '0.85rem', fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > step.num ? 'var(--color-success)' : 'var(--border-light)', margin: '0 8px', transition: 'all 0.3s' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '0.5rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Step 1 */}
                <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Professor(a) *</label>
                      <select ref={formFirstInputRef} className="form-control" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${errors.teacher ? 'var(--color-danger)' : 'var(--border-light)'}` }} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                        <option value="">Selecione um professor</option>
                        {professores.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {errors.teacher && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.teacher}</span>}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Data da Evidência *</label>
                      <input type="date" className="form-control" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${errors.date ? 'var(--color-danger)' : 'var(--border-light)'}` }} value={date} onChange={(e) => setDate(e.target.value)} />
                      {errors.date && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.date}</span>}
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Tipo *</label>
                    <select className="form-control" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${errors.tipo ? 'var(--color-danger)' : 'var(--border-light)'}` }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                      <option value="">Selecione um tipo</option>
                      {tiposEvidencia.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.tipo && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.tipo}</span>}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Gestor(a) *</label>
                    {userName ? (
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}>
                        {gestor || userName}
                      </div>
                    ) : (
                      <select className="form-control" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${errors.gestor ? 'var(--color-danger)' : 'var(--border-light)'}` }} value={gestor} onChange={(e) => setGestor(e.target.value)}>
                        <option value="">Selecione um gestor</option>
                        {gestores.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                    {errors.gestor && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.gestor}</span>}
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Descrição e Contexto</label>
                    <textarea className="form-control" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', minHeight: '150px', resize: 'vertical' }} placeholder="Explique o que esta evidência comprova..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: currentStep === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Anexar Documento</label>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: mockFileName ? 'var(--color-primary-light)' : 'var(--bg-primary)', transition: 'var(--transition-smooth)', borderColor: mockFileName ? 'var(--color-primary)' : 'var(--border-light)' }}>
                      <input type="file" style={{ display: 'none' }} onChange={handleFileChangeMock} />
                      <span style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                        {mockFileName ? <FileText size={40} /> : <UploadCloud size={40} />}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, textAlign: 'center' }}>
                        {mockFileName ? `Selecionado: ${mockFileName} (${mockFileSize})` : 'Clique para selecionar PDF, JPG ou PNG'}
                      </span>
                      {!mockFileName && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Máx: 20MB</span>}
                    </label>
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ flexShrink: 0, padding: '1.25rem 2rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                <div>
                  {currentStep > 1 && (
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-light)' }} onClick={handlePrevStep}>
                      <ChevronLeft size={18} /> Voltar
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: 'none' }} onClick={() => setIsFormModalOpen(false)}>Cancelar</button>
                  {currentStep < 3 ? (
                    <button type="button" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleNextStep}>
                      Próximo <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                      {editingId ? 'Salvar Alterações' : 'Registrar Evidência'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
