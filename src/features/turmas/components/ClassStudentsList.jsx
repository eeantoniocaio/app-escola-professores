import React from 'react';
import { School, Link as LinkIcon, User } from 'lucide-react';
import CarometroGrid from '../CarometroGrid';
import { findPhotoInMap } from '@/services/photoService';
import StudentActionButtons from './StudentActionButtons';

export default function ClassStudentsList({
  activeClass,
  classStudents,
  classViewMode,
  setClassViewMode,
  photosMap,
  loadingPhotos,
  errorPhotos,
  refreshPhotos,
  needsAuthPhotos,
  loginMicrosoftPhotos,
  isConfigured,
  accessToken,
  loginGoogle,
  getTurmaColor,
  setSelectedStudentForCarometro,
  setIsCarometroModalOpen,
  userRole,
  showToast,
  onOpenFicha,
  onOpenFrequencia
}) {
  const turmaColor = getTurmaColor(activeClass.nome);

  return (
    <div 
      style={{ background: turmaColor }}
      className="border border-[rgba(255,255,255,0.1)] rounded-[14px] p-8 shadow-sm animate-[fadeIn_0.3s_ease-out]"
    >
      <div className="flex justify-between items-center mb-6 border-b border-[rgba(255,255,255,0.2)] pb-4 flex-wrap gap-4">
        <div>
          <h3 className="text-[1.35rem] m-0 flex items-center gap-2 text-white font-semibold">
            <School size={20} color="#ffffff" /> Alunos Matriculados — {activeClass.nome}
          </h3>
          <p className="text-[rgba(255,255,255,0.8)] text-[0.9rem] m-0 mt-0.5">
            {classStudents.length} aluno(s) cadastrado(s)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {activeClass.link && (
            <button 
              onClick={() => window.open(activeClass.link, '_blank', 'noopener')}
              className="btn flex items-center gap-2 m-0 bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.3)] text-white shadow-none hover:bg-[rgba(255,255,255,0.3)]"
            >
              <LinkIcon size={16} /> Abrir Mapa de Classe
            </button>
          )}
        </div>
      </div>

      {/* Segmented Control de Abas Internas da Turma */}
      <div className="flex gap-1.5 bg-[rgba(0,0,0,0.12)] p-1 rounded-[10px] w-fit mb-6 border border-[rgba(255,255,255,0.15)]">
        <button 
          onClick={() => setClassViewMode('list')}
          style={{ color: classViewMode === 'list' ? turmaColor : '#ffffff' }}
          className={`py-1.5 px-4 rounded-[6px] border-none cursor-pointer font-bold text-[0.8rem] transition-all duration-200 ${
            classViewMode === 'list' ? 'bg-white' : 'bg-transparent text-white'
          }`}
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
          style={{ color: classViewMode === 'carometro' ? turmaColor : '#ffffff' }}
          className={`py-1.5 px-4 rounded-[6px] border-none cursor-pointer font-bold text-[0.8rem] transition-all duration-200 ${
            classViewMode === 'carometro' ? 'bg-white' : 'bg-transparent text-white'
          }`}
        >
          Carômetro (Fotos)
        </button>
      </div>

      {classViewMode === 'list' ? (
        classStudents.length === 0 ? (
          <div className="text-center py-12 px-4 text-[rgba(255,255,255,0.8)]">
            Nenhum aluno cadastrado nesta turma.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {classStudents.map((aluno, index) => {
              const photoUrl = findPhotoInMap(aluno.nome, photosMap);
              return (
                <div 
                  key={aluno.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-4 sm:px-5 bg-white rounded-[10px] border border-[rgba(255,255,255,0.1)] shadow-sm transition-all duration-200 md:hover:-translate-y-px md:hover:shadow-md gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      style={{ color: turmaColor }}
                      className="font-bold text-[0.85rem] min-w-[24px]"
                    >
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
                      className="w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>

                    <span className="text-[0.95rem] font-semibold text-gray-900">{aluno.nome}</span>
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
                      onOpenCarometro={(std) => {
                        setSelectedStudentForCarometro(std);
                        setIsCarometroModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-[10px] p-6 border border-[rgba(255,255,255,0.1)]">
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
  );
}
