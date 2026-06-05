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
    <div className="flex flex-col gap-8">
      {/* Painel de Busca */}
      <div className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-sm">
        <div className="relative w-full">
          <input 
            type="text" 
            value={studentSearchTerm} 
            onChange={e => setStudentSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome do(a) aluno(a)..."
            className="search-input w-full p-[0.75rem_1rem_0.75rem_2.5rem] rounded-[10px] m-0"
          />
          <Search size={18} className="search-icon absolute left-[0.85rem] top-1/2 -translate-y-1/2 text-gray-400" />
          {studentSearchTerm && (
            <button 
              onClick={() => setStudentSearchTerm('')}
              className="absolute right-[0.85rem] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-gray-500 flex items-center p-0"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Resultados da Busca */}
      <div className="bg-white border border-gray-200 rounded-[14px] p-8 shadow-sm">
        <h3 className="text-[1.25rem] m-0 mb-6 border-b border-gray-200 pb-3 font-semibold text-gray-900">
          Resultados da Pesquisa
        </h3>

        {studentSearchTerm.trim().length < 2 ? (
          <div className="text-center py-12 px-4 text-gray-500">
            {studentSearchTerm.trim().length === 1 
              ? 'Digite pelo menos 2 caracteres para buscar.' 
              : 'Digite o nome do aluno no campo acima para iniciar a busca.'
            }
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-500">
            Nenhum(a) aluno(a) encontrado(a) com "{studentSearchTerm}".
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredStudents.map(aluno => (
              <div 
                key={aluno.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-4 sm:px-5 bg-gray-50 rounded-[10px] border border-gray-200 transition-all duration-200 hover:-translate-y-px hover:shadow-md gap-3 sm:gap-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[0.95rem] font-semibold text-gray-900">{aluno.nome}</span>
                  <span 
                    onClick={() => handleGoToClass(aluno.turma)}
                    title={`Ir para listagem da turma ${aluno.turma}`}
                    className="text-[0.8rem] text-blue-600 cursor-pointer inline-flex items-center gap-1 font-semibold w-fit hover:underline"
                  >
                    <School size={12} /> {aluno.turma}
                  </span>
                </div>
                <div className="self-end sm:self-auto">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
