import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, PlusCircle, Search, Trash2, ArrowLeft, Filter, AlertTriangle, CheckCircle, Clock, Archive } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import './SolicitacoesMateriais.css';

export default function SolicitacoesMateriais() {
  const navigate = useNavigate();
  const { userRole, userName } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(userRole === 'gestao' ? 'painel' : 'solicitacoes'); // 'painel' | 'solicitacoes'

  useEffect(() => {
    if (userRole && userRole !== 'gestao') {
      setActiveTab('solicitacoes');
    }
  }, [userRole]);
  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqNome, setReqNome] = useState(userName || '');
  const [reqData, setReqData] = useState(new Date().toISOString().split('T')[0]);
  const [reqTipo, setReqTipo] = useState('Materiais');
  const [reqPrioridade, setReqPrioridade] = useState('dá pra esperar');
  const [reqDescricao, setReqDescricao] = useState('');

  useEffect(() => {
    if (userName) {
      setReqNome(userName);
    }
  }, [userName]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch data
  const fetchSolicitacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_materiais_servicos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
      showToast('Erro ao carregar solicitações', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();

    // Setup realtime channel
    const channel = supabase.channel('realtime-solicitacoes-materiais')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitacoes_materiais_servicos' },
        () => {
          fetchSolicitacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Save Request
  const handleSaveRequest = async (e) => {
    e.preventDefault();
    if (!reqNome.trim() || !reqData || !reqTipo || !reqPrioridade || !reqDescricao.trim()) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const payload = {
      nome: reqNome.trim(),
      data: reqData,
      tipo: reqTipo,
      prioridade: reqPrioridade,
      descricao: reqDescricao.trim(),
      status: 'Pendente',
      solicitante: userName || 'Usuário Autenticado'
    };

    try {
      const { error } = await supabase
        .from('solicitacoes_materiais_servicos')
        .insert([payload]);

      if (error) throw error;

      showToast('Solicitação cadastrada com sucesso!', 'success');
      setIsModalOpen(false);
      setReqNome(userName || '');
      setReqData(new Date().toISOString().split('T')[0]);
      setReqTipo('Materiais');
      setReqPrioridade('dá pra esperar');
      setReqDescricao('');
      fetchSolicitacoes();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar solicitação', 'error');
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_materiais_servicos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      showToast('Status atualizado com sucesso!', 'success');
      fetchSolicitacoes();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  // Handle Delete Request
  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta solicitação?')) return;

    try {
      const { error } = await supabase
        .from('solicitacoes_materiais_servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Solicitação excluída com sucesso!', 'success');
      fetchSolicitacoes();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir solicitação', 'error');
    }
  };

  // Memoized Filters
  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.solicitante.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTipo = filterTipo ? item.tipo === filterTipo : true;
      const matchesPrioridade = filterPrioridade ? item.prioridade === filterPrioridade : true;
      const matchesStatus = filterStatus ? item.status === filterStatus : true;

      return matchesSearch && matchesTipo && matchesPrioridade && matchesStatus;
    });
  }, [solicitacoes, searchQuery, filterTipo, filterPrioridade, filterStatus]);

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const total = solicitacoes.length;
    const materiais = solicitacoes.filter(s => s.tipo === 'Materiais').length;
    const servicos = solicitacoes.filter(s => s.tipo === 'Serviços').length;
    
    const pendente = solicitacoes.filter(s => s.status === 'Pendente').length;
    const andamento = solicitacoes.filter(s => s.status === 'Em andamento').length;
    const atendido = solicitacoes.filter(s => s.status === 'Atendido').length;
    
    const urgente = solicitacoes.filter(s => s.prioridade === 'urgente').length;
    const esperar = solicitacoes.filter(s => s.prioridade === 'dá pra esperar').length;
    const longoPrazo = solicitacoes.filter(s => s.prioridade === 'longo prazo').length;

    return {
      total,
      materiais,
      servicos,
      pendente,
      andamento,
      atendido,
      urgente,
      esperar,
      longoPrazo
    };
  }, [solicitacoes]);

  // Custom Chart calculations
  const donutData = useMemo(() => {
    const total = stats.urgente + stats.esperar + stats.longoPrazo || 1;
    return [
      { name: 'Urgente', value: stats.urgente, percentage: Math.round((stats.urgente / total) * 100), color: '#DC2626' },
      { name: 'Dá pra esperar', value: stats.esperar, percentage: Math.round((stats.esperar / total) * 100), color: '#D97706' },
      { name: 'Longo prazo', value: stats.longoPrazo, percentage: Math.round((stats.longoPrazo / total) * 100), color: '#2563EB' }
    ];
  }, [stats]);

  return (
    <div className="solicitacoes-container">
      {/* Header section */}
      <div className="solicitacoes-header">
        <div className="solicitacoes-title-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClipboardList size={28} color="var(--color-primary)" /> Solicitações de Materiais ou Serviços
            </h2>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusCircle size={16} /> Nova Solicitação
        </button>
      </div>

      {/* Tabs bar */}
      <div className="tab-container">
        {userRole === 'gestao' && (
          <button 
            onClick={() => { setActiveTab('painel'); }}
            className={`tab-button ${activeTab === 'painel' ? 'active' : ''}`}
          >
            Painel
          </button>
        )}
        <button 
          onClick={() => { setActiveTab('solicitacoes'); }}
          className={`tab-button ${activeTab === 'solicitacoes' ? 'active' : ''}`}
        >
          Solicitações
        </button>
      </div>

      {/* --- PAINEL (DASHBOARD) TAB --- */}
      {activeTab === 'painel' && (
        <div className="dashboard-grid-view">
          <div className="dashboard-stats-cards">
            <div className="dashboard-stat-card card-blue">
              <div className="card-stat-icon">
                <Archive size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{stats.total}</span>
                <span className="card-stat-label">Total de Solicitações</span>
              </div>
            </div>

            <div className="dashboard-stat-card card-purple">
              <div className="card-stat-icon">
                <Clock size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{stats.pendente}</span>
                <span className="card-stat-label">Pendentes</span>
              </div>
            </div>

            <div className="dashboard-stat-card card-green">
              <div className="card-stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{stats.atendido}</span>
                <span className="card-stat-label">Atendidas</span>
              </div>
            </div>

            <div className="dashboard-stat-card card-amber">
              <div className="card-stat-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{stats.urgente}</span>
                <span className="card-stat-label">Críticas / Urgentes</span>
              </div>
            </div>
          </div>

          <div className="dashboard-charts-row">
            {/* Donut Chart for Priority */}
            <div className="dashboard-chart-box">
              <h3 className="chart-title">Distribuição por Prioridade</h3>
              {stats.total === 0 ? (
                <p className="no-data-text">Nenhuma solicitação cadastrada para gerar o gráfico</p>
              ) : (
                <div className="donut-chart-container">
                  <div className="donut-svg-wrapper">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                      {(() => {
                        let accumulatedPercentage = 0;
                        return donutData.map((slice) => {
                          if (slice.value === 0) return null;
                          const strokeLength = (slice.percentage / 100) * 314.159;
                          const offset = (accumulatedPercentage / 100) * 314.159;
                          accumulatedPercentage += slice.percentage;

                          return (
                            <circle
                              key={slice.name}
                              cx="80"
                              cy="80"
                              r="50"
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="16"
                              className="donut-segment"
                              style={{
                                strokeDasharray: `${strokeLength} 314.159`,
                                strokeDashoffset: -offset,
                                strokeLinecap: slice.percentage === 100 ? 'butt' : 'round'
                              }}
                            />
                          );
                        });
                      })()}
                      <circle cx="80" cy="80" r="42" fill="var(--bg-card)" />
                    </svg>
                    <div className="donut-center-label">
                      <span className="donut-center-value">{stats.total}</span>
                      <span className="donut-center-text">Total</span>
                    </div>
                  </div>

                  <div className="donut-legend">
                    {donutData.map((slice) => (
                      <div key={slice.name} className="legend-item">
                        <div className="legend-marker-wrapper">
                          <span className="legend-dot" style={{ backgroundColor: slice.color }}></span>
                          <span className="legend-name">{slice.name}</span>
                        </div>
                        <span className="legend-value">{slice.value} <small>({slice.percentage}%)</small></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart for Request Types */}
            <div className="dashboard-chart-box">
              <h3 className="chart-title">Distribuição por Tipo de Solicitação</h3>
              {stats.total === 0 ? (
                <p className="no-data-text">Nenhuma solicitação cadastrada</p>
              ) : (
                <div className="bar-chart-container">
                  <div className="bar-chart-row">
                    <div className="bar-row-header">
                      <span className="bar-row-label">Materiais</span>
                      <span className="bar-row-value">{stats.materiais} solicitadas ({stats.total > 0 ? Math.round((stats.materiais / stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="bar-row-track">
                      <div 
                        className="bar-row-fill" 
                        style={{ 
                          width: `${stats.total > 0 ? (stats.materiais / stats.total) * 100 : 0}%`,
                          backgroundColor: '#2563EB'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="bar-chart-row" style={{ marginTop: '1.25rem' }}>
                    <div className="bar-row-header">
                      <span className="bar-row-label">Serviços</span>
                      <span className="bar-row-value">{stats.servicos} solicitadas ({stats.total > 0 ? Math.round((stats.servicos / stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="bar-row-track">
                      <div 
                        className="bar-row-fill" 
                        style={{ 
                          width: `${stats.total > 0 ? (stats.servicos / stats.total) * 100 : 0}%`,
                          backgroundColor: '#7C3AED'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SOLICITAÇÕES (LISTA) TAB --- */}
      {activeTab === 'solicitacoes' && (
        <>
          {/* Controls row */}
          <div className="search-bar-row">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou solicitante..."
                className="search-input"
              />
              <Search className="search-icon" size={18} />
            </div>

            <div className="action-buttons-group">
              <select 
                value={filterTipo} 
                onChange={(e) => setFilterTipo(e.target.value)} 
                className="form-select-input"
                style={{ width: 'auto', minWidth: '130px' }}
              >
                <option value="">Tipo (Todos)</option>
                <option value="Materiais">Materiais</option>
                <option value="Serviços">Serviços</option>
              </select>

              <select 
                value={filterPrioridade} 
                onChange={(e) => setFilterPrioridade(e.target.value)} 
                className="form-select-input"
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="">Prioridade (Todos)</option>
                <option value="urgente">Urgente</option>
                <option value="dá pra esperar">Dá pra esperar</option>
                <option value="longo prazo">Longo prazo</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="form-select-input"
                style={{ width: 'auto', minWidth: '140px' }}
              >
                <option value="">Status (Todos)</option>
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Atendido">Atendido</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          {filteredSolicitacoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <ClipboardList size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="solicitacoes-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Data Solicitação</th>
                    <th>Solicitante</th>
                    <th>Tipo</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    {userRole === 'gestao' && <th>Alterar Status</th>}
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitacoes.map((item) => {
                    const isOwner = item.solicitante === userName;
                    const canDelete = userRole === 'gestao' || isOwner;

                    return (
                      <tr key={item.id}>
                        <td style={{ maxWidth: '250px' }}>
                          <div style={{ fontWeight: 700 }}>{item.nome}</div>
                          {item.descricao && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.descricao}>
                              {item.descricao}
                            </div>
                          )}
                        </td>
                        <td>{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td>{item.solicitante}</td>
                        <td>
                          <span className={`tipo-badge ${item.tipo === 'Materiais' ? 'tipo-materiais' : 'tipo-servicos'}`}>
                            {item.tipo}
                          </span>
                        </td>
                        <td>
                          <span className={`prioridade-badge ${
                            item.prioridade === 'urgente' 
                              ? 'prioridade-urgente' 
                              : item.prioridade === 'dá pra esperar' 
                              ? 'prioridade-esperar' 
                              : 'prioridade-longo'
                          }`}>
                            {item.prioridade}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${
                            item.status === 'Pendente' 
                              ? 'status-pendente' 
                              : item.status === 'Em andamento' 
                              ? 'status-andamento' 
                              : item.status === 'Atendido' 
                              ? 'status-atendido' 
                              : 'status-cancelado'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        {userRole === 'gestao' && (
                          <td>
                            <select 
                              value={item.status} 
                              onChange={(e) => handleUpdateStatus(item.id, e.target.value)} 
                              className="status-select-inline"
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Em andamento">Em andamento</option>
                              <option value="Atendido">Atendido</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                        )}
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {canDelete && (
                              <button 
                                className="action-btn delete" 
                                onClick={() => handleDeleteRequest(item.id)} 
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* --- CREATE REQUEST MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nova Solicitação</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveRequest}>
              <div className="modal-body-scroll">
                <div className="form-grid">
                  <div className="form-input-group">
                    <label htmlFor="req-nome">Nome *</label>
                    <input 
                      type="text" 
                      id="req-nome" 
                      value={reqNome} 
                      className="form-text-input"
                      disabled
                      readOnly
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="req-descricao">Descrição *</label>
                    <textarea 
                      id="req-descricao" 
                      value={reqDescricao} 
                      onChange={(e) => setReqDescricao(e.target.value)}
                      placeholder="Descreva detalhadamente os materiais ou serviços solicitados..."
                      className="form-textarea-input"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="req-data">Data desejada/necessária *</label>
                    <input 
                      type="date" 
                      id="req-data" 
                      value={reqData} 
                      onChange={(e) => setReqData(e.target.value)}
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="req-tipo">Tipo de solicitação *</label>
                    <select 
                      id="req-tipo" 
                      value={reqTipo} 
                      onChange={(e) => setReqTipo(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="Materiais">Materiais</option>
                      <option value="Serviços">Serviços</option>
                    </select>
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="req-prioridade">Prioridade *</label>
                    <select 
                      id="req-prioridade" 
                      value={reqPrioridade} 
                      onChange={(e) => setReqPrioridade(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="urgente">urgente</option>
                      <option value="dá pra esperar">dá pra esperar</option>
                      <option value="longo prazo">longo prazo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
