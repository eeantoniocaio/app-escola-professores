import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, FolderKanban, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function ProjetoModal({ isOpen, onClose, onSuccess, projetoToEdit = null }) {
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [local, setLocal] = useState('');
  const [capaUrl, setCapaUrl] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTabCapa, setActiveTabCapa] = useState('url'); // 'url' | 'file'

  useEffect(() => {
    if (projetoToEdit) {
      setNome(projetoToEdit.nome || '');
      setDescricao(projetoToEdit.descricao || '');
      setObjetivo(projetoToEdit.objetivo || '');
      setLocal(projetoToEdit.local || '');
      setCapaUrl(projetoToEdit.capa_url || '');
      setAtivo(projetoToEdit.ativo !== false);
    } else {
      setNome('');
      setDescricao('');
      setObjetivo('');
      setLocal('');
      setCapaUrl('');
      setAtivo(true);
    }
  }, [projetoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Apenas Gestão e Secretaria podem fazer upload de capas.', 'warning');
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      showToast('Formato de imagem não suportado. Utilize JPEG, PNG, WEBP ou GIF.', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5MB.', 'warning');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `capa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `projetos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('evidencias')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath);

      setCapaUrl(publicUrl);
      showToast('Imagem de capa enviada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro no upload da capa:', err);
      showToast('Erro ao fazer upload da imagem de capa.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

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

    if (capaUrl && capaUrl.trim()) {
      const urlTrim = capaUrl.trim();
      if (!urlTrim.startsWith('http://') && !urlTrim.startsWith('https://')) {
        showToast('A URL da capa deve iniciar com http:// ou https://', 'warning');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        nome: cleanNome,
        descricao: descricao.trim() || null,
        objetivo: objetivo.trim() || null,
        local: local.trim() || null,
        capa_url: capaUrl.trim() || null,
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
        const { data, error } = await supabase
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
      showToast('Erro ao salvar projeto no banco de dados.', 'error');
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
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '580px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FolderKanban color="var(--color-primary)" />
            {projetoToEdit ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
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

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Descrição Resumida
            </label>
            <textarea
              rows={3}
              placeholder="Breve resumo sobre o projeto..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Objetivo
            </label>
            <textarea
              rows={2}
              placeholder="Objetivos pedagógicos ou sociais do projeto..."
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Local Principal
            </label>
            <input
              type="text"
              placeholder="Ex: Laboratório de Informática / Quadra Coberta"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Imagem de Capa */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Imagem de Capa (Opcional)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTabCapa('url')}
                style={{
                  padding: '0.25rem 0.625rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                  border: '1px solid var(--border-light)',
                  background: activeTabCapa === 'url' ? 'var(--color-primary-light)' : 'transparent',
                  color: activeTabCapa === 'url' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                URL da Imagem
              </button>
              <button
                type="button"
                onClick={() => setActiveTabCapa('file')}
                style={{
                  padding: '0.25rem 0.625rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                  border: '1px solid var(--border-light)',
                  background: activeTabCapa === 'file' ? 'var(--color-primary-light)' : 'transparent',
                  color: activeTabCapa === 'file' ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                Upload de Imagem
              </button>
            </div>

            {activeTabCapa === 'url' ? (
              <input
                type="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={capaUrl}
                onChange={(e) => setCapaUrl(e.target.value)}
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
                }}
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ fontSize: '0.875rem' }}
                />
                {uploadingImage && (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Loader2 size={14} className="animate-spin" /> Enviando imagem...
                  </span>
                )}
              </div>
            )}

            {capaUrl && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img
                  src={capaUrl}
                  alt="Pré-visualização da capa"
                  style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setCapaUrl('')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Remover Capa
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
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
              disabled={submitting || uploadingImage}
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
