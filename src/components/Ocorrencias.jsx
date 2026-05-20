import React, { useState, useMemo, useCallback } from 'react'

const EMPTY_FORM = { professor: '', disciplina: '', data: '', turma: '', descricao: '', alunos: [], acao_professor: '' }

export default function Ocorrencias({ setView, professores, turmas, alunos, addOcorrencia }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [filterAluno, setFilterAluno] = useState('')
  const [filterData, setFilterData] = useState('')

  // Alunos da turma selecionada no formulário
  const alunosDaTurma = useMemo(
    () => (alunos || []).filter(a => a.turma === form.turma).sort((a, b) => a.nome.localeCompare(b.nome)),
    [alunos, form.turma]
  )

  // Alunos da turma selecionada no filtro
  const alunosDoFiltro = useMemo(
    () => (alunos || []).filter(a => a.turma === filterTurma).sort((a, b) => a.nome.localeCompare(b.nome)),
    [alunos, filterTurma]
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
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleTurmaChange = (turma) => {
    setForm(prev => ({ ...prev, turma, alunos: [] })) // limpa alunos ao mudar turma
  }

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

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
            Preencha os dados abaixo para registrar uma nova ocorrência
          </p>
        </div>
      </div>

      {success && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, animation: 'slideDown 0.3s' }}>
          <span>✅</span> Ocorrência salva com sucesso!
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '24px', padding: '2.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form id="ocorrencia-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
              {professores && professores.length > 0 ? (
                <select value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} style={inputStyle('professor')}>
                  <option value="">Selecione...</option>
                  {professores.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Nome completo" value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} style={inputStyle('professor')} />
              )}
              {errors.professor && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.professor}</span>}
            </div>
            <div>
              <label style={labelStyle}>Disciplina <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" placeholder="Ex: Matemática..." value={form.disciplina} onChange={e => setForm({...form, disciplina: e.target.value})} style={inputStyle('disciplina')} />
              {errors.disciplina && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.disciplina}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Data da Ocorrência <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} style={inputStyle('data')} />
              {errors.data && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.data}</span>}
            </div>
            <div>
              <label style={labelStyle}>Turma <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.turma} onChange={e => handleTurmaChange(e.target.value)} style={inputStyle('turma')}>
                <option value="">Selecione a turma...</option>
                {turmas && turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
              </select>
              {errors.turma && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.turma}</span>}
            </div>
          </div>

          {form.turma && (
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ ...labelStyle, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Alunos Envolvidos</span>
                {form.alunos.length > 0 && (
                  <span style={{ fontSize: '0.75rem', background: '#6366f1', color: 'white', borderRadius: '20px', padding: '0.1rem 0.55rem', fontWeight: 700 }}>
                    {form.alunos.length} selecionado(s)
                  </span>
                )}
              </label>
              {alunosDaTurma.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>Nenhum aluno cadastrado para esta turma.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {alunosDaTurma.map(a => {
                    const isSelected = form.alunos.includes(a.nome)
                    return (
                      <button
                        key={a.id} type="button"
                        onClick={() => toggleAluno(a.nome)}
                        style={{
                          background: isSelected ? '#10b981' : 'white',
                          color: isSelected ? 'white' : '#475569',
                          border: `1.5px solid ${isSelected ? '#10b981' : '#cbd5e1'}`,
                          borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.82rem',
                          cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                      >
                        {isSelected && <span>✓</span>} {a.nome}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label style={labelStyle}>Descrição da Ocorrência <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              placeholder="Descreva detalhadamente o que aconteceu em sala de aula..."
              value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}
              rows={4} style={{ ...inputStyle('descricao'), resize: 'vertical' }}
            />
            {errors.descricao && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.descricao}</span>}
          </div>

          <div>
            <label style={labelStyle}>Intervenção pedagógica em sala de aula <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              placeholder="Quais ações foram tomadas em sala de aula para contornar ou resolver a situação?"
              value={form.acao_professor} onChange={e => setForm({...form, acao_professor: e.target.value})}
              rows={3} style={{ ...inputStyle('acao_professor'), resize: 'vertical' }}
            />
            {errors.acao_professor && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.acao_professor}</span>}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{ padding: '0.85rem 2rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : '✓ Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>
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

                {/* Intervenção pedagógica em sala de aula */}
                <div>
                  <label style={labelStyle}>Intervenção pedagógica em sala de aula <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    placeholder="Descreva as medidas tomadas em sala de aula..."
                    value={form.acao_professor}
                    onChange={e => setForm(p => ({ ...p, acao_professor: e.target.value }))}
                    rows={3}
                    style={{ ...inputStyle('acao_professor'), resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                  />
                  {errors.acao_professor && <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{errors.acao_professor}</span>}
                </div>


    </div>
  )
}
