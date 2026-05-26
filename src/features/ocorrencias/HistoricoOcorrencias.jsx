import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportOcorrenciasCSV, exportOcorrenciasPDF } from '../../utils/exportOcorrencias'
import { Book, Calendar, CheckCircle2, Clock, AlertTriangle, User, Zap, Shield, ClipboardList, X, ArrowLeft, Download, FileText, Trash2, Check, Pencil } from 'lucide-react'
import { useOcorrencias } from './hooks/useOcorrencias'
import { useGlobalData } from '../../app/providers/GlobalDataProvider'
import { useAuth } from '../../app/providers/AuthProvider'
import Ocorrencias from './Ocorrencias'

const getStatusStyles = (status) => {
  const s = status || 'Em aberto';
  if (s === 'Em aberto') {
    return {
      border: 'var(--color-danger)',
      bg: 'var(--color-danger-bg)',
      text: 'var(--color-danger)',
      icon: <AlertTriangle size={14} />
    };
  } else if (s === 'Em andamento') {
    return {
      border: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      text: 'var(--color-warning)',
      icon: <Clock size={14} />
    };
  } else if (s === 'Concluída') {
    return {
      border: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      text: 'var(--color-success)',
      icon: <CheckCircle2 size={14} />
    };
  }
  return {
    border: 'var(--border-light)',
    bg: 'var(--bg-secondary)',
    text: 'var(--text-muted)',
    icon: <ClipboardList size={14} />
  };
};

export default function HistoricoOcorrencias() {
  const navigate = useNavigate();
  const { ocorrencias, deleteOcorrencia, updateOcorrencia } = useOcorrencias();
  const { professores, turmas } = useGlobalData();
  const { userRole, userName, linkProfileName, authLoading } = useAuth();
  
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null)
  const [intervencaoText, setIntervencaoText] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Em aberto')
  const [savingIntervencao, setSavingIntervencao] = useState(false)

  // Identification flow
  const [selectedNameForLink, setSelectedNameForLink] = useState('');
  const [linking, setLinking] = useState(false);

  // Modal flow
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false);
  const [ocorrenciaToEdit, setOcorrenciaToEdit] = useState(null);

  // Filters
  const [filterProf, setFilterProf] = useState('')
  const [filterDisciplina, setFilterDisciplina] = useState('')
  const [filterTurma, setFilterTurma] = useState('')
  const [filterAluno, setFilterAluno] = useState('')
  const [filterData, setFilterData] = useState('')

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState('Todas');

  const handleLinkProfile = async (e) => {
    e.preventDefault();
    if (!selectedNameForLink) return;
    setLinking(true);
    const success = await linkProfileName(selectedNameForLink);
    setLinking(false);
    if (!success) {
      alert('Erro ao vincular conta. Tente novamente.');
    }
  };

  const handleEditOcorrencia = (o) => {
    setOcorrenciaToEdit(o);
    setShowOcorrenciaModal(true);
  };

  const filtered = useMemo(() => (ocorrencias || []).filter(o => {
    // Security restriction: if not gestao and userName is linked, they only see their own occurrences
    if (userRole !== 'gestao' && userName) {
      if (o.professor !== userName) return false;
    }

    if (filterProf && !o.professor.toLowerCase().includes(filterProf.toLowerCase())) return false
    if (filterDisciplina && !o.disciplina.toLowerCase().includes(filterDisciplina.toLowerCase())) return false
    if (filterTurma && o.turma !== filterTurma) return false
    if (filterAluno && !(o.alunos || []).some(a => a.toLowerCase().includes(filterAluno.toLowerCase()))) return false
    if (filterData && o.data !== filterData) return false
    return true
  }), [ocorrencias, filterProf, filterDisciplina, filterTurma, filterAluno, filterData, userRole, userName])

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.data) - new Date(a.data))
  }, [filtered])

  const ocorrenciasEmAberto = useMemo(() => sortedFiltered.filter(o => o.status === 'Em aberto' || !o.status), [sortedFiltered])
  const ocorrenciasEmAndamento = useMemo(() => sortedFiltered.filter(o => o.status === 'Em andamento'), [sortedFiltered])
  const ocorrenciasConcluidas = useMemo(() => sortedFiltered.filter(o => o.status === 'Concluída'), [sortedFiltered])

  const itemsToDisplay = useMemo(() => {
    if (activeTab === 'Todas') return sortedFiltered;
    if (activeTab === 'Em aberto') return ocorrenciasEmAberto;
    if (activeTab === 'Em andamento') return ocorrenciasEmAndamento;
    if (activeTab === 'Concluída') return ocorrenciasConcluidas;
    return sortedFiltered;
  }, [sortedFiltered, ocorrenciasEmAberto, ocorrenciasEmAndamento, ocorrenciasConcluidas, activeTab]);

  const tabs = [
    { key: 'Todas', label: 'Todas', color: '#3b82f6', bgGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', count: sortedFiltered.length, icon: <ClipboardList size={16} /> },
    { key: 'Em aberto', label: 'Em aberto', color: 'var(--color-danger)', bgGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', count: ocorrenciasEmAberto.length, icon: <AlertTriangle size={16} /> },
    { key: 'Em andamento', label: 'Em andamento', color: 'var(--color-warning)', bgGradient: 'linear-gradient(135deg, #f59e0b, #d97706)', count: ocorrenciasEmAndamento.length, icon: <Clock size={16} /> },
    { key: 'Concluída', label: 'Concluídas', color: 'var(--color-success)', bgGradient: 'linear-gradient(135deg, #10b981, #047857)', count: ocorrenciasConcluidas.length, icon: <CheckCircle2 size={16} /> }
  ];

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'var(--bg-card)', transition: 'border-color 0.2s'
  }

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', fontWeight: 600 }}>
        Carregando informações...
      </div>
    );
  }

  if (userRole !== 'gestao' && !userName) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '2.5rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>👋</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem 0' }}>Identifique-se</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.75rem 0' }}>
            Para ver e gerenciar suas ocorrências, selecione o seu nome de Professor(a) para vincular à sua conta de e-mail.
          </p>
          <form onSubmit={handleLinkProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                Seu nome de Professor(a) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={selectedNameForLink}
                onChange={e => setSelectedNameForLink(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Selecione...</option>
                {professores && professores.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedNameForLink || linking}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.8rem 1.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: (!selectedNameForLink || linking) ? 'not-allowed' : 'pointer',
                opacity: (!selectedNameForLink || linking) ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => { if (selectedNameForLink && !linking) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {linking ? 'Vinculando...' : 'Confirmar e Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem' }} title="Voltar">
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700 }}>Histórico de Ocorrências</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, marginLeft: '3.25rem', fontSize: '0.9rem' }}>
            {filtered.length} ocorrência{filtered.length !== 1 ? 's' : ''} registrada{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary"
            onClick={() => { setOcorrenciaToEdit(null); setShowOcorrenciaModal(true); }} 
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-warning)' }}
          >
            <AlertTriangle size={16} /> Nova Ocorrência
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => exportOcorrenciasCSV(filtered)} 
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> Exportar CSV
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => exportOcorrenciasPDF(filtered, { filterProf, filterDisciplina, filterTurma, filterAluno, filterData })} 
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-primary-dark)' }}
          >
            <FileText size={16} /> Gerar PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
        {userRole === 'gestao' && (
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Professor(a)</label>
            <select value={filterProf} onChange={e => setFilterProf(e.target.value)}
              style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
              <option value="">Todos</option>
              {professores && professores.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Disciplina</label>
          <input type="text" placeholder="Ex: Matemática..." value={filterDisciplina}
            onChange={e => setFilterDisciplina(e.target.value)}
            style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        {turmas && turmas.length > 0 && (
          <div style={{ flex: '1 1 130px' }}>
            <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Turma</label>
            <select value={filterTurma} onChange={e => { setFilterTurma(e.target.value); setFilterAluno(''); }}
              style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.87rem' }}>
              <option value="">Todas</option>
              {turmas.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Aluno</label>
          <input type="text" placeholder="Nome do aluno..." value={filterAluno}
            onChange={e => setFilterAluno(e.target.value)}
            style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Data</label>
          <input type="date" value={filterData} onChange={e => setFilterData(e.target.value)}
            style={{ ...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.87rem' }} />
        </div>
        {(filterProf || filterDisciplina || filterTurma || filterAluno || filterData) && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setFilterProf(''); setFilterDisciplina(''); setFilterTurma(''); setFilterAluno(''); setFilterData('') }}
              style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ✕ Limpar
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {filtered.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-light)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {tabs.map(tab => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: isSelected ? tab.bgGradient : 'var(--bg-card)',
                  color: isSelected ? 'white' : 'var(--text-main)',
                  border: isSelected ? 'none' : '1px solid var(--border-light)',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '30px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 4px 10px ${tab.color}33` : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => { if(!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
                onMouseOut={e => { if(!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card)' }}
              >
                <span style={{ display: 'flex', color: isSelected ? 'white' : tab.color }}>
                  {tab.icon}
                </span>
                {tab.label}
                <span style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-secondary)',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '20px',
                  fontWeight: 700,
                  border: isSelected ? 'none' : '1px solid var(--border-light)',
                  marginLeft: '0.2rem'
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      {itemsToDisplay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ color: 'var(--color-primary)', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><ClipboardList size={48} /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma ocorrência encontrada nesta aba.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(() => {
            const isGestao = userRole === 'gestao';
            const renderItem = (o, statusStyles) => {
              const canModify = isGestao || o.professor === userName;
              
              return (
                <div key={o.id} 
                  onClick={() => {
                    if (isGestao) {
                      setSelectedOcorrencia(o)
                      setIntervencaoText(o.intervencao_gestao || '')
                      setSelectedStatus(o.status || 'Em aberto')
                    }
                  }}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                    borderLeft: `6px solid ${statusStyles.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                    cursor: isGestao ? 'pointer' : 'default',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => { if (isGestao) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                  onMouseOut={(e) => { if (isGestao) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>{o.professor}</span>
                      {o.turma && (
                        <span style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          {o.turma}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: (o.descricao || (o.alunos && o.alunos.length > 0)) ? '0.75rem' : 0 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Book size={14} /> {o.disciplina}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={14} /> {new Date(o.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: statusStyles.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', background: statusStyles.bg, padding: '0.15rem 0.6rem', borderRadius: '999px' }}>
                        {statusStyles.icon} {o.status || 'Em aberto'}
                      </span>
                    </div>
                    {o.alunos && o.alunos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: o.descricao ? '0.75rem' : 0 }}>
                        {o.alunos.map(nome => (
                          <span key={nome} style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <User size={12} /> {nome}
                          </span>
                        ))}
                      </div>
                    )}
                    {o.descricao && (
                      <div style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-primary)', marginBottom: o.acao_professor ? '0.5rem' : 0 }}>
                        {o.descricao}
                      </div>
                    )}
                    {o.acao_professor && (
                      <div style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-success)', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-success)', marginBottom: o.intervencao_gestao ? '0.5rem' : 0, display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <Zap size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <div><span style={{ fontWeight: 600, marginRight: '0.35rem' }}>Ação:</span>{o.acao_professor}</div>
                      </div>
                    )}
                    {o.intervencao_gestao && (
                      <div style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', borderLeft: '3px solid var(--color-primary-dark)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <Shield size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <div><span style={{ fontWeight: 600, marginRight: '0.35rem' }}>Intervenção da Gestão:</span>{o.intervencao_gestao}</div>
                      </div>
                    )}
                  </div>
                  {canModify && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon edit"
                        onClick={() => handleEditOcorrencia(o)}
                        title="Editar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '0.5rem', transition: 'var(--transition-fast)' }}
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => deleteOcorrencia(o.id)}
                        title="Excluir"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.5rem', transition: 'var(--transition-fast)' }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {itemsToDisplay.map(o => renderItem(o, getStatusStyles(o.status)))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal Intervenção Gestão */}
      {selectedOcorrencia && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedOcorrencia(null) }}>
          <div className="modal-content" style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)' }}>
                <Shield size={24} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>Intervenção da Gestão</h3>
              </div>
              <button className="btn-icon" onClick={() => setSelectedOcorrencia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{selectedOcorrencia.professor} - {selectedOcorrencia.turma}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12} /> {new Date(selectedOcorrencia.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}><strong>Descrição:</strong> {selectedOcorrencia.descricao}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-success)' }}><strong>Ação do Prof:</strong> {selectedOcorrencia.acao_professor}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.95rem', outline: 'none', marginBottom: '1.25rem', fontFamily: 'inherit', backgroundColor: 'var(--bg-card)' }}
                >
                  <option value="Em aberto">Em aberto</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>

                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Intervenção da Gestão</label>
                <textarea
                  placeholder="Descreva as ações ou observações da gestão sobre esta ocorrência..."
                  value={intervencaoText}
                  onChange={e => setIntervencaoText(e.target.value)}
                  rows={5}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'var(--bg-card)' }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1.25rem 2rem', display: 'flex', gap: '0.75rem', flexShrink: 0, borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
              <button className="btn btn-secondary" type="button" onClick={() => setSelectedOcorrencia(null)} style={{ flex: 1, padding: '0.75rem' }}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                type="button" 
                disabled={savingIntervencao}
                onClick={async () => {
                  setSavingIntervencao(true)
                  await updateOcorrencia(selectedOcorrencia.id, { intervencao_gestao: intervencaoText.trim(), status: selectedStatus })
                  setSavingIntervencao(false)
                  setSelectedOcorrencia(null)
                }}
                style={{ flex: 2, padding: '0.75rem', opacity: savingIntervencao ? 0.7 : 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {savingIntervencao ? 'Salvando...' : <><Check size={18} /> Salvar Intervenção</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Ocorrência */}
      {showOcorrenciaModal && (
        <Ocorrencias
          isOpen={showOcorrenciaModal}
          onClose={() => { setShowOcorrenciaModal(false); setOcorrenciaToEdit(null); }}
          ocorrenciaToEdit={ocorrenciaToEdit}
        />
      )}
    </div>
  )
}
