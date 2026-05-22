import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function BoasPraticasModal({ isOpen, onClose, professores = [], turmas = [] }) {
  const [professor, setProfessor] = useState('');
  const [serie, setSerie] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState(new Date().toISOString().split('T')[0]);
  const [relato, setRelato] = useState('');
  const [habilidade, setHabilidade] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (firstInputRef.current) {
        setTimeout(() => firstInputRef.current.focus(), 150);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!professor || !serie || !dataRealizacao || !relato || !habilidade) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('boas_praticas').insert([{
      professor,
      serie,
      data_realizacao: dataRealizacao,
      relato,
      habilidade
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
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
  };

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
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'scaleIn 0.5s ease-out' }}>✨</div>
              <h3 style={{ color: '#16a34a', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Prática Registrada!</h3>
              <p style={{ color: '#64748b' }}>Muito obrigado por compartilhar essa boa prática.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Professor(a)</label>
                  <select
                    value={professor}
                    onChange={e => setProfessor(e.target.value)}
                    style={inputStyle}
                    ref={firstInputRef}
                    required
                  >
                    <option value="" disabled>Selecione um professor</option>
                    {professores.map(p => (
                      <option key={p.nome || p} value={p.nome || p}>{p.nome || p}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={labelStyle}>Série / Turma</label>
                  <select
                    value={serie}
                    onChange={e => setSerie(e.target.value)}
                    style={inputStyle}
                    required
                  >
                    <option value="" disabled>Selecione a série</option>
                    {turmas.map(t => (
                      <option key={t.id || t} value={t.nome || t}>{t.nome || t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Data da Realização</label>
                <input
                  type="date"
                  value={dataRealizacao}
                  onChange={e => setDataRealizacao(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Habilidade Desenvolvida</label>
                <input
                  type="text"
                  placeholder="Ex: EF06MA02, Leitura crítica..."
                  value={habilidade}
                  onChange={e => setHabilidade(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Relato da Prática</label>
                <textarea
                  placeholder="Descreva brevemente como a prática foi realizada, quais foram os resultados e a receptividade dos alunos..."
                  value={relato}
                  onChange={e => setRelato(e.target.value)}
                  style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.5, marginTop: '0.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#b45309' }}>Atenção:</strong>
                Guarde as fotos, vídeos e outros registros das práticas desenvolvidas, pois a Coordenação poderá solicitá-los.
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.65rem 1.25rem', borderRadius: '10px', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ background: '#10b981', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Salvando...' : 'Salvar Prática'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
