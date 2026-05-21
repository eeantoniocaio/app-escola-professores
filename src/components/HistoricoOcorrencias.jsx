import React, { useState, useMemo, useCallback } from 'react'
import { exportOcorrenciasCSV, exportOcorrenciasPDF } from '../utils/exportOcorrencias'
export default function HistoricoOcorrencias({ setView, ocorrencias, professores, turmas, deleteOcorrencia, updateOcorrencia, userRole }) {
  const [hoveredBtn, setHoveredBtn] = useState(null)
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null)
  const [intervencaoText, setIntervencaoText] = useState('')
  const [savingIntervencao, setSavingIntervencao] = useState(false)

  // Filters
  const [filterProf, setFilterProf] = useState('')
  const [filterDisciplina, setFilterDisciplina] = useState('')
  const [filterTurma, setFilterTurma] = useState('')
  const [filterAluno, setFilterAluno] = useState('')
  const [filterData, setFilterData] = useState('')

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
    border: `1.5px solid #e2e8f0`,
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
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Histórico de Ocorrências</h2>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, marginLeft: '2.5rem', fontSize: '0.9rem' }}>
            {filtered.length} ocorrência{filtered.length !== 1 ? 's' : ''} registrada{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => exportOcorrenciasCSV(filtered)} 
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, background: '#fff', border: '1px solid #f2bbc9', color: '#8b3a52', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Exportar CSV
          </button>
          <button 
            onClick={() => exportOcorrenciasPDF(filtered, { filterProf, filterDisciplina, filterTurma, filterAluno, filterData })} 
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, background: '#f2bbc9', border: 'none', color: '#8b3a52', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6aebc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f2bbc9'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
            </svg>
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'white', padding: '1rem 1.25rem', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Professor(a)</label>
          <select value={filterProf} onChange={e => setFilterProf(e.target.value)}
            style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
            <option value="">Todos</option>
            {professores && professores.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
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
            <select value={filterTurma} onChange={e => { setFilterTurma(e.target.value); setFilterAluno(''); }}
              style={{ ...inputStyle(), width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
              <option value="">Todas</option>
              {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
        )}
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
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(o => {
            const isGestao = userRole === 'gestao'
            return (
            <div key={o.id} 
              onClick={() => {
                if (isGestao) {
                  setSelectedOcorrencia(o)
                  setIntervencaoText(o.intervencao_gestao || '')
                }
              }}
              style={{
                background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                cursor: isGestao ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
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
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', background: '#f0fdf4', borderRadius: '8px', padding: '0.6rem 0.85rem', borderLeft: '3px solid #22c55e', marginBottom: o.intervencao_gestao ? '0.5rem' : 0 }}>
                    <span style={{ fontWeight: 700, marginRight: '0.35rem' }}>⚡ Ação:</span>{o.acao_professor}
                  </p>
                )}
                {o.intervencao_gestao && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#4c1d95', background: '#ede9fe', borderRadius: '8px', padding: '0.6rem 0.85rem', borderLeft: '3px solid #8b5cf6' }}>
                    <span style={{ fontWeight: 700, marginRight: '0.35rem' }}>🛡️ Intervenção da Gestão:</span>{o.intervencao_gestao}
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
            )
          })}
        </div>
      )}

      {/* Modal Intervenção Gestão */}
      {selectedOcorrencia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedOcorrencia(null) }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🛡️</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>Intervenção da Gestão</h3>
              </div>
              <button onClick={() => setSelectedOcorrencia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{selectedOcorrencia.professor} - {selectedOcorrencia.turma}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>{new Date(selectedOcorrencia.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}><strong>Descrição:</strong> {selectedOcorrencia.descricao}</div>
                <div style={{ fontSize: '0.9rem', color: '#166534' }}><strong>Ação do Prof:</strong> {selectedOcorrencia.acao_professor}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Intervenção da Gestão</label>
                <textarea
                  placeholder="Descreva as ações ou observações da gestão sobre esta ocorrência..."
                  value={intervencaoText}
                  onChange={e => setIntervencaoText(e.target.value)}
                  rows={5}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ padding: '1.25rem 2rem', display: 'flex', gap: '0.75rem', flexShrink: 0, borderTop: '1px solid #f1f5f9' }}>
              <button type="button" onClick={() => setSelectedOcorrencia(null)} style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.95rem' }}>
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={savingIntervencao}
                onClick={async () => {
                  setSavingIntervencao(true)
                  await updateOcorrencia(selectedOcorrencia.id, intervencaoText.trim())
                  setSavingIntervencao(false)
                  setSelectedOcorrencia(null)
                }}
                style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', opacity: savingIntervencao ? 0.7 : 1 }}>
                {savingIntervencao ? 'Salvando...' : '✓ Salvar Intervenção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
