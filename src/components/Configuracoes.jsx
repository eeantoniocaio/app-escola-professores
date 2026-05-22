import React, { useState } from 'react'

const SECTIONS = [
  { key: 'tiposEvento',    emoji: '📅', label: 'Tipos de Evento',    color: '#fff7ed', border: '#fed7aa', dark: '#c2410c' },
  { key: 'tiposEvidencia', emoji: '🏷️', label: 'Tipos de Evidência', color: '#faf5ff', border: '#e9d5ff', dark: '#7c3aed' },
  { key: 'professores',    emoji: '👩‍🏫', label: 'Corpo Docente',      color: '#ecfdf5', border: '#a7f3d0', dark: '#065f46' },
  { key: 'gestores',       emoji: '👔', label: 'Equipe de Gestão',   color: '#eff6ff', border: '#bfdbfe', dark: '#1d4ed8' },
  { key: 'turmas',         emoji: '🏫', label: 'Turmas',             color: '#fff1f2', border: '#fecdd3', dark: '#be123c' },
]

export default function Configuracoes({
  setView,
  tiposEvento, addTipoEvento, removeTipoEvento,
  tiposEvidencia, addTipoEvidencia, removeTipoEvidencia,
  professores, addProfessor, removeProfessor, importProfessores,
  gestores, addGestor, removeGestor,
  turmas, addTurma, removeTurma, updateTurmaLink,
  alunos, importAlunosTurma, clearAlunosTurma, removeAlunosPorNome
}) {
  const [activeSection, setActiveSection] = useState(null)
  const [novoTipoEvento, setNovoTipoEvento] = useState('')
  const [novoTipoEvidencia, setNovoTipoEvidencia] = useState('')
  const [novoProfessor, setNovoProfessor] = useState('')
  const [novoGestor, setNovoGestor] = useState('')
  const [novaTurma, setNovaTurma] = useState('')
  const [editingLink, setEditingLink] = useState({})
  const [selectedAlunos, setSelectedAlunos] = useState({})
  const [novoAlunoPorTurma, setNovoAlunoPorTurma] = useState({})

  const handleAddAlunoIndividual = (turmaNome) => {
    const nome = novoAlunoPorTurma[turmaNome]
    if (!nome || !nome.trim()) return
    importAlunosTurma(turmaNome, [nome.trim().toUpperCase()])
    setNovoAlunoPorTurma(prev => ({ ...prev, [turmaNome]: '' }))
  }

  const toggleAlunoSelection = (turmaId, nome) => {
    setSelectedAlunos(prev => {
      const current = prev[turmaId] || []
      if (current.includes(nome)) return { ...prev, [turmaId]: current.filter(n => n !== nome) }
      return { ...prev, [turmaId]: [...current, nome] }
    })
  }

  const handleDeleteSelectedAlunos = (turmaId, turmaNome) => {
    const nomes = selectedAlunos[turmaId] || []
    if (nomes.length === 0) return
    if (window.confirm(`Remover ${nomes.length} aluno(s) selecionado(s) de ${turmaNome}?`)) {
       removeAlunosPorNome(turmaNome, nomes)
       setSelectedAlunos(prev => ({ ...prev, [turmaId]: [] }))
    }
  }

  const handleAddTipoEvento = (e) => {
    e.preventDefault()
    if (!novoTipoEvento.trim()) return
    if (!tiposEvento.includes(novoTipoEvento.trim())) addTipoEvento(novoTipoEvento.trim())
    setNovoTipoEvento('')
  }

  const handleAddTipoEvidencia = (e) => {
    e.preventDefault()
    if (!novoTipoEvidencia.trim()) return
    if (!tiposEvidencia.includes(novoTipoEvidencia.trim())) addTipoEvidencia(novoTipoEvidencia.trim())
    setNovoTipoEvidencia('')
  }

  const handleAddProfessor = (e) => {
    e.preventDefault()
    if (!novoProfessor.trim()) return
    if (!professores.includes(novoProfessor.trim())) addProfessor(novoProfessor.trim())
    setNovoProfessor('')
  }

  const handleAddGestor = (e) => {
    e.preventDefault()
    if (!novoGestor.trim()) return
    if (!gestores.includes(novoGestor.trim())) addGestor(novoGestor.trim())
    setNovoGestor('')
  }

  const handleAddTurma = (e) => {
    e.preventDefault()
    if (!novaTurma.trim()) return
    if (!turmas.find(t => t.nome === novaTurma.trim())) addTurma(novaTurma.trim())
    setNovaTurma('')
  }

  const handleSaveLink = (turma) => {
    const link = editingLink[turma.id] !== undefined ? editingLink[turma.id] : (turma.link || '')
    updateTurmaLink(turma.id, link || null)
  }

  const handleCSVAlunosTurma = (turmaNome, e) => {
    const file = e.target.files[0]
    if (!file) return
    const existingNames = new Set((alunos || []).filter(a => a.turma === turmaNome).map(a => a.nome.toLowerCase()))
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim() !== '')
      if (lines.length < 2) return
      const sep = lines[0].includes(';') ? ';' : ','
      let headerIdx = -1, nomeIdx = -1, situacaoIdx = -1
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase())
        const idx = cols.indexOf('nome do aluno')
        if (idx !== -1) { 
          headerIdx = i; 
          nomeIdx = idx; 
          situacaoIdx = cols.findIndex(c => c === 'situação' || c === 'situacao')
          break 
        }
      }
      if (nomeIdx === -1) { alert('Coluna "Nome do Aluno" não encontrada no CSV.'); e.target.value = ''; return }
      const novos = []
      const situacoesIgnoradas = ['TRAN', 'REMA', 'BXTR']
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/^["']|["']$/g, '').trim())
        const name = cols[nomeIdx] || ''
        if (!name) continue
        
        if (situacaoIdx !== -1) {
          const situacao = (cols[situacaoIdx] || '').toUpperCase()
          if (situacoesIgnoradas.includes(situacao)) continue
        }

        if (!existingNames.has(name.toLowerCase())) { novos.push(name); existingNames.add(name.toLowerCase()) }
      }
      if (novos.length > 0) importAlunosTurma(turmaNome, novos)
      else alert('Nenhum aluno novo encontrado.')
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const lines = event.target.result.split(/\r?\n/)
      const novosProfessores = []
      lines.forEach(line => {
        let name = line.split(',')[0].replace(/^["']|["']$/g, '').trim()
        if (name.toLowerCase() === 'nome' || name.toLowerCase() === 'professor' || name.toLowerCase() === 'professores') return
        if (name && !professores.includes(name) && !novosProfessores.includes(name)) novosProfessores.push(name)
      })
      if (novosProfessores.length > 0) importProfessores(novosProfessores)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Counts for badge display
  const counts = {
    tiposEvento: tiposEvento.length,
    tiposEvidencia: tiposEvidencia.length,
    professores: professores.length,
    gestores: gestores.length,
    turmas: turmas.length,
  }

  const deleteIconPath = "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"

  const renderDeleteBtn = (onClick) => (
    <button className="btn-icon delete" onClick={onClick} title="Excluir">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d={deleteIconPath}/>
      </svg>
    </button>
  )

  const renderList = (items, onRemove, emptyMsg) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(item => (
        <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{item}</span>
          {renderDeleteBtn(() => onRemove(item))}
        </li>
      ))}
      {items.length === 0 && (
        <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>{emptyMsg}</li>
      )}
    </ul>
  )

  const renderAddForm = (value, onChange, onSubmit, placeholder) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input type="text" className="form-control" placeholder={placeholder} value={value} onChange={onChange} style={{ flex: 1, margin: 0 }} />
      <button type="submit" className="btn btn-primary" style={{ margin: 0 }}>Adicionar</button>
    </form>
  )

  // ── Section content renderers ──────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 'tiposEvento':
        return (
          <>
            {renderList(tiposEvento, removeTipoEvento, 'Nenhum tipo de evento cadastrado.')}
            {renderAddForm(novoTipoEvento, e => setNovoTipoEvento(e.target.value), handleAddTipoEvento, 'Novo tipo (Ex: Apresentação)')}
          </>
        )
      case 'tiposEvidencia':
        return (
          <>
            {renderList(tiposEvidencia, removeTipoEvidencia, 'Nenhum tipo de evidência cadastrado.')}
            {renderAddForm(novoTipoEvidencia, e => setNovoTipoEvidencia(e.target.value), handleAddTipoEvidencia, 'Novo tipo de evidência')}
          </>
        )
      case 'professores':
        return (
          <>
            {renderList(professores, removeProfessor, 'Nenhum professor cadastrado.')}
            {renderAddForm(novoProfessor, e => setNovoProfessor(e.target.value), handleAddProfessor, 'Nome do professor (Ex: Profa. Maria)')}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                Importar de CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>— um nome por linha</span>
            </div>
          </>
        )
      case 'gestores':
        return (
          <>
            {renderList(gestores, removeGestor, 'Nenhum gestor cadastrado.')}
            {renderAddForm(novoGestor, e => setNovoGestor(e.target.value), handleAddGestor, 'Nome do gestor(a)')}
          </>
        )
      case 'turmas':
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              {turmas.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma turma cadastrada.</p>}
              {turmas.map(turma => {
                const currentLink = editingLink[turma.id] !== undefined ? editingLink[turma.id] : (turma.link || '')
                const alunosDaTurma = (alunos || []).filter(a => a.turma === turma.nome)
                const uniqueNames = Array.from(new Set(alunosDaTurma.map(a => a.nome.trim()))).sort()
                const selectedForTurma = selectedAlunos[turma.id] || []
                return (
                  <div key={turma.id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{turma.nome}</span>
                      {renderDeleteBtn(() => removeTurma(turma.nome))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🔗 Link:</span>
                      <input type="url" className="form-control" placeholder="https://..." value={currentLink}
                        onChange={e => setEditingLink(prev => ({ ...prev, [turma.id]: e.target.value }))}
                        style={{ flex: 1, margin: 0, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }} />
                      <button className="btn btn-primary" onClick={() => handleSaveLink(turma)}
                        style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Salvar</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>👥 Alunos:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, background: uniqueNames.length > 0 ? '#dcfce7' : '#f1f5f9', color: uniqueNames.length > 0 ? '#166534' : '#64748b', borderRadius: '20px', padding: '0.2rem 0.65rem' }}>
                        {uniqueNames.length} aluno{uniqueNames.length !== 1 ? 's' : ''}
                      </span>
                      <label style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#ede9fe', borderRadius: '8px', padding: '0.3rem 0.65rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                        </svg>
                        Importar CSV
                        <input type="file" accept=".csv,.txt" onChange={e => handleCSVAlunosTurma(turma.nome, e)} style={{ display: 'none' }} />
                      </label>
                      {uniqueNames.length > 0 && (
                        <button onClick={() => clearAlunosTurma(turma.nome)}
                          style={{ fontSize: '0.78rem', background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontWeight: 600 }}>
                          ✕ Limpar lista
                        </button>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Nome do aluno..." 
                        value={novoAlunoPorTurma[turma.nome] || ''}
                        onChange={e => setNovoAlunoPorTurma(prev => ({ ...prev, [turma.nome]: e.target.value }))}
                        onKeyDown={e => { if(e.key === 'Enter') handleAddAlunoIndividual(turma.nome) }}
                        style={{ flex: 1, margin: 0, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                      />
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleAddAlunoIndividual(turma.nome)}
                        style={{ margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        Adicionar
                      </button>
                    </div>

                    {uniqueNames.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', background: 'white', borderRadius: '6px', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {uniqueNames.map(nome => (
                            <label key={nome} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.2rem 0' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedForTurma.includes(nome)} 
                                onChange={() => toggleAlunoSelection(turma.id, nome)}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              {nome}
                            </label>
                          ))}
                        </div>
                        {selectedForTurma.length > 0 && (
                          <button onClick={() => handleDeleteSelectedAlunos(turma.id, turma.nome)}
                            style={{ fontSize: '0.78rem', background: 'none', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
                            Excluir selecionados ({selectedForTurma.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {renderAddForm(novaTurma, e => setNovaTurma(e.target.value), handleAddTurma, 'Nome da turma (Ex: 6ºA, 7ºB)')}
          </>
        )
      default:
        return null
    }
  }

  const currentSection = SECTIONS.find(s => s.key === activeSection)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <button className="btn-back-home"
            onClick={() => activeSection ? setActiveSection(null) : setView('home')}
            title={activeSection ? 'Voltar às configurações' : 'Voltar ao início'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div>
            <h2 style={{ marginBottom: '0.1rem' }}>
              {activeSection ? `${currentSection.emoji} ${currentSection.label}` : 'Configurações do Sistema'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {activeSection ? 'Adicione ou remova itens da lista' : 'Gerencie as opções de campos personalizados na Nuvem'}
            </p>
          </div>
        </div>
      </div>

      {/* Card Grid or Section Content */}
      {!activeSection ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.25rem',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0.5rem 0'
        }}>
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              style={{
                background: sec.color,
                border: `1.5px solid ${sec.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.5rem',
                textAlign: 'left',
                transition: 'transform 0.18s, box-shadow 0.18s',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
            >
              <span style={{ fontSize: '2rem' }}>{sec.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: sec.dark }}>{sec.label}</span>
              <span style={{
                fontSize: '0.78rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '20px', padding: '0.15rem 0.6rem',
                color: sec.dark,
                border: `1px solid ${sec.border}`
              }}>
                {counts[sec.key]} {counts[sec.key] === 1 ? 'item' : 'itens'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)'
          }}>
            {renderSection()}
          </div>
        </div>
      )}
    </div>
  )
}
