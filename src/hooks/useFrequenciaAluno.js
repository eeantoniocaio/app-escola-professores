import { useState, useEffect } from 'react';
import { useMicrosoftAuth } from '../app/providers/MicrosoftAuthProvider';
import { useToast } from '../app/providers/ToastProvider';
import { getAlunoFrequencia } from '../services/excelService';

const DEFAULT_SPREADSHEET_URL = "https://1drv.ms/x/c/302ec50fbf74a18d/IQCCbssSwqdKSpwHH1junCEDAevG2GvY97aCI3Kh4V4eGmY?e=IpMZWm";

export default function useFrequenciaAluno(aluno, isOpen) {
  const { getMicrosoftToken, accessToken, msAccount } = useMicrosoftAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(() => localStorage.getItem('selected_frequencia_file_id') || '');
  const [driveId, setDriveId] = useState(() => localStorage.getItem('selected_frequencia_drive_id') || '');
  const [selectedFileName, setSelectedFileName] = useState(() => localStorage.getItem('selected_frequencia_file_name') || '');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const [useDefaultFile, setUseDefaultFile] = useState(() => !localStorage.getItem('selected_frequencia_file_id'));

  // Obter token silencioso ao abrir o modal
  useEffect(() => {
    if (isOpen && msAccount && !accessToken) {
      getMicrosoftToken();
    }
  }, [isOpen, msAccount, accessToken]);

  // Efeito principal: se tiver token de acesso, buscar dados
  useEffect(() => {
    if (accessToken && isOpen && aluno) {
      if (selectedFileId) {
        fetchWorksheets(selectedFileId);
      } else if (useDefaultFile) {
        resolveDefaultSpreadsheet();
      } else {
        fetchExcelFiles();
      }
    }
  }, [accessToken, selectedFileId, useDefaultFile, isOpen, aluno]);

  // 0. Resolver a planilha padrão a partir do link de compartilhamento
  const resolveDefaultSpreadsheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const base64Value = btoa(DEFAULT_SPREADSHEET_URL);
      const sharingToken = "u!" + base64Value
        .replace(/=/g, '')
        .replace(/\//g, '-')
        .replace(/\+/g, '_');
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/shares/${sharingToken}/driveItem`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      
      if (data && data.id) {
        const fileId = data.id;
        const resolvedDriveId = data.parentReference?.driveId || 'me';
        const fileName = data.name || 'Planilha de Frequência';

        setSelectedFileId(fileId);
        setDriveId(resolvedDriveId);
        setSelectedFileName(fileName);

        localStorage.setItem('selected_frequencia_file_id', fileId);
        localStorage.setItem('selected_frequencia_drive_id', resolvedDriveId);
        localStorage.setItem('selected_frequencia_file_name', fileName);

        fetchWorksheets(fileId, resolvedDriveId);
      } else {
        console.warn('Erro ao resolver planilha padrão, listando arquivos...', data);
        setUseDefaultFile(false);
        fetchExcelFiles();
      }
    } catch (err) {
      console.error('Erro ao resolver planilha padrão:', err);
      setUseDefaultFile(false);
      fetchExcelFiles();
    } finally {
      setLoading(false);
    }
  };

  // 1. Listar arquivos do OneDrive
  const fetchExcelFiles = async () => {
    setIsSearchingFiles(true);
    setError(null);
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root/search(q='.xlsx')`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.value) {
        const excelFiles = data.value.filter(file => file.file);
        setFiles(excelFiles);
      }
    } catch (err) {
      console.error('Erro ao buscar arquivos no OneDrive:', err);
      setError('Erro ao carregar arquivos do OneDrive.');
    } finally {
      setIsSearchingFiles(false);
    }
  };

  // 2. Buscar abas (Worksheets)
  const fetchWorksheets = async (fileId, targetDriveId = driveId) => {
    setLoading(true);
    setError(null);
    const resolvedDrive = targetDriveId || 'me';
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${resolvedDrive}/items/${fileId}/workbook/worksheets`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.value) {
        setWorksheets(data.value);
        
        // Auto-seleção de aba baseada na turma do aluno
        const turmaName = aluno.turma.toLowerCase().replace(/\s+/g, '');
        const matchingSheet = data.value.find(sheet => {
          const sheetName = sheet.name.toLowerCase().replace(/\s+/g, '');
          return sheetName.includes(turmaName) || turmaName.includes(sheetName);
        });

        if (matchingSheet) {
          setSelectedSheetName(matchingSheet.name);
          fetchWorksheetData(fileId, matchingSheet.name, resolvedDrive);
        } else if (data.value.length > 0) {
          setSelectedSheetName(data.value[0].name);
          fetchWorksheetData(fileId, data.value[0].name, resolvedDrive);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar abas da planilha:', err);
      setError('Erro ao carregar abas da planilha.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Buscar dados da aba selecionada (Used Range)
  const fetchWorksheetData = async (fileId, sheetName, targetDriveId = driveId) => {
    setLoading(true);
    setError(null);
    setAttendanceData(null);
    const resolvedDrive = targetDriveId || 'me';
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${resolvedDrive}/items/${fileId}/workbook/worksheets/${encodeURIComponent(sheetName)}/usedRange`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data && data.values) {
        const parsed = getAlunoFrequencia(data.values, aluno.nome, sheetName);
        if (parsed.error) {
          setError(parsed.error);
        } else {
          setAttendanceData(parsed);
        }
      } else {
        setError('A planilha está vazia ou sem dados válidos.');
      }
    } catch (err) {
      console.error('Erro ao ler conteúdo da planilha:', err);
      setError('Erro ao ler conteúdo da planilha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFileId(file.id);
    const resolvedDriveId = file.parentReference?.driveId || 'me';
    setDriveId(resolvedDriveId);
    setSelectedFileName(file.name);
    setUseDefaultFile(false);
    localStorage.setItem('selected_frequencia_file_id', file.id);
    localStorage.setItem('selected_frequencia_drive_id', resolvedDriveId);
    localStorage.setItem('selected_frequencia_file_name', file.name);
    showToast('Planilha selecionada com sucesso!');
  };

  const handleResetFile = () => {
    setSelectedFileId('');
    setDriveId('');
    setSelectedFileName('');
    setWorksheets([]);
    setSelectedSheetName('');
    setAttendanceData(null);
    setError(null);
    setUseDefaultFile(false);
    localStorage.removeItem('selected_frequencia_file_id');
    localStorage.removeItem('selected_frequencia_drive_id');
    localStorage.removeItem('selected_frequencia_file_name');
    fetchExcelFiles();
  };

  const handleSheetChange = (sheetName) => {
    setSelectedSheetName(sheetName);
    fetchWorksheetData(selectedFileId, sheetName);
  };

  return {
    loading,
    error,
    files,
    selectedFileId,
    driveId,
    selectedFileName,
    worksheets,
    selectedSheetName,
    attendanceData,
    isSearchingFiles,
    useDefaultFile,
    fetchExcelFiles,
    handleSelectFile,
    handleResetFile,
    handleSheetChange
  };
}
