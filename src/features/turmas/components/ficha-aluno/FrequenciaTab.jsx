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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Estado A: Sem Client ID do Google */}
      {!isConfigured ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Google Client ID não configurado</div>
          <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.4 }}>
            Insira o Client ID do seu aplicativo do Google no arquivo <strong>.env</strong> para ativar a busca automática de presença diretamente do Google Sheets.
          </p>
        </div>
      ) : !accessToken ? (
        /* Estado B: Desconectado */
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ height: '36px' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Sheets</span>
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Conectar ao Google Sheets</h4>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.4 }}>
              Visualize o espelho real de frequência bimestral sincronizado diretamente de suas planilhas de chamadas no Google Drive.
            </p>
          </div>
          <button 
            className="btn" 
            onClick={loginGoogle} 
            style={{ 
              padding: '0.75rem 1.5rem', 
              fontWeight: 700,
              backgroundColor: '#ffffff',
              border: '1px solid #dadce0',
              color: '#3c4043',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
              cursor: 'pointer',
              borderRadius: '24px',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8f9fa'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="" style={{ height: '18px' }} />
            Conectar Conta Google
          </button>
        </div>
      ) : (
        /* Estado C: Conectado. Mostrar planilha selecionada e card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {googleAccount?.picture && (
                <img src={googleAccount.picture} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              Conectado como: <strong>{googleAccount?.name || googleAccount?.email}</strong>
            </span>
            <button onClick={logoutGoogle} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
              <LogOut size={14} /> Desconectar
            </button>
          </div>

          {!selectedFileId ? (
            isMaster ? (
              /* Selecionar Planilha (Apenas Master) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Selecione a Planilha de Frequência</h4>
                {isSearchingFiles ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Buscando planilhas no Drive...</div>
                ) : files.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    Nenhuma planilha Sheets encontrada no seu Drive.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                    {files.map(file => (
                      <button
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.75rem',
                          border: 'none',
                          background: 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} color="var(--color-primary)" /> {file.name}
                        </span>
                        <ChevronRight size={16} color="var(--text-light)" />
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={fetchExcelFiles} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RefreshCw size={12} /> Atualizar lista de planilhas
                </button>
              </div>
            ) : (
              /* Carregando Planilha Padrão */
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
                <RefreshCw size={24} className="spin-animation" color="var(--color-primary)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Carregando planilha de frequência...</span>
              </div>
            )
          ) : (
            /* Mostrar Dados da Planilha */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '60%' }}>
                  <FileText size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFileName}</span>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={handleFreqRefresh} 
                    disabled={freqLoading}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <RefreshCw size={12} className={freqLoading ? 'spin-animation' : ''} />
                    <span>Atualizar</span>
                  </button>
                  {isMaster && (
                    <button className="btn" onClick={handleResetFile} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-secondary)' }}>
                      Mudar Planilha
                    </button>
                  )}
                </div>
              </div>

              {freqLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando notas e presença...</div>
              ) : freqError ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
                  <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{freqError}</div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
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
