import React, { useState, useEffect, useRef } from 'react'

export default function EventModal({ isOpen, eventToEdit, onClose, onSave }) {
  // Input states
  const [dataSolicitacao, setDataSolicitacao] = useState('')
  const [evento, setEvento] = useState('')
  const [tipo, setTipo] = useState('formulário')
  const [quemSolicitou, setQuemSolicitou] = useState('')
  const [dataEntrega, setDataEntrega] = useState('')

  const firstInputRef = useRef(null)

  // Sync inputs with eventToEdit when editing, or reset when creating
  useEffect(() => {
    if (eventToEdit) {
      setDataSolicitacao(eventToEdit.dataSolicitacao || '')
      setEvento(eventToEdit.evento || '')
      setTipo(eventToEdit.tipo || 'formulário')
      setQuemSolicitou(eventToEdit.quemSolicitou || '')
      setDataEntrega(eventToEdit.dataEntrega || '')
    } else {
      setDataSolicitacao('')
      setEvento('')
      setTipo('formulário')
      setQuemSolicitou('')
      setDataEntrega('')
    }
  }, [eventToEdit])

  // Focus the first input field on mount
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      // Focus after a tiny delay to wait for scale animations
      const timer = setTimeout(() => {
        firstInputRef.current.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!evento.trim() || !tipo || !quemSolicitou.trim() || !dataEntrega) {
      return
    }

    onSave({
      dataSolicitacao,
      evento,
      tipo,
      quemSolicitou,
      dataEntrega
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

        {/* Form Body and Scrollable area */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', margin: 0 }}>
          
          {/* Scrollable Body */}
          <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
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
                required 
              />
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
                required
                style={{ width: '100%', height: '42px', paddingRight: '2rem' }}
              >
                <option value="formulário">Formulário</option>
                <option value="email">E-mail</option>
                <option value="físico">Físico</option>
              </select>
            </div>

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
                required 
              />
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
                required 
              />
            </div>

          </div>

          {/* Footer Actions (Fixed) */}
          <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)', flexShrink: 0, justifyContent: 'space-between' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--pastel-blue)', color: 'var(--pastel-blue-dark)' }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
