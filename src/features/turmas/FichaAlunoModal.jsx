import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Printer, Share2 } from 'lucide-react'
import { useGoogleAuth } from '@/app/providers/GoogleAuthProvider'
import { useAuth } from '@/app/providers/AuthProvider'
import useFrequenciaAluno from '@/hooks/useFrequenciaAluno'
import { findPhotoInMap } from '@/services/photoService'

// Componentes modulares do prontuário do aluno
import { getMockStudentDetails } from './components/ficha-aluno/mockStudentDetails'
import FichaCadastralTab from './components/ficha-aluno/FichaCadastralTab'
import BoletimTab from './components/ficha-aluno/BoletimTab'
import FrequenciaTab from './components/ficha-aluno/FrequenciaTab'
import FichaPrintReport from './components/ficha-aluno/FichaPrintReport'

export default function FichaAlunoModal({ aluno, isOpen, onClose, photosMap }) {
  const { loginGoogle, logoutGoogle, accessToken, googleAccount, isConfigured } = useGoogleAuth()
  const { userRole, isMaster } = useAuth()
  const [activeTab, setActiveTab] = useState('cadastro') // 'cadastro' | 'boletim' | 'frequencia'

  // Auto-autenticação para frequência ao selecionar a aba correspondente
  useEffect(() => {
    if (isOpen && activeTab === 'frequencia' && isConfigured && !accessToken) {
      loginGoogle()
    }
  }, [isOpen, activeTab, isConfigured, accessToken, loginGoogle])

  const {
    loading: freqLoading,
    error: freqError,
    files,
    selectedFileId,
    selectedFileName,
    attendanceData,
    isSearchingFiles,
    fetchExcelFiles,
    handleSelectFile,
    handleResetFile,
    handleRefresh: handleFreqRefresh,
  } = useFrequenciaAluno(aluno, isOpen)

  if (!isOpen) return null

  const photoUrl = findPhotoInMap(aluno.nome, photosMap)
  const details = getMockStudentDetails(aluno)

  let raDisplay = '---'
  let birthDateDisplay = '---'
  let ageDisplay = '---'

  if (freqLoading) {
    raDisplay = 'Carregando R.A...'
    birthDateDisplay = 'Carregando...'
    ageDisplay = 'Carregando...'
  } else if (attendanceData) {
    raDisplay = attendanceData.ra || 'Não informado na planilha'
    birthDateDisplay = attendanceData.birthDate || 'Não informado na planilha'
    ageDisplay = attendanceData.age || 'Não informado na planilha'
  } else if (!isConfigured) {
    raDisplay = 'N/D (Sheets não config.)'
    birthDateDisplay = 'N/D (Sheets não config.)'
    ageDisplay = 'N/D (Sheets não config.)'
  } else if (!accessToken) {
    raDisplay = 'N/D (Pendente de Login)'
    birthDateDisplay = 'N/D (Pendente de Login)'
    ageDisplay = 'N/D (Pendente de Login)'
  } else if (freqError) {
    raDisplay = 'Não encontrado no Sheets'
    birthDateDisplay = 'Não encontrado no Sheets'
    ageDisplay = 'Não encontrado no Sheets'
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const shareText = `Ficha do Aluno: ${aluno.nome}\nTurma: ${aluno.turma}\nR.A.: ${raDisplay}\nNascimento: ${birthDateDisplay}\nIdade: ${ageDisplay}\nResponsável: ${details.parentName}\nTelefone: ${details.phone}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha do Aluno - ${aluno.nome}`,
          text: shareText,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        alert('Dados da Ficha copiados para a área de transferência!')
      } catch (err) {
        alert('Não foi possível compartilhar ou copiar os dados.')
      }
    }
  }

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          border: 'none',
        }}
      >
        {/* Cabeçalho do Prontuário */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            padding: '1.5rem 2rem',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              {/* Foto Ampliada */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #ffffff',
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={32} color="#d97706" />
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {aluno.nome}
                </h3>
                <p style={{ margin: '0.2rem 0 0', opacity: 0.9, fontSize: '0.88rem', fontWeight: 500 }}>
                  Turma: {aluno.turma} • R.A: {raDisplay}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Abas */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
            padding: '0 2rem',
          }}
        >
          <button
            onClick={() => setActiveTab('cadastro')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'cadastro' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'cadastro' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            Ficha Cadastral
          </button>
          <button
            onClick={() => setActiveTab('boletim')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'boletim' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'boletim' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            Boletim Escolar
          </button>
          <button
            onClick={() => setActiveTab('frequencia')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              padding: '1rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'frequencia' ? '#d97706' : 'var(--text-muted)',
              borderBottomColor: activeTab === 'frequencia' ? '#d97706' : 'transparent',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            Frequência
          </button>
        </div>

        {/* Corpo do Modal (com Scroll) */}
        <div
          style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1,
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* TAB 1: FICHA CADASTRAL */}
          {activeTab === 'cadastro' && (
            <FichaCadastralTab
              aluno={aluno}
              details={details}
              birthDateDisplay={birthDateDisplay}
              ageDisplay={ageDisplay}
              raDisplay={raDisplay}
            />
          )}

          {/* TAB 2: BOLETIM ESCOLAR */}
          {activeTab === 'boletim' && <BoletimTab details={details} />}

          {/* TAB 3: FREQUÊNCIA */}
          {activeTab === 'frequencia' && (
            <FrequenciaTab
              isConfigured={isConfigured}
              accessToken={accessToken}
              googleAccount={googleAccount}
              loginGoogle={loginGoogle}
              logoutGoogle={logoutGoogle}
              selectedFileId={selectedFileId}
              isMaster={isMaster}
              isSearchingFiles={isSearchingFiles}
              files={files}
              handleSelectFile={handleSelectFile}
              fetchExcelFiles={fetchExcelFiles}
              selectedFileName={selectedFileName}
              freqLoading={freqLoading}
              handleFreqRefresh={handleFreqRefresh}
              handleResetFile={handleResetFile}
              freqError={freqError}
              attendanceData={attendanceData}
            />
          )}
        </div>

        {/* Rodapé da Ficha */}
        <div
          style={{
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(userRole === 'secretaria' || userRole === 'gestao') && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handlePrint}
                  style={{
                    margin: 0,
                    padding: '0.55rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#d97706',
                    borderColor: '#d97706',
                    color: '#ffffff',
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleShare}
                  style={{
                    margin: 0,
                    padding: '0.55rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                  }}
                >
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </button>
              </>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ margin: 0, padding: '0.55rem 1.25rem' }}>
            Fechar Prontuário
          </button>
        </div>

        {/* Área exclusiva para impressão (A4) */}
        <FichaPrintReport
          aluno={aluno}
          photoUrl={photoUrl}
          raDisplay={raDisplay}
          birthDateDisplay={birthDateDisplay}
          ageDisplay={ageDisplay}
          details={details}
          attendanceData={attendanceData}
        />
      </div>
    </div>,
    document.body
  )
}
