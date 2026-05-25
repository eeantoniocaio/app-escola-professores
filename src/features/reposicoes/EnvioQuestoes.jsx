import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestoes } from './hooks/useQuestoes';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const EMPTY_FORM = { 
  professor: '', 
  disciplina: '', 
  turma: '', 
  data: '', 
  habilidade: '',
  enunciado: '', 
  imagem_base64: '',
  numAlternativas: '4', // default 4
  alternativas: { A: '', B: '', C: '', D: '', E: '' } 
};

export default function EnvioQuestoes() {
  const navigate = useNavigate();
  const { questoes, addQuestao, deleteQuestao } = useQuestoes();
  const { professores, turmas } = useGlobalData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const letrasAlternativas = ['A', 'B', 'C', 'D', 'E'];

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.professor.trim()) e.professor = 'Campo obrigatório';
      if (!form.disciplina.trim()) e.disciplina = 'Campo obrigatório';
      if (!form.turma) e.turma = 'Campo obrigatório';
      if (!form.data) e.data = 'Campo obrigatório';
      if (!form.habilidade?.trim()) e.habilidade = 'Campo obrigatório';
    } else if (step === 2) {
      if (!form.enunciado.trim()) e.enunciado = 'Campo obrigatório';
      
      const num = parseInt(form.numAlternativas, 10);
      for (let i = 0; i < num; i++) {
        const letra = letrasAlternativas[i];
        if (!form.alternativas[letra].trim()) {
          e[`alternativa_${letra}`] = 'Campo obrigatório';
        }
      }
    }
    return e;
  };

  const handleNextStep = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(2);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setSaving(true);
    await addQuestao({
      professor: form.professor.trim(),
      disciplina: form.disciplina.trim(),
      turma: form.turma,
      data: form.data,
      habilidade: form.habilidade.trim(),
      enunciado: form.enunciado.trim(),
      num_alternativas: parseInt(form.numAlternativas, 10),
      alternativas: form.alternativas,
      imagem_base64: form.imagem_base64 || null
    });
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
    setSaving(false);
    setCurrentStep(1);
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', transition: 'border-color 0.2s'
  });

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} title="Voltar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Questões de reposições</h2>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, marginLeft: '2.5rem', fontSize: '0.9rem' }}>
            {questoes.length} questão(ões) enviada(s)
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setErrors({}); setCurrentStep(1); setShowModal(true); }}
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span> Nova Questão
        </button>
      </div>

      {/* List */}
      {questoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma questão enviada ainda.</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>Clique em "+ Nova Questão" para criar uma.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {questoes && questoes.map(q => (
            <div key={q.id} style={{ background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', paddingRight: '2rem' }}>{q.disciplina}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {q.habilidade && <span style={{ background: '#fef08a', color: '#854d0e', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{q.habilidade}</span>}
                  <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{q.turma}</span>
                </div>
              </div>
              <button 
                onClick={() => deleteQuestao && deleteQuestao(q.id)}
                style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
                title="Excluir"
              >
                ✕
              </button>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Por {q.professor} em {new Date(q.data + 'T12:00:00').toLocaleDateString('pt-BR')}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {q.enunciado}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                {q.num_alternativas} Alternativas
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Modal header */}
            <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📝</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Nova Questão</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <X size={24} />
              </button>
            </div>

            {/* Progress indicator */}
            <div style={{ padding: '1.5rem 4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
              {[
                { num: 1, label: 'Contexto' },
                { num: 2, label: 'Questão' }
              ].map((step, idx, arr) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const color = isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#e2e8f0');
                const textColor = isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#94a3b8');
                const bgColor = isCompleted || isCurrent ? color : '#f8fafc';
                
                return (
                  <React.Fragment key={step.num}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, color: (isCompleted || isCurrent) ? '#fff' : '#94a3b8', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}>
                        {isCompleted ? <Check size={20} strokeWidth={3} /> : step.num}
                      </div>
                      <span style={{ position: 'absolute', top: '44px', fontSize: '0.85rem', fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > step.num ? '#10b981' : '#e2e8f0', margin: '0 8px', transition: 'all 0.3s', alignSelf: 'flex-start', marginTop: '17px' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1 }}>
              <form 
                id="questao-form" 
                onSubmit={handleSubmit} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    if (currentStep < 2) {
                      handleNextStep();
                    }
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1rem' }}
              >
                
                {/* Step 1: Contexto */}
                <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  
                  {/* Professor */}
                  <div>
                    <label style={labelStyle}>Nome do Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
                    {professores && professores.length > 0 ? (
                      <select value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')}>
                        <option value="">Selecione...</option>
                        {professores.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder="Nome completo" value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')} />
                    )}
                    {errors.professor && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.professor}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Disciplina */}
                    <div>
                      <label style={labelStyle}>Disciplina <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="Ex: Matemática" value={form.disciplina} onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))} style={inputStyle('disciplina')} />
                      {errors.disciplina && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.disciplina}</span>}
                    </div>
                    
                    {/* Turma */}
                    <div>
                      <label style={labelStyle}>Turma <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.turma} onChange={e => setForm(p => ({ ...p, turma: e.target.value }))} style={inputStyle('turma')}>
                        <option value="">Selecione...</option>
                        {turmas && turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                      </select>
                      {errors.turma && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.turma}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Data */}
                    <div>
                      <label style={labelStyle}>Data de envio <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} style={inputStyle('data')} />
                      {errors.data && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.data}</span>}
                    </div>
                    
                    {/* Habilidade */}
                    <div>
                      <label style={labelStyle}>Habilidade <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="Ex: EF06MA02" value={form.habilidade} onChange={e => setForm(p => ({ ...p, habilidade: e.target.value }))} style={inputStyle('habilidade')} />
                      {errors.habilidade && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.habilidade}</span>}
                    </div>
                  </div>
                </div>

                {/* Step 2: Questão */}
                <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  
                  {/* Enunciado */}
                  <div>
                    <label style={labelStyle}>Enunciado <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea
                      placeholder="Digite o enunciado da questão..."
                      value={form.enunciado}
                      onChange={e => setForm(p => ({ ...p, enunciado: e.target.value }))}
                      rows={4}
                      style={{ ...inputStyle('enunciado'), resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }}
                    />
                    {errors.enunciado && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.enunciado}</span>}
                  </div>

                  <div>
                    {/* Numero de Alternativas */}
                    <label style={labelStyle}>Nº de alternativas <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={form.numAlternativas} onChange={e => setForm(p => ({ ...p, numAlternativas: e.target.value }))} style={inputStyle('numAlternativas')}>
                      <option value="1">1 alternativa</option>
                      <option value="2">2 alternativas</option>
                      <option value="3">3 alternativas</option>
                      <option value="4">4 alternativas</option>
                      <option value="5">5 alternativas</option>
                    </select>
                  </div>

                  {/* Alternativas Dinamicas */}
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ ...labelStyle, fontSize: '0.9rem', marginBottom: '1rem', color: '#1e293b' }}>Alternativas</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Array.from({ length: parseInt(form.numAlternativas, 10) }).map((_, i) => {
                        const letra = letrasAlternativas[i];
                        return (
                          <div key={letra} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 800, color: '#64748b', marginTop: '0.5rem', width: '20px' }}>{letra})</span>
                            <div style={{ flex: 1 }}>
                              <textarea
                                placeholder={`Texto da alternativa ${letra}...`}
                                value={form.alternativas[letra]}
                                onChange={e => setForm(p => ({
                                  ...p,
                                  alternativas: { ...p.alternativas, [letra]: e.target.value }
                                }))}
                                rows={2}
                                style={{ ...inputStyle(`alternativa_${letra}`), resize: 'vertical', minHeight: '50px', fontFamily: 'inherit' }}
                              />
                              {errors[`alternativa_${letra}`] && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors[`alternativa_${letra}`]}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Imagem da Questão */}
                  <div>
                    <label style={labelStyle}>Imagem da Questão <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                    {form.imagem_base64 ? (
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                        <img
                          src={form.imagem_base64}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block', background: '#f8fafc' }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, imagem_base64: '' }))}
                          style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                            width: '28px', height: '28px', cursor: 'pointer', color: 'white',
                            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Remover imagem"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px',
                        padding: '1.5rem', cursor: 'pointer', background: '#f8fafc',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#94a3b8" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Clique para selecionar uma imagem</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>PNG, JPG ou JPEG — máx. 2MB</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Imagem muito grande! O tamanho máximo é 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = ev => setForm(p => ({ ...p, imagem_base64: ev.target.result }));
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '1.25rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexShrink: 0,
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px'
            }}>
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    style={{
                      padding: '0.65rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'white',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '0.95rem'
                    }}
                  >
                    <ChevronLeft size={18} /> Voltar
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#64748b',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                {currentStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{
                      padding: '0.65rem 1.5rem',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    Próximo <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="questao-form"
                    disabled={saving}
                    style={{
                      padding: '0.65rem 1.5rem',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      opacity: saving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {saving ? 'Salvando...' : <><Check size={18} /> Salvar Questão</>}
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
