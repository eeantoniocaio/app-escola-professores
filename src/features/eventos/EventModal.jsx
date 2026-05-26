import React, { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
export default function EventModal({ isOpen, eventToEdit, tiposEvento, onClose, onSave }) {
  // Input states
  const [dataSolicitacao, setDataSolicitacao] = useState('')
  const [evento, setEvento] = useState('')
  const [tipo, setTipo] = useState(tiposEvento[0] || '')
  const [quemSolicitou, setQuemSolicitou] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})

  const firstInputRef = useRef(null)

  // Sync inputs with eventToEdit when editing, or reset when creating
  useEffect(() => {
    if (eventToEdit) {
      setDataSolicitacao(eventToEdit.dataSolicitacao || '')
      setEvento(eventToEdit.evento || '')
      setTipo(eventToEdit.tipo || tiposEvento[0] || '')
      setQuemSolicitou(eventToEdit.quemSolicitou || '')
      setDataEntrega(eventToEdit.dataEntrega || '')
    } else {
      setDataSolicitacao('')
      setEvento('')
      setTipo(tiposEvento[0] || '')
      setQuemSolicitou('')
      setDataEntrega('')
    }
    setCurrentStep(1)
    setErrors({})
  }, [eventToEdit])

  // Focus the first input field on mount
  useEffect(() => {
    if (isOpen && firstInputRef.current && currentStep === 1) {
      // Focus after a tiny delay to wait for scale animations
      const timer = setTimeout(() => {
        firstInputRef.current.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentStep])

  // Add Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const validateStep = (step) => {
    const e = {}
    if (step === 1) {
      if (!evento.trim()) e.evento = 'Campo obrigatório'
      if (!tipo) e.tipo = 'Campo obrigatório'
    } else if (step === 2) {
      if (!quemSolicitou.trim()) e.quemSolicitou = 'Campo obrigatório'
      if (!dataEntrega) e.dataEntrega = 'Campo obrigatório'
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

    onSave({
      ...(eventToEdit ? { id: eventToEdit.id } : {}),
      dataSolicitacao: dataSolicitacao ? dataSolicitacao : null,
      evento,
      tipo,
      quemSolicitou,
      dataEntrega: dataEntrega ? dataEntrega : null
    })
  }

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content event-modal-card" style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header (Fixed) */}
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', margin: 0 }}>
            <span>{eventToEdit ? '📝' : '✨'}</span>
            <span>{eventToEdit ? 'Editar Evento' : 'Novo Evento'}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="btn-icon" 
            title="Fechar"
            style={{ width: '32px', height: '32px', borderRadius: '10px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        <div style={{ padding: '0.5rem 4rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { num: 1, label: 'Dados Básicos' },
            { num: 2, label: 'Detalhes' }
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

        {/* Form Body and Scrollable area */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
          
          {/* Scrollable Body */}
          <div className="modal-body" style={{ padding: '0.5rem 1.5rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Step 1 */}
            <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
              {/* Data de Solicitação (Optional) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Data de Solicitação
                </label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dataSolicitacao} 
                  onChange={(e) => setDataSolicitacao(e.target.value)} 
                />
              </div>

              {/* Evento (Required) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Evento *
                </label>
                <input 
                  ref={firstInputRef}
                  type="text" 
                  className="form-control" 
                  placeholder="Nome do evento ou entrega..." 
                  value={evento} 
                  onChange={(e) => setEvento(e.target.value)} 
                  style={{ border: errors.evento ? '1px solid var(--color-danger)' : undefined }}
                />
                {errors.evento && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.evento}</span>}
              </div>

              {/* Tipo (Required Dropdown) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Tipo *
                </label>
                <select 
                  className="form-control select-filter" 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  style={{ width: '100%', height: '42px', paddingRight: '2rem', border: errors.tipo ? '1px solid var(--color-danger)' : undefined }}
                >
                  {tiposEvento.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.tipo && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.tipo}</span>}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
              {/* Quem Solicitou (Required) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Quem solicitou *
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: Coordenação Pedagógica..." 
                  value={quemSolicitou} 
                  onChange={(e) => setQuemSolicitou(e.target.value)} 
                  style={{ border: errors.quemSolicitou ? '1px solid var(--color-danger)' : undefined }}
                />
                {errors.quemSolicitou && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.quemSolicitou}</span>}
              </div>

              {/* Data de Entrega (Required) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Data de entrega *
                </label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dataEntrega} 
                  onChange={(e) => setDataEntrega(e.target.value)} 
                  style={{ border: errors.dataEntrega ? '1px solid var(--color-danger)' : undefined }}
                />
                {errors.dataEntrega && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.dataEntrega}</span>}
              </div>
            </div>

          </div>

          {/* Footer Actions (Fixed) */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
            <div>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handlePrevStep} 
                  style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose} 
                style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none' }}
              >
                Cancelar
              </button>
              {currentStep < 2 ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleNextStep} 
                  style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--pastel-blue)', color: 'var(--pastel-blue-dark)' }}
                >
                  Próximo <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--pastel-blue)', color: 'var(--pastel-blue-dark)' }}
                >
                  Salvar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
