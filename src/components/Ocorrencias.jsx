import React, { useState, useMemo, useCallback } from 'react'

const EMPTY_FORM = { professor: '', disciplina: '', data: '', turma: '', descricao: '', alunos: [], acao_professor: '' }

export default function Ocorrencias({ onClose, professores, turmas, alunos, addOcorrencia }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

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
    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      if (onClose) onClose()
    }, 2000)
  }

  const handleTurmaChange = (turma) => {
    setForm(prev => ({ ...prev, turma, alunos: [] })) // limpa alunos ao mudar turma
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', transition: 'border-color 0.2s', fontFamily: 'inherit'
  })

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUp 0.3s ease-out' }}>

        {/* Modal header */}
        <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>Nova Ocorrência</h3>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.6rem', lineHeight: 1, padding: '0.2rem' }}>×</button>
          )}
        </div>

        {/* Modal body - scrollable */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1 }}>
          {success && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, animation: 'slideDown 0.3s' }}>
              <span>✅</span> Ocorrência salva com sucesso! Fechando...
            </div>
          )}

          <form id="ocorrencia-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1rem', display: success ? 'none' : 'flex' }}>

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

          </form>
        </div>

        {/* Modal footer */}
        {!success && (
          <div style={{ padding: '1.25rem 2rem', display: 'flex', gap: '1rem', flexShrink: 0, borderTop: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: '0 0 20px 20px' }}>
            {onClose && (
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '0.85rem', border: '1.5px solid #cbd5e1', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
                Cancelar
              </button>
            )}
            <button type="submit" form="ocorrencia-form" disabled={saving}
              style={{ flex: 2, padding: '0.85rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : '✓ Registrar Ocorrência'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
