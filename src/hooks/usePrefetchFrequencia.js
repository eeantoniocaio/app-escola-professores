import { useEffect, useState } from 'react';
import { useMicrosoftAuth } from '../app/providers/MicrosoftAuthProvider';

const DEFAULT_SPREADSHEET_URL = "https://1drv.ms/x/c/302ec50fbf74a18d/IQCCbssSwqdKSpwHH1junCEDAevG2GvY97aCI3Kh4V4eGmY?e=IpMZWm";

const normalizeTurmaForMatching = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/º/g, '')
    .replace(/ª/g, '')
    .replace(/\s+/g, '')
    .trim();
};

export default function usePrefetchFrequencia(activeClassName) {
  const { accessToken } = useMicrosoftAuth();
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
        let driveId = localStorage.getItem('selected_frequencia_drive_id') || 'me';

        if (!fileId) {
          // Resolver planilha padrão
          const base64Value = btoa(DEFAULT_SPREADSHEET_URL);
          const sharingToken = "u!" + base64Value
            .replace(/=/g, '')
            .replace(/\//g, '-')
            .replace(/\+/g, '_');
          
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/shares/${sharingToken}/driveItem`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: controller.signal
            }
          );
          const data = await response.json();
          if (data && data.id) {
            fileId = data.id;
            driveId = data.parentReference?.driveId || 'me';
            
            // Salvar no localStorage para evitar resoluções futuras
            localStorage.setItem('selected_frequencia_file_id', fileId);
            localStorage.setItem('selected_frequencia_drive_id', driveId);
            if (data.name) {
              localStorage.setItem('selected_frequencia_file_name', data.name);
            }
          }
        }

        if (!fileId || !isMounted) return;

        // 2. Buscar abas (se não estiver em cache)
        const worksheetsCacheKey = `ms_worksheets_${fileId}`;
        let worksheets = null;
        const cachedWorksheets = sessionStorage.getItem(worksheetsCacheKey);

        if (cachedWorksheets) {
          try {
            worksheets = JSON.parse(cachedWorksheets);
          } catch (e) {
            console.warn('Erro ao ler cache de abas', e);
          }
        }

        if (!worksheets) {
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets?$select=name,id`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: controller.signal
            }
          );
          const data = await response.json();
          if (data && data.value) {
            worksheets = data.value;
            sessionStorage.setItem(worksheetsCacheKey, JSON.stringify(worksheets));
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
        const sheetCacheKey = `ms_sheet_${fileId}_${sheetName}`;
        const cachedSheetData = sessionStorage.getItem(sheetCacheKey);

        // 4. Buscar dados da aba (se não estiver em cache)
        if (!cachedSheetData) {
          console.log(`[Prefetch] Carregando dados da aba "${sheetName}" em segundo plano...`);
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/${encodeURIComponent(sheetName)}/usedRange(valuesOnly=true)?$select=values`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: controller.signal
            }
          );
          const data = await response.json();
          if (data && data.values && isMounted) {
            sessionStorage.setItem(sheetCacheKey, JSON.stringify(data.values));
            console.log(`[Prefetch] Aba "${sheetName}" carregada com sucesso e salva em cache.`);
          }
        } else {
          console.log(`[Prefetch] Aba "${sheetName}" já está no cache.`);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[Prefetch] Erro na pré-busca de dados:', err);
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
