import React, { useState } from 'react'

export default function Configuracoes({
  setView,
  tiposEvento, setTiposEvento,
  tiposEvidencia, setTiposEvidencia
}) {
  const [novoTipoEvento, setNovoTipoEvento] = useState('')
  const [novoTipoEvidencia, setNovoTipoEvidencia] = useState('')

  const handleAddTipoEvento = (e) => {
    e.preventDefault()
    if (!novoTipoEvento.trim()) return
    if (!tiposEvento.includes(novoTipoEvento.trim())) {
      setTiposEvento([...tiposEvento, novoTipoEvento.trim()])
    }
    setNovoTipoEvento('')
  }

  const handleDeleteTipoEvento = (tipo) => {
    setTiposEvento(tiposEvento.filter(t => t !== tipo))
  }

  const handleAddTipoEvidencia = (e) => {
    e.preventDefault()
    if (!novoTipoEvidencia.trim()) return
    if (!tiposEvidencia.includes(novoTipoEvidencia.trim())) {
      setTiposEvidencia([...tiposEvidencia, novoTipoEvidencia.trim()])
    }
    setNovoTipoEvidencia('')
  }

  const handleDeleteTipoEvidencia = (tipo) => {
    setTiposEvidencia(tiposEvidencia.filter(t => t !== tipo))
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home" onClick={() => setView('home')} title="Voltar ao início">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>Configurações do Sistema</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Gerencie as opções de campos personalizados
            </p>
          </div>
        </div>
      </div>

      <div className="records-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Tipos de Evento */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📅</span> Tipos de Evento
          </h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tiposEvento.map(tipo => (
              <li key={tipo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{tipo}</span>
                <button className="btn-icon delete" onClick={() => handleDeleteTipoEvento(tipo)} title="Excluir">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </li>
            ))}
            {tiposEvento.length === 0 && (
              <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum tipo de evento cadastrado.</li>
            )}
          </ul>

          <form onSubmit={handleAddTipoEvento} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Novo tipo de evento (Ex: Apresentação)" 
              value={novoTipoEvento}
              onChange={(e) => setNovoTipoEvento(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>Adicionar</button>
          </form>
        </div>

        {/* Tipos de Evidência */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏷️</span> Tipos de Evidência
          </h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tiposEvidencia.map(tipo => (
              <li key={tipo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{tipo}</span>
                <button className="btn-icon delete" onClick={() => handleDeleteTipoEvidencia(tipo)} title="Excluir">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </li>
            ))}
            {tiposEvidencia.length === 0 && (
              <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum tipo de evidência cadastrado.</li>
            )}
          </ul>

          <form onSubmit={handleAddTipoEvidencia} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Novo tipo de evidência" 
              value={novoTipoEvidencia}
              onChange={(e) => setNovoTipoEvidencia(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>Adicionar</button>
          </form>
        </div>

      </div>
    </div>
  )
}
