import { useState, useEffect } from 'react';
import { useGoogleAuth } from '../app/providers/GoogleAuthProvider';
import { useToast } from '../app/providers/ToastProvider';
import { getAlunoFrequencia } from '../services/excelService';

const DEFAULT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit";

const getSpreadsheetIdFromUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
};

export default function useFrequenciaAluno(aluno, isOpen) {
  const { getGoogleToken, accessToken, googleAccount } = useGoogleAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(() => localStorage.getItem('selected_frequencia_file_id') || '');
  const [selectedFileName, setSelectedFileName] = useState(() => localStorage.getItem('selected_frequencia_file_name') || '');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const [useDefaultFile, setUseDefaultFile] = useState(() => !localStorage.getItem('selected_frequencia_file_id'));

  // Obter token ao abrir o modal
  useEffect(() => {
    if (isOpen && !accessToken) {
      getGoogleToken();
    }
  }, [isOpen, accessToken]);

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

  // Helper para normalizar nome de turma para comparação
  const normalizeTurmaForMatching = (name) => {
    if (!name) return '';
    return name.toLowerCase()
      .replace(/º/g, '')
      .replace(/ª/g, '')
      .replace(/\s+/g, '')
      .trim();
  };

  // Helper para selecionar aba e buscar os dados correspondentes
  const selectAndFetchSheetData = (fileId, worksheetsList) => {
    const targetTurma = normalizeTurmaForMatching(aluno.turma);
    const matchingSheet = worksheetsList.find(sheet => {
      const sheetName = normalizeTurmaForMatching(sheet.name);
      return sheetName.includes(targetTurma) || targetTurma.includes(sheetName);
    });

    if (matchingSheet) {
      setSelectedSheetName(matchingSheet.name);
      fetchWorksheetData(fileId, matchingSheet.name);
    } else if (worksheetsList.length > 0) {
      setSelectedSheetName(worksheetsList[0].name);
      fetchWorksheetData(fileId, worksheetsList[0].name);
    }
  };

  // 0. Resolver a planilha padrão a partir do link do Google Sheets
  const resolveDefaultSpreadsheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileId = getSpreadsheetIdFromUrl(DEFAULT_SPREADSHEET_URL);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=properties.title,sheets.properties(title,sheetId)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar planilha padrão: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.properties) {
        const fileName = data.properties.title || 'Planilha de Frequência';

        setSelectedFileId(fileId);
        setSelectedFileName(fileName);

        localStorage.setItem('selected_frequencia_file_id', fileId);
        localStorage.setItem('selected_frequencia_file_name', fileName);

        const mappedSheets = data.sheets?.map(sheet => ({
          id: sheet.properties.sheetId,
          name: sheet.properties.title
        })) || [];

        setWorksheets(mappedSheets);
        sessionStorage.setItem(`google_worksheets_${fileId}`, JSON.stringify(mappedSheets));

        selectAndFetchSheetData(fileId, mappedSheets);
      } else {
        console.warn('Erro ao resolver planilha padrão, listando arquivos...');
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

  // 1. Listar arquivos do Google Drive
  const fetchExcelFiles = async () => {
    setIsSearchingFiles(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)&orderBy=name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!response.ok) throw new Error('Falha ao listar planilhas do Google Drive.');
      const data = await response.json();
      if (data && data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Erro ao buscar arquivos no Google Drive:', err);
      setError('Erro ao carregar arquivos do Google Drive.');
    } finally {
      setIsSearchingFiles(false);
    }
  };

  // 2. Buscar abas (Worksheets)
  const fetchWorksheets = async (fileId) => {
    setLoading(true);
    setError(null);

    // Otimização: Tentar carregar a lista de abas do cache do sessionStorage
    const cacheKey = `google_worksheets_${fileId}`;
    const cachedWorksheets = sessionStorage.getItem(cacheKey);
    if (cachedWorksheets) {
      try {
        const parsedSheets = JSON.parse(cachedWorksheets);
        setWorksheets(parsedSheets);
        selectAndFetchSheetData(fileId, parsedSheets);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Falha ao ler cache de abas do sessionStorage, consultando API...', e);
      }
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties(title,sheetId)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!response.ok) throw new Error('Falha ao obter metadados da planilha.');
      const data = await response.json();
      if (data && data.sheets) {
        const mappedSheets = data.sheets.map(sheet => ({
          id: sheet.properties.sheetId,
          name: sheet.properties.title
        }));
        setWorksheets(mappedSheets);
        // Salvar abas no cache
        sessionStorage.setItem(cacheKey, JSON.stringify(mappedSheets));
        selectAndFetchSheetData(fileId, mappedSheets);
      }
    } catch (err) {
      console.error('Erro ao carregar abas da planilha:', err);
      setError('Erro ao carregar abas da planilha.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Buscar dados da aba selecionada
  const fetchWorksheetData = async (fileId, sheetName) => {
    setLoading(true);
    setError(null);
    setAttendanceData(null);

    // Otimização: Tentar carregar os dados desta aba do cache do sessionStorage
    const cacheKey = `google_sheet_${fileId}_${sheetName}`;
    const cachedSheetData = sessionStorage.getItem(cacheKey);
    if (cachedSheetData) {
      try {
        const parsedValues = JSON.parse(cachedSheetData);
        const parsedResult = getAlunoFrequencia(parsedValues, aluno.nome, sheetName);
        if (parsedResult.error) {
          setError(parsedResult.error);
        } else {
          setAttendanceData(parsedResult);
        }
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Falha ao ler cache de células da aba, consultando API...', e);
      }
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${encodeURIComponent(sheetName)}?valueRenderOption=FORMATTED_VALUE`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!response.ok) throw new Error('Falha ao buscar dados da aba.');
      const data = await response.json();
      if (data && data.values) {
        // Salvar valores no cache
        sessionStorage.setItem(cacheKey, JSON.stringify(data.values));
        
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
    setSelectedFileName(file.name);
    setUseDefaultFile(false);
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
    setError(null);
    setUseDefaultFile(false);
    localStorage.removeItem('selected_frequencia_file_id');
    localStorage.removeItem('selected_frequencia_file_name');
    fetchExcelFiles();
  };

  const handleSheetChange = (sheetName) => {
    setSelectedSheetName(sheetName);
    fetchWorksheetData(selectedFileId, sheetName);
  };

  // Função para invalidar os caches locais e recarregar os dados da planilha em tempo real
  const handleRefresh = () => {
    if (selectedFileId) {
      setLoading(true);
      setError(null);
      
      // Limpar cache de abas
      sessionStorage.removeItem(`google_worksheets_${selectedFileId}`);
      
      // Limpar cache de todas as abas carregadas
      worksheets.forEach(sheet => {
        sessionStorage.removeItem(`google_sheet_${selectedFileId}_${sheet.name}`);
      });
      
      showToast('Limpando cache e recarregando do Google Sheets...', 'info');
      fetchWorksheets(selectedFileId);
    }
  };

  return {
    loading,
    error,
    files,
    selectedFileId,
    selectedFileName,
    worksheets,
    selectedSheetName,
    attendanceData,
    isSearchingFiles,
    useDefaultFile,
    fetchExcelFiles,
    handleSelectFile,
    handleResetFile,
    handleSheetChange,
    handleRefresh
  };
}
