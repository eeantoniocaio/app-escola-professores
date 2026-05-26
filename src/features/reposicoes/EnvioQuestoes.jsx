import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestoes } from './hooks/useQuestoes';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';
import { Pencil, Trash2, Check, ChevronLeft, ChevronRight, Search, X, FileText } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { supabase } from '../../shared/services/supabase';
import QuestaoDetailModal from './QuestaoDetailModal';
import QuestionPrintPreviewModal from './components/QuestionPrintPreviewModal';

const EMPTY_FORM = { 
  professor: '', 
  disciplina: '', 
  serie: '',
  turma: '', 
  data: '', 
  habilidade: '',
  enunciado: '', 
  imagem_base64: '',
  imagem_url: '',
  numAlternativas: '4', // default 4
  alternativas: { A: '', B: '', C: '', D: '', E: '' },
  alternativaCorreta: ''
};

const getCombinedTurmaName = (serie, turma) => {
  if (!serie) return turma;
  const match = serie.match(/^\d+º/);
  if (match) {
    return `${match[0]}${turma}`;
  }
  return `${serie} ${turma}`;
};

export default function EnvioQuestoes() {
  const navigate = useNavigate();
  const { userRole, userName, authLoading } = useAuth();
  const { questoes, addQuestao, deleteQuestao, updateQuestao } = useQuestoes();
  const { professores } = useGlobalData();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [questaoToEdit, setQuestaoToEdit] = useState(null);
  const [selectedQuestaoForDetail, setSelectedQuestaoForDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Print & Selection States
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Storage Image state
  const [imageFile, setImageFile] = useState(null);

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('questoes-imagens')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('questoes-imagens')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      return null;
    }
  };

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterDisciplina, setFilterDisciplina] = useState('');
  const [filterHabilidade, setFilterHabilidade] = useState('');
  const [activeTab, setActiveTab] = useState('Todas');

  const letrasAlternativas = ['A', 'B', 'C', 'D', 'E'];

  const seriesTabs = ['Todas', '6º ano', '7º ano', '8º ano', '9º ano', '1ºEM', '2ºEM', '3ºEM'];

  // Derived filter options from database questions
  const uniqueProfessores = Array.from(new Set(questoes.map(q => q.professor).filter(Boolean))).sort();
  const uniqueDisciplinas = Array.from(new Set(questoes.map(q => q.disciplina).filter(Boolean))).sort();
  const uniqueHabilidades = Array.from(new Set(questoes.map(q => q.habilidade).filter(Boolean))).sort();

  // Filter logic
  const filteredQuestoes = (questoes || []).filter(q => {
    // SECURITY LIMITATION: If user is a professor, they only see their own questions
    if (userRole !== 'gestao' && userName) {
      if (q.professor !== userName) return false;
    }

    // Active Series Tab filter
    if (activeTab !== 'Todas' && q.serie !== activeTab) {
      return false;
    }

    if (filterText.trim()) {
      const search = filterText.toLowerCase();
      const matchText = 
        (q.enunciado || '').toLowerCase().includes(search) ||
        (q.professor || '').toLowerCase().includes(search) ||
        (q.disciplina || '').toLowerCase().includes(search) ||
        (q.habilidade || '').toLowerCase().includes(search) ||
        (q.serie || '').toLowerCase().includes(search) ||
        (q.turma || '').toLowerCase().includes(search);
      if (!matchText) return false;
    }
    if (filterProfessor && q.professor !== filterProfessor) return false;
    if (filterDisciplina && q.disciplina !== filterDisciplina) return false;
    if (filterHabilidade && q.habilidade !== filterHabilidade) return false;
    return true;
  });

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredQuestoes.map(q => q.id);
    setSelectedQuestionIds(prev => {
      const newSelection = new Set([...prev, ...filteredIds]);
      return Array.from(newSelection);
    });
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!form.professor.trim()) e.professor = 'Campo obrigatório';
      if (!form.disciplina.trim()) e.disciplina = 'Campo obrigatório';
      if (!form.serie) e.serie = 'Campo obrigatório';
      if (!form.turma) e.turma = 'Campo obrigatório';
      if (!form.data) e.data = 'Campo obrigatório';
      if (!form.habilidade?.trim()) e.habilidade = 'Campo obrigatório';
    } else if (step === 2) {
      if (!form.enunciado.trim()) e.enunciado = 'Campo obrigatório';
    } else if (step === 3) {
      const num = parseInt(form.numAlternativas, 10);
      for (let i = 0; i < num; i++) {
        const letra = letrasAlternativas[i];
        if (!form.alternativas[letra] || !form.alternativas[letra].trim()) {
          e[`alternativa_${letra}`] = 'Campo obrigatório';
        }
      }
      if (!form.alternativaCorreta) e.alternativaCorreta = 'Campo obrigatório';
    }
    return e;
  };

  const handleCloseFormModal = () => {
    setShowModal(false);
    setQuestaoToEdit(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setErrors({});
    setCurrentStep(1);
  };

  const handleEditQuestao = (q) => {
    setForm({
      professor: q.professor || '',
      disciplina: q.disciplina || '',
      serie: q.serie || '',
      turma: q.turma ? q.turma.charAt(q.turma.length - 1) : '',
      data: q.data || '',
      habilidade: q.habilidade || '',
      enunciado: q.enunciado || '',
      imagem_base64: q.imagem_base64 || '',
      imagem_url: q.imagem_url || '',
      numAlternativas: q.num_alternativas?.toString() || '4',
      alternativas: {
        A: q.alternativas?.A || '',
        B: q.alternativas?.B || '',
        C: q.alternativas?.C || '',
        D: q.alternativas?.D || '',
        E: q.alternativas?.E || ''
      },
      alternativaCorreta: q.alternativa_correta || ''
    });
    setQuestaoToEdit(q);
    setImageFile(null);
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleNextStep = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(3);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setSaving(true);

    let finalImageUrl = form.imagem_url;
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        alert('Falha ao enviar a imagem. Salvando a questão sem imagem.');
      }
    }

    const combinedTurma = getCombinedTurmaName(form.serie, form.turma);
    const questionData = {
      professor: form.professor.trim(),
      disciplina: form.disciplina.trim(),
      serie: form.serie,
      turma: combinedTurma,
      data: form.data,
      habilidade: form.habilidade.trim(),
      enunciado: form.enunciado.trim(),
      num_alternativas: parseInt(form.numAlternativas, 10),
      alternativas: form.alternativas,
      imagem_base64: null, // Clear Base64 string from database
      imagem_url: finalImageUrl || null,
      alternativa_correta: form.alternativaCorreta
    };

    let success = false;
    if (questaoToEdit) {
      success = await updateQuestao(questaoToEdit.id, questionData);
    } else {
      success = await addQuestao(questionData);
    }

    setSaving(false);
    if (success) {
      setForm(EMPTY_FORM);
      setImageFile(null);
      setErrors({});
      setQuestaoToEdit(null);
      setShowModal(false);
      setCurrentStep(1);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
    border: `1.5px solid ${errors[field] ? '#f87171' : '#e2e8f0'}`,
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', transition: 'border-color 0.2s'
  });

  const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', fontWeight: 600 }}>
        Carregando informações...
      </div>
    );
  }



  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }} title="Voltar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Questões de reposições</h2>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, marginLeft: '2.5rem', fontSize: '0.9rem' }}>
            {filteredQuestoes.length === (questoes || []).length 
              ? `${(questoes || []).length} questão(ões) enviada(s)`
              : `${filteredQuestoes.length} de ${(questoes || []).length} questão(ões) filtrada(s)`
            }
          </p>
        </div>
        <button
          onClick={() => { 
            setForm({ ...EMPTY_FORM, professor: (userRole !== 'gestao' && userName) ? userName : '' }); 
            setErrors({}); 
            setShowModal(true); 
          }}
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span> Nova Questão
        </button>
      </div>

      {/* Filtros */}
      {questoes.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Row 1: Search & Reset */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Pesquisar por enunciado, professor, disciplina..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.5rem',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {filterText && (
                <button
                  onClick={() => setFilterText('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                    display: 'flex', alignItems: 'center', padding: 0
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {(filterText || filterProfessor || filterDisciplina || filterHabilidade || activeTab !== 'Todas') && (
              <button
                onClick={() => {
                  setFilterText('');
                  setFilterProfessor('');
                  setFilterDisciplina('');
                  setFilterHabilidade('');
                  setActiveTab('Todas');
                }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <X size={16} /> Limpar Filtros
              </button>
            )}
          </div>

          {/* Row 2: Select Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {/* Professor Filter */}
            {userRole === 'gestao' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Professor(a)</label>
                <select
                  value={filterProfessor}
                  onChange={e => setFilterProfessor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    color: '#334155',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Todos</option>
                  {uniqueProfessores.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Disciplina Filter */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Disciplina</label>
              <select
                value={filterDisciplina}
                onChange={e => setFilterDisciplina(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#334155',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Todas</option>
                {uniqueDisciplinas.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Habilidade Filter */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Habilidade</label>
              <select
                value={filterHabilidade}
                onChange={e => setFilterHabilidade(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '0.85rem',
                  color: '#334155',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Todas</option>
                {uniqueHabilidades.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      )}

      {/* Series Tabs */}
      {questoes.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}>
          {seriesTabs.map(tab => {
            const countForTab = (questoes || []).filter(q => {
              if (userRole !== 'gestao' && userName && q.professor !== userName) return false;
              if (tab !== 'Todas' && q.serie !== tab) return false;
              return true;
            }).length;

            const isSelected = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)' : '#f1f5f9',
                  color: isSelected ? 'white' : '#475569',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '30px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 10px rgba(14, 165, 233, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { if(!isSelected) e.currentTarget.style.backgroundColor = '#e2e8f0' }}
                onMouseOut={e => { if(!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9' }}
              >
                {tab}
                <span style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#cbd5e1',
                  color: isSelected ? 'white' : '#64748b',
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '20px',
                  fontWeight: 700
                }}>
                  {countForTab}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Batch selection controls */}
      {questoes.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.88rem'
        }}>
          <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{selectedQuestionIds.length} selecionada(s)</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSelectAllFiltered}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#475569',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.82rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              Selecionar Todas ({filteredQuestoes.length})
            </button>
            {selectedQuestionIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#ef4444',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Limpar Seleção
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {questoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma questão enviada ainda.</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>Clique em "+ Nova Questão" para criar uma.</p>
        </div>
      ) : filteredQuestoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma questão encontrada para os filtros aplicados.</p>
          <button
            onClick={() => {
              setFilterText('');
              setFilterProfessor('');
              setFilterDisciplina('');
              setFilterHabilidade('');
              setActiveTab('Todas');
            }}
            style={{
              marginTop: '1rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredQuestoes && filteredQuestoes.map(q => (
            <div 
              key={q.id} 
              onClick={(e) => {
                if (e.target.closest('button') || e.target.closest('.card-checkbox')) return;
                setSelectedQuestaoForDetail(q);
              }}
              style={{ 
                background: 'white', 
                borderRadius: '14px', 
                padding: '1.5rem', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                border: selectedQuestionIds.includes(q.id) ? '1.5px solid #3b82f6' : '1px solid #f1f5f9', 
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                {/* Checkbox */}
                <div 
                  className="card-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectQuestion(q.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: `2px solid ${selectedQuestionIds.includes(q.id) ? '#3b82f6' : '#cbd5e1'}`,
                    backgroundColor: selectedQuestionIds.includes(q.id) ? '#3b82f6' : 'transparent',
                    cursor: 'pointer',
                    marginTop: '2px',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                >
                  {selectedQuestionIds.includes(q.id) && (
                    <Check size={14} strokeWidth={3} color="white" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', paddingRight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.disciplina}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {q.habilidade && <span style={{ background: '#fef08a', color: '#854d0e', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{q.habilidade}</span>}
                      <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{q.turma}</span>
                      
                      {/* Action Buttons */}
                      {(userRole === 'gestao' || q.professor === userName) && (
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.4rem' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditQuestao(q); }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                            title="Editar Questão"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteQuestao && deleteQuestao(q.id); }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                            title="Excluir Questão"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    Por {q.professor} em {new Date(q.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}>
                    {q.enunciado}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                    {q.num_alternativas} Alternativas
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) handleCloseFormModal() }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Modal header */}
            <div style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{questaoToEdit ? '📝 Editar Questão' : '📝 Nova Questão'}</h3>
              <button onClick={handleCloseFormModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>

            {/* Progress indicator */}
            <div style={{ padding: '1.5rem 4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #f1f5f9' }}>
              {[
                { num: 1, label: 'Identificação' },
                { num: 2, label: 'Questão' },
                { num: 3, label: 'Alternativas' }
              ].map((step, idx, arr) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const color = isCompleted ? '#10b981' : (isCurrent ? '#2563eb' : '#cbd5e1');
                const textColor = isCompleted ? '#10b981' : (isCurrent ? '#2563eb' : '#94a3b8');
                const bgColor = isCompleted || isCurrent ? color : '#f8fafc';
                
                return (
                  <React.Fragment key={step.num}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bgColor, color: (isCompleted || isCurrent) ? '#fff' : '#94a3b8', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s' }}>
                        {isCompleted ? <Check size={20} strokeWidth={3} /> : step.num}
                      </div>
                      <span style={{ position: 'absolute', top: '44px', fontSize: '0.85rem', fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > step.num ? '#10b981' : '#e2e8f0', margin: '0 8px', transition: 'all 0.3s', alignSelf: 'flex-start', marginTop: '17px' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1 }}>
              <form 
                id="questao-form" 
                onSubmit={handleSubmit} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    if (currentStep < 3) {
                      handleNextStep();
                    }
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                
                {/* Step 1: Identificação */}
                <div style={{ display: currentStep === 1 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  {/* Nome do Professor */}
                  <div>
                    <label style={labelStyle}>Nome do Professor(a) <span style={{ color: '#ef4444' }}>*</span></label>
                    {userRole !== 'gestao' && userName ? (
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}>
                        {userName}
                      </div>
                    ) : professores && professores.length > 0 ? (
                      <select value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')}>
                        <option value="">Selecione...</option>
                        {professores.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder="Nome completo" value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))} style={inputStyle('professor')} />
                    )}
                    {errors.professor && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.professor}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Disciplina */}
                    <div>
                      <label style={labelStyle}>Disciplina <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="Ex: Matemática" value={form.disciplina} onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))} style={inputStyle('disciplina')} />
                      {errors.disciplina && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.disciplina}</span>}
                    </div>

                    {/* Habilidade */}
                    <div>
                      <label style={labelStyle}>Habilidade <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="Ex: EF06MA02" value={form.habilidade} onChange={e => setForm(p => ({ ...p, habilidade: e.target.value }))} style={inputStyle('habilidade')} />
                      {errors.habilidade && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.habilidade}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Série */}
                    <div>
                      <label style={labelStyle}>Série <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.serie} onChange={e => setForm(p => ({ ...p, serie: e.target.value }))} style={inputStyle('serie')}>
                        <option value="">Selecione...</option>
                        {['6º ano', '7º ano', '8º ano', '9º ano', '1ºEM', '2ºEM', '3ºEM'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.serie && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.serie}</span>}
                    </div>

                    {/* Turma */}
                    <div>
                      <label style={labelStyle}>Turma <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.turma} onChange={e => setForm(p => ({ ...p, turma: e.target.value }))} style={inputStyle('turma')}>
                        <option value="">Selecione...</option>
                        {['A', 'B', 'C', 'D', 'E'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.turma && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.turma}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Data de Envio */}
                    <div>
                      <label style={labelStyle}>Data de envio <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} style={inputStyle('data')} />
                      {errors.data && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.data}</span>}
                    </div>

                    {/* Nº de alternativas */}
                    <div>
                      <label style={labelStyle}>Nº de alternativas <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.numAlternativas} onChange={e => setForm(p => ({ ...p, numAlternativas: e.target.value }))} style={inputStyle('numAlternativas')}>
                        <option value="1">1 alternativa</option>
                        <option value="2">2 alternativas</option>
                        <option value="3">3 alternativas</option>
                        <option value="4">4 alternativas</option>
                        <option value="5">5 alternativas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Questão */}
                <div style={{ display: currentStep === 2 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  {/* Enunciado */}
                  <div>
                    <label style={labelStyle}>Enunciado <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea
                      placeholder="Digite o enunciado da questão..."
                      value={form.enunciado}
                      onChange={e => setForm(p => ({ ...p, enunciado: e.target.value }))}
                      rows={6}
                      style={{ ...inputStyle('enunciado'), resize: 'vertical', minHeight: '150px', fontFamily: 'inherit' }}
                    />
                    {errors.enunciado && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.enunciado}</span>}
                  </div>

                  {/* Imagem da Questão */}
                  <div>
                    <label style={labelStyle}>Imagem da Questão <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                    {form.imagem_base64 || form.imagem_url ? (
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                        <img
                          src={form.imagem_base64 || form.imagem_url}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block', background: '#f8fafc' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setForm(p => ({ ...p, imagem_base64: '', imagem_url: '' }));
                            setImageFile(null);
                          }}
                          style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
                            width: '28px', height: '28px', cursor: 'pointer', color: 'white',
                            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Remover imagem"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px',
                        padding: '1.5rem', cursor: 'pointer', background: '#f8fafc',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#0ea5e9'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#94a3b8" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Clique para selecionar uma imagem</span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>PNG, JPG ou JPEG — máx. 2MB</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Imagem muito grande! O tamanho máximo é 2MB.');
                              return;
                            }
                            setImageFile(file);
                            const reader = new FileReader();
                            reader.onload = ev => setForm(p => ({ ...p, imagem_base64: ev.target.result }));
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Step 3: Alternativas */}
                <div style={{ display: currentStep === 3 ? 'flex' : 'none', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ ...labelStyle, fontSize: '0.9rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: 0 }}>Alternativas</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Array.from({ length: parseInt(form.numAlternativas, 10) }).map((_, i) => {
                        const letra = letrasAlternativas[i];
                        return (
                          <div key={letra} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 800, color: '#64748b', marginTop: '0.55rem', width: '20px' }}>{letra})</span>
                            <div style={{ flex: 1 }}>
                              <textarea
                                placeholder={`Texto da alternativa ${letra}...`}
                                value={form.alternativas[letra]}
                                onChange={e => setForm(p => ({
                                  ...p,
                                  alternativas: { ...p.alternativas, [letra]: e.target.value }
                                }))}
                                rows={2}
                                style={{ ...inputStyle(`alternativa_${letra}`), resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                              />
                              {errors[`alternativa_${letra}`] && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors[`alternativa_${letra}`]}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Alternativa Correta */}
                  <div>
                    <label style={labelStyle}>Alternativa correta <span style={{ color: '#ef4444' }}>*</span></label>
                    <select 
                      value={form.alternativaCorreta} 
                      onChange={e => setForm(p => ({ ...p, alternativaCorreta: e.target.value }))} 
                      style={inputStyle('alternativaCorreta')}
                    >
                      <option value="">Selecione...</option>
                      {Array.from({ length: parseInt(form.numAlternativas, 10) }).map((_, i) => {
                        const letra = letrasAlternativas[i];
                        return <option key={letra} value={letra}>Alternativa {letra}</option>;
                      })}
                    </select>
                    {errors.alternativaCorreta && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{errors.alternativaCorreta}</span>}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '1.25rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexShrink: 0,
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px'
            }}>
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      color: '#1e293b',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  >
                    <ChevronLeft size={16} /> Voltar
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '0.65rem 1.5rem',
                    color: '#1e293b',
                    fontWeight: 600,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  Cancelar
                </button>
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{
                      background: '#2563eb',
                      border: 'none',
                      padding: '0.65rem 1.5rem',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    Próximo <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="questao-form"
                    disabled={saving}
                    style={{
                      background: '#2563eb',
                      border: 'none',
                      padding: '0.65rem 1.5rem',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => { if(!saving) e.currentTarget.style.backgroundColor = '#1d4ed8' }}
                    onMouseOut={(e) => { if(!saving) e.currentTarget.style.backgroundColor = '#2563eb' }}
                  >
                    {saving ? 'Salvando...' : <><Check size={16} /> Salvar Questão</>}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {selectedQuestaoForDetail && (
        <QuestaoDetailModal 
          questao={selectedQuestaoForDetail} 
          onClose={() => setSelectedQuestaoForDetail(null)} 
        />
      )}

      {showPrintModal && (
        <QuestionPrintPreviewModal
          selectedQuestions={questoes.filter(q => selectedQuestionIds.includes(q.id))}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Fixed bottom action bar */}
      {selectedQuestionIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
          color: 'white',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: '90%',
          width: '550px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: '#3b82f6',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {selectedQuestionIds.length}
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>Questões selecionadas</span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleClearSelection}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'color 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#f87171'}
              onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
            >
              Limpar
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FileText size={18} /> Gerar Prova
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 50px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
