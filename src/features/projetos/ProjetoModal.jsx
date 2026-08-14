import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Loader2, Check } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import {
  PROJECT_CAPA_FAMILIES,
  DEFAULT_CAPA_COLOR,
  VALID_CAPA_HEX_SET,
  getProjectCapaColor
} from './projetoCapaColors';

export default function ProjetoModal({ isOpen, onClose, onSuccess, projetoToEdit = null }) {
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_CAPA_COLOR);
  const [ativo, setAtivo] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projetoToEdit) {
      setNome(projetoToEdit.nome || '');
      setSelectedColor(getProjectCapaColor(projetoToEdit.capa_url));
      setAtivo(projetoToEdit.ativo !== false);
    } else {
      setNome('');
      setSelectedColor(DEFAULT_CAPA_COLOR);
      setAtivo(true);
    }
  }, [projetoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Acesso negado. Apenas Gestão e Secretaria podem alterar projetos.', 'error');
      return;
    }

    const cleanNome = nome.trim();
    if (!cleanNome) {
      showToast('O nome do projeto é obrigatório.', 'warning');
      return;
    }

    // Validação estrita do código hexadecimal da cor contra valores permitidos
    const colorToSave = VALID_CAPA_HEX_SET.has(selectedColor.toLowerCase())
      ? selectedColor.toUpperCase()
      : DEFAULT_CAPA_COLOR;

    setSubmitting(true);
    try {
      const payload = {
        nome: cleanNome,
        capa_url: colorToSave,
        ativo: Boolean(ativo),
        updated_at: new Date().toISOString()
      };

      if (projetoToEdit?.id) {
        const { error } = await supabase
          .from('projetos')
          .update(payload)
          .eq('id', projetoToEdit.id);

        if (error) throw error;
        showToast('Projeto atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('projetos')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        showToast('Projeto criado com sucesso!', 'success');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar projeto:', err);
      const msg = err?.message || err?.error_description || 'Erro ao salvar projeto no banco de dados.';
      showToast(`Erro ao salvar projeto: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '560px',
          maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FolderKanban color="var(--color-primary)" />
            {projetoToEdit ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Campo Nome */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Robótica Educacional"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Seletor Visual de Cores */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Cor da Capa
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} role="radiogroup" aria-label="Seletor de cor da capa">
              {PROJECT_CAPA_FAMILIES.map((familia) => (
                <div key={familia.nome} className="projeto-color-family-group">
                  <div className="projeto-color-family-label">
                    <span>{familia.icone}</span>
                    <span>{familia.nome}</span>
                  </div>
                  <div className="projeto-color-swatches-row">
                    {familia.cores.map((cor) => {
                      const isSelected = selectedColor.toLowerCase() === cor.hex.toLowerCase();
                      return (
                        <button
                          key={cor.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Cor ${cor.nome}`}
                          title={`${cor.nome} (${cor.hex})`}
                          tabIndex={0}
                          onClick={() => setSelectedColor(cor.hex)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedColor(cor.hex);
                            }
                          }}
                          className={`projeto-color-swatch-btn ${isSelected ? 'selected' : ''}`}
                          style={{ backgroundColor: cor.hex }}
                        >
                          {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prévia da Capa */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prévia do Card
            </label>
            <div
              className="projeto-capa-preview-banner"
              style={{ backgroundColor: selectedColor }}
            >
              <FolderKanban size={40} color="rgba(255,255,255,0.85)" />
              <span className="projeto-capa-preview-title">
                {nome.trim() || 'Nome do Projeto'}
              </span>
            </div>
          </div>

          {/* Status Ativo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="chkAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="chkAtivo" style={{ fontSize: '0.9375rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              Projeto Ativo
            </label>
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
              {projetoToEdit ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
