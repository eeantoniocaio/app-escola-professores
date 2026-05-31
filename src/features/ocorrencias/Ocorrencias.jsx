import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { useOcorrencias } from './hooks/useOcorrencias'
import { useGlobalData } from '../../app/providers/GlobalDataProvider'
import { useAuth } from '../../app/providers/AuthProvider'

const EMPTY_FORM = { professor: '', disciplina: '', data: '', turma: '', aula: '', descricao: '', alunos: [], acao_professor: '' }

export default function Ocorrencias({ isOpen, onClose, ocorrenciaToEdit = null }) {
  const { addOcorrencia, updateOcorrencia } = useOcorrencias();
  const { professores, turmas, alunos } = useGlobalData();
  const { userRole, userName } = useAuth();
  
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (ocorrenciaToEdit) {
        setForm({
          professor: ocorrenciaToEdit.professor || '',
          disciplina: ocorrenciaToEdit.disciplina || '',
          data: ocorrenciaToEdit.data || '',
          turma: ocorrenciaToEdit.turma || '',
          aula: ocorrenciaToEdit.aula || '',
          descricao: ocorrenciaToEdit.descricao || '',
          alunos: ocorrenciaToEdit.alunos || [],
          acao_professor: ocorrenciaToEdit.acao_professor || ''
        });
        setCurrentStep(1);
        setErrors({});
      } else {
        setForm({
          ...EMPTY_FORM,
          professor: (userRole !== 'gestao' && userName) ? userName : '',
          data: new Date().toISOString().split('T')[0]
        });
        setCurrentStep(1);
        setErrors({});
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, ocorrenciaToEdit, userRole, userName]);

  // Alunos da turma selecionada no formulário
  const alunosDaTurma = useMemo(
    () => (alunos || [])
      .filter(a => a && a.turma === form.turma && a.nome)
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '')),
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

  const validateStep = (step) => {
    const e = {}
    if (step === 1) {
      if (!form.professor.trim()) e.professor = 'Campo obrigatório'
      if (!form.disciplina.trim()) e.disciplina = 'Campo obrigatório'
      if (!form.data) e.data = 'Campo obrigatório'
      if (!form.turma) e.turma = 'Campo obrigatório'
      if (!form.aula) e.aula = 'Campo obrigatório'
    } else if (step === 3) {
      if (!form.descricao.trim()) e.descricao = 'Campo obrigatório'
      if (!form.acao_professor.trim()) e.acao_professor = 'Campo obrigatório'
    }
    return e
  }

  const handleNextStep = () => {
    const errs = validateStep(currentStep)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateStep(3)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)

    const payload = {
      professor: form.professor.trim(),
      disciplina: form.disciplina.trim(),
      data: form.data,
      turma: form.turma || null,
      aula: form.aula || null,
      descricao: form.descricao.trim() || null,
      alunos: form.alunos.length > 0 ? form.alunos : [],
      acao_professor: form.acao_professor.trim() || null,
      ...(userRole === 'gestao' && userName ? { gestor: userName } : {})
    }

    let successResult = false;
    if (ocorrenciaToEdit) {
      successResult = await updateOcorrencia(ocorrenciaToEdit.id, payload);
    } else {
      successResult = await addOcorrencia(payload);
    }

    setSaving(false)
    if (successResult) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setForm(EMPTY_FORM)
        setErrors({})
        setCurrentStep(1)
        if (onClose) onClose()
      }, 2000)
    }
  }

  const handleTurmaChange = (turma) => {
    setForm(prev => ({ ...prev, turma, alunos: [] })) // limpa alunos ao mudar turma
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
    border: `1px solid ${errors[field] ? 'var(--color-danger)' : 'var(--border-light)'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'var(--bg-card)', transition: 'border-color 0.2s', fontFamily: 'inherit'
  })

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose() }}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '650px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Modal header */}
        <div className="modal-header" style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-warning)' }}>
            <AlertTriangle size={24} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {ocorrenciaToEdit ? 'Editar Ocorrência' : 'Nova Ocorrência'}
            </h3>
          </div>
          {onClose && (
            <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {!success && (
          <div style={{ padding: '1.5rem 4rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[
              { num: 1, label: 'Contexto' },
              { num: 2, label: 'Alunos' },
              { num: 3, label: 'Relato' }
            ].map((step, idx, arr) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const color = isCompleted ? 'var(--color-success)' : (isCurrent ? '#3b82f6' : 'var(--border-light)');
              const textColor = isCompleted ? 'var(--color-success)' : (isCurrent ? '#3b82f6' : 'var(--text-muted)');
              const bgColor = isCompleted || isCurrent ? color : 'var(--bg-secondary)';
              
              return (
                <React.Fragment key={step.num}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, color: (isCompleted || isCurrent) ? '#fff' : 'var(--text-muted)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}>
                      {isCompleted ? <Check size={20} strokeWidth={3} /> : step.num}
                    </div>
                    <span style={{ position: 'absolute', top: '44px', fontSize: '0.85rem', fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > step.num ? 'var(--color-success)' : 'var(--border-light)', margin: '0 8px', transition: 'all 0.3s' }} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Modal body - scrollable */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1, overflowX: 'hidden' }}>
          {success && (
            <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, animation: 'slideDown 0.3s' }}>
              <CheckCircle2 size={20} /> Ocorrência salva com sucesso! Fechando...
            </div>
          )}

          <form id="ocorrencia-form" onSubmit={handleSubmit} style={{ flexDirection: 'column', gap: '1.25rem', paddingBottom: '1rem', display: success ? 'none' : 'flex' }}>
            
            {/* Step 1: Informações Básicas */}
            <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Professor(a) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  {userRole !== 'gestao' && userName ? (
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>
                      {userName}
                    </div>
                  ) : professores && professores.length > 0 ? (
                    <select value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} style={inputStyle('professor')}>
                      <option value="">Selecione...</option>
                      {professores.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <input type="text" placeholder="Nome completo" value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} style={inputStyle('professor')} />
                  )}
                  {errors.professor && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.professor}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Disciplina <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input type="text" placeholder="Ex: Matemática..." value={form.disciplina} onChange={e => setForm({...form, disciplina: e.target.value})} style={inputStyle('disciplina')} />
                  {errors.disciplina && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.disciplina}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Data da Ocorrência <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} style={inputStyle('data')} />
                  {errors.data && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.data}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Turma <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <select value={form.turma} onChange={e => handleTurmaChange(e.target.value)} style={inputStyle('turma')}>
                    <option value="">Selecione a turma...</option>
                    {turmas && turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                  </select>
                  {errors.turma && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.turma}</span>}
                </div>
                <div>
                  <label style={labelStyle}>Aula <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <select value={form.aula} onChange={e => setForm({...form, aula: e.target.value})} style={inputStyle('aula')}>
                    <option value="">Selecione...</option>
                    <option value="1ª">1ª</option>
                    <option value="2ª">2ª</option>
                    <option value="3ª">3ª</option>
                    <option value="4ª">4ª</option>
                    <option value="5ª">5ª</option>
                    <option value="6ª">6ª</option>
                    <option value="troca de aulas">troca de aulas</option>
                    <option value="recreio">recreio</option>
                  </select>
                  {errors.aula && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.aula}</span>}
                </div>
              </div>
            </div>

            {/* Step 2: Envolvidos */}
            <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
              {!form.turma ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <AlertTriangle size={32} color="var(--color-warning)" style={{ marginBottom: '1rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Por favor, selecione uma turma no passo anterior para ver a lista de alunos.</p>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <label style={{ ...labelStyle, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Alunos Envolvidos</span>
                    {form.alunos.length > 0 && (
                      <span style={{ fontSize: '0.75rem', background: 'var(--color-primary)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.6rem', fontWeight: 600 }}>
                        {form.alunos.length} selecionado(s)
                      </span>
                    )}
                  </label>
                  {alunosDaTurma.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Nenhum aluno cadastrado para esta turma.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                      {alunosDaTurma.map(a => {
                        const isSelected = form.alunos.includes(a.nome)
                        return (
                          <button
                            key={a.id} type="button"
                            onClick={() => toggleAluno(a.nome)}
                            style={{
                              background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                              color: isSelected ? 'white' : 'var(--text-main)',
                              border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-light)'}`,
                              borderRadius: '999px', padding: '0.35rem 0.85rem', fontSize: '0.85rem',
                              cursor: 'pointer', transition: 'var(--transition-fast)', fontWeight: 500,
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              boxShadow: isSelected ? 'none' : 'var(--shadow-sm)'
                            }}
                          >
                            {isSelected && <Check size={14} />} {a.nome}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Detalhamento */}
            <div style={{ display: currentStep === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
              <div>
                <label style={labelStyle}>Descrição da Ocorrência <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  placeholder="Descreva detalhadamente o que aconteceu em sala de aula..."
                  value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})}
                  rows={4} style={{ ...inputStyle('descricao'), resize: 'vertical' }}
                />
                {errors.descricao && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.descricao}</span>}
              </div>

              <div>
                <label style={labelStyle}>Intervenção pedagógica em sala de aula <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <textarea
                  placeholder="Quais ações foram tomadas em sala de aula para contornar ou resolver a situação?"
                  value={form.acao_professor} onChange={e => setForm({...form, acao_professor: e.target.value})}
                  rows={3} style={{ ...inputStyle('acao_professor'), resize: 'vertical' }}
                />
                {errors.acao_professor && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.acao_professor}</span>}
              </div>
            </div>

          </form>
        </div>

        {/* Modal footer */}
        {!success && (
          <div className="modal-footer" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexShrink: 0, borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
            <div>
              {currentStep > 1 && (
                <button className="btn btn-secondary" type="button" onClick={handlePrevStep} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-light)' }}>
                  <ChevronLeft size={18} /> Voltar
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {onClose && (
                <button className="btn btn-secondary" type="button" onClick={onClose} style={{ padding: '0.75rem 1.25rem', background: 'transparent', border: 'none' }}>
                  Cancelar
                </button>
              )}
              {currentStep < 3 ? (
                <button className="btn btn-primary" type="button" onClick={handleNextStep} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Próximo <ChevronRight size={18} />
                </button>
              ) : (
                <button className="btn btn-primary" type="submit" form="ocorrencia-form" disabled={saving} style={{ padding: '0.75rem 1.25rem', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {saving ? 'Salvando...' : <><Check size={18} /> {ocorrenciaToEdit ? 'Salvar Alterações' : 'Registrar Ocorrência'}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
