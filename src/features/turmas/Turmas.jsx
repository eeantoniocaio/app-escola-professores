import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { useGlobalData } from '@/app/providers/GlobalDataProvider';
import { useToast } from '@/app/providers/ToastProvider';
import { useGoogleAuth } from '@/app/providers/GoogleAuthProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import Frequencia from './Frequencia';
import usePrefetchFrequencia from '@/hooks/usePrefetchFrequencia';
import useCarometro from '@/hooks/useCarometro';
import CarometroModal from './CarometroModal';
import FichaAlunoModal from './FichaAlunoModal';

// Components & Hooks
import useTurmasData, { getTurmaColor } from './hooks/useTurmasData';
import ClassFilterPanel from './components/ClassFilterPanel';
import ClassStudentsList from './components/ClassStudentsList';
import StudentSearchPanel from './components/StudentSearchPanel';

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

  // Hook customizado com lógica de dados (parsing, filtragem, ordenação)
  const {
    sortedSeriesList,
    availableTurmaSiglas,
    activeClass,
    classStudents,
    filteredStudents,
    parsedTurmas
  } = useTurmasData({
    turmas,
    alunos,
    selectedSerie,
    selectedTurmaSigla,
    studentSearchTerm
  });

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

  const handleOpenFicha = (aluno) => {
    setSelectedStudentForFicha(aluno);
    setIsFichaOpen(true);
  };

  const handleOpenFrequencia = (aluno) => {
    setSelectedStudentForFreq(aluno);
    setIsFrequenciaOpen(true);
  };

  const handleOpenCarometro = (aluno) => {
    setSelectedStudentForCarometro(aluno);
    setIsCarometroModalOpen(true);
  };

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
          <ClassFilterPanel
            selectedSerie={selectedSerie}
            setSelectedSerie={setSelectedSerie}
            selectedTurmaSigla={selectedTurmaSigla}
            setSelectedTurmaSigla={setSelectedTurmaSigla}
            sortedSeriesList={sortedSeriesList}
            availableTurmaSiglas={availableTurmaSiglas}
          />

          {/* Listagem de Alunos */}
          {activeClass ? (
            <ClassStudentsList
              activeClass={activeClass}
              classStudents={classStudents}
              classViewMode={classViewMode}
              setClassViewMode={setClassViewMode}
              photosMap={photosMap}
              loadingPhotos={loadingPhotos}
              errorPhotos={errorPhotos}
              refreshPhotos={refreshPhotos}
              needsAuthPhotos={needsAuthPhotos}
              loginMicrosoftPhotos={loginMicrosoftPhotos}
              isConfigured={isConfigured}
              accessToken={accessToken}
              loginGoogle={loginGoogle}
              getTurmaColor={getTurmaColor}
              setSelectedStudentForCarometro={setSelectedStudentForCarometro}
              setIsCarometroModalOpen={setIsCarometroModalOpen}
              userRole={userRole}
              showToast={showToast}
              onOpenFicha={handleOpenFicha}
              onOpenFrequencia={handleOpenFrequencia}
            />
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
        <StudentSearchPanel
          studentSearchTerm={studentSearchTerm}
          setStudentSearchTerm={setStudentSearchTerm}
          filteredStudents={filteredStudents}
          handleGoToClass={handleGoToClass}
          userRole={userRole}
          isConfigured={isConfigured}
          accessToken={accessToken}
          loginGoogle={loginGoogle}
          showToast={showToast}
          photosMap={photosMap}
          onOpenFicha={handleOpenFicha}
          onOpenFrequencia={handleOpenFrequencia}
          onOpenCarometro={handleOpenCarometro}
        />
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
