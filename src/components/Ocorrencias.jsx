import React, { useState, useMemo, useCallback } from 'react'

const EMPTY_FORM = { professor: '', disciplina: '', data: '', turma: '', descricao: '', alunos: [], acao_professor: '' }

export default function Ocorrencias({ setView, ocorrencias, professores, turmas, alunos, addOcorrencia, deleteOcorrencia }) {
  const [hoveredBtn, setHoveredBtn] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Filters
  const [filterProf, setFilterProf] = useState('')
  const [filterDisciplina, setFilterDisciplina] = useState('')
  const [filterTurma, setFilterTurma] = useState('')
  const [filterAluno, setFilterAluno] = useState('')
  const [filterData, setFilterData] = useState('')

  // Alunos da turma selecionada no formulário
  const alunosDaTurma = useMemo(
    () => (alunos || []).filter(a => a.turma === form.turma).sort((a, b) => a.nome.localeCompare(b.nome)),
    [alunos, form.turma]
  )

  const toggleAluno = useCallback((nome) => {
    setForm(prev => ({
      ...prev,
      alunos: prev.alunos.includes(nome)
        ? prev.alunos.filter(a => a !== nome)
        : [...prev.alunos, nome]
    }))
  }, [])

  const validate = () => {
    const e = {}
    if (!form.professor.trim()) e.professor = 'Campo obrigatório'
    if (!form.disciplina.trim()) e.disciplina = 'Campo obrigatório'
    if (!form.data) e.data = 'Campo obrigatório'
    if (!form.turma) e.turma = 'Campo obrigatório'
    if (!form.descricao.trim()) e.descricao = 'Campo obrigatório'
    if (!form.acao_professor.trim()) e.acao_professor = 'Campo obrigatório'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await addOcorrencia({
      professor: form.professor.trim(),
      disciplina: form.disciplina.trim(),
      data: form.data,
      turma: form.turma || null,
      descricao: form.descricao.trim() || null,
      alunos: form.alunos.length > 0 ? form.alunos : [],
      acao_professor: form.acao_professor.trim() || null,
    })
    setForm(EMPTY_FORM)
    setErrors({})
    setShowModal(false)
    setSaving(false)
  }

  const handleTurmaChange = (turma) => {
    setForm(prev => ({ ...prev, turma, alunos: [] })) // limpa alunos ao mudar turma
  }

  const filtered = useMemo(() => (ocorrencias || []).filter(o => {
    if (filterProf && !o.professor.toLowerCase().includes(filterProf.toLowerCase())) return false
    if (filterDisciplina && !o.disciplina.toLowerCase().includes(filterDisciplina.toLowerCase())) return false
    if (filterTurma && o.turma !== filterTurma) return false
    if (filterAluno && !(o.alunos || []).some(a => a.toLowerCase().includes(filterAluno.toLowerCase()))) return false
    if (filterData && o.data !== filterData) return false
    return true
  }), [ocorrencias, filterProf, filterDisciplina, filterTurma, filterAluno, filterData])

  const inputStyle = (field) => ({
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', transition: 'border-color 0.2s'
  })

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', padding: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} title="Voltar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Ocorrências em Sala de Aula</h2>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, marginLeft: '2.5rem', fontSize: '0.9rem' }}>
            {filtered.length} ocorrência{filtered.length !== 1 ? 's' : ''} registrada{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }}
          onMouseEnter={() => setHoveredBtn('nova')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            transform: hoveredBtn === 'nova' ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'transform 0.2s'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span> Nova Ocorrência
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'white', padding: '1rem 1.25rem', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Professor(a)</label>
          <input type="text" placeholder="Filtrar por nome..." value={filterProf}
            onChange={e => setFilterProf(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Disciplina</label>
          <input type="text" placeholder="Ex: Matemática..." value={filterDisciplina}
            onChange={e => setFilterDisciplina(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        {turmas && turmas.length > 0 && (
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Turma</label>
            <select value={filterTurma} onChange={e => setFilterTurma(e.target.value)}
              style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
              <option value="">Todas</option>
              {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Aluno(a)</label>
          <input type="text" placeholder="Nome do aluno..." value={filterAluno}
            onChange={e => setFilterAluno(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Data</label>
          <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        {(filterProf || filterDisciplina || filterTurma || filterAluno || filterData) && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setFilterProf(''); setFilterDisciplina(''); setFilterTurma(''); setFilterAluno(''); setFilterData('') }}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              ✕ Limpar
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma ocorrência registrada.</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>Clique em "+ Nova Ocorrência" para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(o => (
            <div key={o.id} style={{
              background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{o.professor}</span>
                  {o.turma && (
                    <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      {o.turma}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: (o.descricao || (o.alunos && o.alunos.length > 0)) ? '0.75rem' : 0 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>📚</span> {o.disciplina}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>📅</span> {new Date(o.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {o.alunos && o.alunos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: o.descricao ? '0.5rem' : 0 }}>
                    {o.alunos.map(nome => (
                      <span key={nome} style={{ background: '#f0fdf4', color: '#15803d', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        👤 {nome}
                      </span>
                    ))}
                  </div>
                )}
                {o.descricao && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.85rem', borderLeft: '3px solid #6366f1', marginBottom: o.acao_professor ? '0.5rem' : 0 }}>
                    {o.descricao}
                  </p>
                )}
                {o.acao_professor && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', background: '#f0fdf4', borderRadius: '8px', padding: '0.6rem 0.85rem', borderLeft: '3px solid #22c55e' }}>
                    <span style={{ fontWeight: 700, marginRight: '0.35rem' }}>⚡ Ação:</span>{o.acao_professor}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteOcorrencia(o.id)}
                onMouseEnter={() => setHoveredBtn(`del-${o.id}`)}
                onMouseLeave={() => setHoveredBtn(null)}
                title="Excluir"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: hoveredBtn === `del-${o.id}` ? '#ef4444' : '#cbd5e1', padding: '0.25rem', transition: 'color 0.2s', flexShrink: 0 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Modal header */}
            <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>📋 Nova Ocorrência</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>

            {/* Modal body - scrollable */}
            <div style={{ overflowY: 'auto', padding: '0 2rem', flex: 1 }}>
              <form id="ocorrencia-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>

                {/* Professor */}
                <div>
                  <label style={labelStyle}>Nome do Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
                  {professores && professores.length > 0 ? (
                    <select value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')}>
                      <option value="">Selecione...</option>
                      {professores.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <input type="text" placeholder="Nome completo" value={form.professor}
                      onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')} />
                  )}
                  {errors.professor && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.professor}</span>}
                </div>

                {/* Disciplina + Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Disciplina <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" placeholder="Ex: Matemática" value={form.disciplina}
                      onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))} style={inputStyle('disciplina')} />
                    {errors.disciplina && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.disciplina}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Data <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" value={form.data}
                      onChange={e => setForm(p => ({ ...p, data: e.target.value }))} style={inputStyle('data')} />
                    {errors.data && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.data}</span>}
                  </div>
                </div>

                {/* Turma */}
                {turmas && turmas.length > 0 && (
                  <div>
                    <label style={labelStyle}>Turma <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={form.turma} onChange={e => handleTurmaChange(e.target.value)} style={inputStyle('turma')}>
                      <option value="">Selecione...</option>
                      {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>
                    {errors.turma && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.turma}</span>}
                  </div>
                )}

                {/* Alunos(as) — aparece quando uma turma é selecionada */}
                {form.turma && (
                  <div>
                    <label style={labelStyle}>
                      Alunos(as)
                      {form.alunos.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', background: '#6366f1', color: 'white', borderRadius: '20px', padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
                          {form.alunos.length} selecionado{form.alunos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </label>

                    {alunosDaTurma.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', margin: 0 }}>
                        Nenhum aluno cadastrado para esta turma nas Configurações.
                      </p>
                    ) : (
                      <div style={{
                        border: '1.5px solid #e2e8f0', borderRadius: '10px',
                        maxHeight: '200px', overflowY: 'auto',
                        display: 'flex', flexDirection: 'column'
                      }}>
                        {alunosDaTurma.map((aluno, idx) => {
                          const selected = form.alunos.includes(aluno.nome)
                          return (
                            <div
                              key={aluno.id}
                              onClick={() => toggleAluno(aluno.nome)}
                              role="checkbox"
                              aria-checked={selected}
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); toggleAluno(aluno.nome) } }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.55rem 0.9rem', cursor: 'pointer',
                                background: selected ? '#f0f0ff' : (idx % 2 === 0 ? '#fafafa' : 'white'),
                                borderBottom: idx < alunosDaTurma.length - 1 ? '1px solid #f1f5f9' : 'none',
                                transition: 'background 0.15s', userSelect: 'none'
                              }}
                            >
                              {/* Checkbox visual */}
                              <div style={{
                                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                                border: `2px solid ${selected ? '#6366f1' : '#cbd5e1'}`,
                                background: selected ? '#6366f1' : 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}>
                                {selected && (
                                  <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="2 7 5.5 10.5 12 3" />
                                  </svg>
                                )}
                              </div>
                              <span style={{ fontSize: '0.88rem', color: selected ? '#4338ca' : '#334155', fontWeight: selected ? 600 : 400 }}>
                                {aluno.nome}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Descrição */}
                <div>
                  <label style={labelStyle}>Descrição da Ocorrência <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    placeholder="Descreva o que aconteceu em sala de aula..."
                    value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle('descricao'), resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                  />
                  {errors.descricao && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.descricao}</span>}
                </div>

                {/* Ação do professor(a) */}
                <div>
                  <label style={labelStyle}>Ação do Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    placeholder="Descreva as medidas tomadas em sala de aula..."
                    value={form.acao_professor}
                    onChange={e => setForm(p => ({ ...p, acao_professor: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle('acao_professor'), resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                  />
                  {errors.acao_professor && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.acao_professor}</span>}
                </div>


              </form>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '1rem 2rem 1.5rem', display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button type="button" onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
                Cancelar
              </button>
              <button type="submit" form="ocorrencia-form" disabled={saving}
                style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : '✓ Registrar Ocorrência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
