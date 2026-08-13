import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, RefreshCw, CheckCircle, AlertTriangle, Clock, 
  CornerDownLeft, ShieldAlert, Check
} from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useToast } from '../../app/providers/ToastProvider';

export default function DevolucaoModal({ isOpen, onClose, onSuccess, prefilledCode = '' }) {
  const { showToast } = useToast();

  // Passos: 'scanner' | 'confirm' | 'success' | 'error_no_loan' | 'error_not_found'
  const [step, setStep] = useState('scanner');

  // Dados do escaneamento e consulta
  const [inputCode, setInputCode] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [activeLoan, setActiveLoan] = useState(null);
  const [exemplarDetails, setExemplarDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [observacoesDevolucao, setObservacoesDevolucao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modo Devolução Contínua
  const [continuousMode, setContinuousMode] = useState(false);
  const [lastReturnedInfo, setLastReturnedInfo] = useState(null);

  // Controle de Câmera e Prevenção de Duplicidades
  const qrScannerRef = useRef(null);
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef('');
  const [cameraError, setCameraError] = useState(null);

  const resetForm = useCallback(() => {
    setStep('scanner');
    setInputCode('');
    setLoadingLookup(false);
    setActiveLoan(null);
    setExemplarDetails(null);
    setErrorMsg('');
    setObservacoesDevolucao('');
    setSubmitting(false);
    setLastReturnedInfo(null);
    isProcessingScanRef.current = false;
    lastScannedCodeRef.current = '';
  }, []);

  const stopCamera = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        await qrScannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar câmera de devolução:', err);
      } finally {
        qrScannerRef.current = null;
      }
    }
  }, []);

  // Consultar Exemplar e Empréstimo Ativo no Supabase
  const handleLookupLoan = useCallback(async (codeToSearch) => {
    const cleanCode = (codeToSearch || inputCode).trim().toUpperCase();
    if (!cleanCode) {
      showToast('Digite ou escaneie o código do exemplar (Ex: BIB-000001).', 'warning');
      isProcessingScanRef.current = false;
      return;
    }

    setInputCode(cleanCode);
    setLoadingLookup(true);
    setErrorMsg('');
    setActiveLoan(null);
    setExemplarDetails(null);

    try {
      // 1. Buscar exemplar no acervo
      const { data: exemplar, error: exErr } = await supabase
        .from('exemplares_livros')
        .select('id, codigo_exemplar, status, livros(id, titulo, autor, prateleira)')
        .ilike('codigo_exemplar', cleanCode)
        .maybeSingle();

      if (exErr) throw exErr;

      if (!exemplar) {
        setStep('error_not_found');
        setErrorMsg(`Exemplar com o código "${cleanCode}" não foi localizado no acervo da biblioteca.`);
        return;
      }

      setExemplarDetails(exemplar);

      // 2. Buscar empréstimo ativo para este exemplar
      const { data: loan, error: loanErr } = await supabase
        .from('emprestimos_livros')
        .select('id, data_retirada, data_prevista_devolucao, status, observacoes, alunos(id, nome, turma, ra), exemplares_livros(id, codigo_exemplar, status, livros(id, titulo, autor, prateleira))')
        .eq('exemplar_id', exemplar.id)
        .eq('status', 'ativo')
        .maybeSingle();

      if (loanErr) throw loanErr;

      if (!loan) {
        setStep('error_no_loan');
        setErrorMsg(`O exemplar "${cleanCode}" não possui empréstimo ativo no momento (Status atual: ${exemplar.status}).`);
        return;
      }

      // Empréstimo ativo encontrado!
      setActiveLoan(loan);
      setStep('confirm');
    } catch (err) {
      console.error('Erro ao consultar empréstimo:', err);
      showToast('Erro ao consultar empréstimo no banco de dados.', 'error');
      setStep('scanner');
    } finally {
      setLoadingLookup(false);
      isProcessingScanRef.current = false;
    }
  }, [inputCode, showToast]);

  const handleDecodedText = useCallback(async (rawText) => {
    if (isProcessingScanRef.current) return;

    const cleanedCode = rawText.trim().toUpperCase();
    if (!cleanedCode) return;

    if (lastScannedCodeRef.current === cleanedCode) return;

    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = cleanedCode;

    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.pause(true);
      } catch (e) {
        console.error('Erro ao pausar scanner visual:', e);
      }
    }

    handleLookupLoan(cleanedCode);
  }, [handleLookupLoan]);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    setTimeout(async () => {
      try {
        const scannerId = "bib-devolucao-qr-viewport";
        const element = document.getElementById(scannerId);
        if (!element) return;

        const html5QrCode = new Html5Qrcode(scannerId);
        qrScannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const minDim = Math.min(width, height);
              const qrboxSize = Math.floor(minDim * 0.7);
              return { width: qrboxSize, height: qrboxSize };
            }
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Erro ao iniciar câmera de devolução:', err);
        let errorMsg = 'Não foi possível acessar a câmera. Verifique se deu permissão no navegador.';
        if (err?.name === 'NotAllowedError') {
          errorMsg = 'Permissão para usar a câmera foi negada no navegador.';
        } else if (err?.name === 'NotFoundError') {
          errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
        }
        setCameraError(errorMsg);
      }
    }, 250);
  }, [handleDecodedText]);

  const resumeCamera = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.resume();
      } catch (err) {
        console.error('Erro ao retomar câmera:', err);
        startCamera();
      }
    } else {
      startCamera();
    }
  }, [startCamera]);

  const handleClose = () => {
    stopCamera();
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (prefilledCode) {
        handleLookupLoan(prefilledCode);
      } else {
        startCamera();
      }
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, prefilledCode, handleLookupLoan, startCamera, stopCamera]);

  // Confirmar Devolução via RPC transacional (public.registrar_devolucao_livro)
  const handleConfirmReturn = async () => {
    if (!activeLoan || submitting) return;

    setSubmitting(true);
    try {
      const codeToReturn = activeLoan.exemplares_livros.codigo_exemplar;
      const { data, error } = await supabase.rpc('registrar_devolucao_livro', {
        p_codigo_exemplar: codeToReturn,
        p_observacoes: observacoesDevolucao.trim() || null
      });

      if (error) throw error;

      if (data && data.success) {
        showToast('Livro devolvido com sucesso.', 'success');

        if (onSuccess) onSuccess();

        if (continuousMode) {
          setLastReturnedInfo({
            aluno: activeLoan.alunos?.nome || 'N/A',
            livro: activeLoan.exemplares_livros?.livros?.titulo || 'Livro',
            codigo: codeToReturn
          });

          setActiveLoan(null);
          setObservacoesDevolucao('');
          lastScannedCodeRef.current = '';
          isProcessingScanRef.current = false;
          setStep('scanner');
          resumeCamera();
        } else {
          setStep('success');
        }
      } else {
        throw new Error(data?.mensagem || 'Erro ao registrar devolução.');
      }
    } catch (err) {
      console.error('Erro ao registrar devolução via RPC:', err);
      showToast(err.message || 'Erro ao efetivar a devolução do livro.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestartScan = () => {
    setStep('scanner');
    setInputCode('');
    setActiveLoan(null);
    setExemplarDetails(null);
    setErrorMsg('');
    lastScannedCodeRef.current = '';
    isProcessingScanRef.current = false;
    resumeCamera();
  };

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = activeLoan && activeLoan.data_prevista_devolucao < todayStr;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !submitting) handleClose(); }}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3>
            <CornerDownLeft size={20} color="var(--color-primary)" /> Registrar Devolução de Livro
          </h3>
          <button className="btn-action-icon" onClick={handleClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Banner de Sucesso para o Modo Devolução Contínua */}
          {lastReturnedInfo && step === 'scanner' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F0FDF4',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              color: '#15803D',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '1rem',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <span>
                ✅ Livro <strong>{lastReturnedInfo.codigo}</strong> ({lastReturnedInfo.livro}) devolvido por <strong>{lastReturnedInfo.aluno}</strong>!
              </span>
              <button 
                onClick={() => setLastReturnedInfo(null)} 
                style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* PASSO 1: SCANNER OU DIGITAÇÃO DO CÓDIGO */}
          {step === 'scanner' && (
            <div>
              {/* Controle de Modo Devolução Contínua */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                background: 'var(--bg-secondary)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                    Modo Devolução Contínua
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Mantém a câmera pronta para escaneamentos em lote
                  </span>
                </div>
                <label className="switch" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={continuousMode}
                    onChange={(e) => setContinuousMode(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                </label>
              </div>

              {/* Digitação Manual Rápida */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input 
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLookupLoan(inputCode); }}
                  placeholder="Digite o código do exemplar (Ex: BIB-000001)..."
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}
                />
                <button 
                  className="btn-primary" 
                  onClick={() => handleLookupLoan(inputCode)}
                  disabled={loadingLookup || !inputCode.trim()}
                >
                  {loadingLookup ? <RefreshCw size={16} className="spin-animation" /> : 'Buscar'}
                </button>
              </div>

              {/* Leitor de Câmera QR Code */}
              {cameraError ? (
                <div style={{ padding: '2rem 1rem', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', color: '#DC2626', textAlign: 'center' }}>
                  <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.25rem' }}>Erro na Câmera</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{cameraError}</p>
                  <button className="btn-secondary" onClick={startCamera}>
                    <RefreshCw size={14} /> Tentar Novamente
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Ou aponte a câmera para a etiqueta QR Code do livro:
                  </p>
                  <div 
                    id="bib-devolucao-qr-viewport" 
                    style={{ 
                      width: '100%', 
                      minHeight: '250px', 
                      borderRadius: 'var(--radius-md)', 
                      overflow: 'hidden', 
                      background: '#0f172a',
                      border: '2px dashed var(--border-light)'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ESTADO: CARREGANDO CONSULTA */}
          {loadingLookup && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="spin-animation" style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>Localizando empréstimo ativo no acervo...</p>
            </div>
          )}

          {/* PASSO 2: CONFIRMAÇÃO DE DEVOLUÇÃO (DADOS DO EMPRÉSTIMO ATIVO) */}
          {step === 'confirm' && activeLoan && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                background: isOverdue ? '#FEF2F2' : '#F0FDF4',
                border: isOverdue ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(22, 163, 74, 0.3)',
                color: isOverdue ? '#DC2626' : '#16A34A'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isOverdue ? <Clock size={18} /> : <CheckCircle size={18} />}
                  {isOverdue ? 'Empréstimo Atrasado' : 'Empréstimo em Dia'}
                </span>
                <span style={{ 
                  fontWeight: 800, 
                  fontSize: '0.82rem', 
                  padding: '0.25rem 0.6rem', 
                  borderRadius: '999px',
                  background: isOverdue ? '#DC2626' : '#16A34A',
                  color: '#FFF',
                  textTransform: 'uppercase'
                }}>
                  {isOverdue ? '🔴 Atrasado' : '🟢 Em dia'}
                </span>
              </div>

              {/* Card com Detalhes do Empréstimo */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Estudante (Aluno):</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      {activeLoan.alunos?.nome || 'Não informado'}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>
                      Turma: {activeLoan.alunos?.turma || 'N/A'} {activeLoan.alunos?.ra ? `| RA: ${activeLoan.alunos.ra}` : ''}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Exemplar / Código:</span>
                    <strong style={{ fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                      {activeLoan.exemplares_livros?.codigo_exemplar}
                    </strong>
                    {activeLoan.exemplares_livros?.livros?.prateleira && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>
                        Prateleira: {activeLoan.exemplares_livros.livros.prateleira}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: '#FFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Obra (Livro):</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block' }}>
                    {activeLoan.exemplares_livros?.livros?.titulo || 'Título não informado'}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Autor: {activeLoan.exemplares_livros?.livros?.autor || 'Não informado'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Data da Retirada:</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {new Date(activeLoan.data_retirada).toLocaleDateString('pt-BR')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Devolução Prevista:</span>
                    <strong style={{ fontSize: '0.9rem', color: isOverdue ? '#DC2626' : 'var(--text-main)' }}>
                      {new Date(activeLoan.data_prevista_devolucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Observações da Devolução (Opcional) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                  Observações da Devolução (Opcional):
                </label>
                <input 
                  type="text"
                  value={observacoesDevolucao}
                  onChange={(e) => setObservacoesDevolucao(e.target.value)}
                  placeholder="Ex: Exemplar devolvido em bom estado..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleRestartScan} disabled={submitting}>
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleConfirmReturn} 
                  disabled={submitting}
                  style={{ background: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" /> Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Confirmar Devolução
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: SUCESSO DE DEVOLUÇÃO (MODO INDIVIDUAL) */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                background: '#F0FDF4', 
                color: '#16A34A', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                border: '2px solid rgba(22, 163, 74, 0.3)'
              }}>
                <Check size={32} />
              </div>

              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Livro Devolvido com Sucesso!
              </h4>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                O status do exemplar retornou para <strong>Disponível</strong> e o empréstimo foi encerrado.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={handleRestartScan}>
                  <RefreshCw size={14} /> Devolver Outro Livro
                </button>
                <button className="btn-primary" onClick={handleClose}>
                  Concluir
                </button>
              </div>
            </div>
          )}

          {/* ESTADO DE ERRO: EXEMPLAR NÃO POSSUI EMPRÉSTIMO ATIVO */}
          {step === 'error_no_loan' && (
            <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FFFBEB',
                color: '#D97706',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginBottom: '1rem',
                border: '1px solid rgba(217, 119, 6, 0.3)'
              }}>
                <AlertTriangle size={20} /> Sem Empréstimo Ativo
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                {errorMsg}
              </p>

              {exemplarDetails && (
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Livro:</div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                    {exemplarDetails.livros?.titulo}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status Atual do Exemplar:</div>
                  <strong style={{ fontSize: '0.9rem', color: '#16A34A', textTransform: 'uppercase' }}>
                    {exemplarDetails.status}
                  </strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleRestartScan}>
                  <RefreshCw size={14} /> Escanear Outro
                </button>
                <button className="btn-primary" onClick={handleClose}>
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* ESTADO DE ERRO: EXEMPLAR NÃO ENCONTRADO NO ACERVO */}
          {step === 'error_not_found' && (
            <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#FEF2F2',
                color: '#DC2626',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginBottom: '1rem',
                border: '1px solid rgba(220, 38, 38, 0.3)'
              }}>
                <ShieldAlert size={20} /> Exemplar Não Encontrado
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                {errorMsg}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleRestartScan}>
                  <RefreshCw size={14} /> Tentar Outro Código
                </button>
                <button className="btn-primary" onClick={handleClose}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            RPC Transacional: public.registrar_devolucao_livro
          </span>
          <button className="btn-secondary" onClick={handleClose} disabled={submitting}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
