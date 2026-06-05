import React from 'react'
import { AlertTriangle, LogOut, FileText, RefreshCw, ChevronRight } from 'lucide-react'
import FrequenciaAlunoCard from '../../FrequenciaAlunoCard'

export default function FrequenciaTab({
  isConfigured,
  accessToken,
  googleAccount,
  loginGoogle,
  logoutGoogle,
  selectedFileId,
  isMaster,
  isSearchingFiles,
  files,
  handleSelectFile,
  fetchExcelFiles,
  selectedFileName,
  freqLoading,
  handleFreqRefresh,
  handleResetFile,
  freqError,
  attendanceData,
}) {
  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
      
      {/* Estado A: Sem Client ID do Google */}
      {!isConfigured ? (
        <div className="text-center py-10 px-6 bg-amber-50 border border-amber-600 rounded-[14px] text-amber-600">
          <AlertTriangle size={32} className="mb-3 mx-auto" />
          <div className="font-bold text-[0.95rem] mb-2">Google Client ID não configurado</div>
          <p className="text-[0.85rem] m-0 text-gray-900 leading-relaxed">
            Insira o Client ID do seu aplicativo do Google no arquivo <strong>.env</strong> para ativar a busca automática de presença diretamente do Google Sheets.
          </p>
        </div>
      ) : !accessToken ? (
        /* Estado B: Desconectado */
        <div className="text-center py-12 px-6 bg-white border border-gray-200 rounded-[14px] flex flex-col items-center gap-5 shadow-sm">
          <div className="flex gap-1.5 items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="h-[36px]" />
            <span className="text-[1.4rem] font-bold font-sans text-gray-900 tracking-[-0.5px]">Sheets</span>
          </div>
          <div>
            <h4 className="m-0 font-bold text-[1.05rem] text-gray-900">Conectar ao Google Sheets</h4>
            <p className="m-2 mt-0 text-[0.85rem] text-gray-500 max-w-[380px] leading-relaxed">
              Visualize o espelho real de frequência bimestral sincronizado diretamente de suas planilhas de chamadas no Google Drive.
            </p>
          </div>
          <button 
            className="btn py-3 px-6 font-bold bg-white border border-[#dadce0] text-[#3c4043] flex items-center gap-3 shadow-[0_1px_3px_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] cursor-pointer rounded-[24px] text-[0.9rem] transition-all duration-200 hover:bg-[#f8f9fa] hover:-translate-y-px"
            onClick={loginGoogle} 
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" className="h-[18px]" />
            Conectar Conta Google
          </button>
        </div>
      ) : (
        /* Estado C: Conectado. Mostrar planilha selecionada e card */
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center text-[0.82rem] text-gray-500 border-b border-gray-200 pb-3">
            <span className="flex items-center gap-2">
              {googleAccount?.picture && (
                <img src={googleAccount.picture} alt="" className="w-[22px] h-[22px] rounded-full object-cover" />
              )}
              Conectado como: <strong>{googleAccount?.name || googleAccount?.email}</strong>
            </span>
            <button 
              onClick={logoutGoogle} 
              className="bg-none border-none text-red-600 cursor-pointer flex items-center gap-1.5 font-semibold"
            >
              <LogOut size={14} /> Desconectar
            </button>
          </div>

          {!selectedFileId ? (
            isMaster ? (
              /* Selecionar Planilha (Apenas Master) */
              <div className="flex flex-col gap-4 bg-white border border-gray-200 p-6 rounded-[14px]">
                <h4 className="m-0 font-bold text-[0.95rem] text-gray-900">Selecione a Planilha de Frequência</h4>
                {isSearchingFiles ? (
                  <div className="text-center p-6 text-gray-500">Buscando planilhas no Drive...</div>
                ) : files.length === 0 ? (
                  <div className="text-center p-6 text-gray-500 border border-dashed border-gray-200 rounded-[10px]">
                    Nenhuma planilha Sheets encontrada no seu Drive.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto border border-gray-200 rounded-[10px] p-2">
                    {files.map(file => (
                      <button
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        className="flex items-center justify-between p-2.5 px-3 border-none bg-transparent rounded-[4px] cursor-pointer text-left w-full transition-colors duration-200 hover:bg-gray-100"
                      >
                        <span className="text-[0.85rem] font-semibold text-gray-900 flex items-center gap-2">
                          <FileText size={16} className="text-blue-600" /> {file.name}
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
                <button 
                  onClick={fetchExcelFiles} 
                  className="bg-none border-none text-blue-600 cursor-pointer self-start text-[0.82rem] font-semibold flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Atualizar lista de planilhas
                </button>
              </div>
            ) : (
              /* Carregando Planilha Padrão */
              <div className="text-center py-12 px-6 bg-white rounded-[14px] border border-gray-200 flex flex-col items-center gap-3 shadow-sm">
                <RefreshCw size={24} className="animate-spin text-blue-600" />
                <span className="text-[0.9rem] text-gray-500">Carregando planilha de frequência...</span>
              </div>
            )
          ) : (
            /* Mostrar Dados da Planilha */
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white p-3 px-4 rounded-[10px] border border-gray-200">
                <span className="text-[0.85rem] font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-1.5 max-w-[60%]">
                  <FileText size={16} className="text-blue-600 shrink-0" />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selectedFileName}</span>
                </span>
                <div className="flex gap-2">
                  <button 
                    className="btn py-1.5 px-3 text-[0.75rem] m-0 bg-gray-100 cursor-pointer flex items-center gap-1.5" 
                    onClick={handleFreqRefresh} 
                    disabled={freqLoading}
                  >
                    <RefreshCw size={12} className={freqLoading ? 'animate-spin' : ''} />
                    <span>Atualizar</span>
                  </button>
                  {isMaster && (
                    <button 
                      className="btn py-1.5 px-3 text-[0.75rem] m-0 bg-gray-100" 
                      onClick={handleResetFile}
                    >
                      Mudar Planilha
                    </button>
                  )}
                </div>
              </div>

              {freqLoading ? (
                <div className="text-center p-8 text-gray-500">Buscando notas e presença...</div>
              ) : freqError ? (
                <div className="text-center p-8 px-4 bg-red-50 rounded-[14px] border border-red-600 text-red-600">
                  <AlertTriangle size={24} className="mb-2 mx-auto" />
                  <div className="text-[0.85rem] font-semibold">{freqError}</div>
                  <p className="m-1 mt-0 text-[0.78rem] text-gray-900 leading-relaxed">
                    Verifique se o aluno está matriculado e seu nome bate exatamente com a planilha de chamada.
                  </p>
                </div>
              ) : attendanceData ? (
                <FrequenciaAlunoCard data={attendanceData} />
              ) : null}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
