import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Search, Plus, Edit2, Trash2, Users, FolderOpen, X, ArrowLeft, Activity, AlertTriangle, Bell, Download, FileText, Share2, QrCode, Printer, CheckSquare, Camera } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import { useGlobalData } from '../../app/providers/GlobalDataProvider';
import './Equipamentos.css';

// Cor azul padrão adotada para os modais e cards de salas
const ROOM_COLOR_DEFAULT = '#2B70C9';

export default function Equipamentos() {
  const navigate = useNavigate();
  const { userRole, userName } = useAuth();
  const { showToast } = useToast();
  const { professores } = useGlobalData();

  const canEdit = userRole === 'gestao' || userRole === 'tecnico';

  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'salas' | 'dispositivos' | 'solicitacoes'
  const [loading, setLoading] = useState(true);

  // Estados de Solicitação de Ajuda
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpProfessor, setHelpProfessor] = useState((userRole !== 'gestao' && userName) ? userName : '');
  const [helpData, setHelpData] = useState(new Date().toISOString().split('T')[0]);
  const [helpSala, setHelpSala] = useState('');
  const [helpDescricao, setHelpDescricao] = useState('');
  const [techComment, setTechComment] = useState('');

  // Lista de Solicitações (para técnico/gestão)
  const [helpRequests, setHelpRequests] = useState([]);
  const [loadingHelp, setLoadingHelp] = useState(false);

  // Dados do banco
  const [salas, setSalas] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);

  // Termos de busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondicao, setFilterCondicao] = useState('');
  const [filterSala, setFilterSala] = useState('');

  // Modais de Criação / Edição de Sala
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // null = criar, objeto = editar
  const [roomName, setRoomName] = useState('');

  // Modais de Criação / Edição de Dispositivo
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null); // null = criar, objeto = editar
  const [deviceTipo, setDeviceTipo] = useState('');
  const [deviceNumEscola, setDeviceNumEscola] = useState('');
  const [deviceNumSerie, setDeviceNumSerie] = useState('');
  const [deviceSalaId, setDeviceSalaId] = useState('');
  const [deviceCondicao, setDeviceCondicao] = useState('Funcional');
  const [deviceObs, setDeviceObs] = useState('');
  const [deviceDisponivelEmprestimo, setDeviceDisponivelEmprestimo] = useState(false);

  // Modal de QR Code do Dispositivo
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDevice, setQrDevice] = useState(null);

  const openQrModal = (device) => {
    setQrDevice(device);
    setIsQrModalOpen(true);
  };

  // Modal de Ação de Empréstimo / Devolução
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanDevice, setLoanDevice] = useState(null);
  const [loanProfessor, setLoanProfessor] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);

  const openLoanModal = (device) => {
    setLoanDevice(device);
    setLoanProfessor('');
    setLoanDate(new Date().toISOString().split('T')[0]);
    setIsLoanModalOpen(true);
  };

  // Estado e funções para controle de seleção de dispositivos (para impressão em lote)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  const toggleSelectDevice = (id) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (devicesList) => {
    const visibleIds = devicesList.map(d => d.id);
    const allVisibleSelected = visibleIds.every(id => selectedDeviceIds.includes(id));

    if (allVisibleSelected) {
      // Deselecionar apenas os que estão visíveis
      setSelectedDeviceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Selecionar todos os que estão visíveis
      setSelectedDeviceIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  // Modal de Detalhes da Sala (Floating)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Modal de Detalhes da Solicitação de Ajuda
  const [selectedHelpRequest, setSelectedHelpRequest] = useState(null);
  const [isHelpDetailsModalOpen, setIsHelpDetailsModalOpen] = useState(false);

  // Histórico de Empréstimos
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState([]);

  // Estados para Devolução em Lote
  const [isBatchReturnModalOpen, setIsBatchReturnModalOpen] = useState(false);
  const [batchReturnInput, setBatchReturnInput] = useState('');
  const [batchReturnList, setBatchReturnList] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const qrScannerRef = useRef(null);
  const scannedIdsRef = useRef(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const startCamera = async () => {
    setIsCameraActive(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
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
            handleBatchReturnScan(decodedText);
          },
          (errorMessage) => {
            // Silence scan warnings
          }
        );
        qrScannerRef.current = html5QrCode;
      } catch (err) {
        console.error("Erro ao iniciar câmera:", err);
        showToast("Não foi possível acessar a câmera. Verifique as permissões.", "error");
        setIsCameraActive(false);
      }
    }, 200);
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Erro ao parar câmera:", err);
      } finally {
        qrScannerRef.current = null;
      }
    }
    setIsCameraActive(false);
  };

  const closeBatchReturnModal = async () => {
    await stopCamera();
    setBatchReturnList([]);
    setIsBatchReturnModalOpen(false);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  // Carregar dados iniciais
  const fetchData = async () => {
    setLoading(true);
    try {
      const [salasRes, dispRes, histRes] = await Promise.all([
        supabase.from('salas').select('*').order('nome'),
        supabase.from('dispositivos').select('*').order('tipo'),
        supabase.from('historico_emprestimos').select('*').order('data_emprestimo', { ascending: false })
      ]);

      if (salasRes.error) throw salasRes.error;
      if (dispRes.error) throw dispRes.error;
      if (histRes.error) throw histRes.error;

      setSalas(salasRes.data || []);
      setDispositivos(dispRes.data || []);
      setHistoricoEmprestimos(histRes.data || []);

      // Se a sala selecionada foi atualizada, atualizar a referência na UI
      if (selectedRoom) {
        const updatedSelected = salasRes.data.find(s => s.id === selectedRoom.id);
        if (updatedSelected) {
          setSelectedRoom(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de equipamentos:', err);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (userName) {
      setHelpProfessor((userRole !== 'gestao') ? userName : '');
    }
  }, [userName, userRole]);

  // Sincronizar aba ativa via parâmetro da URL (ex: tab=solicitacoes ao clicar na notificação)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'salas', 'dispositivos', 'solicitacoes', 'emprestimos'].includes(tab)) {
      setActiveTab(tab);
    }

    // Sincronizar busca por ID do QR Code
    const searchParam = params.get('search') || params.get('device') || params.get('id');
    if (searchParam) {
      setSearchQuery(searchParam);
      setActiveTab('dispositivos');
    }
  }, [location]);

  // Abrir o modal da etiqueta (QR Code) diretamente em primeiro plano ao escanear
  useEffect(() => {
    if (dispositivos.length > 0) {
      const params = new URLSearchParams(location.search);
      const searchParam = params.get('search') || params.get('device') || params.get('id');
      if (searchParam) {
        const foundDevice = dispositivos.find(d => d.id.toLowerCase() === searchParam.toLowerCase());
        if (foundDevice) {
          if (foundDevice.disponivel_emprestimo) {
            openLoanModal(foundDevice);
          } else {
            openQrModal(foundDevice);
          }
          // Limpa o parâmetro da URL para não reabrir o modal em renderizações ou atualizações posteriores
          navigate(location.pathname, { replace: true });
        }
      }
    }
  }, [dispositivos, location.search]);

  const fetchHelpRequests = async () => {
    setLoadingHelp(true);
    try {
      let query = supabase
        .from('solicitacoes_ajuda')
        .select('*');

      if (userRole === 'professor' && userName) {
        query = query.eq('professor', userName);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setHelpRequests(data || []);
    } catch (err) {
      console.error('Erro ao buscar solicitações de ajuda:', err);
      showToast('Erro ao carregar solicitações', 'error');
    } finally {
      setLoadingHelp(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'solicitacoes' && (userRole === 'gestao' || userRole === 'tecnico' || userRole === 'professor')) {
      fetchHelpRequests();
    }
  }, [activeTab, userRole]);

  const handleSaveHelpRequest = async (e) => {
    e.preventDefault();
    const finalProfessor = (userRole !== 'gestao' && userName) ? userName : helpProfessor;
    if (!finalProfessor.trim() || !helpSala.trim() || !helpDescricao.trim()) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    const payload = {
      professor: finalProfessor.trim(),
      data: helpData,
      sala: helpSala.trim(),
      descricao: helpDescricao.trim(),
      status: 'Pendente'
    };

    try {
      const { error } = await supabase.from('solicitacoes_ajuda').insert([payload]);
      if (error) throw error;
      
      showToast('Solicitação de ajuda enviada com sucesso!');
      setIsHelpModalOpen(false);
      setHelpSala('');
      setHelpDescricao('');
      
      if (activeTab === 'solicitacoes') {
        fetchHelpRequests();
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao enviar solicitação de ajuda', 'error');
    }
  };

  const handleUpdateHelpStatus = async (id, status, comentarios = null) => {
    try {
      const payload = { status };
      if (comentarios !== null) {
        payload.comentarios = comentarios;
      }
      const { error } = await supabase
        .from('solicitacoes_ajuda')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
      showToast('Solicitação atualizada!');
      fetchHelpRequests();
      setSelectedHelpRequest(prev => prev && prev.id === id ? { ...prev, ...payload } : prev);
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar solicitação', 'error');
    }
  };

  const handleDeleteHelpRequest = async (id, skipConfirm = false) => {
    const requestToDelete = helpRequests.find(r => r.id === id);
    const isOwner = requestToDelete && userRole === 'professor' && requestToDelete.professor === userName;
    const isGestao = userRole === 'gestao';

    if (!isGestao && !isOwner) {
      showToast('Você não tem permissão para excluir esta solicitação', 'error');
      return false;
    }

    if (!skipConfirm && !window.confirm('Tem certeza que deseja excluir esta solicitação?')) return false;
    try {
      const { error } = await supabase
        .from('solicitacoes_ajuda')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Solicitação excluída!');
      fetchHelpRequests();
      return true;
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir solicitação', 'error');
      return false;
    }
  };

  // --- REPORT EXPORTS (CSV / PDF) ---
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    let headers = [];
    let rows = [];
    let filename = '';

    if (activeTab === 'solicitacoes') {
      headers = ['Professor', 'Data', 'Sala', 'Descrição', 'Status', 'Comentários do Técnico'];
      rows = helpRequests.map(req => [
        req.professor,
        new Date(req.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        req.sala,
        req.descricao,
        req.status,
        req.comentarios || ''
      ]);
      filename = `solicitacoes_ajuda_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ['Tipo', 'Nº Patrimônio (Escola)', 'Nº Série', 'Local / Sala', 'Condição', 'Observações'];
      rows = filteredDispositivos.map(device => [
        device.tipo,
        device.numero_escola || 'Não definido',
        device.numero_serie || 'Não definido',
        roomNameMap[device.sala_id] || 'Sem Sala',
        device.condicao,
        device.observacoes || ''
      ]);
      filename = `inventario_equipamentos_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = BOM + [headers.join(';'), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const isHelp = activeTab === 'solicitacoes';
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(isHelp ? 'Relatório de Solicitações de Ajuda' : 'Relatório de Inventário de Equipamentos', 14, 20);
    
    // Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27);
    
    if (isHelp) {
      doc.text(`Total de registros: ${helpRequests.length}`, 14, 32);
    } else {
      const condFilter = filterCondicao ? `Condição: ${filterCondicao}` : 'Condição: Todas';
      const salaFilter = filterSala ? `Sala: ${roomNameMap[filterSala] || ''}` : 'Sala: Todas';
      doc.text(`Filtros: ${condFilter} | ${salaFilter} | Busca: ${searchQuery || 'Nenhuma'}`, 14, 32);
    }
    
    // Header line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 196, 35);
    
    let y = 42;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    if (isHelp) {
      doc.text('Professor', 14, y);
      doc.text('Data', 60, y);
      doc.text('Sala', 80, y);
      doc.text('Descrição', 105, y);
      doc.text('Status', 180, y);
      
      doc.line(14, y + 2, 196, y + 2);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      helpRequests.forEach((req) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('Professor', 14, y);
          doc.text('Data', 60, y);
          doc.text('Sala', 80, y);
          doc.text('Descrição', 105, y);
          doc.text('Status', 180, y);
          doc.line(14, y + 2, 196, y + 2);
          y += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }
        
        const profStr = doc.splitTextToSize(req.professor, 44);
        const dataStr = new Date(req.data + 'T00:00:00').toLocaleDateString('pt-BR');
        const salaStr = req.sala;
        const descStr = doc.splitTextToSize(req.descricao + (req.comentarios ? `\nObs: ${req.comentarios}` : ''), 72);
        const statusStr = req.status;
        
        const rowHeight = Math.max(profStr.length * 4, descStr.length * 4, 6);
        
        doc.text(profStr, 14, y);
        doc.text(dataStr, 60, y);
        doc.text(salaStr, 80, y);
        doc.text(descStr, 105, y);
        doc.text(statusStr, 180, y);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + rowHeight - 2, 196, y + rowHeight - 2);
        y += rowHeight;
      });
      doc.save(`solicitacoes_ajuda_${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      doc.text('Tipo', 14, y);
      doc.text('Patrimônio', 60, y);
      doc.text('Nº Série', 95, y);
      doc.text('Sala', 135, y);
      doc.text('Condição', 170, y);
      
      doc.line(14, y + 2, 196, y + 2);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      filteredDispositivos.forEach((dev) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('Tipo', 14, y);
          doc.text('Patrimônio', 60, y);
          doc.text('Nº Série', 95, y);
          doc.text('Sala', 135, y);
          doc.text('Condição', 170, y);
          doc.line(14, y + 2, 196, y + 2);
          y += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }
        
        const tipoStr = doc.splitTextToSize(dev.tipo, 44);
        const patStr = dev.numero_escola || 'Não def.';
        const serieStr = dev.numero_serie || 'Não def.';
        const salaStr = roomNameMap[dev.sala_id] || 'Sem Sala';
        const condStr = dev.condicao;
        
        const rowHeight = Math.max(tipoStr.length * 4, 6);
        
        doc.text(tipoStr, 14, y);
        doc.text(patStr, 60, y);
        doc.text(serieStr, 95, y);
        doc.text(salaStr, 135, y);
        doc.text(condStr, 170, y);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + rowHeight - 2, 196, y + rowHeight - 2);
        y += rowHeight;
      });
      doc.save(`inventario_equipamentos_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const handlePrintQrCode = (device) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      window.location.origin + window.location.pathname + '?search=' + device.id
    )}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR Code - ${device.tipo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              color: #333;
            }
            .tag-container {
              border: 2px dashed #333;
              padding: 15px;
              display: inline-block;
              border-radius: 10px;
              background: #fff;
              max-width: 250px;
            }
            .qr-image {
              width: 150px;
              height: 150px;
              margin-bottom: 10px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
              text-transform: uppercase;
            }
            .detail {
              font-size: 12px;
              margin: 3px 0;
              color: #555;
            }
            .footer-tag {
              font-size: 10px;
              color: #999;
              margin-top: 8px;
              font-family: monospace;
            }
            @media print {
              body { padding: 0; }
              .tag-container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="tag-container">
            <img class="qr-image" src="${qrUrl}" alt="QR Code" />
            <div class="title">${device.tipo}</div>
            ${device.numero_escola ? `<div class="detail">Patrimônio: <b>${device.numero_escola}</b></div>` : ''}
            ${device.numero_serie ? `<div class="detail">Série: <b>${device.numero_serie}</b></div>` : ''}
            <div class="detail">Local: ${roomNameMap[device.sala_id] || 'Sem sala'}</div>
            <div class="footer-tag">${device.id.substring(0, 8)}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGenerateLabelsPdf = async (devicesToPrint) => {
    if (devicesToPrint.length === 0) return;
    
    showToast('Carregando imagens e gerando PDF...', 'info');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const loadQrImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const labelWidth = 85;
    const labelHeight = 50;
    const marginX = 15;
    const marginY = 15;
    const gapX = 10;
    const gapY = 10;

    let col = 0;
    let row = 0;

    for (let i = 0; i < devicesToPrint.length; i++) {
      const device = devicesToPrint[i];
      
      if (i > 0 && i % 10 === 0) {
        doc.addPage();
        col = 0;
        row = 0;
      } else if (i > 0) {
        col = i % 2;
        row = Math.floor((i % 10) / 2);
      }

      const x = marginX + col * (labelWidth + gapX);
      const y = marginY + row * (labelHeight + gapY);

      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(x, y, labelWidth, labelHeight);
      doc.setLineDashPattern([], 0);

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        window.location.origin + window.location.pathname + '?search=' + device.id
      )}`;
      
      const qrImg = await loadQrImage(qrUrl);
      if (qrImg) {
        doc.addImage(qrImg, 'PNG', x + 5, y + 10, 30, 30);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('[Erro QR]', x + 10, y + 25);
      }

      doc.setTextColor(51, 51, 51);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const tipoText = doc.splitTextToSize(device.tipo, 42);
      doc.text(tipoText, x + 38, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Patrimônio: ${device.numero_escola || 'N/D'}`, x + 38, y + 22);

      const numSerie = device.numero_serie ? (device.numero_serie.length > 20 ? device.numero_serie.substring(0, 18) + '...' : device.numero_serie) : 'N/D';
      doc.text(`Nº Série: ${numSerie}`, x + 38, y + 27);

      const roomName = roomNameMap[device.sala_id] || 'Sem sala';
      const roomText = roomName.length > 20 ? roomName.substring(0, 18) + '...' : roomName;
      doc.text(`Local: ${roomText}`, x + 38, y + 32);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(153, 153, 153);
      doc.text(`ID: ${device.id.substring(0, 13)}...`, x + 38, y + 42);
    }

    doc.save(`etiquetas_equipamentos_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('PDF de etiquetas gerado com sucesso!', 'success');
  };

  const handleShareHelpRequest = async (req) => {
    const dataStr = new Date(req.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const text = `*Solicitação de Ajuda - Controle de Equipamentos*\n\n` +
                 `*Professor(a):* ${req.professor}\n` +
                 `*Data:* ${dataStr}\n` +
                 `*Sala/Local:* ${req.sala}\n` +
                 `*Descrição:* ${req.descricao}\n` +
                 `*Status:* ${req.status}` +
                 (req.comentarios ? `\n*Retorno Técnico:* ${req.comentarios}` : '');

    try {
      await navigator.clipboard.writeText(text);
      showToast('Copiado para a área de transferência!', 'success');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      showToast('Erro ao copiar para a área de transferência', 'error');
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Solicitação de Ajuda',
          text: text
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    }
  };

  // --- MÉTRIAS E PROCESSAMENTO DO DASHBOARD ---
  const dashboardStats = useMemo(() => {
    const totalRooms = salas.length;
    const totalDevices = dispositivos.length;
    const functionalCount = dispositivos.filter(d => d.condicao === 'Funcional').length;
    const maintenanceCount = dispositivos.filter(d => d.condicao === 'Em manutenção').length;
    const damagedCount = dispositivos.filter(d => d.condicao === 'Danificado' || d.condicao === 'Danificado sem garantia').length;
    const warrantyCount = dispositivos.filter(d => d.condicao === 'Garantia solicitada').length;
    
    const functionalPercentage = totalDevices > 0 ? Math.round((functionalCount / totalDevices) * 100) : 0;
    const attentionCount = totalDevices - functionalCount;

    return {
      totalRooms,
      totalDevices,
      functionalCount,
      maintenanceCount,
      damagedCount,
      warrantyCount,
      functionalPercentage,
      attentionCount
    };
  }, [salas, dispositivos]);

  const conditionsData = useMemo(() => {
    const counts = {
      'Funcional': 0,
      'Em manutenção': 0,
      'Danificado': 0,
      'Garantia solicitada': 0,
      'Danificado sem garantia': 0
    };
    dispositivos.forEach(d => {
      if (counts[d.condicao] !== undefined) {
        counts[d.condicao]++;
      } else {
        counts['Danificado']++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dispositivos]);

  const roomDistributionData = useMemo(() => {
    const counts = {};
    dispositivos.forEach(d => {
      const roomKey = d.sala_id || 'unlinked';
      counts[roomKey] = (counts[roomKey] || 0) + 1;
    });

    const data = salas.map(sala => ({
      id: sala.id,
      nome: sala.nome,
      count: counts[sala.id] || 0
    }));

    if (counts['unlinked']) {
      data.push({
        id: 'unlinked',
        nome: 'Sem sala vinculada',
        count: counts['unlinked']
      });
    }

    return data.sort((a, b) => b.count - a.count);
  }, [salas, dispositivos]);

  // Contagem dinâmica de dispositivos por sala
  const deviceCounts = useMemo(() => {
    const counts = {};
    dispositivos.forEach(d => {
      if (d.sala_id) {
        counts[d.sala_id] = (counts[d.sala_id] || 0) + 1;
      }
    });
    return counts;
  }, [dispositivos]);

  // Filtragem de salas para a exibição na grade
  const filteredSalas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return salas;
    return salas.filter(s => 
      s.nome.toLowerCase().includes(query) || 
      (s.descricao && s.descricao.toLowerCase().includes(query))
    );
  }, [salas, searchQuery]);

  // Mapeamento id_sala -> nome_sala para exibição simples
  const roomNameMap = useMemo(() => {
    const map = {};
    salas.forEach(s => {
      map[s.id] = s.nome;
    });
    return map;
  }, [salas]);

  // Filtragem de todos os dispositivos para exibição na tabela
  const filteredDispositivos = useMemo(() => {
    let result = dispositivos;

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(d => 
        d.id.toLowerCase().includes(query) ||
        d.tipo.toLowerCase().includes(query) ||
        (d.numero_escola && d.numero_escola.toLowerCase().includes(query)) ||
        (d.numero_serie && d.numero_serie.toLowerCase().includes(query)) ||
        (d.observacoes && d.observacoes.toLowerCase().includes(query))
      );
    }

    if (filterCondicao) {
      result = result.filter(d => d.condicao === filterCondicao);
    }

    if (filterSala) {
      result = result.filter(d => d.sala_id === filterSala);
    }

    return result;
  }, [dispositivos, searchQuery, filterCondicao, filterSala]);

  // Dispositivos pertencentes apenas à sala selecionada
  const selectedRoomDevices = useMemo(() => {
    if (!selectedRoom) return [];
    return dispositivos
      .filter(d => d.sala_id === selectedRoom.id)
      .sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [dispositivos, selectedRoom]);

  // Dispositivos que estão habilitados para empréstimo
  const loanableDevices = useMemo(() => {
    return dispositivos
      .filter(d => d.disponivel_emprestimo)
      .sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [dispositivos]);



  // ── AÇÕES DE SALAS (CRUD) ──

  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (e, sala) => {
    e.stopPropagation();
    setEditingRoom(sala);
    setRoomName(sala.nome);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!roomName.trim()) {
      showToast('O nome da sala é obrigatório', 'error');
      return;
    }

    const payload = {
      nome: roomName.trim()
    };

    try {
      if (editingRoom) {
        // Atualizar
        const { error } = await supabase.from('salas').update(payload).eq('id', editingRoom.id);
        if (error) throw error;
        showToast('Sala updated com sucesso!');
      } else {
        // Criar
        const { error } = await supabase.from('salas').insert([payload]);
        if (error) throw error;
        showToast('Sala criada com sucesso!');
      }
      setIsRoomModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar sala', 'error');
    }
  };

  const handleDeleteRoom = async (e, salaId) => {
    e.stopPropagation();
    if (!canEdit) return;
    if (!window.confirm('Tem certeza que deseja excluir esta sala? Os dispositivos nela alocados ficarão sem sala vinculada.')) return;

    try {
      const { error } = await supabase.from('salas').delete().eq('id', salaId);
      if (error) throw error;
      showToast('Sala excluída com sucesso!');
      if (selectedRoom?.id === salaId) {
        setIsDetailsModalOpen(false);
      }
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir sala', 'error');
    }
  };

  // ── AÇÕES DE DISPOSITIVOS (CRUD) ──

  const openCreateDeviceModal = () => {
    setEditingDevice(null);
    setDeviceTipo('');
    setDeviceNumEscola('');
    setDeviceNumSerie('');
    setDeviceSalaId(selectedRoom ? selectedRoom.id : '');
    setDeviceCondicao('Funcional');
    setDeviceObs('');
    setDeviceDisponivelEmprestimo(false);
    setIsDeviceModalOpen(true);
  };

  const openEditDeviceModal = (device) => {
    setEditingDevice(device);
    setDeviceTipo(device.tipo);
    setDeviceNumEscola(device.numero_escola || '');
    setDeviceNumSerie(device.numero_serie || '');
    setDeviceSalaId(device.sala_id || '');
    setDeviceCondicao(device.condicao);
    setDeviceObs(device.observacoes || '');
    setDeviceDisponivelEmprestimo(device.disponivel_emprestimo || false);
    setIsDeviceModalOpen(true);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!deviceTipo.trim()) {
      showToast('O tipo do dispositivo é obrigatório', 'error');
      return;
    }

    const payload = {
      tipo: deviceTipo.trim(),
      numero_escola: deviceNumEscola.trim() || null,
      numero_serie: deviceNumSerie.trim() || null,
      sala_id: deviceSalaId || null,
      condicao: deviceCondicao,
      observacoes: deviceObs.trim() || null,
      disponivel_emprestimo: deviceDisponivelEmprestimo
    };

    try {
      if (editingDevice) {
        // Atualizar
        const { error } = await supabase.from('dispositivos').update(payload).eq('id', editingDevice.id);
        if (error) throw error;
        showToast('Equipamento atualizado com sucesso!');
      } else {
        // Criar
        const { error } = await supabase.from('dispositivos').insert([payload]);
        if (error) throw error;
        showToast('Equipamento adicionado com sucesso!');
      }
      setIsDeviceModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar equipamento', 'error');
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!canEdit) return;
    if (!window.confirm('Deseja realmente remover este equipamento?')) return;

    try {
      const { error } = await supabase.from('dispositivos').delete().eq('id', deviceId);
      if (error) throw error;
      showToast('Equipamento removido com sucesso!');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover equipamento', 'error');
    }
  };

  const handleDeleteHistorico = async (id) => {
    if (!canEdit) return;
    if (!window.confirm('Tem certeza que deseja excluir este registro do histórico?')) return;

    try {
      const { error } = await supabase.from('historico_emprestimos').delete().eq('id', id);
      if (error) throw error;
      showToast('Registro do histórico excluído com sucesso!');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir registro do histórico', 'error');
    }
  };

  const handleBatchReturnScan = (val) => {
    if (!val.trim()) return;

    let deviceId = val.trim();
    try {
      if (deviceId.startsWith('http://') || deviceId.startsWith('https://')) {
        const urlObj = new URL(deviceId);
        deviceId = urlObj.searchParams.get('search') || urlObj.searchParams.get('device') || urlObj.searchParams.get('id') || deviceId;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    const device = dispositivos.find(d => 
      d.id.toLowerCase() === deviceId.toLowerCase() || 
      (d.numero_escola && d.numero_escola.toLowerCase() === deviceId.toLowerCase())
    );
    
    if (!device) {
      showToast('Dispositivo não encontrado pelo ID ou Patrimônio inserido', 'error');
      setBatchReturnInput('');
      return;
    }

    if (!device.emprestado) {
      showToast(`O dispositivo "${device.tipo}" já está disponível (não está emprestado)`, 'warning');
      setBatchReturnInput('');
      return;
    }

    // Usar scannedIdsRef para ignorar leituras duplicadas rápidas no mesmo frame da camera
    if (scannedIdsRef.current.has(device.id)) {
      setBatchReturnInput('');
      return;
    }
    scannedIdsRef.current.add(device.id);

    setBatchReturnList(prev => {
      // Remove any existing copy to ensure absolute uniqueness in the state array
      const filtered = prev.filter(item => item.id !== device.id);
      return [...filtered, device];
    });
    
    showToast(`"${device.tipo}" adicionado à lista de devolução!`, 'success');
    setBatchReturnInput('');
  };

  const handleBatchInputSubmit = (e) => {
    e.preventDefault();
    handleBatchReturnScan(batchReturnInput);
  };

  const closeBatchReturnModal = async () => {
    await stopCamera();
    setBatchReturnList([]);
    scannedIdsRef.current.clear();
    setIsBatchReturnModalOpen(false);
  };

  const handleConfirmBatchReturn = async () => {
    if (batchReturnList.length === 0 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const executionId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const devicesToProcess = [...batchReturnList];
    console.log(`[RETURN EXECUTION ${executionId}] started processing ${devicesToProcess.length} items.`);
    
    // Limpa a lista e o cache de escaneamento imediatamente para evitar múltiplos cliques/processamento concorrente
    setBatchReturnList([]);
    scannedIdsRef.current.clear();
    setIsBatchReturnModalOpen(false);

    try {
      // Garantia absoluta de unicidade de IDs na fila
      const uniqueDevices = [];
      const seenIds = new Set();
      for (const dev of devicesToProcess) {
        if (!seenIds.has(dev.id)) {
          seenIds.add(dev.id);
          uniqueDevices.push(dev);
        }
      }

      if (uniqueDevices.length === 0) {
        console.log(`[RETURN EXECUTION ${executionId}] uniqueDevices list is empty.`);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      console.log(`[RETURN EXECUTION ${executionId}] unique IDs to return:`, uniqueDevices.map(d => d.id));
      const idsToUpdate = uniqueDevices.map(d => d.id);

      // 1. Atualizar o status dos dispositivos para disponível
      const { error: updateDevicesError } = await supabase
        .from('dispositivos')
        .update({
          emprestado: false,
          professor_emprestimo: null,
          data_emprestimo: null
        })
        .in('id', idsToUpdate);

      if (updateDevicesError) throw updateDevicesError;

      // 2. Buscar empréstimos ativos (sem data de devolução) para esses dispositivos
      const { data: activeLoans, error: selectError } = await supabase
        .from('historico_emprestimos')
        .select('id, dispositivo_id')
        .in('dispositivo_id', idsToUpdate)
        .is('data_devolucao', null);

      if (selectError) throw selectError;

      const activeLoanIds = [];
      const devicesWithActiveLoan = new Set();

      if (activeLoans && activeLoans.length > 0) {
        for (const loan of activeLoans) {
          activeLoanIds.push(loan.id);
          devicesWithActiveLoan.add(loan.dispositivo_id);
        }

        console.log(`[RETURN EXECUTION ${executionId}] active loans to close:`, activeLoanIds);

        // 3. Atualizar devoluções dos empréstimos ativos com a data/hora atual
        const { error: updateHistoryError } = await supabase
          .from('historico_emprestimos')
          .update({ data_devolucao: new Date() })
          .in('id', activeLoanIds);

        if (updateHistoryError) throw updateHistoryError;
      }

      // 4. Para dispositivos que não possuíam empréstimo ativo no histórico, inserir um registro já concluído
      // Adicionamos uma salvaguarda extra: se o mesmo dispositivo foi devolvido nos últimos 10 segundos,
      // pulamos a inserção dele para evitar qualquer concorrência residual.
      const devicesFiltered = uniqueDevices.filter(d => !devicesWithActiveLoan.has(d.id));
      const devicesToInsert = [];

      if (devicesFiltered.length > 0) {
        console.log(`[RETURN EXECUTION ${executionId}] devices without active loan in history, running recent check:`, devicesFiltered.map(d => d.id));
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        const { data: recentReturns, error: recentError } = await supabase
          .from('historico_emprestimos')
          .select('dispositivo_id')
          .in('dispositivo_id', devicesFiltered.map(d => d.id))
          .gte('data_devolucao', tenSecondsAgo);

        if (!recentError && recentReturns) {
          const recentlyReturnedIds = new Set(recentReturns.map(r => r.dispositivo_id));
          for (const dev of devicesFiltered) {
            if (!recentlyReturnedIds.has(dev.id)) {
              devicesToInsert.push(dev);
            } else {
              console.log(`[RETURN EXECUTION ${executionId}] skipped duplicate insert for device ${dev.id} as it was returned in the last 10s.`);
            }
          }
        } else {
          devicesToInsert.push(...devicesFiltered);
        }
      }

      if (devicesToInsert.length > 0) {
        const inserts = devicesToInsert.map(dev => ({
          dispositivo_id: dev.id,
          professor: dev.professor_emprestimo || 'Não identificado',
          data_emprestimo: dev.data_emprestimo || new Date(),
          data_devolucao: new Date(),
          tipo_dispositivo: dev.tipo,
          patrimonio: dev.numero_escola || null
        }));

        console.log(`[RETURN EXECUTION ${executionId}] inserting history records:`, inserts.map(i => i.dispositivo_id));
        const { error: insertHistoryError } = await supabase
          .from('historico_emprestimos')
          .insert(inserts);

        if (insertHistoryError) throw insertHistoryError;
      }

      console.log(`[RETURN EXECUTION ${executionId}] finished successfully.`);
      showToast(`${uniqueDevices.length} devoluções registradas com sucesso!`, 'success');
      fetchData();
    } catch (err) {
      console.error(`[RETURN EXECUTION ${executionId}] failed:`, err);
      showToast('Erro ao processar devolução em lote', 'error');
      // Restaura a fila de devolução caso ocorra algum erro no banco
      setBatchReturnList(devicesToProcess);
      for (const dev of devicesToProcess) {
        scannedIdsRef.current.add(dev.id);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleBorrowDevice = async (e) => {
    e.preventDefault();
    if (!loanDevice || isSubmittingRef.current) return;
    if (!loanProfessor.trim()) {
      showToast('Selecione o professor', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const payload = {
      emprestado: true,
      professor_emprestimo: loanProfessor,
      data_emprestimo: new Date(loanDate + 'T12:00:00')
    };

    try {
      const { error: updateError } = await supabase
        .from('dispositivos')
        .update(payload)
        .eq('id', loanDevice.id);

      if (updateError) throw updateError;

      // Inserir registro no histórico de empréstimos
      const { error: historyError } = await supabase
        .from('historico_emprestimos')
        .insert([{
          dispositivo_id: loanDevice.id,
          professor: loanProfessor,
          data_emprestimo: new Date(loanDate + 'T12:00:00'),
          tipo_dispositivo: loanDevice.tipo,
          patrimonio: loanDevice.numero_escola || null
        }]);

      if (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
      }

      showToast('Empréstimo registrado com sucesso!');
      setIsLoanModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar empréstimo', 'error');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReturnDevice = async () => {
    if (!loanDevice || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const payload = {
      emprestado: false,
      professor_emprestimo: null,
      data_emprestimo: null
    };

    try {
      const { error: updateError } = await supabase
        .from('dispositivos')
        .update(payload)
        .eq('id', loanDevice.id);

      if (updateError) throw updateError;

      // Atualizar a data de devolução no histórico de empréstimo ativo mais recente
      // Procuramos o registro onde data_devolucao é null para esse dispositivo
      const { data: activeLoans, error: selectError } = await supabase
        .from('historico_emprestimos')
        .select('id')
        .eq('dispositivo_id', loanDevice.id)
        .is('data_devolucao', null)
        .order('data_emprestimo', { ascending: false })
        .limit(1);

      if (!selectError && activeLoans && activeLoans.length > 0) {
        const { error: historyError } = await supabase
          .from('historico_emprestimos')
          .update({ data_devolucao: new Date() })
          .eq('id', activeLoans[0].id);

        if (historyError) {
          console.error('Erro ao atualizar devolução no histórico:', historyError);
        }
      } else {
        // Fallback caso não ache um registro aberto: insere um registro completo já devolvido
        await supabase.from('historico_emprestimos').insert([{
          dispositivo_id: loanDevice.id,
          professor: loanDevice.professor_emprestimo || 'Não identificado',
          data_emprestimo: loanDevice.data_emprestimo || new Date(),
          data_devolucao: new Date(),
          tipo_dispositivo: loanDevice.tipo,
          patrimonio: loanDevice.numero_escola || null
        }]);
      }

      showToast('Devolução registrada com sucesso!');
      setIsLoanModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar devolução', 'error');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };



  // Helper para renderizar badges de condição
  const renderCondicaoBadge = (condicao) => {
    let className = 'condicao-badge ';
    if (condicao === 'Funcional') className += 'condicao-funcional';
    else if (condicao === 'Em manutenção') className += 'condicao-manutencao';
    else if (condicao === 'Danificado') className += 'condicao-danificado';
    else if (condicao === 'Garantia solicitada') className += 'condicao-garantia';
    else className += 'condicao-danificado-sem-garantia';

    return <span className={className}>{condicao}</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Carregando equipamentos...</div>
      </div>
    );
  }

  return (
    <div className="equipamentos-container">
      {/* Header Geral do Painel */}
      <div className="equipamentos-header">
        <div className="equipamentos-title-section">
          <button className="btn-back-home" onClick={() => navigate('/')} title="Voltar ao início">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Wrench size={28} color="var(--color-primary)" /> Controle de Equipamentos
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <>
              <button 
                className="btn btn-secondary"
                onClick={handleExportCSV} 
                style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleExportPDF} 
                style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, backgroundColor: 'var(--color-primary)' }}
              >
                <FileText size={16} /> Gerar PDF
              </button>
            </>
          )}
          
          <button 
            className="btn-help" 
            onClick={() => {
              setHelpProfessor((userRole !== 'gestao' && userName) ? userName : '');
              setHelpData(new Date().toISOString().split('T')[0]);
              setIsHelpModalOpen(true);
            }}
            style={{ margin: 0 }}
          >
            Solicitar Ajuda
          </button>
        </div>
      </div>

      {/* Tab bar principal (Dashboard vs Salas vs Tabela Completa vs Solicitações) */}
      <div className="tab-container">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => { setActiveTab('salas'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'salas' ? 'active' : ''}`}
        >
          Salas e Locais
        </button>
        <button 
          onClick={() => { setActiveTab('dispositivos'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'dispositivos' ? 'active' : ''}`}
        >
          Todos os Dispositivos
        </button>
        <button 
          onClick={() => { setActiveTab('emprestimos'); setSearchQuery(''); }}
          className={`tab-button ${activeTab === 'emprestimos' ? 'active' : ''}`}
        >
          Empréstimos
        </button>
        {(userRole === 'tecnico' || userRole === 'gestao' || userRole === 'professor') && (
          <button 
            onClick={() => { setActiveTab('solicitacoes'); setSearchQuery(''); }}
            className={`tab-button ${activeTab === 'solicitacoes' ? 'active' : ''}`}
          >
            {userRole === 'professor' ? 'Minhas Solicitações' : 'Solicitações de Ajuda'}
          </button>
        )}
      </div>

      {/* Barra de pesquisa e botão nova sala na página principal */}
      {activeTab === 'salas' && (
        <div className="search-bar-row">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar salas por nome..."
              className="search-input"
            />
            <Search className="search-icon" size={18} />
          </div>

          {canEdit && (
            <div className="action-buttons-group">
              <button className="btn btn-primary" onClick={openCreateRoomModal}>
                <Plus size={16} /> Nova Sala
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB DASHBOARD (Painel de Indicadores e Gráficos) ── */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid-view">
          {/* Cards de Métricas Rápidas */}
          <div className="dashboard-stats-cards">
            <div className="dashboard-stat-card card-blue">
              <div className="card-stat-icon">
                <Wrench size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{dashboardStats.totalDevices}</span>
                <span className="card-stat-label">Total de Equipamentos</span>
              </div>
            </div>
            
            <div className="dashboard-stat-card card-purple">
              <div className="card-stat-icon">
                <FolderOpen size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{dashboardStats.totalRooms}</span>
                <span className="card-stat-label">Salas e Locais</span>
              </div>
            </div>

            <div className="dashboard-stat-card card-green">
              <div className="card-stat-icon">
                <Activity size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{dashboardStats.functionalPercentage}%</span>
                <span className="card-stat-label">Taxa de Funcionamento</span>
              </div>
            </div>

            <div className="dashboard-stat-card card-amber">
              <div className="card-stat-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="card-stat-info">
                <span className="card-stat-value">{dashboardStats.attentionCount}</span>
                <span className="card-stat-label">Necessitam Atenção</span>
              </div>
            </div>
          </div>

          {/* Seção Principal de Gráficos */}
          <div className="dashboard-charts-row">
            {/* Gráfico Donut de Condições */}
            <div className="dashboard-chart-box donut-chart-box">
              <h3 className="chart-title">Condição de Funcionamento</h3>
              <div className="donut-chart-container">
                <div className="donut-svg-wrapper">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                    {(() => {
                      let accumulatedPercentage = 0;
                      return conditionsData.map((slice) => {
                        const percentage = dashboardStats.totalDevices > 0 ? (slice.value / dashboardStats.totalDevices) * 100 : 0;
                        if (percentage === 0) return null;
                        const strokeLength = (percentage / 100) * 314.159;
                        const offset = (accumulatedPercentage / 100) * 314.159;
                        accumulatedPercentage += percentage;
                        
                        const strokeColors = {
                          'Funcional': '#16A34A',
                          'Em manutenção': '#D97706',
                          'Danificado': '#DC2626',
                          'Garantia solicitada': '#2563EB',
                          'Danificado sem garantia': '#6B7280'
                        };
                        
                        return (
                          <circle
                            key={slice.name}
                            cx="80"
                            cy="80"
                            r="50"
                            fill="transparent"
                            stroke={strokeColors[slice.name] || '#374151'}
                            strokeWidth="16"
                            className="donut-segment"
                            style={{
                              strokeDasharray: `${strokeLength} 314.159`,
                              strokeDashoffset: -offset,
                              strokeLinecap: percentage === 100 ? 'butt' : 'round'
                            }}
                          />
                        );
                      });
                    })()}
                    <circle cx="80" cy="80" r="42" fill="var(--bg-card)" />
                  </svg>
                  <div className="donut-center-label">
                    <span className="donut-center-value">{dashboardStats.totalDevices}</span>
                    <span className="donut-center-text">Dispositivos</span>
                  </div>
                </div>
                
                {/* Legenda do Gráfico Donut */}
                <div className="donut-legend">
                  {conditionsData.map((slice) => {
                    const percentage = dashboardStats.totalDevices > 0 ? Math.round((slice.value / dashboardStats.totalDevices) * 100) : 0;
                    const strokeColors = {
                      'Funcional': '#16A34A',
                      'Em manutenção': '#D97706',
                      'Danificado': '#DC2626',
                      'Garantia solicitada': '#2563EB',
                      'Danificado sem garantia': '#6B7280'
                    };
                    return (
                      <div key={slice.name} className="legend-item">
                        <div className="legend-marker-wrapper">
                          <span className="legend-dot" style={{ backgroundColor: strokeColors[slice.name] || '#374151' }}></span>
                          <span className="legend-name">{slice.name}</span>
                        </div>
                        <span className="legend-value">{slice.value} <small>({percentage}%)</small></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gráfico de Barras de Distribuição por Sala */}
            <div className="dashboard-chart-box bar-chart-box">
              <h3 className="chart-title">Equipamentos por Sala</h3>
              <div className="bar-chart-container">
                {roomDistributionData.length === 0 ? (
                  <p className="no-data-text">Nenhuma sala ou dispositivo cadastrado</p>
                ) : (
                  roomDistributionData.slice(0, 6).map((item) => {
                    const maxVal = Math.max(...roomDistributionData.map(r => r.count), 1);
                    const widthPercent = (item.count / maxVal) * 100;
                    return (
                      <div key={item.id} className="bar-chart-row">
                        <div className="bar-row-header">
                          <span className="bar-row-label">{item.nome}</span>
                          <span className="bar-row-value">{item.count} {item.count === 1 ? 'item' : 'itens'}</span>
                        </div>
                        <div className="bar-row-track">
                          <div 
                            className="bar-row-fill" 
                            style={{ 
                              width: `${widthPercent}%`,
                              backgroundColor: item.id === 'unlinked' ? '#9CA3AF' : '#2563EB'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
                {roomDistributionData.length > 6 && (
                  <button className="btn-show-all-rooms" onClick={() => setActiveTab('salas')}>
                    Ver todas as {roomDistributionData.length} salas
                  </button>
                )}
              </div>
            </div>
          </div>


        </div>
      )}

      {/* ── TAB SALAS E LOCAIS (Grade de Cards) ── */}
      {activeTab === 'salas' && (
        filteredSalas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            <FolderOpen size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhuma sala encontrada</p>
          </div>
        ) : (
          <div className="salas-grid">
            {filteredSalas.map(sala => {
              const roomColor = ROOM_COLOR_DEFAULT;
              return (
                <div 
                  key={sala.id} 
                  className="sala-card"
                  onClick={() => { setSelectedRoom(sala); setIsDetailsModalOpen(true); }}
                  style={{ 
                    cursor: 'pointer',
                    borderTop: `5px solid ${roomColor}`
                  }}
                >
                  <div>
                    <div className="sala-card-header">
                      <h3 className="sala-card-title">{sala.nome}</h3>
                      {canEdit && (
                        <div className="card-actions-icons">
                          <button className="btn-icon" onClick={(e) => openEditRoomModal(e, sala)} title="Editar Sala">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={(e) => handleDeleteRoom(e, sala.id)} title="Excluir Sala">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="sala-card-info">
                      <div className="sala-card-info-item">
                        <Wrench size={14} />
                        <span>{deviceCounts[sala.id] || 0} dispositivos cadastrados</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB TODOS OS DISPOSITIVOS (Tabela Geral) ── */}
      {activeTab === 'dispositivos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Painel de Filtros para Dispositivos */}
          <div className="search-bar-row">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar dispositivos por patrimônio, tipo ou série..."
                className="search-input"
              />
              <Search className="search-icon" size={18} />
            </div>

            {canEdit && (
              <div className="action-buttons-group">
                <button className="btn btn-primary" onClick={openCreateDeviceModal}>
                  <Plus size={16} /> Novo Dispositivo
                </button>
              </div>
            )}
          </div>

          <div className="controls-panel" style={{ margin: 0, padding: '1rem' }}>
            <div className="filters-group" style={{ gap: '0.75rem' }}>
              <select 
                value={filterCondicao}
                onChange={(e) => setFilterCondicao(e.target.value)}
                className="select-filter"
              >
                <option value="">Todas as condições</option>
                <option value="Funcional">Funcional</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Danificado">Danificado</option>
                <option value="Garantia solicitada">Garantia solicitada</option>
                <option value="Danificado sem garantia">Danificado sem garantia</option>
              </select>

              <select 
                value={filterSala}
                onChange={(e) => setFilterSala(e.target.value)}
                className="select-filter"
              >
                <option value="">Todas as salas</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de Ações em Lote */}
          {selectedDeviceIds.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1.25rem',
              background: 'var(--color-primary-light, #e6f0fa)',
              border: '1px solid var(--color-primary, #2B70C9)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              color: 'var(--text-main)',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ fontWeight: 600 }}>
                {selectedDeviceIds.length} {selectedDeviceIds.length === 1 ? 'dispositivo selecionado' : 'dispositivos selecionados'}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedDeviceIds([])}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', margin: 0 }}
                >
                  Limpar Seleção
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const devicesToPrint = dispositivos.filter(d => selectedDeviceIds.includes(d.id));
                    handleGenerateLabelsPdf(devicesToPrint);
                  }}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', margin: 0, backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Printer size={14} /> Gerar PDF de Etiquetas
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Dispositivos */}
          {filteredDispositivos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <Wrench size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="equipamentos-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={filteredDispositivos.length > 0 && filteredDispositivos.every(d => selectedDeviceIds.includes(d.id))}
                        onChange={() => toggleSelectAll(filteredDispositivos)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>Tipo</th>
                    <th>Nº Patrimônio (Escola)</th>
                    <th>Nº Série</th>
                    <th>Local / Sala</th>
                    <th>Condição</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispositivos.map(device => (
                    <tr key={device.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={selectedDeviceIds.includes(device.id)}
                          onChange={() => toggleSelectDevice(device.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{device.tipo}</td>
                      <td>{device.numero_escola || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Não definido</span>}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{device.numero_serie || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Não definido</span>}</td>
                      <td>{roomNameMap[device.sala_id] || <span style={{ color: 'var(--color-danger)', fontStyle: 'italic', fontWeight: 500 }}>Sem Sala</span>}</td>
                      <td>{renderCondicaoBadge(device.condicao)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => openQrModal(device)} title="Ver QR Code">
                            <QrCode size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button className="btn-icon" onClick={() => openEditDeviceModal(device)} title="Editar Equipamento">
                                <Edit2 size={14} />
                              </button>
                              <button className="btn-icon delete" onClick={() => handleDeleteDevice(device.id)} title="Remover Equipamento">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB EMPRÉSTIMOS ── */}
      {activeTab === 'emprestimos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="search-bar-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Dispositivos Disponíveis para Empréstimo</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setBatchReturnList([]);
                setIsBatchReturnModalOpen(true);
              }}
              style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
            >
              <CheckSquare size={16} /> Devolução em Lote
            </button>
          </div>

          {loanableDevices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <Wrench size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhum dispositivo habilitado para empréstimo</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1rem' 
            }}>
              {loanableDevices.map(device => (
                <div 
                  key={device.id}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between', 
                    padding: '1.25rem', 
                    background: '#ffffff', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition-smooth)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{device.tipo}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        {renderCondicaoBadge(device.condicao)}
                        {device.emprestado ? (
                          <span className="condicao-badge condicao-danificado" style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            Emprestado
                          </span>
                        ) : (
                          <span className="condicao-badge condicao-funcional">
                            Disponível
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span><b>Patrimônio:</b> {device.numero_escola || 'N/D'}</span>
                      <span><b>Nº Série:</b> {device.numero_serie || 'N/D'}</span>
                      <span><b>Localização:</b> <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{roomNameMap[device.sala_id] || 'Sem sala'}</span></span>
                      {device.emprestado && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: 'var(--radius-sm)', 
                          borderLeft: '4px solid #ff9800',
                          fontSize: '0.8rem' 
                        }}>
                          <div><b>Retirado por:</b> {device.professor_emprestimo}</div>
                          <div><b>Data:</b> {device.data_emprestimo ? new Date(device.data_emprestimo).toLocaleDateString('pt-BR') : 'N/D'}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '0.75rem',
                    marginTop: 'auto'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                        ID: {device.id.substring(0, 8)}
                      </span>
                      <button 
                        className="btn"
                        onClick={() => openLoanModal(device)}
                        style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem', 
                          margin: 0, 
                          backgroundColor: device.emprestado ? 'var(--color-danger)' : 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        {device.emprestado ? 'Devolver' : 'Emprestar'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openQrModal(device)} title="Ver QR Code">
                        <QrCode size={14} />
                      </button>
                      {canEdit && (
                        <>
                          <button className="btn-icon" onClick={() => openEditDeviceModal(device)} title="Editar Equipamento">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteDevice(device.id)} title="Remover Equipamento">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Tabela de Histórico de Empréstimos */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--color-primary)" /> Histórico de Empréstimos Registrados
            </h3>

            {historicoEmprestimos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                Nenhum empréstimo registrado anteriormente.
              </div>
            ) : (
              <div className="table-container">
                <table className="equipamentos-table">
                  <thead>
                    <tr>
                      <th>Equipamento</th>
                      <th>Patrimônio</th>
                      <th>Professor(a)</th>
                      <th>Data do Empréstimo</th>
                      <th>Status / Data de Devolução</th>
                      {canEdit && <th style={{ textAlign: 'center' }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {historicoEmprestimos.map((hist) => (
                      <tr key={hist.id}>
                        <td style={{ fontWeight: 600 }}>{hist.tipo_dispositivo}</td>
                        <td>{hist.patrimonio || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Não definido</span>}</td>
                        <td style={{ fontWeight: 500 }}>{hist.professor}</td>
                        <td>{new Date(hist.data_emprestimo).toLocaleString('pt-BR')}</td>
                        <td>
                          {hist.data_devolucao ? (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              Devolvido em {new Date(hist.data_devolucao).toLocaleString('pt-BR')}
                            </span>
                          ) : (
                            <span style={{ color: '#ff9800', fontWeight: 700 }}>
                              Pendente (Em uso)
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-icon delete" 
                              onClick={() => handleDeleteHistorico(hist.id)} 
                              title="Excluir Registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB SOLICITAÇÕES DE AJUDA ── */}
      {activeTab === 'solicitacoes' && (userRole === 'tecnico' || userRole === 'gestao' || userRole === 'professor') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="search-bar-row">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Histórico de Solicitações</h3>
          </div>
          
          {loadingHelp ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando solicitações...</div>
          ) : helpRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
              <Bell size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-muted)' }}>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {helpRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="help-request-card"
                  onClick={() => {
                    setSelectedHelpRequest(req);
                    setTechComment(req.comentarios || '');
                    setIsHelpDetailsModalOpen(true);
                  }}
                  style={{
                    borderLeft: req.status === 'Pendente' ? '6px solid #FF4B4B' : '6px solid var(--color-success)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                        {req.professor}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(req.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className={`condicao-badge ${req.status === 'Pendente' ? 'condicao-danificado' : 'condicao-funcional'}`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      Sala/Local: <span style={{ color: 'var(--color-primary)' }}>{req.sala}</span>
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {req.descricao}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareHelpRequest(req);
                      }}
                      title="Compartilhar Solicitação"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Share2 size={16} />
                    </button>
                    {req.status === 'Pendente' && canEdit && (
                      <button 
                        className="btn btn-success" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateHelpStatus(req.id, 'Resolvido');
                        }}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--color-success)', color: 'white', border: 'none' }}
                      >
                        Marcar como Resolvido
                      </button>
                    )}
                    {(userRole === 'gestao' || (userRole === 'professor' && req.professor === userName)) && (
                      <button 
                        className="btn-icon delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHelpRequest(req.id);
                        }}
                        title="Excluir Solicitação"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL FLUTUANTE: DETALHES COMPLETOS DA SALA (Estilo Turmas) ── */}
      {isDetailsModalOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', border: 'none', overflow: 'hidden' }}>
            
            {/* Cabeçalho do Modal Colorido usando a cor azul padrão dos modais */}
            <div style={{ 
              background: '#2B70C9',
              padding: '1.5rem 2rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wrench size={22} color="#ffffff" /> {selectedRoom.nome}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="modal-body-scroll" style={{ background: 'var(--bg-secondary)', padding: '1.5rem' }}>
              
              {selectedRoomDevices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Wrench size={32} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Nenhum dispositivo cadastrado nesta sala.</p>
                  {canEdit && (
                    <button 
                      className="btn btn-primary" 
                      onClick={openCreateDeviceModal}
                      style={{ marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <Plus size={14} /> Vincular Equipamento
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox"
                        checked={selectedRoomDevices.length > 0 && selectedRoomDevices.every(d => selectedDeviceIds.includes(d.id))}
                        onChange={() => toggleSelectAll(selectedRoomDevices)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selecionar Todos</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedRoomDevices.some(d => selectedDeviceIds.includes(d.id)) && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const devicesToPrint = selectedRoomDevices.filter(d => selectedDeviceIds.includes(d.id));
                            handleGenerateLabelsPdf(devicesToPrint);
                          }}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#28a745', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}
                        >
                          <Printer size={12} /> Imprimir Etiquetas ({selectedRoomDevices.filter(d => selectedDeviceIds.includes(d.id)).length})
                        </button>
                      )}
                      {canEdit && (
                        <button 
                          className="btn btn-primary" 
                          onClick={openCreateDeviceModal}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0 }}
                        >
                          <Plus size={14} /> Vincular Equipamento
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedRoomDevices.map((device, index) => (
                    <div 
                      key={device.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.75rem 1.25rem', 
                        background: '#ffffff', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input 
                          type="checkbox"
                          checked={selectedDeviceIds.includes(device.id)}
                          onChange={() => toggleSelectDevice(device.id)}
                          style={{ cursor: 'pointer', marginRight: '0.25rem' }}
                        />
                        <span style={{ fontWeight: 800, color: '#2B70C9', fontSize: '0.85rem', minWidth: '24px' }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{device.tipo}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Patrimônio: {device.numero_escola || 'N/D'} • Série: {device.numero_serie || 'N/D'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {renderCondicaoBadge(device.condicao)}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon" onClick={() => openQrModal(device)} title="Ver QR Code">
                            <QrCode size={12} />
                          </button>
                          {canEdit && (
                            <>
                              <button className="btn-icon" onClick={() => openEditDeviceModal(device)} title="Editar Equipamento">
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-icon delete" onClick={() => handleDeleteDevice(device.id)} title="Remover Equipamento">
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer-actions" style={{ background: '#ffffff', padding: '1rem 2rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CRIAR / EDITAR SALA ── */}
      {isRoomModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingRoom ? 'Editar Sala / Local' : 'Cadastrar Nova Sala'}
              </h3>
              <button className="btn-icon" onClick={() => setIsRoomModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRoom}>
              <div className="modal-body-scroll">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-input-group">
                    <label>Nome da Sala / Local <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Ex: Sala 05, Auditório, Sala de Leitura"
                      className="form-text-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRoomModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Salvar Alterações' : 'Criar Sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CRIAR / EDITAR DISPOSITIVO ── */}
      {isDeviceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingDevice ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
              </h3>
              <button className="btn-icon" onClick={() => setIsDeviceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveDevice}>
              <div className="modal-body-scroll">
                <div className="form-grid">
                  <div className="form-input-group form-group-full">
                    <label>Tipo do Equipamento <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="text"
                      value={deviceTipo}
                      onChange={(e) => setDeviceTipo(e.target.value)}
                      placeholder="Ex: Notebook Positivo, Projetor Epson, TV LG 43"
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Nº Patrimônio (Escola)</label>
                    <input 
                      type="text"
                      value={deviceNumEscola}
                      onChange={(e) => setDeviceNumEscola(e.target.value)}
                      placeholder="Ex: 10, 34"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Nº Série Fabricante</label>
                    <input 
                      type="text"
                      value={deviceNumSerie}
                      onChange={(e) => setDeviceNumSerie(e.target.value)}
                      placeholder="Ex: 4AB59WH20"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Local / Sala Vinculada</label>
                    <select
                      value={deviceSalaId}
                      onChange={(e) => setDeviceSalaId(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="">Sem sala vinculada</option>
                      {salas.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-input-group">
                    <label>Condição de Funcionamento</label>
                    <select
                      value={deviceCondicao}
                      onChange={(e) => setDeviceCondicao(e.target.value)}
                      className="form-select-input"
                    >
                      <option value="Funcional">Funcional</option>
                      <option value="Em manutenção">Em manutenção</option>
                      <option value="Danificado">Danificado</option>
                      <option value="Garantia solicitada">Garantia solicitada</option>
                      <option value="Danificado sem garantia">Danificado sem garantia</option>
                    </select>
                  </div>

                  <div className="form-input-group form-group-full">
                    <label>Observações</label>
                    <textarea 
                      value={deviceObs}
                      onChange={(e) => setDeviceObs(e.target.value)}
                      placeholder="Observações de reparos, especificações ou detalhes físicos..."
                      className="form-textarea-input"
                    />
                  </div>

                  <div className="form-input-group form-group-full" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      id="disponivel_emprestimo"
                      checked={deviceDisponivelEmprestimo}
                      onChange={(e) => setDeviceDisponivelEmprestimo(e.target.checked)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <label htmlFor="disponivel_emprestimo" style={{ cursor: 'pointer', margin: 0, userSelect: 'none', fontWeight: 600 }}>
                      Disponível para empréstimo
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeviceModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDevice ? 'Salvar Alterações' : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SOLICITAR AJUDA AO TÉCNICO ── */}
      {isHelpModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Solicitar Ajuda do Técnico
              </h3>
              <button className="btn-icon" onClick={() => setIsHelpModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveHelpRequest}>
              <div className="modal-body-scroll">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-input-group">
                    <label>Professor(a) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    {userRole !== 'gestao' && userName ? (
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}>
                        {userName}
                      </div>
                    ) : (
                      <select
                        value={helpProfessor}
                        onChange={(e) => setHelpProfessor(e.target.value)}
                        className="form-select-input"
                        required
                      >
                        <option value="">Selecione o(a) Professor(a)...</option>
                        {professores.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-input-group">
                    <label>Data <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="date" 
                      value={helpData}
                      onChange={(e) => setHelpData(e.target.value)}
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Sala / Local <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      value={helpSala}
                      onChange={(e) => setHelpSala(e.target.value)}
                      placeholder="Descreva a sala ou local (Ex: Sala 05, Info 2)"
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-input-group">
                    <label>Descrição do Problema <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <textarea 
                      value={helpDescricao}
                      onChange={(e) => setHelpDescricao(e.target.value)}
                      placeholder="Descreva o problema que está ocorrendo com os equipamentos..."
                      className="form-textarea-input"
                      style={{ minHeight: '120px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsHelpModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-help-submit">
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DETALHES DA SOLICITAÇÃO DE AJUDA ── */}
      {isHelpDetailsModalOpen && selectedHelpRequest && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsHelpDetailsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--color-primary)" /> Detalhes da Solicitação
              </h3>
              <button className="btn-icon" onClick={() => setIsHelpDetailsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Professor(a)
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedHelpRequest.professor}
                </span>
              </div>

              <div className="form-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Data da Solicitação
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {new Date(selectedHelpRequest.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sala / Local
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {selectedHelpRequest.sala}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Status Atual
                </span>
                <div>
                  <span className={`condicao-badge ${selectedHelpRequest.status === 'Pendente' ? 'condicao-danificado' : 'condicao-funcional'}`}>
                    {selectedHelpRequest.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Descrição do Problema
                </span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                  {selectedHelpRequest.descricao}
                </p>
              </div>

              {canEdit ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Comentários / Ação do Técnico (Opcional)
                  </label>
                  <textarea
                    value={techComment}
                    onChange={(e) => setTechComment(e.target.value)}
                    placeholder="Descreva as ações realizadas ou comentários sobre o problema..."
                    className="form-textarea-input"
                    style={{ minHeight: '80px', width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleUpdateHelpStatus(selectedHelpRequest.id, selectedHelpRequest.status, techComment)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Salvar Comentário
                    </button>
                  </div>
                </div>
              ) : (
                selectedHelpRequest.comentarios && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Comentários / Ação do Técnico
                    </span>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {selectedHelpRequest.comentarios}
                    </p>
                  </div>
                )
              )}

            </div>

            <div className="modal-footer-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => handleShareHelpRequest(selectedHelpRequest)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: 'auto' }}
              >
                <Share2 size={16} /> Compartilhar
              </button>

              <button type="button" className="btn btn-secondary" onClick={() => setIsHelpDetailsModalOpen(false)}>
                Fechar
              </button>
              
              {(canEdit || (userRole === 'professor' && selectedHelpRequest.professor === userName)) && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedHelpRequest.status === 'Pendente' && canEdit && (
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={async () => {
                        await handleUpdateHelpStatus(selectedHelpRequest.id, 'Resolvido', techComment);
                        setIsHelpDetailsModalOpen(false);
                      }}
                      style={{ backgroundColor: 'var(--color-success)', color: 'white', border: 'none' }}
                    >
                      Marcar como Resolvido
                    </button>
                  )}
                  {(userRole === 'gestao' || (userRole === 'professor' && selectedHelpRequest.professor === userName)) && (
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={async () => {
                        const deleted = await handleDeleteHelpRequest(selectedHelpRequest.id);
                        if (deleted) setIsHelpDetailsModalOpen(false);
                      }}
                      style={{ backgroundColor: 'var(--color-danger)', color: 'white', border: 'none' }}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXIBIR QR CODE DO EQUIPAMENTO ── */}
      {isQrModalOpen && qrDevice && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsQrModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} color="var(--color-primary)" /> QR Code do Equipamento
              </h3>
              <button className="btn-icon" onClick={() => setIsQrModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-scroll" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ 
                  background: '#fff', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-md)', 
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-light)',
                  display: 'inline-block'
                }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      window.location.origin + window.location.pathname + '?search=' + qrDevice.id
                    )}`} 
                    alt="QR Code" 
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>
                
                <div style={{ width: '100%' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>{qrDevice.tipo}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span><b>ID Único:</b> <span style={{ fontFamily: 'monospace' }}>{qrDevice.id}</span></span>
                    {qrDevice.numero_escola && <span><b>Patrimônio:</b> {qrDevice.numero_escola}</span>}
                    {qrDevice.numero_serie && <span><b>Nº Série:</b> {qrDevice.numero_serie}</span>}
                    <span><b>Local:</b> {roomNameMap[qrDevice.sala_id] || 'Sem sala'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setIsQrModalOpen(false)}>
                Fechar
              </button>
              <button className="btn btn-primary" onClick={() => handlePrintQrCode(qrDevice)}>
                Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR EMPRÉSTIMO / DEVOLUÇÃO ── */}
      {isLoanModalOpen && loanDevice && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsLoanModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={20} color="var(--color-primary)" /> 
                {loanDevice.emprestado ? 'Registrar Devolução' : 'Registrar Empréstimo'}
              </h3>
              <button className="btn-icon" onClick={() => setIsLoanModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            {!loanDevice.emprestado ? (
              // Form de Empréstimo
              <form onSubmit={handleBorrowDevice}>
                <div className="modal-body-scroll">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{loanDevice.tipo}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Patrimônio: {loanDevice.numero_escola || 'N/D'} • Local: {roomNameMap[loanDevice.sala_id] || 'Sem sala'}
                      </span>
                    </div>

                    <div className="form-input-group">
                      <label>Professor(a) que está retirando <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <select
                        value={loanProfessor}
                        onChange={(e) => setLoanProfessor(e.target.value)}
                        className="form-select-input"
                        required
                      >
                        <option value="">Selecione o(a) Professor(a)...</option>
                        {professores.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-input-group">
                      <label>Data de Retirada <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input 
                        type="date" 
                        value={loanDate}
                        onChange={(e) => setLoanDate(e.target.value)}
                        className="form-text-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsLoanModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ backgroundColor: 'var(--color-primary)', opacity: isSubmitting ? 0.6 : 1 }}>
                    {isSubmitting ? 'Processando...' : 'Confirmar Empréstimo'}
                  </button>
                </div>
              </form>
            ) : (
              // Form de Devolução
              <div>
                <div className="modal-body-scroll">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{loanDevice.tipo}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Patrimônio: {loanDevice.numero_escola || 'N/D'} • Local: {roomNameMap[loanDevice.sala_id] || 'Sem sala'}
                      </span>
                    </div>

                    <div style={{ background: '#fff9e6', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #ffeeba', color: '#856404' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Este equipamento já está emprestado:</p>
                      <div style={{ fontSize: '0.9rem' }}>
                        <div><b>Emprestado para:</b> {loanDevice.professor_emprestimo}</div>
                        <div><b>Data de retirada:</b> {loanDevice.data_emprestimo ? new Date(loanDevice.data_emprestimo).toLocaleDateString('pt-BR') : 'N/D'}</div>
                      </div>
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Confirmar que o equipamento foi devolvido para a escola? O status será alterado para <b>Disponível</b>.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsLoanModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleReturnDevice} disabled={isSubmitting} style={{ backgroundColor: 'var(--color-success)', color: 'white', border: 'none', opacity: isSubmitting ? 0.6 : 1 }}>
                    {isSubmitting ? 'Processando...' : 'Confirmar Devolução'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── MODAL: DEVOLUÇÃO EM LOTE ── */}
      {isBatchReturnModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeBatchReturnModal(); }}>
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} color="#ff9800" /> Devolução em Lote
              </h3>
              <button className="btn-icon" onClick={closeBatchReturnModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Escaneie ou digite os códigos/patrimônios dos dispositivos emprestados. Eles serão adicionados à fila e devolvidos de uma só vez.
                </p>

                <form onSubmit={handleBatchInputSubmit}>
                  <div className="form-input-group">
                    <label>Escanear QR Code ou Digitar Patrimônio / ID</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={batchReturnInput}
                        onChange={(e) => setBatchReturnInput(e.target.value)}
                        placeholder="Clique aqui e escaneie ou digite..."
                        className="form-text-input"
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-primary)', margin: 0 }}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                </form>

                {/* Área da Câmera */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {!isCameraActive ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={startCamera}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto', width: '100%', border: '1px solid #ff9800', color: '#ff9800', background: 'transparent' }}
                    >
                      <Camera size={16} /> Abrir Leitor de Câmera (QR Code)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={stopCamera}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto', width: '100%', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'transparent' }}
                    >
                      <X size={16} /> Parar Câmera
                    </button>
                  )}

                  {isCameraActive && (
                    <div 
                      id="qr-reader" 
                      style={{ 
                        width: '100%', 
                        maxWidth: '350px', 
                        margin: '0.5rem auto', 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden', 
                        border: '2px solid #ff9800',
                        background: '#000'
                      }}
                    />
                  )}
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                    Fila de Devolução ({batchReturnList.length})
                  </h4>

                  {batchReturnList.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem 1rem', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px dashed var(--border-light)', 
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      Nenhum equipamento na fila. Comece a escanear!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {batchReturnList.map(dev => (
                        <div 
                          key={dev.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.6rem 1rem',
                            background: '#fff',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>{dev.tipo}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Patrimônio: {dev.numero_escola || 'N/D'} • Retirado por: {dev.professor_emprestimo}
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="btn-icon delete" 
                            onClick={() => {
                              scannedIdsRef.current.delete(dev.id);
                              setBatchReturnList(prev => prev.filter(item => item.id !== dev.id));
                            }}
                            title="Remover da fila"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeBatchReturnModal}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handleConfirmBatchReturn} 
                disabled={batchReturnList.length === 0 || isSubmitting}
                style={{ backgroundColor: 'var(--color-success)', color: 'white', border: 'none', opacity: (batchReturnList.length === 0 || isSubmitting) ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Processando...' : `Devolver todos (${batchReturnList.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
