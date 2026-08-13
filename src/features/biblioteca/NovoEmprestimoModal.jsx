import React, { useState, useEffect } from 'react';
import { 
  X, Camera, Search, BookOpen, CheckCircle, 
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, FileText
} from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useToast } from '../../app/providers/ToastProvider';
import BibliotecaQrScanner from './BibliotecaQrScanner';

export default function NovoEmprestimoModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();

  // Etapa Atual: 1 = Exemplar, 2 = Aluno, 3 = Datas & Confirmação, 4 = Sucesso
  const [step, setStep] = useState(1);

  // Etapa 1: Exemplar
  const [exemplarCode, setExemplarCode] = useState('');
  const [loadingExemplar, setLoadingExemplar] = useState(false);
  const [validatedExemplar, setValidatedExemplar] = useState(null); // { id, codigo_exemplar, status, livro }
  const [exemplarError, setExemplarError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Etapa 2: Aluno
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [loadingStudentSearch, setLoadingStudentSearch] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); // { id, nome, turma, ra }
  const [studentActiveLoans, setStudentActiveLoans] = useState([]);
  const [loadingStudentLoans, setLoadingStudentLoans] = useState(false);

  // Etapa 3: Prazo & Observações
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getDefaultReturnDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [returnDate, setReturnDate] = useState(getDefaultReturnDate());
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resultado Final Sucesso
  const [successData, setSuccessData] = useState(null);

  const resetForm = () => {
    setStep(1);
    setExemplarCode('');
    setValidatedExemplar(null);
    setExemplarError(null);
    setStudentSearchTerm('');
    setStudentSearchResults([]);
    setSelectedStudent(null);
    setStudentActiveLoans([]);
    setReturnDate(getDefaultReturnDate());
    setObservacoes('');
    setSubmitting(false);
    setSuccessData(null);
  };

  useEffect(() => {
    let isMounted = true;
    if (!isOpen && isMounted) {
      setStep(1);
      setExemplarCode('');
      setValidatedExemplar(null);
      setExemplarError(null);
      setStudentSearchTerm('');
      setStudentSearchResults([]);
      setSelectedStudent(null);
      setStudentActiveLoans([]);
      setReturnDate(getDefaultReturnDate());
      setObservacoes('');
      setSubmitting(false);
      setSuccessData(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Validar Código do Exemplar no Banco (Digitação ou Scan)
  const handleValidateExemplarCode = async (codeToTest) => {
    const code = (codeToTest || exemplarCode).trim().toUpperCase();
    if (!code) {
      showToast('Digite ou escaneie o código do exemplar.', 'warning');
      return;
    }

    setLoadingExemplar(true);
    setExemplarError(null);
    setValidatedExemplar(null);

    try {
      const { data, error } = await supabase
        .from('exemplares_livros')
        .select('id, codigo_exemplar, status, livros(id, titulo, autor, prateleira)')
        .ilike('codigo_exemplar', code)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setExemplarError(`Exemplar com código "${code}" não foi localizado no acervo.`);
        return;
      }

      if (data.status !== 'disponivel') {
        let statusMsg = 'Este exemplar não está disponível para empréstimo.';
        if (data.status === 'emprestado') statusMsg = 'Este exemplar já se encontra EMPRESTADO a outro aluno.';
        if (data.status === 'manutencao') statusMsg = 'Este exemplar está em MANUTENÇÃO / RESTAURAÇÃO.';
        if (data.status === 'extraviado') statusMsg = 'Este exemplar está marcado como EXTRAVIADO.';
        setExemplarError(statusMsg);
        setValidatedExemplar(data);
        return;
      }

      setValidatedExemplar(data);
      setExemplarCode(data.codigo_exemplar);
    } catch (err) {
      console.error('Erro ao validar exemplar:', err);
      setExemplarError('Erro ao consultar o exemplar no banco de dados.');
    } finally {
      setLoadingExemplar(false);
    }
  };

  // Buscar Alunos por Nome ou RA via RPC Segura (buscar_alunos_biblioteca)
  const handleSearchStudents = async (term) => {
    setStudentSearchTerm(term);
    const cleanTerm = term ? term.trim() : '';
    if (!cleanTerm || cleanTerm.length < 2) {
      setStudentSearchResults([]);
      return;
    }

    setLoadingStudentSearch(true);
    try {
      const { data, error } = await supabase
        .rpc('buscar_alunos_biblioteca', { p_termo: cleanTerm });

      if (error) throw error;
      setStudentSearchResults(data || []);
    } catch (err) {
      console.error('Erro ao buscar alunos via RPC:', err);
    } finally {
      setLoadingStudentSearch(false);
    }
  };

  // Selecionar Aluno e Buscar Empréstimos Ativos Dele
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingStudentLoans(true);
    try {
      const { data, error } = await supabase
        .from('emprestimos_livros')
        .select('id, data_retirada, data_prevista_devolucao, status, exemplares_livros(codigo_exemplar, livros(titulo, autor))')
        .eq('aluno_id', student.id)
        .eq('status', 'ativo');

      if (error) throw error;
      setStudentActiveLoans(data || []);
    } catch (err) {
      console.error('Erro ao consultar empréstimos do aluno:', err);
      showToast('Erro ao verificar empréstimos anteriores do aluno.', 'error');
    } finally {
      setLoadingStudentLoans(false);
    }
  };

  // Submeter Empréstimo via RPC Transacional
  const handleSubmitLoan = async () => {
    if (!validatedExemplar || validatedExemplar.status !== 'disponivel') {
      showToast('Selecione um exemplar válido e disponível.', 'warning');
      return;
    }

    if (!selectedStudent) {
      showToast('Selecione um aluno para o empréstimo.', 'warning');
      return;
    }

    if (studentActiveLoans.length >= 2) {
      showToast('Este aluno já atingiu o limite de 2 empréstimos ativos.', 'error');
      return;
    }

    if (!returnDate || returnDate < getTodayString()) {
      showToast('A data prevista de devolução não pode ser anterior a hoje.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Invocação da RPC Transacional atômica
      const { data, error } = await supabase.rpc('realizar_emprestimo_livro', {
        p_codigo_exemplar: validatedExemplar.codigo_exemplar,
        p_aluno_id: selectedStudent.id,
        p_data_prevista_devolucao: returnDate,
        p_observacoes: observacoes.trim() || null
      });

      if (error) {
        throw new Error(error.message || 'Erro ao realizar empréstimo no banco.');
      }

      if (data && data.success) {
        showToast('Empréstimo registrado com sucesso!', 'success');
        setSuccessData({
          emprestimoId: data.emprestimo_id,
          aluno: selectedStudent,
          livro: validatedExemplar.livros,
          codigoExemplar: validatedExemplar.codigo_exemplar,
          dataRetirada: new Date().toLocaleDateString('pt-BR'),
          dataDevolucao: new Date(returnDate + 'T00:00:00').toLocaleDateString('pt-BR')
        });
        setStep(4);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.mensagem || 'Erro desconhecido ao processar empréstimo.');
      }
    } catch (err) {
      console.error('Erro no envio do empréstimo:', err);
      // Extrair mensagem amigável lançada pela RPC (ex: limite excedido, exemplar indisponível)
      let cleanMsg = err.message || 'Erro ao processar empréstimo.';
      if (cleanMsg.includes('Limite máximo')) cleanMsg = 'Limite atingido! O aluno já possui 2 empréstimos ativos no sistema.';
      if (cleanMsg.includes('não está disponível')) cleanMsg = 'Este exemplar não está disponível para empréstimo.';
      showToast(cleanMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3>
            <BookOpen size={20} color="var(--color-primary)" /> Novo Empréstimo de Livro
          </h3>
          <button className="btn-action-icon" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        {/* Indicador de Etapas */}
        {step < 4 && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
            <div style={{ flex: 1, padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: step >= 1 ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: step === 1 ? '2px solid var(--color-primary)' : 'none' }}>
              1. Exemplar
            </div>
            <div style={{ flex: 1, padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: step >= 2 ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: step === 2 ? '2px solid var(--color-primary)' : 'none' }}>
              2. Aluno
            </div>
            <div style={{ flex: 1, padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: step >= 3 ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: step === 3 ? '2px solid var(--color-primary)' : 'none' }}>
              3. Confirmação
            </div>
          </div>
        )}

        <div className="modal-body">
          {/* ── ETAPA 1: IDENTIFICAR EXEMPLAR ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Escaneie a etiqueta QR Code do livro ou digite o código patrimonial do exemplar.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input 
                  type="text"
                  value={exemplarCode}
                  onChange={(e) => {
                    setExemplarCode(e.target.value);
                    setExemplarError(null);
                  }}
                  placeholder="Código do Exemplar (ex: BIB-000001)"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleValidateExemplarCode(); }}
                />
                <button className="btn-secondary" onClick={() => setIsScannerOpen(true)} title="Abrir Leitor de Câmera">
                  <Camera size={18} /> Ler QR
                </button>
                <button className="btn-primary" onClick={() => handleValidateExemplarCode()} disabled={loadingExemplar}>
                  {loadingExemplar ? <RefreshCw size={16} className="spin-animation" /> : 'Buscar'}
                </button>
              </div>

              {/* Erro de Validação de Exemplar */}
              {exemplarError && (
                <div style={{ padding: '0.85rem 1rem', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', color: '#DC2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <AlertTriangle size={18} /> {exemplarError}
                </div>
              )}

              {/* Exemplar Validad e Disponível */}
              {validatedExemplar && validatedExemplar.status === 'disponivel' && (
                <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16A34A', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                    <CheckCircle size={18} /> Exemplar Disponível para Empréstimo
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {validatedExemplar.livros?.titulo}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Autor: {validatedExemplar.livros?.autor} • Prateleira: <strong>{validatedExemplar.livros?.prateleira}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Código: {validatedExemplar.codigo_exemplar}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ETAPA 2: SELECIONAR ALUNO DE CADASTRO ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Pesquise o estudante cadastrado na escola por nome ou RA.
              </p>

              <div className="search-box" style={{ marginBottom: '1.25rem' }}>
                <Search className="search-icon" size={18} />
                <input 
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => handleSearchStudents(e.target.value)}
                  placeholder="Digite o nome ou RA do aluno..."
                  autoFocus
                />
              </div>

              {/* Resultados da Busca de Alunos */}
              {loadingStudentSearch ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin-animation" /> Buscando alunos...
                </div>
              ) : studentSearchResults.length > 0 && !selectedStudent ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  {studentSearchResults.map(student => (
                    <div 
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      className="exemplar-card-item"
                    >
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>{student.nome}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Turma: {student.turma || 'N/A'} {student.ra ? `• RA: ${student.ra}` : ''}</span>
                      </div>
                      <ArrowRight size={16} color="var(--color-primary)" />
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Aluno Selecionado & Status de Empréstimos Ativos */}
              {selectedStudent && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{selectedStudent.nome}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Turma: {selectedStudent.turma || 'N/A'} {selectedStudent.ra ? `• RA: ${selectedStudent.ra}` : ''}</div>
                    </div>
                    <button className="btn-secondary" onClick={() => { setSelectedStudent(null); setStudentActiveLoans([]); }} style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                      Trocar Aluno
                    </button>
                  </div>

                  {/* Verificação do Limite de Empréstimos (2 livros) */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Empréstimos Ativos do Aluno:</span>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 800, 
                        padding: '2px 8px', 
                        borderRadius: '10px',
                        background: studentActiveLoans.length >= 2 ? '#FEF2F2' : '#EFF6FF',
                        color: studentActiveLoans.length >= 2 ? '#DC2626' : '#2563EB'
                      }}>
                        {studentActiveLoans.length} de 2 permitidos
                      </span>
                    </div>

                    {loadingStudentLoans ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Consultando histórico do aluno...</div>
                    ) : studentActiveLoans.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600 }}>Nenhum empréstimo ativo. Aluno apto para retirada.</div>
                    ) : (
                      <div style={{ marginTop: '0.5rem' }}>
                        {studentActiveLoans.map(loan => (
                          <div key={loan.id} style={{ fontSize: '0.82rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>{loan.exemplares_livros?.livros?.titulo}</strong> ({loan.exemplares_livros?.codigo_exemplar})</span>
                            <span style={{ color: 'var(--text-muted)' }}>Devolução: {new Date(loan.data_prevista_devolucao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {studentActiveLoans.length >= 2 && (
                      <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={16} /> Limite máximo atingido! Este aluno precisa devolver um livro antes de realizar novo empréstimo.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ETAPA 3: DEFINIR PRAZO & CONFIRMAÇÃO DO EMPRÉSTIMO ── */}
          {step === 3 && (
            <div>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} color="var(--color-primary)" /> Resumo da Operação
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Aluno:</span>
                    <strong>{selectedStudent?.nome}</strong> ({selectedStudent?.turma || 'N/A'})
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Livro:</span>
                    <strong>{validatedExemplar?.livros?.titulo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Exemplar (Código):</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary)' }}>{validatedExemplar?.codigo_exemplar}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Prateleira:</span>
                    <strong>{validatedExemplar?.livros?.prateleira}</strong>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Data de Retirada</label>
                <input type="text" value={new Date().toLocaleDateString('pt-BR')} disabled style={{ background: 'var(--bg-secondary)' }} />
              </div>

              <div className="form-group">
                <label>Data Prevista de Devolução <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input 
                  type="date"
                  value={returnDate}
                  min={getTodayString()}
                  onChange={e => setReturnDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Prazo sugerido automaticamente: 7 dias corridos.
                </span>
              </div>

              <div className="form-group">
                <label>Observações (Opcional)</label>
                <input 
                  type="text"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Ex: Exemplar em bom estado, capa plastificada"
                />
              </div>
            </div>
          )}

          {/* ── ETAPA 4: TELA DE SUCESSO DO EMPRÉSTIMO ── */}
          {step === 4 && successData && (
            <div style={{ textAlign: 'center', padding: '1rem 0', animation: 'fadeIn 0.2s ease-out' }}>
              <CheckCircle size={48} color="#16A34A" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Empréstimo Concluído com Sucesso!
              </h3>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'left', margin: '1.25rem 0' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong>Aluno:</strong> {successData.aluno.nome} ({successData.aluno.turma})
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong>Livro:</strong> {successData.livro.titulo}
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong>Código do Exemplar:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{successData.codigoExemplar}</span>
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong>Data de Retirada:</strong> {successData.dataRetirada}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                  <strong>Data Limite de Devolução:</strong> {successData.dataDevolucao}
                </div>
              </div>

              <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
                Concluir
              </button>
            </div>
          )}
        </div>

        {/* Rodapé de Navegação do Stepper */}
        {step < 4 && (
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            {step > 1 ? (
              <button className="btn-secondary" onClick={() => setStep(prev => prev - 1)} disabled={submitting}>
                <ArrowLeft size={16} /> Voltar
              </button>
            ) : (
              <button className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
            )}

            {step === 1 && (
              <button 
                className="btn-primary" 
                disabled={!validatedExemplar || validatedExemplar.status !== 'disponivel'}
                onClick={() => setStep(2)}
              >
                Avançar <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button 
                className="btn-primary" 
                disabled={!selectedStudent || studentActiveLoans.length >= 2}
                onClick={() => setStep(3)}
              >
                Avançar <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button className="btn-primary" onClick={handleSubmitLoan} disabled={submitting}>
                {submitting ? 'Registrando Transação...' : 'Confirmar Empréstimo'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Leitor de Câmera (Reutilizado da Sprint 3B) */}
      <BibliotecaQrScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
