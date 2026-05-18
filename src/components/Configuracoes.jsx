import React, { useState } from 'react'

export default function Configuracoes({
  setView,
  tiposEvento, addTipoEvento, removeTipoEvento,
  tiposEvidencia, addTipoEvidencia, removeTipoEvidencia,
  professores, addProfessor, removeProfessor, importProfessores
}) {
  const [novoTipoEvento, setNovoTipoEvento] = useState('')
  const [novoTipoEvidencia, setNovoTipoEvidencia] = useState('')
  const [novoProfessor, setNovoProfessor] = useState('')

  const handleAddTipoEvento = (e) => {
    e.preventDefault()
    if (!novoTipoEvento.trim()) return
    if (!tiposEvento.includes(novoTipoEvento.trim())) {
      addTipoEvento(novoTipoEvento.trim())
    }
    setNovoTipoEvento('')
  }

  const handleAddTipoEvidencia = (e) => {
    e.preventDefault()
    if (!novoTipoEvidencia.trim()) return
    if (!tiposEvidencia.includes(novoTipoEvidencia.trim())) {
      addTipoEvidencia(novoTipoEvidencia.trim())
    }
    setNovoTipoEvidencia('')
  }

  const handleAddProfessor = (e) => {
    e.preventDefault()
    if (!novoProfessor.trim()) return
    if (!professores.includes(novoProfessor.trim())) {
      addProfessor(novoProfessor.trim())
    }
    setNovoProfessor('')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split(/\r?\n/)
      
      const novosProfessores = []
      lines.forEach(line => {
        let name = line.split(',')[0].replace(/^["']|["']$/g, '').trim()
        if (name.toLowerCase() === 'nome' || name.toLowerCase() === 'professor' || name.toLowerCase() === 'professores') return;
        if (name && !professores.includes(name) && !novosProfessores.includes(name)) {
          novosProfessores.push(name)
        }
      })

      if (novosProfessores.length > 0) {
        importProfessores(novosProfessores)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
              Gerencie as opções de campos personalizados na Nuvem
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
                <button className="btn-icon delete" onClick={() => removeTipoEvento(tipo)} title="Excluir">
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
                <button className="btn-icon delete" onClick={() => removeTipoEvidencia(tipo)} title="Excluir">
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

        {/* Professores */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👩‍🏫</span> Corpo Docente
          </h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {professores.map(prof => (
              <li key={prof} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{prof}</span>
                <button className="btn-icon delete" onClick={() => removeProfessor(prof)} title="Excluir">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </li>
            ))}
            {professores.length === 0 && (
              <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum professor cadastrado.</li>
            )}
          </ul>

          <form onSubmit={handleAddProfessor} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nome do professor (Ex: Profa. Maria)" 
              value={novoProfessor}
              onChange={(e) => setNovoProfessor(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>Adicionar</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              Importar de CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>— Selecione um arquivo com nomes (um por linha)</span>
          </div>
        </div>

      </div>
    </div>
  )
}
