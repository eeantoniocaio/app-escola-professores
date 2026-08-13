import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, CheckCircle, BookOpen, Tag, ShieldAlert } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useToast } from '../../app/providers/ToastProvider';

export default function BibliotecaQrScanner({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { found: bool, data: obj, code: str }
  const [loadingLookup, setLoadingLookup] = useState(false);

  const qrScannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef('');

  const stopCamera = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        await qrScannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar câmera:', err);
      } finally {
        qrScannerRef.current = null;
        setIsCameraActive(false);
      }
    }
  }, []);

  const handleLookupCode = useCallback(async (codeToSearch) => {
    setLoadingLookup(true);
    setScanResult(null);

    try {
      const cleanedCode = codeToSearch.trim().toUpperCase();

      // Consultar no banco pelo código do exemplar (Ex: BIB-000001)
      const { data: exemplar, error } = await supabase
        .from('exemplares_livros')
        .select(`
          id,
          codigo_exemplar,
          status,
          livros (
            id,
            titulo,
            autor,
            prateleira
          )
        `)
        .ilike('codigo_exemplar', cleanedCode)
        .maybeSingle();

      if (error) throw error;

      if (exemplar) {
        setScanResult({
          found: true,
          code: cleanedCode,
          exemplar: exemplar,
          livro: exemplar.livros
        });
      } else {
        setScanResult({
          found: false,
          code: cleanedCode
        });
      }
    } catch (err) {
      console.error('Erro ao consultar código lido:', err);
      showToast('Erro ao consultar código no banco de dados.', 'error');
    } finally {
      setLoadingLookup(false);
      isProcessingRef.current = false;
    }
  }, [showToast]);

  const handleDecodedText = useCallback(async (rawText) => {
    if (isProcessingRef.current) return;

    const cleanedCode = rawText.trim().toUpperCase();
    if (!cleanedCode) return;

    if (lastScannedCodeRef.current === cleanedCode) return;

    isProcessingRef.current = true;
    lastScannedCodeRef.current = cleanedCode;

    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.pause(true);
      } catch (e) {
        console.error('Erro ao pausar scanner:', e);
      }
    }

    handleLookupCode(cleanedCode);
  }, [handleLookupCode]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanResult(null);
    setIsCameraActive(true);

    setTimeout(async () => {
      try {
        const scannerId = "bib-qr-reader-viewport";
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
        console.error('Erro ao iniciar câmera:', err);
        let errorMsg = 'Não foi possível acessar a câmera. Verifique se deu permissão no navegador.';
        if (err?.name === 'NotAllowedError') {
          errorMsg = 'Permissão para usar a câmera foi negada no navegador.';
        } else if (err?.name === 'NotFoundError') {
          errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
        }
        setCameraError(errorMsg);
        setIsCameraActive(false);
      }
    }, 250);
  }, [handleDecodedText]);

  const resumeCamera = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.resume();
      } catch (err) {
        console.error('Erro ao retomar scanner:', err);
        startCamera();
      }
    } else {
      startCamera();
    }
  }, [startCamera]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && isMounted) {
      startCamera();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleRescan = () => {
    setScanResult(null);
    lastScannedCodeRef.current = '';
    isProcessingRef.current = false;
    resumeCamera();
  };

  const handleClose = () => {
    stopCamera();
    setScanResult(null);
    setCameraError(null);
    isProcessingRef.current = false;
    lastScannedCodeRef.current = '';
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>
            <Camera size={20} color="var(--color-primary)" /> Escanear QR Code de Exemplar
          </h3>
          <button className="btn-action-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Alerta de Erro de Permissão da Câmera */}
          {cameraError ? (
            <div style={{ padding: '2rem 1rem', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', color: '#DC2626', textAlign: 'center' }}>
              <ShieldAlert size={36} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>Erro de Câmera</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{cameraError}</p>
              <button className="btn-secondary" onClick={startCamera}>
                <RefreshCw size={14} /> Tentar Novamente
              </button>
            </div>
          ) : (
            <>
              {/* Viewport da Câmera HTML5 QR Code */}
              {!scanResult && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Posicione o QR Code da etiqueta patrimonial do livro dentro do quadrado marcado:
                  </p>
                  <div 
                    id="bib-qr-reader-viewport" 
                    style={{ 
                      width: '100%', 
                      minHeight: '260px', 
                      borderRadius: 'var(--radius-md)', 
                      overflow: 'hidden', 
                      background: '#0f172a',
                      border: '2px dashed var(--border-light)'
                    }}
                  />
                </div>
              )}

              {/* Carregando Consulta */}
              {loadingLookup && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={32} className="spin-animation" style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Consultando código no banco de dados...</p>
                </div>
              )}

              {/* Resultado: EXEMPLAR ENCONTRADO */}
              {scanResult && scanResult.found && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#F0FDF4',
                    color: '#16A34A',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(22, 163, 74, 0.3)'
                  }}>
                    <CheckCircle size={20} /> Exemplar Localizado com Sucesso
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Código Patrimonial
                      </span>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: scanResult.exemplar.status === 'disponivel' ? '#F0FDF4' : '#FEF2F2',
                        color: scanResult.exemplar.status === 'disponivel' ? '#16A34A' : '#DC2626',
                        border: scanResult.exemplar.status === 'disponivel' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)'
                      }}>
                        {scanResult.exemplar.status === 'disponivel' ? '🟢 Disponível' : scanResult.exemplar.status}
                      </span>
                    </div>

                    <strong style={{ fontSize: '1.35rem', fontFamily: 'monospace', color: 'var(--color-primary)', display: 'block', marginBottom: '1rem' }}>
                      {scanResult.exemplar.codigo_exemplar}
                    </strong>

                    {scanResult.livro && (
                      <div style={{ background: '#FFF', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                          <BookOpen size={16} color="var(--color-primary)" /> {scanResult.livro.titulo}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          Autor: <strong>{scanResult.livro.autor}</strong>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-main)' }}>
                          <Tag size={12} /> Prateleira: <strong>{scanResult.livro.prateleira}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={handleRescan}>
                      <RefreshCw size={14} /> Escanear Outro QR Code
                    </button>
                    <button className="btn-primary" onClick={handleClose}>
                      Concluir
                    </button>
                  </div>
                </div>
              )}

              {/* Resultado: EXEMPLAR NÃO ENCONTRADO */}
              {scanResult && !scanResult.found && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
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
                    <ShieldAlert size={20} /> Código Não Cadastrado
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                    Nenhum livro ou exemplar com o código <strong>&quot;{scanResult.code}&quot;</strong> foi localizado no acervo da biblioteca.
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={handleRescan}>
                      <RefreshCw size={14} /> Tentar Novamente
                    </button>
                    <button className="btn-primary" onClick={handleClose}>
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Fechar Leitor
          </button>
        </div>
      </div>
    </div>
  );
}
