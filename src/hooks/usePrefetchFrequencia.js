import { useEffect, useState } from 'react';
import { useGoogleAuth } from '../app/providers/GoogleAuthProvider';
import logger from '../shared/utils/logger';
import { getCachedData, setCachedData, getOrFetch } from '../shared/utils/sheetsCache';

const DEFAULT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1w6bPGoUUfCMoNpFYUKur4BrbvkCVr_5uAHi3ZwRh3NA/edit?usp=sharing";

const getSpreadsheetIdFromUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
};

const normalizeTurmaForMatching = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/º/g, '')
    .replace(/ª/g, '')
    .replace(/\s+/g, '')
    .trim();
};

export default function usePrefetchFrequencia(activeClassName) {
  const { accessToken } = useGoogleAuth();
  const [prefetching, setPrefetching] = useState(false);

  useEffect(() => {
    if (!accessToken || !activeClassName) return;

    let isMounted = true;
    const controller = new AbortController();

    const prefetch = async () => {
      setPrefetching(true);
      try {
        // 1. Obter ou resolver o file ID
        let fileId = localStorage.getItem('selected_frequencia_file_id');

        if (!fileId) {
          // Resolver planilha padrão
          const resolvedId = getSpreadsheetIdFromUrl(DEFAULT_SPREADSHEET_URL);
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${resolvedId}?fields=properties.title,sheets.properties(title,sheetId)`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: controller.signal
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.properties) {
              fileId = resolvedId;
              localStorage.setItem('selected_frequencia_file_id', fileId);
              localStorage.setItem('selected_frequencia_file_name', data.properties.title || 'Planilha de Frequência');
              
              const mappedSheets = data.sheets?.map(sheet => ({
                id: sheet.properties.sheetId,
                name: sheet.properties.title
              })) || [];
              setCachedData(`google_worksheets_${fileId}`, mappedSheets);
            }
          }
        }

        if (!fileId || !isMounted) return;

        // 2. Buscar abas (se não estiver em cache)
        const worksheetsCacheKey = `google_worksheets_${fileId}`;
        let worksheets = getCachedData(worksheetsCacheKey);

        if (!worksheets) {
          try {
            worksheets = await getOrFetch(worksheetsCacheKey, async () => {
              const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties(title,sheetId)`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  signal: controller.signal
                }
              );
              if (!response.ok) throw new Error('Falha ao obter metadados da planilha.');
              const data = await response.json();
              if (data && data.sheets) {
                const mapped = data.sheets.map(sheet => ({
                  id: sheet.properties.sheetId,
                  name: sheet.properties.title
                }));
                setCachedData(worksheetsCacheKey, mapped);
                return mapped;
              }
              throw new Error('Nenhuma aba encontrada.');
            });
          } catch (err) {
            if (err.name !== 'AbortError') {
              logger.error('[Prefetch] Erro ao carregar abas da planilha:', err);
            }
          }
        }

        if (!worksheets || !isMounted) return;

        // 3. Encontrar a aba correspondente à turma ativa
        const targetTurma = normalizeTurmaForMatching(activeClassName);
        const matchingSheet = worksheets.find(sheet => {
          const sheetName = normalizeTurmaForMatching(sheet.name);
          return sheetName.includes(targetTurma) || targetTurma.includes(sheetName);
        });

        if (!matchingSheet || !isMounted) return;

        const sheetName = matchingSheet.name;
        const sheetCacheKey = `google_sheet_${fileId}_${sheetName}`;
        const cachedSheetData = getCachedData(sheetCacheKey);

        // 4. Buscar dados da aba (se não estiver em cache)
        if (!cachedSheetData) {
          logger.log(`[Prefetch] Carregando dados da aba "${sheetName}" do Google Sheets em segundo plano...`);
          try {
            await getOrFetch(sheetCacheKey, async () => {
              const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${encodeURIComponent(sheetName)}?valueRenderOption=FORMATTED_VALUE`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  signal: controller.signal
                }
              );
              if (!response.ok) throw new Error('Falha ao buscar dados da aba.');
              const data = await response.json();
              if (data && data.values) {
                setCachedData(sheetCacheKey, data.values);
                logger.log(`[Prefetch] Aba "${sheetName}" carregada com sucesso e salva em cache.`);
                return data.values;
              }
              throw new Error('Dados da aba vazios.');
            });
          } catch (fetchErr) {
            if (fetchErr.name !== 'AbortError') {
              logger.error(`[Prefetch] Erro ao buscar dados da aba ${sheetName}:`, fetchErr);
            }
          }
        } else {
          logger.log(`[Prefetch] Aba "${sheetName}" já está no cache.`);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          logger.error('[Prefetch] Erro na pré-busca de dados:', err);
        }
      } finally {
        if (isMounted) {
          setPrefetching(false);
        }
      }
    };

    prefetch();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [accessToken, activeClassName]);

  return { prefetching };
}
