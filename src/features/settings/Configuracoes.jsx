import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Tag, Users, Briefcase, School, Link as LinkIcon, X, Trash2, UploadCloud, ArrowLeft, Settings, Check, BookOpen } from 'lucide-react'
import { useGlobalData } from '../../app/providers/GlobalDataProvider'
import { useAuth } from '../../app/providers/AuthProvider'

const SECTIONS = [
  { key: 'tiposEvento',    icon: <Calendar size={32} />, label: 'Tipos de Evento',    color: '#FFC800' },
  { key: 'tiposEvidencia', icon: <Tag size={32} />, label: 'Tipos de Evidência', color: '#1CB0F6' },
  { key: 'professores',    icon: <Users size={32} />, label: 'Corpo Docente',      color: '#58CC02' },
  { key: 'gestores',       icon: <Briefcase size={32} />, label: 'Equipe de Gestão',   color: '#FF9600' },
  { key: 'turmas',         icon: <School size={32} />, label: 'Turmas',             color: '#FF4B4B' },
  { key: 'disciplinas',    icon: <BookOpen size={32} />, label: 'Disciplinas',         color: '#B01CF6' },
]

export default function Configuracoes() {
  const navigate = useNavigate();
  const { userRole, isMaster } = useAuth();
  const {
    tiposEvento, addTipoEvento, removeTipoEvento,
    tiposEvidencia, addTipoEvidencia, removeTipoEvidencia,
    professores, addProfessor, removeProfessor, importProfessores,
    gestores, addGestor, removeGestor,
    turmas, addTurma, removeTurma, updateTurmaLink,
    alunos, importAlunosTurma, clearAlunosTurma, removeAlunosPorNome,
    disciplinas, addDisciplina, removeDisciplina, importDisciplinas
  } = useGlobalData();
  const [activeSection, setActiveSection] = useState(null)
  const [novoTipoEvento, setNovoTipoEvento] = useState('')
  const [novoTipoEvidencia, setNovoTipoEvidencia] = useState('')
  const [novoProfessor, setNovoProfessor] = useState('')
  const [novoGestor, setNovoGestor] = useState('')
  const [novaTurma, setNovaTurma] = useState('')
  const [novaDisciplina, setNovaDisciplina] = useState('')
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

  const handleAddDisciplina = (e) => {
    e.preventDefault()
    if (!(isMaster || userRole === 'gestao')) {
      alert('Apenas usuários com perfil de Gestão podem adicionar disciplinas.')
      return
    }
    if (!novaDisciplina.trim()) return
    if (!disciplinas.includes(novaDisciplina.trim())) addDisciplina(novaDisciplina.trim())
    setNovoDisciplina('')
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
      const situacoesIgnoradas = ['TRAN', 'REMA', 'BXTR', 'RECL']
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

  const handleCSVDisciplinas = (e) => {
    if (!(isMaster || userRole === 'gestao')) {
      alert('Apenas usuários com perfil de Gestão podem importar disciplinas.')
      return
    }
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const lines = event.target.result.split(/\r?\n/)
      const novas = []
      lines.forEach(line => {
        let name = line.split(',')[0].replace(/^["']|["']$/g, '').trim()
        if (name.toLowerCase() === 'nome' || name.toLowerCase() === 'disciplina' || name.toLowerCase() === 'disciplinas' || name.toLowerCase() === 'materia') return
        if (name && !disciplinas.includes(name) && !novas.includes(name)) novas.push(name)
      })
      if (novas.length > 0) importDisciplinas(novas)
      else alert('Nenhuma disciplina nova encontrada.')
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
    disciplinas: disciplinas.length,
  }

  const renderDeleteBtn = (onClick) => (
    <button className="btn-icon delete" onClick={onClick} title="Excluir" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.25rem' }}>
      <Trash2 size={16} />
    </button>
  )

  const renderList = (items, onRemove, emptyMsg) => (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(item => (
        <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>{item}</span>
          {renderDeleteBtn(() => onRemove(item))}
        </li>
      ))}
      {items.length === 0 && (
        <li style={{ fontSize: '0.9rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>{emptyMsg}</li>
      )}
    </ul>
  )

  const renderAddForm = (value, onChange, onSubmit, placeholder) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
      <input type="text" className="form-control" placeholder={placeholder} value={value} onChange={onChange} style={{ flex: 1, margin: 0 }} />
      <button type="submit" className="btn btn-primary" style={{ margin: 0, padding: '0.5rem 1.25rem' }}>Adicionar</button>
    </form>
  )

  // ── Section content renderers ──────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 'tiposEvento':
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={20} color="var(--color-warning)" /> Tipos de Evento</h3>
            {renderList(tiposEvento, removeTipoEvento, 'Nenhum tipo de evento cadastrado.')}
            {renderAddForm(novoTipoEvento, e => setNovoTipoEvento(e.target.value), handleAddTipoEvento, 'Novo tipo (Ex: Apresentação)')}
          </>
        )
      case 'tiposEvidencia':
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={20} color="var(--color-primary)" /> Tipos de Evidência</h3>
            {renderList(tiposEvidencia, removeTipoEvidencia, 'Nenhum tipo de evidência cadastrado.')}
            {renderAddForm(novoTipoEvidencia, e => setNovoTipoEvidencia(e.target.value), handleAddTipoEvidencia, 'Novo tipo de evidência')}
          </>
        )
      case 'professores':
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} color="var(--color-success)" /> Corpo Docente</h3>
            {renderList(professores, removeProfessor, 'Nenhum professor cadastrado.')}
            {renderAddForm(novoProfessor, e => setNovoProfessor(e.target.value), handleAddProfessor, 'Nome do professor (Ex: Profa. Maria)')}
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                <UploadCloud size={18} />
                Importar de CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>— um nome por linha</span>
            </div>
          </>
        )
      case 'gestores':
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={20} color="var(--text-main)" /> Equipe de Gestão</h3>
            {renderList(gestores, removeGestor, 'Nenhum gestor cadastrado.')}
            {renderAddForm(novoGestor, e => setNovoGestor(e.target.value), handleAddGestor, 'Nome do gestor(a)')}
          </>
        )
      case 'turmas':
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><School size={20} color="var(--color-danger)" /> Turmas e Alunos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {turmas.length === 0 && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>Nenhuma turma cadastrada.</div>}
              {turmas.map(turma => {
                const currentLink = editingLink[turma.id] !== undefined ? editingLink[turma.id] : (turma.link || '')
                const alunosDaTurma = (alunos || []).filter(a => a.turma === turma.nome)
                const uniqueNames = Array.from(new Set(alunosDaTurma.map(a => a.nome.trim()))).sort()
                const selectedForTurma = selectedAlunos[turma.id] || []
                return (
                  <div key={turma.id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>{turma.nome}</span>
                      {renderDeleteBtn(() => removeTurma(turma.nome))}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <LinkIcon size={16} color="var(--text-muted)" />
                      <input type="url" className="form-control" placeholder="Link do mapa da sala..." value={currentLink}
                        onChange={e => setEditingLink(prev => ({ ...prev, [turma.id]: e.target.value }))}
                        style={{ flex: 1, margin: 0, fontSize: '0.9rem', padding: '0.5rem 0.75rem' }} />
                      <button className="btn btn-secondary" onClick={() => handleSaveLink(turma)}
                        style={{ margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Salvar</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={16} /> Alunos:
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, background: uniqueNames.length > 0 ? 'var(--color-success-bg)' : 'var(--bg-card)', color: uniqueNames.length > 0 ? 'var(--color-success)' : 'var(--text-muted)', borderRadius: '999px', padding: '0.2rem 0.75rem', border: `1px solid ${uniqueNames.length > 0 ? 'var(--color-success)' : 'var(--border-light)'}` }}>
                        {uniqueNames.length} aluno{uniqueNames.length !== 1 ? 's' : ''}
                      </span>
                      
                      <label style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', transition: 'var(--transition-fast)' }}>
                        <UploadCloud size={14} />
                        Importar CSV
                        <input type="file" accept=".csv,.txt" onChange={e => handleCSVAlunosTurma(turma.nome, e)} style={{ display: 'none' }} />
                      </label>

                      {uniqueNames.length > 0 && (
                        <button onClick={() => clearAlunosTurma(turma.nome)}
                          style={{ fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <X size={14} /> Limpar lista
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
                        style={{ flex: 1, margin: 0, fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                      />
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleAddAlunoIndividual(turma.nome)}
                        style={{ margin: 0, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        Adicionar
                      </button>
                    </div>

                    {uniqueNames.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid var(--border-light)', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {uniqueNames.map(nome => (
                            <label key={nome} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--bg-primary)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
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
                            style={{ fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Trash2 size={14} /> Excluir selecionados ({selectedForTurma.length})
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
      case 'disciplinas':
        const canEditDisciplinas = isMaster || userRole === 'gestao';
        return (
          <>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="#b01cf6" /> Disciplinas
            </h3>
            {renderList(disciplinas, canEditDisciplinas ? removeDisciplina : null, 'Nenhuma disciplina cadastrada.')}
            {canEditDisciplinas && renderAddForm(novaDisciplina, e => setNovoDisciplina(e.target.value), handleAddDisciplina, 'Nome da disciplina (Ex: Matemática)')}
            {canEditDisciplinas && (
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <UploadCloud size={18} />
                  Importar de CSV
                  <input type="file" accept=".csv" onChange={handleCSVDisciplinas} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>— uma disciplina por linha</span>
              </div>
            )}
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
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary"
            onClick={() => activeSection ? setActiveSection(null) : navigate('/')}
            style={{ padding: '0.5rem' }}
            title={activeSection ? 'Voltar às configurações' : 'Voltar ao início'}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {activeSection ? <>{currentSection.icon} {currentSection.label}</> : <><Settings size={28} color="var(--text-main)" /> Configurações do Sistema</>}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
              {activeSection ? 'Adicione ou remova itens da lista' : 'Gerencie as opções de campos personalizados na Nuvem'}
            </p>
          </div>
        </div>
      </div>

      {/* Card Grid or Section Content */}
      {!activeSection ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0.5rem 0'
        }}>
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              style={{
                background: sec.color,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '1rem',
                textAlign: 'left',
                transition: 'var(--transition-smooth)',
                boxShadow: 'var(--shadow-sm)',
                color: '#ffffff'
              }}
              onMouseOver={e => { 
                e.currentTarget.style.transform = 'translateY(-4px)'; 
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; 
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; 
              }}
              onMouseOut={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; 
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; 
              }}
            >
              <div style={{ color: '#ffffff', marginBottom: '0.5rem', display: 'flex' }}>{sec.icon}</div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{sec.label}</span>
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '999px', padding: '0.2rem 0.75rem',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {counts[sec.key]} {counts[sec.key] === 1 ? 'item' : 'itens'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '2rem',
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
