import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Search, Calendar, Users, UserCheck, MapPin, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import ProjetoModal from './ProjetoModal';
import './Projetos.css';

export const DIAS_SEMANA_MAP = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo'
};

export function formatHorario(horaInicio, horaFim) {
  if (!horaInicio && !horaFim) return '';
  const inicio = horaInicio ? horaInicio.slice(0, 5) : '';
  const fim = horaFim ? horaFim.slice(0, 5) : '';
  if (inicio && fim) return `${inicio}h - ${fim}h`;
  if (inicio) return `${inicio}h`;
  return `${fim}h`;
}

export function formatDiasSemana(horarios = []) {
  if (!horarios || horarios.length === 0) return 'Horário a definir';
  
  const diasUnicos = [...new Set(horarios.map(h => h.dia_semana))].sort((a, b) => a - b);
  return diasUnicos.map(d => DIAS_SEMANA_MAP[d] || `Dia ${d}`).join(', ');
}

export default function Projetos() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { showToast } = useToast();

  const isAdmin = userRole === 'gestao' || userRole === 'secretaria';

  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ativos'); // 'ativos' | 'inativos' | 'todos'
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);

  const fetchProjetos = useCallback(async () => {
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
            id
          )
        `)
        .order('nome');

      // Se não for admin (gestao ou secretaria), filtra estritamente por ativo = true
      if (!isAdmin) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjetos(data || []);
    } catch (err) {
      console.error('Erro ao carregar projetos da escola:', err);
      showToast('Erro ao carregar projetos da escola.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  const filteredProjetos = projetos.filter(p => {
    // Filtro de Status para Admin
    if (isAdmin) {
      if (filterStatus === 'ativos' && !p.ativo) return false;
      if (filterStatus === 'inativos' && p.ativo) return false;
    } else {
      if (!p.ativo) return false;
    }

    // Busca textual
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchNome = p.nome?.toLowerCase().includes(query);
    const matchDesc = p.descricao?.toLowerCase().includes(query);
    const matchLocal = p.local?.toLowerCase().includes(query);
    const matchResp = p.projetos_responsaveis?.some(r => r.nome?.toLowerCase().includes(query));
    return matchNome || matchDesc || matchLocal || matchResp;
  });

  return (
    <div className="projetos-container">
      <div className="projetos-header-row">
        <div className="projetos-header">
          <h1>
            <FolderKanban style={{ color: 'var(--color-primary)' }} />
            Projetos da Escola
          </h1>
          <p>Conheça os projetos desenvolvidos pela escola.</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="projetos-btn-primary"
            onClick={() => setIsModalCreateOpen(true)}
          >
            <Plus size={18} />
            Novo Projeto
          </button>
        )}
      </div>

      <div className="projetos-controls">
        <div className="projetos-search-box">
          <Search />
          <input
            type="text"
            className="projetos-search-input"
            placeholder="Buscar por nome, descrição, local ou responsável..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAdmin && (
          <div className="projetos-filter-tabs">
            <button
              type="button"
              className={`projetos-tab-btn ${filterStatus === 'ativos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ativos')}
            >
              Ativos
            </button>
            <button
              type="button"
              className={`projetos-tab-btn ${filterStatus === 'inativos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('inativos')}
            >
              Inativos
            </button>
            <button
              type="button"
              className={`projetos-tab-btn ${filterStatus === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterStatus('todos')}
            >
              Todos
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="projetos-loading">
          <Loader2 className="animate-spin" />
          <span>Carregando projetos da escola...</span>
        </div>
      ) : filteredProjetos.length === 0 ? (
        <div className="projetos-empty-state">
          <FolderKanban />
          <h3>Nenhum projeto encontrado</h3>
          <p>{searchQuery ? 'Tente buscar por outro termo.' : 'Nenhum projeto cadastrado no filtro selecionado.'}</p>
        </div>
      ) : (
        <div className="projetos-grid">
          {filteredProjetos.map((projeto) => {
            const numAlunos = projeto.projetos_alunos?.length || 0;
            const numResponsaveis = projeto.projetos_responsaveis?.length || 0;
            const diasFormatados = formatDiasSemana(projeto.projetos_horarios);

            return (
              <div
                key={projeto.id}
                className={`projeto-card ${!projeto.ativo ? 'inativo' : ''}`}
                onClick={() => navigate(`/projetos/${projeto.id}`)}
              >
                {projeto.capa_url ? (
                  <img
                    src={projeto.capa_url}
                    alt={projeto.nome}
                    className="projeto-card-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="projeto-card-cover-placeholder"
                  style={{ display: projeto.capa_url ? 'none' : 'flex' }}
                >
                  <FolderKanban size={48} />
                </div>

                <div className="projeto-card-body">
                  <div className="projeto-card-title-row">
                    <h3 className="projeto-card-title">{projeto.nome}</h3>
                    {isAdmin && (
                      <span className={`projeto-status-tag ${projeto.ativo ? 'ativo' : 'inativo'}`}>
                        {projeto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </div>

                  <p className="projeto-card-description">
                    {projeto.descricao || 'Sem descrição informada.'}
                  </p>

                  <div className="projeto-card-meta">
                    <div className="projeto-meta-item">
                      <Calendar />
                      <span>{diasFormatados}</span>
                    </div>
                    {projeto.local && (
                      <div className="projeto-meta-item">
                        <MapPin />
                        <span>{projeto.local}</span>
                      </div>
                    )}
                  </div>

                  <div className="projeto-card-badge-row">
                    <span className="projeto-badge">
                      <Users size={12} />
                      {numAlunos} {numAlunos === 1 ? 'aluno' : 'alunos'}
                    </span>
                    <span className="projeto-badge">
                      <UserCheck size={12} />
                      {numResponsaveis} {numResponsaveis === 1 ? 'responsável' : 'responsáveis'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação de Projeto */}
      <ProjetoModal
        isOpen={isModalCreateOpen}
        onClose={() => setIsModalCreateOpen(false)}
        onSuccess={fetchProjetos}
      />
    </div>
  );
}
