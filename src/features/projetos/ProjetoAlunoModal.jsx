import React, { useState } from 'react';
import { X, Search, Users, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function ProjetoAlunoModal({ isOpen, onClose, onSuccess, projetoId, existingStudentIds = [] }) {
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [addingStudentId, setAddingStudentId] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Apenas Gestão e Secretaria podem pesquisar alunos.', 'warning');
      return;
    }

    const cleanTerm = term ? term.trim() : '';
    if (!cleanTerm || cleanTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const { data, error } = await supabase
        .rpc('buscar_alunos_projetos', { p_termo: cleanTerm });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Erro ao buscar alunos via RPC:', err);
      showToast('Erro ao buscar alunos.', 'error');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddStudent = async (student) => {
    if (!student || !projetoId) return;

    if (userRole !== 'gestao' && userRole !== 'secretaria') {
      showToast('Acesso negado. Apenas Gestão e Secretaria podem adicionar participantes.', 'error');
      return;
    }

    if (existingStudentIds.includes(student.id)) {
      showToast(`${student.nome} já está cadastrado neste projeto.`, 'warning');
      return;
    }

    setAddingStudentId(student.id);
    try {
      const { error } = await supabase
        .from('projetos_alunos')
        .insert([{
          projeto_id: projetoId,
          aluno_id: student.id
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showToast(`${student.nome} já está adicionado neste projeto.`, 'warning');
        } else {
          throw error;
        }
      } else {
        showToast(`${student.nome} adicionado ao projeto com sucesso!`, 'success');
        onSuccess && onSuccess(student.id);
      }
    } catch (err) {
      console.error('Erro ao adicionar aluno ao projeto:', err);
      showToast('Erro ao adicionar participante ao projeto.', 'error');
    } finally {
      setAddingStudentId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '540px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Users color="var(--color-primary)" />
            Adicionar Participante
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search style={{
            position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-light)', width: '1.125rem', height: '1.125rem'
          }} />
          <input
            type="text"
            placeholder="Digite o nome ou RA do aluno (min. 2 letras)..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9375rem'
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '180px', border: '1px solid var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
          {loadingSearch ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
              <Loader2 className="animate-spin" size={18} />
              <span>Buscando alunos...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {searchTerm.trim().length >= 2 ? 'Nenhum aluno encontrado.' : 'Digite pelo menos 2 caracteres para pesquisar.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {searchResults.map((student) => {
                const isAdded = existingStudentIds.includes(student.id);
                const isAdding = addingStudentId === student.id;

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--bg-secondary)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                        {student.nome}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Turma: {student.turma || '-'} {student.ra ? `• RA: ${student.ra}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded || isAdding}
                      onClick={() => handleAddStudent(student)}
                      style={{
                        padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)', border: 'none',
                        background: isAdded ? 'var(--color-success-bg)' : 'var(--color-primary)',
                        color: isAdded ? 'var(--color-success)' : '#FFF',
                        fontSize: '0.8125rem', fontWeight: '600', cursor: isAdded ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.35rem'
                      }}
                    >
                      {isAdding ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check size={14} />
                          Adicionado
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Adicionar
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
              background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '500', cursor: 'pointer'
            }}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
