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
    <div style={{
      background: turmaColor,
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
            color: classViewMode === 'list' ? turmaColor : '#ffffff',
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
            color: classViewMode === 'carometro' ? turmaColor : '#ffffff',
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
                    <span style={{ fontWeight: 700, color: turmaColor, fontSize: '0.85rem', minWidth: '24px' }}>
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
  );
}
