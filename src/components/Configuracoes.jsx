import React, { useState } from 'react'

export default function Configuracoes({
  setView,
  tiposEvento, addTipoEvento, removeTipoEvento,
  tiposEvidencia, addTipoEvidencia, removeTipoEvidencia,
  professores, addProfessor, removeProfessor, importProfessores,
  turmas, addTurma, removeTurma, updateTurmaLink,
  alunos, importAlunosTurma, clearAlunosTurma
}) {
  const [novoTipoEvento, setNovoTipoEvento] = useState('')
  const [novoTipoEvidencia, setNovoTipoEvidencia] = useState('')
  const [novoProfessor, setNovoProfessor] = useState('')
  const [novaTurma, setNovaTurma] = useState('')
  const [editingLink, setEditingLink] = useState({}) // {[id]: linkValue}

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

  const handleAddTurma = (e) => {
    e.preventDefault()
    if (!novaTurma.trim()) return
    if (!turmas.find(t => t.nome === novaTurma.trim())) {
      addTurma(novaTurma.trim())
    }
    setNovaTurma('')
  }

  const handleSaveLink = (turma) => {
    const link = editingLink[turma.id] !== undefined ? editingLink[turma.id] : (turma.link || '')
    updateTurmaLink(turma.id, link || null)
  }

  const handleCSVAlunosTurma = (turmaNome, e) => {
    const file = e.target.files[0]
    if (!file) return

    const existingNames = new Set(
      (alunos || []).filter(a => a.turma === turmaNome).map(a => a.nome.toLowerCase())
    )

    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim() !== '')
      if (lines.length < 2) return

      // Detecta separador (vírgula ou ponto-e-vírgula) pela primeira linha
      const sep = lines[0].includes(';') ? ';' : ','

      // Varre todas as linhas até encontrar a que contém "Nome do Aluno"
      let headerIdx = -1
      let nomeIdx = -1
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase())
        const idx = cols.indexOf('nome do aluno')
        if (idx !== -1) { headerIdx = i; nomeIdx = idx; break }
      }

      if (nomeIdx === -1) {
        alert('Coluna "Nome do Aluno" não encontrada no CSV.\nVerifique se alguma linha contém exatamente "Nome do Aluno".')
        e.target.value = ''
        return
      }

      const novos = []
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/^["']|["']$/g, '').trim())
        const name = cols[nomeIdx] || ''
        if (!name) continue
        if (!existingNames.has(name.toLowerCase())) {
          novos.push(name)
          existingNames.add(name.toLowerCase())
        }
      }

      if (novos.length > 0) {
        importAlunosTurma(turmaNome, novos)
      } else {
        alert('Nenhum aluno novo encontrado na coluna "Nome do Aluno".')
      }
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
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

        {/* Turmas */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏫</span> Turmas
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Configure cada turma: link externo e lista de alunos via CSV.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {turmas.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma turma cadastrada.</p>
            )}
            {turmas.map(turma => {
              const currentLink = editingLink[turma.id] !== undefined ? editingLink[turma.id] : (turma.link || '')
              const alunosDaTurma = (alunos || []).filter(a => a.turma === turma.nome)
              return (
                <div key={turma.id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-light)' }}>
                  {/* Row 1: Nome + Excluir */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{turma.nome}</span>
                    <button className="btn-icon delete" onClick={() => removeTurma(turma.nome)} title="Excluir turma">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Row 2: Link */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔗 Link:</span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://..."
                      value={currentLink}
                      onChange={e => setEditingLink(prev => ({ ...prev, [turma.id]: e.target.value }))}
                      style={{ flex: 1, margin: 0, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveLink(turma)}
                      style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      Salvar
                    </button>
                  </div>

                  {/* Row 3: Alunos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      👥 Alunos:
                    </span>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: 700,
                      background: alunosDaTurma.length > 0 ? '#dcfce7' : '#f1f5f9',
                      color: alunosDaTurma.length > 0 ? '#166534' : '#64748b',
                      borderRadius: '20px', padding: '0.2rem 0.65rem'
                    }}>
                      {alunosDaTurma.length} aluno{alunosDaTurma.length !== 1 ? 's' : ''}
                    </span>

                    {/* Import CSV */}
                    <label style={{
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      background: '#ede9fe', borderRadius: '8px', padding: '0.3rem 0.65rem'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                      </svg>
                      Importar CSV
                      <input
                        type="file" accept=".csv,.txt"
                        onChange={e => handleCSVAlunosTurma(turma.nome, e)}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Clear */}
                    {alunosDaTurma.length > 0 && (
                      <button
                        onClick={() => clearAlunosTurma(turma.nome)}
                        style={{
                          fontSize: '0.78rem', background: 'none', border: '1px solid #fecaca',
                          color: '#dc2626', borderRadius: '8px', padding: '0.3rem 0.65rem',
                          cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        ✕ Limpar lista
                      </button>
                    )}
                  </div>

                  {/* Preview dos primeiros alunos */}
                  {alunosDaTurma.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#475569', background: 'white', borderRadius: '6px', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', maxHeight: '80px', overflowY: 'auto' }}>
                      {alunosDaTurma.map((a, i) => (
                        <span key={a.id}>{a.nome}{i < alunosDaTurma.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleAddTurma} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nome da turma (Ex: 6ºA, 7ºB, 1ªA)" 
              value={novaTurma}
              onChange={(e) => setNovaTurma(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>Adicionar</button>
          </form>
        </div>

      </div>
    </div>
  )
}
