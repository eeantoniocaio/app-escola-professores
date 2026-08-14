import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, UserCheck, 
  FolderKanban, Target, Info, Loader2, Plus, Edit2, Trash2, 
  Power, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import { DIAS_SEMANA_MAP, formatHorario } from './Projetos';
import ProjetoModal from './ProjetoModal';
import ProjetoHorarioModal from './ProjetoHorarioModal';
import ProjetoResponsavelModal from './ProjetoResponsavelModal';
import ProjetoAlunoModal from './ProjetoAlunoModal';
import './ProjetoDetalhe.css';

export function formatTipoResponsavel(tipo) {
  switch (tipo) {
    case 'professor':
      return 'Professor';
    case 'funcionario':
      return 'Funcionário';
    case 'voluntario':
      return 'Voluntário';
    default:
      return tipo || 'Responsável';
  }
}

export default function ProjetoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const isAdmin = userRole === 'gestao' || userRole === 'secretaria';

  const [projeto, setProjeto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados dos Modais Administráveis
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [horarioToEdit, setHorarioToEdit] = useState(null);

  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [respToEdit, setRespToEdit] = useState(null);

  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);

  const fetchProjetoDetalhe = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('projetos')
        .select(`
          id,
          nome,
          descricao,
          objetivo,
          local,
          capa_url,
          ativo,
          created_at,
          projetos_horarios (
            id,
            dia_semana,
            hora_inicio,
            hora_fim,
            local
          ),
          projetos_responsaveis (
            id,
            nome,
            tipo,
            funcao
          ),
          projetos_alunos (
            id,
            aluno_id,
            alunos (
              id,
              nome,
              turma,
              ra
            )
          )
        `)
        .eq('id', id);

      if (!isAdmin) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setProjeto(data);
    } catch (err) {
      console.error('Erro ao carregar detalhes do projeto:', err);
      showToast('Erro ao carregar detalhes do projeto ou acesso não autorizado.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, showToast]);

  useEffect(() => {
    fetchProjetoDetalhe();
  }, [fetchProjetoDetalhe]);

  // Ações de Administração do Projeto
  const handleToggleAtivo = async () => {
    if (!projeto || !isAdmin) return;
    const novoStatus = !projeto.ativo;
    try {
      const { error } = await supabase
        .from('projetos')
        .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', projeto.id);

      if (error) throw error;

      showToast(`Projeto ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`, 'success');
      fetchProjetoDetalhe();
    } catch (err) {
      console.error('Erro ao alterar status do projeto:', err);
      showToast('Erro ao alterar status do projeto.', 'error');
    }
  };

  const handleDeleteProjeto = async () => {
    if (!projeto || !isAdmin) return;
    const confirm = window.confirm(`Esta ação excluirá permanentemente o projeto "${projeto.nome}" e seus dados relacionados (horários, participantes e responsáveis).\n\nDeseja realmente prosseguir com a exclusão definitiva?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projeto.id);

      if (error) throw error;

      showToast('Projeto excluído com sucesso!', 'success');
      navigate('/projetos');
    } catch (err) {
      console.error('Erro ao excluir projeto:', err);
      showToast('Erro ao excluir projeto no banco de dados.', 'error');
    }
  };

  // Ações de Horários
  const handleDeleteHorario = async (horarioId) => {
    if (!isAdmin) return;
    const confirm = window.confirm('Deseja remover este horário do projeto?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('projetos_horarios')
        .delete()
        .eq('id', horarioId);

      if (error) throw error;
      showToast('Horário removido com sucesso!', 'success');
      fetchProjetoDetalhe();
    } catch (err) {
      console.error('Erro ao remover horário:', err);
      showToast('Erro ao remover horário.', 'error');
    }
  };

  // Ações de Responsáveis
  const handleDeleteResponsavel = async (respId) => {
    if (!isAdmin) return;
    const confirm = window.confirm('Deseja remover este responsável do projeto?');
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('projetos_responsaveis')
        .delete()
        .eq('id', respId);

      if (error) throw error;
      showToast('Responsável removido com sucesso!', 'success');
      fetchProjetoDetalhe();
    } catch (err) {
      console.error('Erro ao remover responsável:', err);
      showToast('Erro ao remover responsável.', 'error');
    }
  };

  // Ações de Alunos Participantes
  const handleDeleteAluno = async (projetoAlunoId, alunoNome) => {
    if (!isAdmin) return;
    const confirm = window.confirm(`Deseja remover o aluno "${alunoNome}" deste projeto?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('projetos_alunos')
        .delete()
        .eq('id', projetoAlunoId);

      if (error) throw error;
      showToast('Aluno removido do projeto com sucesso!', 'success');
      fetchProjetoDetalhe();
    } catch (err) {
      console.error('Erro ao remover aluno do projeto:', err);
      showToast('Erro ao remover participante.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="projetos-detalhe-container">
        <button className="projetos-back-btn" onClick={() => navigate('/projetos')}>
          <ArrowLeft size={16} />
          Voltar para Projetos
        </button>
        <div className="projetos-loading">
          <Loader2 className="animate-spin" />
          <span>Carregando detalhes do projeto...</span>
        </div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="projetos-detalhe-container">
        <button className="projetos-back-btn" onClick={() => navigate('/projetos')}>
          <ArrowLeft size={16} />
          Voltar para Projetos
        </button>
        <div className="projetos-empty-state">
          <FolderKanban />
          <h3>Projeto não encontrado</h3>
          <p>O projeto solicitado não existe ou você não possui autorização para visualizá-lo.</p>
        </div>
      </div>
    );
  }

  const horarios = projeto.projetos_horarios || [];
  const responsaveis = projeto.projetos_responsaveis || [];
  const vinculosAlunos = (projeto.projetos_alunos || []).filter(pa => pa.alunos);
  const existingStudentIds = vinculosAlunos.map(pa => pa.aluno_id);

  return (
    <div className="projetos-detalhe-container">
      <button className="projetos-back-btn" onClick={() => navigate('/projetos')}>
        <ArrowLeft size={16} />
        Voltar para Projetos
      </button>

      <div className="projetos-detalhe-card">
        {projeto.capa_url && (
          <img
            src={projeto.capa_url}
            alt={projeto.nome}
            className="projetos-detalhe-banner"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        <div className="projetos-detalhe-header">
          <div className="projetos-detalhe-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h1>{projeto.nome}</h1>
              {isAdmin && (
                <span className={`projeto-status-tag ${projeto.ativo ? 'ativo' : 'inativo'}`}>
                  {projeto.ativo ? 'Ativo' : 'Inativo'}
                </span>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="projetos-admin-actions">
              <button
                type="button"
                className="projetos-btn-action primary"
                onClick={() => setIsProjectModalOpen(true)}
              >
                <Edit2 size={14} />
                Editar Projeto
              </button>
              <button
                type="button"
                className={`projetos-btn-action ${projeto.ativo ? 'warning' : 'primary'}`}
                onClick={handleToggleAtivo}
              >
                <Power size={14} />
                {projeto.ativo ? 'Inativar' : 'Ativar'}
              </button>
              <button
                type="button"
                className="projetos-btn-action danger"
                onClick={handleDeleteProjeto}
              >
                <Trash2 size={14} />
                Excluir Definitivamente
              </button>
            </div>
          )}
        </div>

        {/* 1. SEÇÃO INFORMAÇÕES DO PROJETO */}
        <div className="projetos-detalhe-section">
          <div className="projetos-detalhe-section-header">
            <h2 className="projetos-detalhe-section-title">
              <Info />
              Sobre o Projeto
            </h2>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              DESCRIÇÃO
            </strong>
            <p className="projetos-text-block">
              {projeto.descricao || 'Nenhuma descrição cadastrada.'}
            </p>
          </div>

          {projeto.objetivo && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Target size={14} />
                OBJETIVO
              </strong>
              <p className="projetos-text-block">{projeto.objetivo}</p>
            </div>
          )}

          {projeto.local && (
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <MapPin size={14} />
                LOCAL PRINCIPAL
              </strong>
              <p className="projetos-text-block">{projeto.local}</p>
            </div>
          )}
        </div>

        {/* 2. SEÇÃO QUANDO ACONTECE (HORÁRIOS) */}
        <div className="projetos-detalhe-section">
          <div className="projetos-detalhe-section-header">
            <h2 className="projetos-detalhe-section-title">
              <Calendar />
              Quando Acontece ({horarios.length})
            </h2>

            {isAdmin && (
              <button
                type="button"
                className="projetos-btn-action primary"
                onClick={() => {
                  setHorarioToEdit(null);
                  setIsHorarioModalOpen(true);
                }}
              >
                <Plus size={14} />
                Adicionar Horário
              </button>
            )}
          </div>

          {horarios.length === 0 ? (
            <p className="projetos-empty-text">Nenhum horário cadastrado.</p>
          ) : (
            <div className="projetos-info-grid">
              {horarios.map((horario) => {
                const diaStr = DIAS_SEMANA_MAP[horario.dia_semana] || `Dia ${horario.dia_semana}`;
                const horaStr = formatHorario(horario.hora_inicio, horario.hora_fim);

                return (
                  <div key={horario.id} className="projetos-info-card">
                    {isAdmin && (
                      <div className="projetos-info-card-actions">
                        <button
                          type="button"
                          className="projetos-icon-btn"
                          title="Editar Horário"
                          onClick={() => {
                            setHorarioToEdit(horario);
                            setIsHorarioModalOpen(true);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="projetos-icon-btn danger"
                          title="Remover Horário"
                          onClick={() => handleDeleteHorario(horario.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div className="projetos-info-card-label">{diaStr}</div>
                    {horaStr && (
                      <div className="projetos-info-card-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                        <Clock size={14} color="var(--color-primary)" />
                        {horaStr}
                      </div>
                    )}
                    {horario.local && (
                      <div className="projetos-info-card-value" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={12} />
                        {horario.local}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. SEÇÃO ALUNOS PARTICIPANTES */}
        <div className="projetos-detalhe-section">
          <div className="projetos-detalhe-section-header">
            <h2 className="projetos-detalhe-section-title">
              <Users />
              Alunos Participantes ({vinculosAlunos.length})
            </h2>

            {isAdmin && (
              <button
                type="button"
                className="projetos-btn-action primary"
                onClick={() => setIsAlunoModalOpen(true)}
              >
                <Plus size={14} />
                Adicionar Participante
              </button>
            )}
          </div>

          {vinculosAlunos.length === 0 ? (
            <p className="projetos-empty-text">Nenhum aluno inscrito neste projeto.</p>
          ) : (
            <div className="projetos-table-wrapper">
              <table className="projetos-table">
                <thead>
                  <tr>
                    <th>Nome do Aluno</th>
                    <th>Turma</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {vinculosAlunos.map((pa) => (
                    <tr key={pa.id}>
                      <td style={{ fontWeight: '500' }}>{pa.alunos.nome}</td>
                      <td>{pa.alunos.turma || '-'}</td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="projetos-icon-btn danger"
                            title="Remover Participante"
                            onClick={() => handleDeleteAluno(pa.id, pa.alunos.nome)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. SEÇÃO RESPONSÁVEIS */}
        <div className="projetos-detalhe-section">
          <div className="projetos-detalhe-section-header">
            <h2 className="projetos-detalhe-section-title">
              <UserCheck />
              Responsáveis ({responsaveis.length})
            </h2>

            {isAdmin && (
              <button
                type="button"
                className="projetos-btn-action primary"
                onClick={() => {
                  setRespToEdit(null);
                  setIsRespModalOpen(true);
                }}
              >
                <Plus size={14} />
                Adicionar Responsável
              </button>
            )}
          </div>

          {responsaveis.length === 0 ? (
            <p className="projetos-empty-text">Nenhum responsável cadastrado.</p>
          ) : (
            <div className="projetos-table-wrapper">
              <table className="projetos-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Função</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {responsaveis.map((resp) => (
                    <tr key={resp.id}>
                      <td style={{ fontWeight: '500' }}>{resp.nome}</td>
                      <td>
                        <span className={`projetos-type-badge ${resp.tipo}`}>
                          {formatTipoResponsavel(resp.tipo)}
                        </span>
                      </td>
                      <td>{resp.funcao || '-'}</td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className="projetos-icon-btn"
                              title="Editar Responsável"
                              onClick={() => {
                                setRespToEdit(resp);
                                setIsRespModalOpen(true);
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="projetos-icon-btn danger"
                              title="Remover Responsável"
                              onClick={() => handleDeleteResponsavel(resp.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modais de Administração */}
      <ProjetoModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={fetchProjetoDetalhe}
        projetoToEdit={projeto}
      />

      <ProjetoHorarioModal
        isOpen={isHorarioModalOpen}
        onClose={() => setIsHorarioModalOpen(false)}
        onSuccess={fetchProjetoDetalhe}
        projetoId={projeto.id}
        horarioToEdit={horarioToEdit}
      />

      <ProjetoResponsavelModal
        isOpen={isRespModalOpen}
        onClose={() => setIsRespModalOpen(false)}
        onSuccess={fetchProjetoDetalhe}
        projetoId={projeto.id}
        respToEdit={respToEdit}
      />

      <ProjetoAlunoModal
        isOpen={isAlunoModalOpen}
        onClose={() => setIsAlunoModalOpen(false)}
        onSuccess={fetchProjetoDetalhe}
        projetoId={projeto.id}
        existingStudentIds={existingStudentIds}
      />
    </div>
  );
}
