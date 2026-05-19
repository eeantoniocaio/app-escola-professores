import React, { useState } from 'react'

const EMPTY_FORM = { professor: '', disciplina: '', data: '', turma: '', descricao: '' }

export default function Ocorrencias({ setView, ocorrencias, professores, turmas, addOcorrencia, deleteOcorrencia }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Filters
  const [filterProf, setFilterProf] = useState('')
  const [filterTurma, setFilterTurma] = useState('')
  const [filterData, setFilterData] = useState('')

  const validate = () => {
    const e = {}
    if (!form.professor.trim()) e.professor = 'Campo obrigatório'
    if (!form.disciplina.trim()) e.disciplina = 'Campo obrigatório'
    if (!form.data) e.data = 'Campo obrigatório'
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
    })
    setForm(EMPTY_FORM)
    setErrors({})
    setShowModal(false)
    setSaving(false)
  }

  const filtered = (ocorrencias || []).filter(o => {
    if (filterProf && !o.professor.toLowerCase().includes(filterProf.toLowerCase())) return false
    if (filterTurma && o.turma !== filterTurma) return false
    if (filterData && o.data !== filterData) return false
    return true
  })

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
            <button
              onClick={() => setView('home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              title="Voltar"
            >
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
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span> Nova Ocorrência
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'white', padding: '1rem 1.25rem', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Professor(a)</label>
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filterProf}
            onChange={e => setFilterProf(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}
          />
        </div>
        {turmas && turmas.length > 0 && (
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Turma</label>
            <select value={filterTurma} onChange={e => setFilterTurma(e.target.value)}
              style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
              <option value="">Todas</option>
              {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: '1 1 160px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Data</label>
          <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        {(filterProf || filterTurma || filterData) && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setFilterProf(''); setFilterTurma(''); setFilterData('') }}
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
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: o.descricao ? '0.75rem' : 0 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>📚</span> {o.disciplina}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>📅</span> {new Date(o.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {o.descricao && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.85rem', borderLeft: '3px solid #6366f1' }}>
                    {o.descricao}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteOcorrencia(o.id)}
                title="Excluir"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.25rem', transition: 'color 0.2s', flexShrink: 0 }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
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
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>📋 Nova Ocorrência</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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

              {/* Disciplina + Data (side by side) */}
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
                  <label style={labelStyle}>Turma</label>
                  <select value={form.turma} onChange={e => setForm(p => ({ ...p, turma: e.target.value }))} style={inputStyle('turma')}>
                    <option value="">Selecione (opcional)</option>
                    {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                  </select>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label style={labelStyle}>Descrição da Ocorrência</label>
                <textarea
                  placeholder="Descreva o que aconteceu em sala de aula..."
                  value={form.descricao}
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle('descricao'), resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Salvando...' : '✓ Registrar Ocorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
