import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, GraduationCap, Link as LinkIcon, School, ChevronRight, X, Calendar, Clipboard, ArrowLeft, Camera, User, FileText } from 'lucide-react';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';
import { useToast } from '../../app/providers/ToastProvider';
import { useGoogleAuth } from '../../app/providers/GoogleAuthProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import Frequencia from './Frequencia';
import usePrefetchFrequencia from '../../hooks/usePrefetchFrequencia';
import useCarometro from '../../hooks/useCarometro';
import CarometroGrid from './CarometroGrid';
import CarometroModal from './CarometroModal';
import FichaAlunoModal from './FichaAlunoModal';
import { findPhotoInMap } from '../../services/photoService';

const GRADE_COLORS = {
  '6': '#1CB0F6', // Macaw
  '7': '#FF4B4B', // Cardinal
  '8': '#FFC800', // Bee
  '9': '#FF9600', // Fox
  '1': '#CE82FF', // Beetle
  '2': '#2B70C9', // Humpback
  '3': '#58CC02'  // Feather Green
};

const getTurmaColor = (nome) => {
  const match = nome.match(/^(\d+)/);
  if (match) {
    const num = match[1];
    return GRADE_COLORS[num] || 'var(--color-primary)';
  }
  return 'var(--color-primary)';
};

export default function Turmas() {
  const navigate = useNavigate();
  const { turmas, alunos, loadingData } = useGlobalData();
  const { showToast } = useToast();
  const { accessToken, loginGoogle, isConfigured } = useGoogleAuth();
  const { userRole } = useAuth();

  const [searchMode, setSearchMode] = useState('class'); // 'class' | 'student'
  const [selectedSerie, setSelectedSerie] = useState('');
  const [selectedTurmaSigla, setSelectedTurmaSigla] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [isFrequenciaOpen, setIsFrequenciaOpen] = useState(false);
  const [selectedStudentForFreq, setSelectedStudentForFreq] = useState(null);

  const [classViewMode, setClassViewMode] = useState('list'); // 'list' | 'carometro'
  const [isCarometroModalOpen, setIsCarometroModalOpen] = useState(false);
  const [selectedStudentForCarometro, setSelectedStudentForCarometro] = useState(null);

  const [isFichaOpen, setIsFichaOpen] = useState(false);
  const [selectedStudentForFicha, setSelectedStudentForFicha] = useState(null);

  // Lógica de Parsing das Turmas: extrair Série e Sigla da Turma (Ex: "6º A" -> Série: "6º", Sigla: "A")
  const parsedTurmas = useMemo(() => {
    return turmas.map(t => {
      const nome = t.nome.trim();
      // Match a number + suffix and space + letter/number (Ex: "6º A", "1º EM B")
      const match = nome.match(/^(.*?)\s+([A-Za-z0-9])$/);
      if (match) {
        return {
          ...t,
          serie: match[1],
          turmaSigla: match[2]
        };
      }
      // Match without space (Ex: "6ºA")
      const matchNoSpace = nome.match(/^(.*?)(([A-Za-z0-9]))$/);
      if (matchNoSpace) {
        return {
          ...t,
          serie: matchNoSpace[1],
          turmaSigla: matchNoSpace[2]
        };
      }
      return {
        ...t,
        serie: nome,
        turmaSigla: 'Geral'
      };
    });
  }, [turmas]);

  // Lista única de Séries ordenada pedagogicamente
  const sortedSeriesList = useMemo(() => {
    const series = Array.from(new Set(parsedTurmas.map(t => t.serie)));
    const getSerieRank = (serieName) => {
      const order = ['6', '7', '8', '9', '1', '2', '3'];
      const match = serieName.match(/^(\d+)/);
      if (match) {
        const num = match[1];
        const index = order.indexOf(num);
        return index !== -1 ? index : 999;
      }
      return 999;
    };
    return [...series].sort((a, b) => {
      const rankA = getSerieRank(a);
      const rankB = getSerieRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });
  }, [parsedTurmas]);

  // Siglas de turmas disponíveis para a série selecionada
  const availableTurmaSiglas = useMemo(() => {
    if (!selectedSerie) return [];
    return Array.from(new Set(
      parsedTurmas
        .filter(t => t.serie === selectedSerie)
        .map(t => t.turmaSigla)
    )).sort();
  }, [parsedTurmas, selectedSerie]);

  // Turma ativa com base na série e sigla selecionadas
  const activeClass = useMemo(() => {
    return parsedTurmas.find(t => t.serie === selectedSerie && t.turmaSigla === selectedTurmaSigla);
  }, [parsedTurmas, selectedSerie, selectedTurmaSigla]);

  // Pré-carregamento dos dados de frequência do OneDrive em segundo plano
  usePrefetchFrequencia(activeClass?.nome);

  // Carregar/mapear fotos da turma em segundo plano para o carômetro
  const { 
    photosMap, 
    loading: loadingPhotos, 
    error: errorPhotos, 
    handleRefresh: refreshPhotos,
    needsAuth: needsAuthPhotos,
    loginMicrosoft: loginMicrosoftPhotos
  } = useCarometro(activeClass?.nome);

  // Auto-autenticação Google ao selecionar uma turma
  useEffect(() => {
    if (activeClass && isConfigured && !accessToken) {
      console.log('[Turmas] Turma selecionada e Google não conectado. Iniciando loginGoogle...');
      loginGoogle();
    }
  }, [activeClass, isConfigured, accessToken, loginGoogle]);

  // Alunos pertencentes à turma selecionada
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return (alunos || [])
      .filter(a => a.turma === activeClass.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, activeClass]);

  // Alunos filtrados por nome na busca de alunos
  const filteredStudents = useMemo(() => {
    const term = studentSearchTerm.trim().toLowerCase();
    if (term.length < 2) return [];
    return (alunos || [])
      .filter(a => a.nome.toLowerCase().includes(term))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, studentSearchTerm]);

  // Redirecionar dos resultados da busca por nome para a listagem da turma
  const handleGoToClass = (turmaNome) => {
    const found = parsedTurmas.find(t => t.nome === turmaNome);
    if (found) {
      setSelectedSerie(found.serie);
      setSelectedTurmaSigla(found.turmaSigla);
      setSearchMode('class');
      showToast(`Exibindo turma ${turmaNome}`, 'info');
    }
  };

  const renderStudentActions = (aluno) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button 
        onClick={() => {
          setSelectedStudentForFicha(aluno);
          setIsFichaOpen(true);
        }}
        title="Ficha do Aluno"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #F59E0B',
          background: '#FEF3C7',
          color: '#d97706',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)'
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#FDE68A'; e.currentTarget.style.borderColor = '#B45309'; e.currentTarget.style.color = '#B45309'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#FEF3C7'; e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.color = '#d97706'; }}
      >
        <FileText size={16} />
      </button>
      {userRole !== 'tecnico' && (
        <button 
          onClick={() => {
            setSelectedStudentForFreq(aluno);
            setIsFrequenciaOpen(true);
            if (isConfigured && !accessToken) {
              loginGoogle();
            }
          }}
          title="Frequência"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #10B981',
            background: '#ECFDF5',
            color: '#10B981',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#D1FAE5'; e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}
        >
          <Calendar size={16} />
        </button>
      )}
      {userRole !== 'tecnico' && (
        <button 
          onClick={() => showToast('Em desenvolvimento.', 'info')}
          title="Notas"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #3B82F6',
            background: '#EFF6FF',
            color: '#3B82F6',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#DBEAFE'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
        >
          <Clipboard size={16} />
        </button>
      )}
      <button 
        onClick={() => {
          setSelectedStudentForCarometro(aluno);
          setIsCarometroModalOpen(true);
          if (isConfigured && !accessToken) {
            loginGoogle();
          }
        }}
        title="Carômetro"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #8B5CF6',
          background: '#F5F3FF',
          color: '#8B5CF6',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)'
        }}
        onMouseOver={e => { e.currentTarget.style.background = '#EDE9FE'; e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.color = '#7C3AED'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6'; }}
      >
        {findPhotoInMap(aluno.nome, photosMap) ? <Camera size={16} /> : <Users size={16} />}
      </button>
    </div>
  );

  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Carregando dados...</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn-back-home"
            onClick={() => navigate('/')}
            title="Voltar ao início"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GraduationCap size={28} color="var(--color-primary)" /> Consulta de Turmas
            </h2>
          </div>
        </div>
      </div>

      {/* Segmented Control (Abas) */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        background: 'var(--bg-secondary)', 
        padding: '0.35rem', 
        borderRadius: 'var(--radius-md)', 
        width: 'fit-content', 
        marginBottom: '2rem',
        border: '1px solid var(--border-light)'
      }}>
        <button 
          onClick={() => setSearchMode('class')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            background: searchMode === 'class' ? 'var(--bg-card)' : 'transparent',
            color: searchMode === 'class' ? 'var(--color-primary)' : 'var(--text-muted)',
            boxShadow: searchMode === 'class' ? 'var(--shadow-sm)' : 'none',
            transition: 'var(--transition-smooth)'
          }}
        >
          Filtrar por Série e Turma
        </button>
        <button 
          onClick={() => setSearchMode('student')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            background: searchMode === 'student' ? 'var(--bg-card)' : 'transparent',
            color: searchMode === 'student' ? 'var(--color-primary)' : 'var(--text-muted)',
            boxShadow: searchMode === 'student' ? 'var(--shadow-sm)' : 'none',
            transition: 'var(--transition-smooth)'
          }}
        >
          Buscar por Nome do Aluno
        </button>
      </div>

      {/* Conteúdo da Aba: Série e Turma */}
      {searchMode === 'class' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Painel de Filtros */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Série / Ano</label>
                <select 
                  value={selectedSerie} 
                  onChange={e => { setSelectedSerie(e.target.value); setSelectedTurmaSigla(''); }}
                  className="select-filter"
                  style={{ width: '100%', padding: '0.65rem 1rem' }}
                >
                  <option value="">Selecione...</option>
                  {sortedSeriesList.map(serie => (
                    <option key={serie} value={serie}>{serie}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Turma</label>
                <select 
                  value={selectedTurmaSigla} 
                  onChange={e => setSelectedTurmaSigla(e.target.value)}
                  disabled={!selectedSerie}
                  className="select-filter"
                  style={{ width: '100%', padding: '0.65rem 1rem', opacity: selectedSerie ? 1 : 0.6 }}
                >
                  <option value="">Selecione...</option>
                  {availableTurmaSiglas.map(sigla => (
                    <option key={sigla} value={sigla}>{sigla}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listagem de Alunos */}
          {activeClass ? (
            <div style={{
              background: getTurmaColor(activeClass.nome),
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1.5rem', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)', 
                paddingBottom: '1rem', 
                flexWrap: 'wrap', 
                gap: '1rem' 
              }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                    <School size={20} color="#ffffff" /> Alunos Matriculados — {activeClass.nome}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', margin: 0, marginTop: '0.15rem' }}>
                    {classStudents.length} aluno(s) cadastrado(s)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {activeClass.link && (
                    <button 
                      onClick={() => window.open(activeClass.link, '_blank', 'noopener')}
                      className="btn"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        margin: 0,
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        boxShadow: 'none'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                    >
                      <LinkIcon size={16} /> Abrir Mapa de Classe
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented Control de Abas Internas da Turma */}
              <div style={{ 
                display: 'flex', 
                gap: '0.35rem', 
                background: 'rgba(0, 0, 0, 0.12)', 
                padding: '0.25rem', 
                borderRadius: 'var(--radius-md)', 
                width: 'fit-content', 
                marginBottom: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <button 
                  onClick={() => setClassViewMode('list')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    background: classViewMode === 'list' ? '#ffffff' : 'transparent',
                    color: classViewMode === 'list' ? getTurmaColor(activeClass.nome) : '#ffffff',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Lista de Alunos
                </button>
                <button 
                  onClick={() => {
                    setClassViewMode('carometro');
                    if (isConfigured && !accessToken) {
                      loginGoogle();
                    }
                  }}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    background: classViewMode === 'carometro' ? '#ffffff' : 'transparent',
                    color: classViewMode === 'carometro' ? getTurmaColor(activeClass.nome) : '#ffffff',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Carômetro (Fotos)
                </button>
              </div>

              {classViewMode === 'list' ? (
                classStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Nenhum aluno cadastrado nesta turma.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {classStudents.map((aluno, index) => {
                      const photoUrl = findPhotoInMap(aluno.nome, photosMap);
                      return (
                        <div 
                          key={aluno.id}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '0.75rem 1.25rem', 
                            background: '#ffffff', 
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'var(--transition-smooth)'
                          }}
                          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 700, color: getTurmaColor(activeClass.nome), fontSize: '0.85rem', minWidth: '24px' }}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            
                            {/* Mini Avatar do Aluno do OneDrive (ou ícone padrão) */}
                            <div 
                              onClick={() => {
                                setSelectedStudentForCarometro(aluno);
                                setIsCarometroModalOpen(true);
                                if (isConfigured && !accessToken) {
                                  loginGoogle();
                                }
                              }}
                              title="Ver crachá/foto"
                              style={{ 
                                width: '30px', 
                                height: '30px', 
                                borderRadius: '50%', 
                                overflow: 'hidden', 
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-light)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              {photoUrl ? (
                                <img 
                                  src={photoUrl} 
                                  alt="" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              ) : (
                                <User size={14} color="var(--text-light)" />
                              )}
                            </div>

                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{aluno.nome}</span>
                          </div>
                           {renderStudentActions(aluno)}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CarometroGrid 
                    students={classStudents}
                    photosMap={photosMap}
                    loading={loadingPhotos}
                    error={errorPhotos}
                    onRefresh={refreshPhotos}
                    needsAuth={needsAuthPhotos}
                    onLogin={loginMicrosoftPhotos}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <GraduationCap size={48} style={{ color: 'var(--border-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Selecione a Série e a Turma</p>
              <p style={{ fontSize: '0.9rem', margin: 0, marginTop: '0.25rem' }}>Utilize os filtros acima para listar os alunos da classe.</p>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba: Nome do Aluno */}
      {searchMode === 'student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Painel de Busca */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text" 
                value={studentSearchTerm} 
                onChange={e => setStudentSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome do(a) aluno(a)..."
                className="search-input"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 2.5rem', 
                  borderRadius: 'var(--radius-md)',
                  margin: 0
                }}
              />
              <Search className="search-icon" size={18} style={{ left: '0.85rem' }} />
              {studentSearchTerm && (
                <button 
                  onClick={() => setStudentSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Resultados da Busca */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              Resultados da Pesquisa
            </h3>

            {studentSearchTerm.trim().length < 2 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                {studentSearchTerm.trim().length === 1 
                  ? 'Digite pelo menos 2 caracteres para buscar.' 
                  : 'Digite o nome do aluno no campo acima para iniciar a busca.'
                }
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                Nenhum(a) aluno(a) encontrado(a) com "{studentSearchTerm}".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredStudents.map(aluno => (
                  <div 
                    key={aluno.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.75rem 1.25rem', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{aluno.nome}</span>
                      <span 
                        onClick={() => handleGoToClass(aluno.turma)}
                        title={`Ir para listagem da turma ${aluno.turma}`}
                        style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--color-primary)', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          fontWeight: 600,
                          width: 'fit-content'
                        }}
                        onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        <School size={12} /> {aluno.turma}
                      </span>
                    </div>
                     {renderStudentActions(aluno)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Frequência */}
      {isFrequenciaOpen && selectedStudentForFreq && (
        <Frequencia 
          aluno={selectedStudentForFreq} 
          isOpen={isFrequenciaOpen} 
          onClose={() => { 
            setIsFrequenciaOpen(false); 
            setSelectedStudentForFreq(null); 
          }} 
        />
      )}

      {/* Modal do Carômetro (Crachá Individual) */}
      {isCarometroModalOpen && selectedStudentForCarometro && (
        <CarometroModal
          aluno={selectedStudentForCarometro}
          isOpen={isCarometroModalOpen}
          onClose={() => {
            setIsCarometroModalOpen(false);
            setSelectedStudentForCarometro(null);
          }}
        />
      )}

      {/* Modal da Ficha do Aluno */}
      {isFichaOpen && selectedStudentForFicha && (
        <FichaAlunoModal
          aluno={selectedStudentForFicha}
          isOpen={isFichaOpen}
          onClose={() => {
            setIsFichaOpen(false);
            setSelectedStudentForFicha(null);
          }}
          photosMap={photosMap}
        />
      )}
    </div>
  );
}
