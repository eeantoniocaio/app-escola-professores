import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import { DIAS_SEMANA_MAP } from './Projetos';

export default function ProjetoHorarioModal({ isOpen, onClose, onSuccess, projetoId, horarioToEdit = null }) {
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const [diaSemana, setDiaSemana] = useState(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [local, setLocal] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (horarioToEdit) {
      setDiaSemana(horarioToEdit.dia_semana || 1);
      setHoraInicio(horarioToEdit.hora_inicio ? horarioToEdit.hora_inicio.slice(0, 5) : '');
      setHoraFim(horarioToEdit.hora_fim ? horarioToEdit.hora_fim.slice(0, 5) : '');
      setLocal(horarioToEdit.local || '');
    } else {
      setDiaSemana(1);
      setHoraInicio('');
      setHoraFim('');
      setLocal('');
    }
  }, [horarioToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Acesso negado. Apenas Gestão e Secretaria podem gerenciar horários.', 'error');
      return;
    }

    if (!diaSemana || diaSemana < 1 || diaSemana > 7) {
      showToast('Selecione um dia da semana válido.', 'warning');
      return;
    }

    if (horaInicio && horaFim && horaFim < horaInicio) {
      showToast('A hora final não pode ser anterior à hora inicial.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projeto_id: projetoId,
        dia_semana: Number(diaSemana),
        hora_inicio: horaInicio ? `${horaInicio}:00` : null,
        hora_fim: horaFim ? `${horaFim}:00` : null,
        local: local.trim() || null
      };

      if (horarioToEdit?.id) {
        const { error } = await supabase
          .from('projetos_horarios')
          .update(payload)
          .eq('id', horarioToEdit.id);

        if (error) throw error;
        showToast('Horário atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('projetos_horarios')
          .insert([payload]);

        if (error) throw error;
        showToast('Horário adicionado com sucesso!', 'success');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar horário:', err);
      showToast('Erro ao salvar horário no banco de dados.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '460px',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Calendar color="var(--color-primary)" />
            {horarioToEdit ? 'Editar Horário' : 'Adicionar Horário'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Dia da Semana *
            </label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(Number(e.target.value))}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            >
              {Object.entries(DIAS_SEMANA_MAP).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Hora Inicial
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Hora Final
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Local Específico (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Sala Maker / Quadra B"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '500', cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'var(--color-primary)', color: '#FFF', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {horarioToEdit ? 'Salvar Horário' : 'Adicionar Horário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
