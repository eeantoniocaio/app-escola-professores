import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoasPraticas } from './hooks/useBoasPraticas';
import { Pencil, Trash2, Search, X, Star } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';
import BoasPraticasFormModal from './components/BoasPraticasFormModal';
import BoasPraticasDetailModal from './components/BoasPraticasDetailModal';

const parseCombinedSerieTurma = (combinedName) => {
  if (!combinedName) return { serie: '', turma: '' };
  
  const grade = combinedName.charAt(0);
  const lastChar = combinedName.charAt(combinedName.length - 1);
  const isHighSchool = ['1', '2', '3'].includes(grade);
  const isElementary = ['6', '7', '8', '9'].includes(grade);
  
  if (isHighSchool) {
    return {
      serie: `${grade}ºEM`,
      turma: lastChar
    };
  } else if (isElementary) {
    return {
      serie: `${grade}º ano`,
      turma: lastChar
    };
  }
  return { serie: combinedName, turma: '' };
};

export default function BoasPraticas() {
  const navigate = useNavigate();
  const { userRole, userName, authLoading } = useAuth();
  const { praticas, loading, addPratica, updatePratica, deletePratica } = useBoasPraticas();
  const { professores = [] } = useGlobalData();

  const [showFormModal, setShowFormModal] = useState(false);
  const [praticaToEdit, setPraticaToEdit] = useState(null);
  const [selectedPraticaForDetail, setSelectedPraticaForDetail] = useState(null);

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterHabilidade, setFilterHabilidade] = useState('');
  const [activeTab, setActiveTab] = useState('Todas');

  const seriesTabs = ['Todas', '6º ano', '7º ano', '8º ano', '9º ano', '1ºEM', '2ºEM', '3ºEM'];

  // Derived filter options from database
  const uniqueProfessores = Array.from(new Set(praticas.map(p => p.professor).filter(Boolean))).sort();
  const uniqueHabilidades = Array.from(new Set(praticas.map(p => p.habilidade).filter(Boolean))).sort();

  // Filter logic
  const filteredPraticas = (praticas || []).filter(p => {
    // SECURITY LIMITATION: If user is a professor, they only see their own practices
    if (userRole !== 'gestao' && userName) {
      if (p.professor !== userName) return false;
    }

    // Active Series Tab filter
    if (activeTab !== 'Todas') {
      const parsed = parseCombinedSerieTurma(p.serie);
      if (parsed.serie !== activeTab) return false;
    }

    if (filterText.trim()) {
      const search = filterText.toLowerCase();
      const parsed = parseCombinedSerieTurma(p.serie);
      const matchText = 
        (p.relato || '').toLowerCase().includes(search) ||
        (p.professor || '').toLowerCase().includes(search) ||
        (p.habilidade || '').toLowerCase().includes(search) ||
        (p.serie || '').toLowerCase().includes(search) ||
        parsed.serie.toLowerCase().includes(search);
      if (!matchText) return false;
    }
    if (filterProfessor && p.professor !== filterProfessor) return false;
    if (filterHabilidade && p.habilidade !== filterHabilidade) return false;
    return true;
  });

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setPraticaToEdit(null);
  };

  const handleEditPratica = (p) => {
    setPraticaToEdit(p);
    setShowFormModal(true);
  };

  const handleSavePratica = async (formData) => {
    if (praticaToEdit) {
      return await updatePratica(praticaToEdit.id, formData);
    } else {
      return await addPratica(formData);
    }
  };

  if (authLoading || loading) {
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
            <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Boas Práticas</h2>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, marginLeft: '2.5rem', fontSize: '0.9rem' }}>
            {filteredPraticas.length === (praticas || []).length 
              ? `${(praticas || []).length} prática(s) compartilhada(s)`
              : `${filteredPraticas.length} de ${(praticas || []).length} prática(s) filtrada(s)`
            }
          </p>
        </div>
        <button
          onClick={() => { 
            setPraticaToEdit(null); 
            setShowFormModal(true); 
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
          <span style={{ fontSize: '1.1rem' }}>+</span> Novo
        </button>
      </div>

      {/* Filtros */}
      {praticas.length > 0 && (
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
                placeholder="Pesquisar por relato, professor, habilidade, série..."
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

            {(filterText || filterProfessor || filterHabilidade || activeTab !== 'Todas') && (
              <button
                onClick={() => {
                  setFilterText('');
                  setFilterProfessor('');
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
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
      {praticas.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {seriesTabs.map(tab => {
            const countForTab = (praticas || []).filter(p => {
              if (userRole !== 'gestao' && userName && p.professor !== userName) return false;
              if (tab !== 'Todas') {
                const parsed = parseCombinedSerieTurma(p.serie);
                if (parsed.serie !== tab) return false;
              }
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

      {/* List */}
      {praticas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma boa prática cadastrada ainda.</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>Clique em "+ Novo" para compartilhar uma.</p>
        </div>
      ) : filteredPraticas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontWeight: 500 }}>Nenhuma boa prática encontrada para os filtros aplicados.</p>
          <button
            onClick={() => {
              setFilterText('');
              setFilterProfessor('');
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
          {filteredPraticas.map(p => {
            const canModify = userRole === 'gestao' || p.professor === userName;
            
            return (
              <div 
                key={p.id} 
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('a')) return;
                  setSelectedPraticaForDetail(p);
                }}
                style={{ 
                  background: 'white', 
                  borderRadius: '14px', 
                  padding: '1.5rem', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                  border: '1px solid #f1f5f9', 
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '160px'
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
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{p.serie}</span>
                      {p.habilidade && <span style={{ background: '#fef08a', color: '#854d0e', borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>{p.habilidade}</span>}
                    </div>

                    {/* Action Buttons */}
                    {canModify && (
                      <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.4rem', flexShrink: 0 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditPratica(p); }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                          title="Editar Prática"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePratica && deletePratica(p.id); }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                          title="Excluir Prática"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Compartilhado por {p.professor} em {new Date(p.data_realizacao + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>

                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#475569', 
                    margin: 0, 
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    lineHeight: 1.5
                  }}>
                    {p.relato}
                  </p>
                </div>
                
                {p.link_drive && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    📁 Possui material complementar
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <BoasPraticasFormModal
          isOpen={showFormModal}
          onClose={handleCloseFormModal}
          praticaToEdit={praticaToEdit}
          onSave={handleSavePratica}
        />
      )}

      {/* Detail Modal */}
      {selectedPraticaForDetail && (
        <BoasPraticasDetailModal
          praticas={selectedPraticaForDetail}
          onClose={() => setSelectedPraticaForDetail(null)}
        />
      )}
    </div>
  );
}
