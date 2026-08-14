import React, { useState, useEffect } from 'react';
import { X, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function ProjetoResponsavelModal({ isOpen, onClose, onSuccess, projetoId, respToEdit = null }) {
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('professor');
  const [funcao, setFuncao] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (respToEdit) {
      setNome(respToEdit.nome || '');
      setTipo(respToEdit.tipo || 'professor');
      setFuncao(respToEdit.funcao || '');
    } else {
      setNome('');
      setTipo('professor');
      setFuncao('');
    }
  }, [respToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Acesso negado. Apenas Gestão e Secretaria podem gerenciar responsáveis.', 'error');
      return;
    }

    const cleanNome = nome.trim();
    if (!cleanNome) {
      showToast('O nome do responsável é obrigatório.', 'warning');
      return;
    }

    if (!['professor', 'funcionario', 'voluntario'].includes(tipo)) {
      showToast('Selecione um tipo de responsável válido.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        projeto_id: projetoId,
        nome: cleanNome,
        tipo: tipo,
        funcao: funcao.trim() || null
      };

      if (respToEdit?.id) {
        const { error } = await supabase
          .from('projetos_responsaveis')
          .update(payload)
          .eq('id', respToEdit.id);

        if (error) throw error;
        showToast('Responsável atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('projetos_responsaveis')
          .insert([payload]);

        if (error) throw error;
        showToast('Responsável adicionado com sucesso!', 'success');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar responsável:', err);
      const msg = err?.message || err?.error_description || 'Erro ao salvar responsável no banco de dados.';
      showToast(`Erro ao salvar responsável: ${msg}`, 'error');
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
            <UserCheck color="var(--color-primary)" />
            {respToEdit ? 'Editar Responsável' : 'Adicionar Responsável'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Nome do Responsável *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Profª Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            >
              <option value="professor">Professor(a)</option>
              <option value="funcionario">Funcionário(a)</option>
              <option value="voluntario">Voluntário(a)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Função no Projeto (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Coordenador Pedagógico / Tutor"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
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
              {respToEdit ? 'Salvar Responsável' : 'Adicionar Responsável'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
