import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Calendar, User, Users, GraduationCap, ChevronRight, HelpCircle } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import './PerfilTurma.css';

const coordenadoresMap = {
  '6ºA': 'DJAIRO APARECIDO ARNANDES',
  '6ºB': 'VALENTINA TOBIAS DA SILVA',
  '6ºC': 'LUCIANA CONSTANTINO ATELLA BARBOSA DA SILVA',
  '7ºA': 'SIMONE PINHEIRO DOS SANTOS HORTA ALDIGHIERI MORAES',
  '7ºB': 'BRUNO RODRIGUES PEREIRA',
  '7ºC': 'ANA CLAUDIA SARTORELLI FELIPE',
  '7ºD': 'GABRIELA DE SOUSA SUMAN',
  '8ºA': 'HELAINE CRISTINA MARQUES DE OLIVEIRA',
  '8ºB': 'JULIA NOGUEIRA NASCIMENTO',
  '8ºC': 'MARIA NEIDE DE OLIVEIRA MOLINARI',
  '9ºA': 'SANDRA REGINA SIMIONATTO',
  '9ºB': 'ELI MOMESSO',
  '9ºC': 'JULIA MANCINI',
  '9ºD': 'DANIELA KLEINFELDER CANELLA',
  '1ºA': 'RITA DE CASSIA OLIVEIRA SIMOES',
  '1ºB': 'ELAINE CRISTINA DOS SANTOS SILVA',
  '1ºC': 'GRAZIELA BIZON',
  '2ºA': 'ANGELA CRISTINA LEONELLO MARTINS',
  '2ºB': 'IVANILDA FINELLI',
  '3ºA': 'JESSICA TORRETTI DA COSTA',
  '3ºB': 'PAULA JULIANA DE ASSIS CALIL ITO'
};

const getTurmaKey = (serie, turma) => {
  if (!serie || !turma) return '';
  const num = serie.split(' ')[0]; // e.g. "6º"
  return `${num}${turma}`;
};

export default function PerfilTurma() {
  const navigate = useNavigate();
  const { userRole, userName } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [perfis, setPerfis] = useState([]);

  // States for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reqSerie, setReqSerie] = useState('6º Ano');
  const [reqTurma, setReqTurma] = useState('A');
  const [reqProfessor, setReqProfessor] = useState('');
  const [reqPontos, setReqPontos] = useState('');
  const [reqAcoes, setReqAcoes] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSerie, setFilterSerie] = useState('');
  const [filterTurma, setFilterTurma] = useState('');

  // Selected Profile for details popup
  const [selectedPerfil, setSelectedPerfil] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Series and Class options
  const seriesOptions = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1º E.M.', '2º E.M.', '3º E.M.'];
  const turmasOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Default series and class to coordinator's class on opening modal
  useEffect(() => {
    if (isModalOpen && userRole === 'professor' && userName) {
      const coordinatedClass = Object.keys(coordenadoresMap).find(
        key => coordenadoresMap[key].toLowerCase() === userName.toLowerCase()
      );
      if (coordinatedClass) {
        const num = coordinatedClass.slice(0, 2); // e.g. "6º" or "1º"
        const letter = coordinatedClass.slice(2); // e.g. "B"
        const matchedSerie = seriesOptions.find(opt => opt.startsWith(num));
        if (matchedSerie) {
          setReqSerie(matchedSerie);
        }
        setReqTurma(letter);
      }
    }
  }, [isModalOpen, userRole, userName]);

  // Automatically select the coordinator professor when class changes
  useEffect(() => {
    if (isModalOpen) {
      const key = getTurmaKey(reqSerie, reqTurma);
      const coord = coordenadoresMap[key] || '';
      setReqProfessor(coord);
    }
  }, [reqSerie, reqTurma, isModalOpen]);

  // Check if current user is authorized to save
  const isAuthorized = useMemo(() => {
    if (userRole === 'gestao') return true;
    const key = getTurmaKey(reqSerie, reqTurma);
    const coordinator = coordenadoresMap[key];
    return userName && coordinator && coordinator.toLowerCase() === userName.toLowerCase();
  }, [userRole, reqSerie, reqTurma, userName]);

  const fetchPerfis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('perfis_turmas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPerfis(data || []);
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
      showToast('Erro ao carregar perfis de turmas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfis();

    // Setup realtime channel
    const channel = supabase.channel('realtime-perfis-turmas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'perfis_turmas' },
        () => {
          fetchPerfis();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!reqSerie || !reqTurma || !reqProfessor.trim() || !reqPontos.trim() || !reqAcoes.trim()) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    // Double-check authorization
    if (userRole !== 'gestao') {
      const key = getTurmaKey(reqSerie, reqTurma);
      const coordinator = coordenadoresMap[key];
      if (!userName || !coordinator || coordinator.toLowerCase() !== userName.toLowerCase()) {
        showToast('Você não tem autorização para preencher o perfil desta turma.', 'error');
        return;
      }
    }

    const payload = {
      serie: reqSerie,
      turma: reqTurma,
      professor: reqProfessor.trim(),
      pontos_importantes: reqPontos.trim(),
      acoes_proximo_bimestre: reqAcoes.trim()
    };

    try {
      const { error } = await supabase
        .from('perfis_turmas')
        .insert([payload]);

      if (error) throw error;

      showToast('Perfil da turma cadastrado com sucesso!', 'success');
      setIsModalOpen(false);
      setReqPontos('');
      setReqAcoes('');
      fetchPerfis();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar perfil da turma', 'error');
    }
  };

  // Handle Delete Profile
  const handleDeleteProfile = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este perfil de turma?')) return;

    try {
      const { error } = await supabase
        .from('perfis_turmas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Perfil excluído com sucesso!', 'success');
      fetchPerfis();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir perfil', 'error');
    }
  };

  // Memoized filters
  const filteredPerfis = useMemo(() => {
    return perfis.filter(item => {
      const matchesSearch = item.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.pontos_importantes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.acoes_proximo_bimestre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSerie = filterSerie ? item.serie === filterSerie : true;
      const matchesTurma = filterTurma ? item.turma === filterTurma : true;

      return matchesSearch && matchesSerie && matchesTurma;
    });
  }, [perfis, searchQuery, filterSerie, filterTurma]);



  return (
    <div className="perfil-turma-container">
      {/* Header section */}
      <div className="perfil-turma-header">
        <div className="perfil-turma-title-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={28} color="var(--color-primary)" /> Perfis das Turmas
            </h2>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Novo Perfil
        </button>
      </div>

      {/* Filters row */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por professor ou observações..."
            className="search-input"
          />
          <Search className="search-icon" size={18} />
        </div>

        <div className="action-buttons-group">
          <select 
            value={filterSerie} 
            onChange={(e) => setFilterSerie(e.target.value)} 
            className="form-select-input"
            style={{ width: 'auto', minWidth: '135px' }}
          >
            <option value="">Série (Todas)</option>
            {seriesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          <select 
            value={filterTurma} 
            onChange={(e) => setFilterTurma(e.target.value)} 
            className="form-select-input"
            style={{ width: 'auto', minWidth: '135px' }}
          >
            <option value="">Turma (Todas)</option>
            {turmasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Profile grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando perfis...</div>
      ) : filteredPerfis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
          <GraduationCap size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhum perfil de turma encontrado</p>
        </div>
      ) : (
        <div className="perfil-grid">
          {filteredPerfis.map((item) => {
            const isOwner = item.professor === userName;
            const canDelete = userRole === 'gestao' || isOwner;

            return (
              <div key={item.id} className="perfil-card" onClick={() => { setSelectedPerfil(item); setIsDetailsOpen(true); }} style={{ cursor: 'pointer' }}>
                <div>
                  <div className="perfil-card-header">
                    <h3 className="perfil-card-title">{item.serie} - Turma {item.turma}</h3>
                  </div>

                  <div className="perfil-card-meta">
                    <div className="perfil-meta-item">
                      <User size={14} />
                      <span>Prof(a). {item.professor}</span>
                    </div>
                    <div className="perfil-meta-item">
                      <Calendar size={14} />
                      <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="perfil-card-footer">
                  <button className="btn-details">
                    Ver Detalhes <ChevronRight size={14} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle' }} />
                  </button>

                  {canDelete && (
                    <button 
                      className="action-btn delete" 
                      onClick={(e) => handleDeleteProfile(item.id, e)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE PROFILE MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Perfil de Turma</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body-scroll">
                <div className="form-grid">
                  <div className="form-input-group">
                    <label htmlFor="req-serie">Série *</label>
                    <select 
                      id="req-serie" 
                      value={reqSerie} 
                      onChange={(e) => setReqSerie(e.target.value)}
                      className="form-select-input"
                    >
                      {seriesOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="form-input-group">
                    <label htmlFor="req-turma">Turma *</label>
                    <select 
                      id="req-turma" 
                      value={reqTurma} 
                      onChange={(e) => setReqTurma(e.target.value)}
                      className="form-select-input"
                    >
                      {turmasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="form-input-group form-group-full">
                    <label htmlFor="req-professor">Nome do(a) Professor(a) *</label>
                    <input 
                      type="text" 
                      id="req-professor" 
                      value={reqProfessor}
                      onChange={(e) => setReqProfessor(e.target.value)}
                      className="form-text-input"
                      disabled={userRole !== 'gestao'}
                      readOnly={userRole !== 'gestao'}
                      required
                    />
                  </div>

                  {!isAuthorized && (
                    <div className="form-group-full" style={{ padding: '0.75rem 1rem', backgroundColor: '#FDF2F2', color: '#DE350B', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, border: '1px solid #F8B4B4', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⚠️ Apenas o(a) professor(a) coordenador(a) <strong>{coordenadoresMap[getTurmaKey(reqSerie, reqTurma)] || 'responsável'}</strong> tem autorização para preencher o perfil desta turma.</span>
                    </div>
                  )}

                  <div className="form-input-group form-group-full">
                    <label htmlFor="req-pontos">Pontos importantes perfil da sala *</label>
                    <textarea 
                      id="req-pontos" 
                      value={reqPontos} 
                      onChange={(e) => setReqPontos(e.target.value)}
                      placeholder="Descreva as principais observações sobre a sala..."
                      className="form-textarea-input"
                      required
                    />
                    <div className="guidelines-panel">
                      <div className="guidelines-title">💡 Sugestões de Tópicos:</div>
                      <ul className="guidelines-list">
                        <li>Frequência dos estudantes</li>
                        <li>Participação nas atividades</li>
                        <li>Trabalhos em equipe</li>
                        <li>Convivência entre colegas e professores</li>
                        <li>Cumprimento dos combinados escolares</li>
                        <li>Alunos que necessitam de adaptação curricular</li>
                        <li>Estudantes na tutoria com a Profa. Alessandra (especificar se há ou não muitos alunos, sem nomes)</li>
                        <li>Realização das tarefas</li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-input-group form-group-full">
                    <label htmlFor="req-acoes">Ações que devem ser desenvolvidas no próximo bimestre *</label>
                    <textarea 
                      id="req-acoes" 
                      value={reqAcoes} 
                      onChange={(e) => setReqAcoes(e.target.value)}
                      placeholder="Descreva o planejamento e estratégias futuras..."
                      className="form-textarea-input"
                      required
                    />
                    <div className="guidelines-panel">
                      <div className="guidelines-title">💡 Sugestões de Tópicos:</div>
                      <ul className="guidelines-list">
                        <li>Recuperação contínua</li>
                        <li>Recomposição dos conteúdos</li>
                        <li>Estratégias para realização das tarefas</li>
                        <li>Estratégias para estudantes faltosos</li>
                        <li>Metodologias a serem desenvolvidas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!isAuthorized}
                  style={{ 
                    opacity: isAuthorized ? 1 : 0.6, 
                    cursor: isAuthorized ? 'pointer' : 'not-allowed' 
                  }}
                >
                  Gravar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILS OVERLAY POPUP --- */}
      {isDetailsOpen && selectedPerfil && (
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Perfil da Turma: {selectedPerfil.serie} - Turma {selectedPerfil.turma}</h3>
              <button 
                onClick={() => setIsDetailsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body-scroll">
              <div className="details-section">
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.88rem' }}><strong>Professor(a):</strong> {selectedPerfil.professor}</div>
                  <div style={{ fontSize: '0.88rem' }}><strong>Data de registro:</strong> {new Date(selectedPerfil.created_at).toLocaleDateString('pt-BR')}</div>
                </div>

                <div className="details-block">
                  <div className="details-block-title">Pontos importantes do perfil da sala</div>
                  <div className="details-block-content">{selectedPerfil.pontos_importantes}</div>
                </div>

                <div className="details-block">
                  <div className="details-block-title">Ações a serem desenvolvidas no próximo bimestre</div>
                  <div className="details-block-content">{selectedPerfil.acoes_proximo_bimestre}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
