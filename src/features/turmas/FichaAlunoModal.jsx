import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Printer, Share2 } from 'lucide-react'
import { useGoogleAuth } from '@/app/providers/GoogleAuthProvider'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/app/providers/ToastProvider'
import useFrequenciaAluno from '@/hooks/useFrequenciaAluno'
import { findPhotoInMap } from '@/services/photoService'
import logger from '@/shared/utils/logger'

// Componentes modulares do prontuário do aluno
import { getMockStudentDetails } from './components/ficha-aluno/mockStudentDetails'
import FichaCadastralTab from './components/ficha-aluno/FichaCadastralTab'
import BoletimTab from './components/ficha-aluno/BoletimTab'
import FrequenciaTab from './components/ficha-aluno/FrequenciaTab'
import FichaPrintReport from './components/ficha-aluno/FichaPrintReport'

export default function FichaAlunoModal({ aluno, isOpen, onClose, photosMap }) {
  const { loginGoogle, logoutGoogle, accessToken, googleAccount, isConfigured } = useGoogleAuth()
  const { userRole, isMaster } = useAuth()
  const { showToast } = useToast()
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
        logger.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        showToast('Dados da Ficha copiados para a área de transferência!', 'success')
      } catch (err) {
        showToast('Não foi possível compartilhar ou copiar os dados.', 'error')
      }
    }
  }

  return createPortal(
    <div className="modal-overlay z-[1100]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content w-full max-w-[800px] flex flex-col max-h-[92vh] overflow-hidden !border-none">
        
        {/* Cabeçalho do Prontuário */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 py-6 px-8 text-white relative">
          <div className="flex justify-between items-start">
            <div className="flex gap-5 items-center">
              {/* Foto Ampliada */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-md bg-white flex items-center justify-center shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-amber-600" />
                )}
              </div>
              <div>
                <h3 className="m-0 text-[1.4rem] font-extrabold text-white tracking-[-0.3px]">
                  {aluno.nome}
                </h3>
                <p className="m-0 mt-[0.2rem] opacity-90 text-[0.88rem] font-medium">
                  Turma: {aluno.turma} • R.A: {raDisplay}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[rgba(255,255,255,0.2)] border-none rounded-full w-8 h-8 flex items-center justify-center text-white cursor-pointer transition-colors duration-100 hover:bg-[rgba(255,255,255,0.3)]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Abas */}
        <div className="flex border-b border-gray-200 bg-gray-100 px-8">
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`bg-transparent border-none border-b-3 py-4 px-5 font-semibold text-[0.9rem] cursor-pointer transition-all duration-100 ${
              activeTab === 'cadastro' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Ficha Cadastral
          </button>
          <button
            onClick={() => setActiveTab('boletim')}
            className={`bg-transparent border-none border-b-3 py-4 px-5 font-semibold text-[0.9rem] cursor-pointer transition-all duration-100 ${
              activeTab === 'boletim' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Boletim Escolar
          </button>
          <button
            onClick={() => setActiveTab('frequencia')}
            className={`bg-transparent border-none border-b-3 py-4 px-5 font-semibold text-[0.9rem] cursor-pointer transition-all duration-100 ${
              activeTab === 'frequencia' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent'
            }`}
          >
            Frequência
          </button>
        </div>

        {/* Corpo do Modal (com Scroll) */}
        <div className="p-8 overflow-y-auto flex-1 bg-gray-100 flex flex-col gap-6">
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
        <div className="py-4 px-8 flex justify-between items-center border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            {(userRole === 'secretaria' || userRole === 'gestao') && (
              <>
                <button
                  className="btn btn-primary m-0 py-2 px-5 flex items-center gap-2 bg-amber-600 border-amber-600 text-white hover:bg-amber-700 hover:border-amber-700"
                  onClick={handlePrint}
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button
                  className="btn btn-secondary m-0 py-2 px-5 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-900 hover:bg-gray-200"
                  onClick={handleShare}
                >
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </button>
              </>
            )}
          </div>
          <button className="btn btn-secondary m-0 py-2 px-5" onClick={onClose}>
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
