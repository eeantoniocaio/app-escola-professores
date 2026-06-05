import React from 'react';
import { Search, X, School } from 'lucide-react';
import StudentActionButtons from './StudentActionButtons';

export default function StudentSearchPanel({
  studentSearchTerm,
  setStudentSearchTerm,
  filteredStudents,
  handleGoToClass,
  userRole,
  isConfigured,
  accessToken,
  loginGoogle,
  showToast,
  photosMap,
  onOpenFicha,
  onOpenFrequencia,
  onOpenCarometro
}) {
  return (
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
                <StudentActionButtons
                  aluno={aluno}
                  userRole={userRole}
                  isConfigured={isConfigured}
                  accessToken={accessToken}
                  loginGoogle={loginGoogle}
                  showToast={showToast}
                  photosMap={photosMap}
                  onOpenFicha={onOpenFicha}
                  onOpenFrequencia={onOpenFrequencia}
                  onOpenCarometro={onOpenCarometro}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
