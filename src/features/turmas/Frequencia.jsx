import React from 'react';
import { X, Calendar, RefreshCw, LogOut, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { useGoogleAuth } from '../../app/providers/GoogleAuthProvider';
import useFrequenciaAluno from '../../hooks/useFrequenciaAluno';
import FrequenciaAlunoCard from './FrequenciaAlunoCard';

export default function Frequencia({ aluno, isOpen, onClose }) {
  const { loginGoogle, logoutGoogle, accessToken, googleAccount, isConfigured } = useGoogleAuth();

  const {
    loading,
    error,
    files,
    selectedFileId,
    selectedFileName,
    worksheets,
    selectedSheetName,
    attendanceData,
    isSearchingFiles,
    fetchExcelFiles,
    handleSelectFile,
    handleResetFile,
    handleSheetChange,
    handleRefresh
  } = useFrequenciaAluno(aluno, isOpen);

  // Se o modal estiver fechado, não renderiza nada
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Cabeçalho do Modal */}
        <div className="modal-header" style={{ padding: '1.5rem 2rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
            <Calendar size={24} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Frequência Diária
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Informações do Aluno */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{aluno.nome}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Turma: {aluno.turma}</div>
          </div>

          {/* Estado A: Configuração de Variável Ausente */}
          {!isConfigured ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={32} style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Google Client ID não configurado</div>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.4 }}>
                Insira o Client ID do seu aplicativo do Google no arquivo <strong>.env</strong> (variável <code>VITE_GOOGLE_CLIENT_ID</code>) para ativar a sincronização em tempo real com o Google Drive e Sheets.
              </p>
            </div>
          ) : !accessToken ? (
            /* Estado B: Usuário não logado no Google */
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style={{ height: '36px' }} />
                <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Drive</span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Acesse sua Planilha no Google Drive</h4>
                <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', lineHeight: 1.4 }}>
                  Conecte sua conta Google para permitir que o aplicativo busque e espelhe os dados de presença diretamente da sua planilha do Sheets.
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
            /* Estado C: Conectado ao Google */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Usuário Logado & Controles de Logout */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {googleAccount?.picture && (
                    <img 
                      src={googleAccount.picture} 
                      alt="" 
                      style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  )}
                  Conectado como: <strong>{googleAccount?.name || googleAccount?.email}</strong>
                </span>
                <button onClick={logoutGoogle} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                  <LogOut size={14} /> Desconectar
                </button>
              </div>

              {/* Se NENHUM arquivo foi selecionado ainda: Listar planilhas */}
              {!selectedFileId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Selecione a Planilha de Frequência</h4>
                  
                  {isSearchingFiles ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando planilhas no Google Drive...</div>
                  ) : files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      Nenhuma planilha Google Sheets encontrada no seu Google Drive.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                      {files.map(file => (
                        <button
                          key={file.id}
                          onClick={() => handleSelectFile(file)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
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
                  <button onClick={fetchExcelFiles} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <RefreshCw size={12} /> Atualizar lista
                  </button>
                </div>
              ) : (
                /* Se planilha foi selecionada: Mostrar controles de aba & os dados */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Informações do Arquivo & Controles */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      <FileText size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFileName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="btn" 
                        onClick={handleRefresh} 
                        disabled={loading}
                        title="Recarregar dados do Google Sheets"
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          fontSize: '0.75rem', 
                          margin: 0, 
                          background: 'var(--bg-card)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.3rem',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={12} className={loading ? 'spin-animation' : ''} />
                        <span>Atualizar</span>
                      </button>
                      <button className="btn" onClick={handleResetFile} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-card)' }}>
                        Mudar Planilha
                      </button>
                    </div>
                  </div>

                  {/* Exibição dos Dados de Frequência do Aluno */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Lendo dados do Sheets...</div>
                  ) : error ? (
                    /* Aluno não encontrado na aba ou outro erro */
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={24} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</span>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4, maxWidth: '380px', marginTop: '0.25rem' }}>
                        Verifique se o nome do aluno na planilha está escrito idêntico a <strong>{aluno.nome}</strong> ou se a aba da planilha corresponde a esta turma.
                      </p>
                    </div>
                  ) : attendanceData ? (
                    /* Frequência Encontrada com Sucesso */
                    <FrequenciaAlunoCard data={attendanceData} />
                  ) : null}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="modal-footer" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ margin: 0, padding: '0.55rem 1.25rem' }}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
