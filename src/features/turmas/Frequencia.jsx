import React from 'react';
import { X, Calendar, RefreshCw, LogOut, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { useMicrosoftAuth } from '../../app/providers/MicrosoftAuthProvider';
import useFrequenciaAluno from '../../hooks/useFrequenciaAluno';
import FrequenciaAlunoCard from './FrequenciaAlunoCard';

export default function Frequencia({ aluno, isOpen, onClose }) {
  const { loginMicrosoft, logoutMicrosoft, accessToken, msAccount, isConfigured } = useMicrosoftAuth();

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
    handleSheetChange
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
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Microsoft Client ID não configurado</div>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)', lineHeight: 1.4 }}>
                Insira a chave do seu aplicativo do Azure no arquivo <strong>.env</strong> (variável <code>VITE_MICROSOFT_CLIENT_ID</code>) para ativar a sincronização em tempo real com o OneDrive.
              </p>
            </div>
          ) : !accessToken ? (
            /* Estado B: Usuário não logado na Microsoft */
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" style={{ height: '36px' }} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Acesse sua Planilha no OneDrive</h4>
                <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', lineHeight: 1.4 }}>
                  Conecte sua conta Microsoft para permitir que o aplicativo busque e espelhe os dados de presença diretamente da sua planilha.
                </p>
              </div>
              <button className="btn btn-primary" onClick={loginMicrosoft} style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                Conectar Conta Microsoft
              </button>
            </div>
          ) : (
            /* Estado C: Conectado à Microsoft */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Usuário Logado & Controles de Logout */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <span>Conectado como: <strong>{msAccount?.name || msAccount?.username}</strong></span>
                <button onClick={logoutMicrosoft} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                  <LogOut size={14} /> Desconectar
                </button>
              </div>

              {/* Se NENHUM arquivo foi selecionado ainda: Listar planilhas */}
              {!selectedFileId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Selecione a Planilha de Frequência</h4>
                  
                  {isSearchingFiles ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Buscando planilhas no OneDrive...</div>
                  ) : files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      Nenhuma planilha Excel (.xlsx) encontrada no seu OneDrive.
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
                  
                  {/* Informações do Arquivo & Botão Alterar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <FileText size={16} color="var(--color-primary)" />
                      <span>{selectedFileName}</span>
                    </div>
                    <button className="btn" onClick={handleResetFile} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0, background: 'var(--bg-card)' }}>
                      Mudar Planilha
                    </button>
                  </div>



                  {/* Exibição dos Dados de Frequência do Aluno */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Lendo dados do Excel...</div>
                  ) : error ? (
                    /* Aluno não encontrado na aba ou outro erro */
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={24} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</span>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4, maxWidth: '380px', marginTop: '0.25rem' }}>
                        Verifique se o nome do aluno na planilha está escrito idêntico a <strong>{aluno.nome}</strong> ou mude de Aba (classe) no campo acima.
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
