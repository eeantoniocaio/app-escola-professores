import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clipboard, RefreshCw, LogOut, CheckCircle2, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { useMicrosoftAuth } from '../../app/providers/MicrosoftAuthProvider';
import { useToast } from '../../app/providers/ToastProvider';

export default function Frequencia({ aluno, isOpen, onClose }) {
  const { loginMicrosoft, getMicrosoftToken, logoutMicrosoft, accessToken, msAccount, isConfigured } = useMicrosoftAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(() => localStorage.getItem('selected_frequencia_file_id') || '');
  const [selectedFileName, setSelectedFileName] = useState(() => localStorage.getItem('selected_frequencia_file_name') || '');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);

  // Se o modal estiver fechado, não renderiza nada
  if (!isOpen) return null;

  // Busca inicial do Token de Acesso (MSAL silencioso)
  useEffect(() => {
    if (isOpen && msAccount && !accessToken) {
      getMicrosoftToken();
    }
  }, [isOpen, msAccount, accessToken]);

  // Efeito principal: se tiver token de acesso
  useEffect(() => {
    if (accessToken) {
      if (selectedFileId) {
        fetchWorksheets(selectedFileId);
      } else {
        fetchExcelFiles();
      }
    }
  }, [accessToken, selectedFileId]);

  // ── Microsoft Graph API Calls ──────────────────────────────────────────────

  // 1. Buscar arquivos do Excel no OneDrive
  const fetchExcelFiles = async () => {
    setIsSearchingFiles(true);
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root/search(q='.xlsx')`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.value) {
        // Filtrar apenas arquivos reais de planilha
        const excelFiles = data.value.filter(file => file.file);
        setFiles(excelFiles);
      }
    } catch (err) {
      console.error('Erro ao buscar arquivos no OneDrive:', err);
      showToast('Erro ao carregar arquivos do OneDrive', 'error');
    } finally {
      setIsSearchingFiles(false);
    }
  };

  // 2. Buscar abas (Worksheets) da planilha selecionada
  const fetchWorksheets = async (fileId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.value) {
        setWorksheets(data.value);
        
        // Auto-seleção: tentar encontrar uma aba que contenha o nome da turma do aluno
        const turmaName = aluno.turma.toLowerCase().replace(/\s+/g, ''); // "6ºa", "6a"
        const matchingSheet = data.value.find(sheet => {
          const sheetName = sheet.name.toLowerCase().replace(/\s+/g, '');
          return sheetName.includes(turmaName) || turmaName.includes(sheetName);
        });

        if (matchingSheet) {
          setSelectedSheetName(matchingSheet.name);
          fetchWorksheetData(fileId, matchingSheet.name);
        } else if (data.value.length > 0) {
          // Se não achar pareo exato, escolhe a primeira aba e deixa o usuario mudar
          setSelectedSheetName(data.value[0].name);
          fetchWorksheetData(fileId, data.value[0].name);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar abas da planilha:', err);
      showToast('Erro ao carregar abas da planilha', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Buscar dados da aba selecionada (Used Range)
  const fetchWorksheetData = async (fileId, sheetName) => {
    setLoading(true);
    setAttendanceData(null);
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets/${encodeURIComponent(sheetName)}/usedRange`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.values) {
        parseAttendance(data.values);
      } else {
        showToast('Planilha está vazia ou sem dados válidos', 'error');
      }
    } catch (err) {
      console.error('Erro ao ler conteúdo da planilha:', err);
      showToast('Erro ao ler conteúdo da planilha', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Lógica de Parsing dos Dados ─────────────────────────────────────────────
  const parseAttendance = (values) => {
    if (!values || values.length < 2) {
      setAttendanceData({ error: 'Planilha sem dados suficientes.' });
      return;
    }

    const header = values[0];
    let studentRowIdx = -1;
    let nameColIdx = -1;

    // 1. Procurar o aluno nas linhas
    const searchName = aluno.nome.trim().toLowerCase();
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        if (val === searchName) {
          studentRowIdx = r;
          nameColIdx = c;
          break;
        }
      }
      if (studentRowIdx !== -1) break;
    }

    // 2. Se não achou exato, tenta aproximação
    if (studentRowIdx === -1) {
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase();
          if (val && (val.includes(searchName) || searchName.includes(val))) {
            studentRowIdx = r;
            nameColIdx = c;
            break;
          }
        }
        if (studentRowIdx !== -1) break;
      }
    }

    if (studentRowIdx === -1) {
      setAttendanceData({ error: 'Aluno não encontrado nesta aba da planilha.' });
      return;
    }

    // 3. Extrair presença por data
    const studentRow = values[studentRowIdx];
    const attendanceList = [];
    let presences = 0;
    let absences = 0;

    for (let c = 0; c < header.length; c++) {
      if (c === nameColIdx) continue;

      const headerVal = String(header[c] || '').trim();
      // Ignorar colunas extras que não representem datas
      if (!headerVal || headerVal.toLowerCase().includes('ra') || headerVal.toLowerCase().includes('total') || headerVal.toLowerCase().includes('falta') || headerVal.toLowerCase().includes('porcent') || headerVal.toLowerCase().includes('nome')) {
        continue;
      }

      const rawVal = String(studentRow[c] || '').trim().toUpperCase();
      if (!rawVal) continue; // pula celula em branco

      const isPresence = rawVal === 'P' || rawVal === 'C' || rawVal === 'PRESENTE' || rawVal === '1';
      const isAbsence = rawVal === 'F' || rawVal === 'FALTA' || rawVal === '0';

      if (isPresence) presences++;
      if (isAbsence) absences++;

      attendanceList.push({
        date: headerVal,
        status: rawVal,
        isPresence,
        isAbsence
      });
    }

    const total = presences + absences;
    const rate = total > 0 ? Math.round((presences / total) * 100) : 100;

    setAttendanceData({
      attendanceList,
      presences,
      absences,
      total,
      rate
    });
  };

  const handleSelectFile = (file) => {
    setSelectedFileId(file.id);
    setSelectedFileName(file.name);
    localStorage.setItem('selected_frequencia_file_id', file.id);
    localStorage.setItem('selected_frequencia_file_name', file.name);
    showToast('Planilha selecionada com sucesso!');
  };

  const handleResetFile = () => {
    setSelectedFileId('');
    setSelectedFileName('');
    setWorksheets([]);
    setSelectedSheetName('');
    setAttendanceData(null);
    localStorage.removeItem('selected_frequencia_file_id');
    localStorage.removeItem('selected_frequencia_file_name');
    fetchExcelFiles();
  };

  const handleSheetChange = (e) => {
    const sheetName = e.target.value;
    setSelectedSheetName(sheetName);
    fetchWorksheetData(selectedFileId, sheetName);
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────

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

                  {/* Dropdown de Abas (Worksheets) */}
                  {worksheets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Aba (Série/Classe)</label>
                      <select 
                        value={selectedSheetName} 
                        onChange={handleSheetChange}
                        className="select-filter"
                        style={{ width: '100%', padding: '0.65rem 1rem', margin: 0 }}
                      >
                        {worksheets.map(sheet => (
                          <option key={sheet.name} value={sheet.name}>{sheet.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Exibição dos Dados de Frequência do Aluno */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Lendo dados do Excel...</div>
                  ) : attendanceData ? (
                    attendanceData.error ? (
                      /* Aluno não encontrado na aba */
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={24} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{attendanceData.error}</span>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.4, maxWidth: '380px', marginTop: '0.25rem' }}>
                          Verifique se o nome do aluno na planilha está escrito idêntico a <strong>{aluno.nome}</strong> ou mude de Aba (classe) no campo acima.
                        </p>
                      </div>
                    ) : (
                      /* Frequência Encontrada com Sucesso */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Estatísticas Rápidas (Presença / Faltas / Taxa) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>{attendanceData.presences}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.15rem' }}>Presenças</div>
                          </div>
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', fontFamily: 'monospace' }}>{attendanceData.absences}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.15rem' }}>Faltas</div>
                          </div>
                          <div style={{ 
                            background: attendanceData.rate >= 75 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', 
                            padding: '0.75rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: `1px solid ${attendanceData.rate >= 75 ? 'var(--color-success)' : 'var(--color-danger)'}` 
                          }}>
                            <div style={{ 
                              fontSize: '1.5rem', 
                              fontWeight: 800, 
                              color: attendanceData.rate >= 75 ? 'var(--color-success)' : 'var(--color-danger)', 
                              fontFamily: 'monospace' 
                            }}>
                              {attendanceData.rate}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.15rem' }}>Frequência</div>
                          </div>
                        </div>

                        {/* Listagem de Datas da Planilha */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Histórico de Aulas Gravadas</div>
                          
                          {attendanceData.attendanceList.length === 0 ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: '4px' }}>
                              Nenhuma data de aula encontrada na planilha.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                              {attendanceData.attendanceList.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.45rem 0.65rem',
                                    background: item.isPresence ? 'var(--color-success-bg)' : item.isAbsence ? 'var(--color-danger-bg)' : 'var(--bg-secondary)',
                                    borderRadius: '4px',
                                    border: `1px solid ${item.isPresence ? 'rgba(16, 185, 129, 0.2)' : item.isAbsence ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-light)'}`
                                  }}
                                >
                                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.date}</span>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: item.isPresence ? 'var(--color-success)' : item.isAbsence ? 'var(--color-danger)' : 'var(--text-muted)'
                                  }}>
                                    {item.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )
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
