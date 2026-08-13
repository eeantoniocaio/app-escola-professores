import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, CheckCircle, AlertCircle, BookOpen, Tag, ShieldAlert } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { useToast } from '../../app/providers/ToastProvider';

export default function BibliotecaQrScanner({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { found: bool, data: obj, code: str }
  const [loadingLookup, setLoadingLookup] = useState(false);

  const qrScannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setCameraError(null);
      isProcessingRef.current = false;
      lastScannedCodeRef.current = '';
    } else {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
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
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);
    setIsCameraActive(true);

    // Pequeno atraso para garantir que a DIV da câmera já existe no DOM
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
          () => {
            // Silenciar avisos comuns de busca contínua por QR
          }
        );
      } catch (err) {
        console.error('Erro ao iniciar scanner:', err);
        let errorMsg = 'Não foi possível acessar a câmera. Verifique as permissões no navegador.';
        if (err?.name === 'NotAllowedError') {
          errorMsg = 'Permissão para usar a câmera foi negada. Por favor, permita o acesso nas configurações do navegador.';
        } else if (err?.name === 'NotFoundError') {
          errorMsg = 'Nenhuma câmera foi encontrada no dispositivo.';
        }
        setCameraError(errorMsg);
        setIsCameraActive(false);
      }
    }, 250);
  };

  const handleDecodedText = async (rawText) => {
    if (isProcessingRef.current) return;

    const cleanedCode = rawText.trim().toUpperCase();
    if (!cleanedCode) return;

    // Proteção contra leituras repetidas do mesmo código em sequência
    if (lastScannedCodeRef.current === cleanedCode) return;

    isProcessingRef.current = true;
    lastScannedCodeRef.current = cleanedCode;
    setLoadingLookup(true);

    try {
      // 1. Pausar scanner visual sem destruir a instância
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        await qrScannerRef.current.pause(true);
      }

      // 2. Buscar exemplar no Supabase
      const { data, error } = await supabase
        .from('exemplares_livros')
        .select('id, codigo_exemplar, status, created_at, livros(id, titulo, autor, prateleira)')
        .ilike('codigo_exemplar', cleanedCode)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setScanResult({
          found: true,
          code: cleanedCode,
          exemplar: data,
          livro: data.livros
        });
      } else {
        setScanResult({
          found: false,
          code: cleanedCode
        });
      }
    } catch (err) {
      console.error('Erro ao buscar exemplar escaneado:', err);
      showToast('Erro ao consultar o exemplar no acervo.', 'error');
    } finally {
      setLoadingLookup(false);
      isProcessingRef.current = false;
    }
  };

  const handleScanAnother = async () => {
    setScanResult(null);
    lastScannedCodeRef.current = '';
    isProcessingRef.current = false;
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
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3>
            <Camera size={20} color="var(--color-primary)" /> Leitor de Código / QR Code
          </h3>
          <button className="btn-action-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          {/* Se a câmera está ativa e não temos resultado final */}
          {!scanResult && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Aponte a câmera do dispositivo para a etiqueta QR Code do livro.
              </p>

              {cameraError ? (
                <div style={{ padding: '2rem 1rem', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', color: '#DC2626' }}>
                  <AlertCircle size={36} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.5rem' }}>Erro na Câmera</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{cameraError}</p>
                  <button className="btn-secondary" onClick={startCamera} style={{ marginTop: '1rem' }}>
                    <RefreshCw size={14} /> Tentar Novamente
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {/* Estado Carregando Consulta no Banco */}
          {loadingLookup && (
            <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-animation" style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
              <p style={{ fontWeight: 600 }}>Identificando exemplar no acervo...</p>
            </div>
          )}

          {/* Resultado: EXEMPLAR ENCONTRADO */}
          {scanResult && scanResult.found && (
            <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: '#F0FDF4', 
                color: '#16A34A', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.95rem',
                marginBottom: '1rem',
                border: '1px solid rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle size={20} /> Exemplar Encontrado no Acervo
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Código Patrimonial
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                  {scanResult.code}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Nome do Livro (Título):</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{scanResult.livro?.titulo || 'Não informado'}</strong>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Autor(a):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{scanResult.livro?.autor || 'Não informado'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Prateleira:</span>
                    <span className="shelf-badge">
                      <Tag size={12} /> {scanResult.livro?.prateleira || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>Status Atual:</span>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      color: scanResult.exemplar?.status === 'disponivel' ? '#16A34A' : '#2563EB'
                    }}>
                      {scanResult.exemplar?.status === 'disponivel' ? 'Disponível' : scanResult.exemplar?.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleScanAnother}>
                  <RefreshCw size={14} /> Escanear Outro
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Concluído
                </button>
              </div>
            </div>
          )}

          {/* Resultado: EXEMPLAR NÃO ENCONTRADO */}
          {scanResult && !scanResult.found && (
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
                fontSize: '0.95rem',
                marginBottom: '1rem',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                <AlertCircle size={20} /> Exemplar Não Encontrado
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                Nenhum livro ou exemplar com o código <strong>&quot;{scanResult.code}&quot;</strong> foi localizado no acervo da biblioteca.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleScanAnother}>
                  <RefreshCw size={14} /> Tentar Outro Código
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Modo Leitura — Apenas identificação
          </span>
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
