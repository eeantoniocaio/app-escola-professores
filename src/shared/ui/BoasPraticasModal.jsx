import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BoasPraticasModal({ isOpen, onClose, professores = [], turmas = [] }) {
  const [professor, setProfessor] = useState('');
  const [serie, setSerie] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState(new Date().toISOString().split('T')[0]);
  const [relato, setRelato] = useState('');
  const [habilidade, setHabilidade] = useState('');
  const [linkDrive, setLinkDrive] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentStep(1);
      setErrors({});
      if (firstInputRef.current) {
        setTimeout(() => firstInputRef.current.focus(), 150);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!professor) e.professor = 'Campo obrigatório';
      if (!serie) e.serie = 'Campo obrigatório';
      if (!dataRealizacao) e.dataRealizacao = 'Campo obrigatório';
      if (!habilidade?.trim()) e.habilidade = 'Campo obrigatório';
    } else if (step === 2) {
      if (!relato?.trim()) e.relato = 'Campo obrigatório';
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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('boas_praticas').insert([{
      professor,
      serie,
      data_realizacao: dataRealizacao,
      relato,
      habilidade,
      link_drive: linkDrive.trim() || null
    }]);

    setSaving(false);

    if (error) {
      console.error(error);
      alert('Erro ao salvar as Boas Práticas. Tente novamente.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProfessor('');
        setSerie('');
        setDataRealizacao(new Date().toISOString().split('T')[0]);
        setRelato('');
        setHabilidade('');
        setLinkDrive('');
        setCurrentStep(1);
        setErrors({});
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  const getInputStyle = (field) => ({
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '10px',
    border: `1.5px solid ${errors[field] ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
  });

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#475569',
    marginBottom: '0.35rem',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if(e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🌟</span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Registro de Boas Práticas</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <X size={24} />
          </button>
        </div>

        {/* Progress indicator */}
        {!success && (
          <div style={{ padding: '1.5rem 4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
            {[
              { num: 1, label: 'Contexto' },
              { num: 2, label: 'Relato' }
            ].map((step, idx, arr) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              const color = isCompleted ? '#10b981' : (isCurrent ? '#3b82f6' : '#cbd5e1');
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
        )}

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'scaleIn 0.5s ease-out' }}>✨</div>
              <h3 style={{ color: '#16a34a', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Prática Registrada!</h3>
              <p style={{ color: '#64748b' }}>Muito obrigado por compartilhar essa boa prática.</p>
            </div>
          ) : (
            <form 
              id="boas-praticas-form"
              onSubmit={handleSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  if (currentStep < 2) {
                    handleNextStep();
                  }
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              
              {/* Step 1: Contexto */}
              <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={professor}
                      onChange={e => setProfessor(e.target.value)}
                      style={getInputStyle('professor')}
                      ref={firstInputRef}
                    >
                      <option value="" disabled>Selecione um professor</option>
                      {professores.map(p => (
                        <option key={p.nome || p} value={p.nome || p}>{p.nome || p}</option>
                      ))}
                    </select>
                    {errors.professor && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.professor}</span>}
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Série / Turma <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      value={serie}
                      onChange={e => setSerie(e.target.value)}
                      style={getInputStyle('serie')}
                    >
                      <option value="" disabled>Selecione a série</option>
                      {turmas.map(t => (
                        <option key={t.id || t} value={t.nome || t}>{t.nome || t}</option>
                      ))}
                    </select>
                    {errors.serie && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.serie}</span>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Data da Realização <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    value={dataRealizacao}
                    onChange={e => setDataRealizacao(e.target.value)}
                    style={getInputStyle('dataRealizacao')}
                  />
                  {errors.dataRealizacao && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.dataRealizacao}</span>}
                </div>

                <div>
                  <label style={labelStyle}>Habilidade Desenvolvida <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: EF06MA02, Leitura crítica..."
                    value={habilidade}
                    onChange={e => setHabilidade(e.target.value)}
                    style={getInputStyle('habilidade')}
                  />
                  {errors.habilidade && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.habilidade}</span>}
                </div>
              </div>

              {/* Step 2: Relato */}
              <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                <div>
                  <label style={labelStyle}>Relato da Prática <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    placeholder="Descreva brevemente como a prática foi realizada, quais foram os resultados e a receptividade dos alunos..."
                    value={relato}
                    onChange={e => setRelato(e.target.value)}
                    style={{ ...getInputStyle('relato'), minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  {errors.relato && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.relato}</span>}
                </div>

                <div>
                  <label style={labelStyle}>Link de Drive <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="url"
                    placeholder="Cole o link do Google Drive, OneDrive, etc."
                    value={linkDrive}
                    onChange={e => setLinkDrive(e.target.value)}
                    style={getInputStyle('linkDrive')}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                    Se o registro estiver em algum drive, pode compartilhar o link aqui.
                  </span>
                </div>

                <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.5, marginTop: '0.5rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#b45309' }}>Atenção:</strong>
                  Guarde as fotos, vídeos e outros registros das práticas desenvolvidas, pois a Coordenação poderá solicitá-los.
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Modal footer */}
        {!success && (
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
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    color: '#1e293b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  color: '#1e293b',
                  fontWeight: 600,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Cancelar
              </button>
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Próximo <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="boas-praticas-form"
                  disabled={saving}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => { if(!saving) e.currentTarget.style.backgroundColor = '#1d4ed8' }}
                  onMouseOut={(e) => { if(!saving) e.currentTarget.style.backgroundColor = '#2563eb' }}
                >
                  {saving ? 'Salvando...' : <><Check size={16} /> Salvar Prática</>}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
