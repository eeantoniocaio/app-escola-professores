import { useState, useEffect, useCallback } from 'react';
import { useMicrosoftAuth } from '../app/providers/MicrosoftAuthProvider';
import { useToast } from '../app/providers/ToastProvider';
import { 
  findCarometroFolder, 
  findClassSubfolder, 
  buildPhotosMap 
} from '../services/photoService';

export default function useCarometro(activeClassName) {
  const { accessToken, loginMicrosoft } = useMicrosoftAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photosMap, setPhotosMap] = useState({});

  const loadPhotos = useCallback(async (forceRefresh = false) => {
    if (!accessToken) {
      setPhotosMap({});
      setLoading(false);
      return;
    }

    if (!activeClassName) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Resolver pasta raiz do "Carômetro" (tenta ler do cache do localStorage primeiro)
      let carometroFolderId = localStorage.getItem('carometro_root_folder_id');
      let driveId = localStorage.getItem('carometro_root_drive_id') || 'me';

      if (!carometroFolderId || forceRefresh) {
        const preferredDriveId = localStorage.getItem('selected_frequencia_drive_id') || 'me';
        const rootFolder = await findCarometroFolder(accessToken, preferredDriveId);
        if (rootFolder) {
          carometroFolderId = rootFolder.id;
          driveId = rootFolder.driveId;
          localStorage.setItem('carometro_root_folder_id', carometroFolderId);
          localStorage.setItem('carometro_root_drive_id', driveId);
        } else {
          setError('Pasta "Carômetro" não encontrada no seu OneDrive.');
          setLoading(false);
          return;
        }
      }

      // 2. Localizar subpasta correspondente à turma ativa
      const subfolderCacheKey = `carometro_subfolder_${carometroFolderId}_${activeClassName}`;
      let classFolderId = sessionStorage.getItem(subfolderCacheKey);

      if (!classFolderId || forceRefresh) {
        classFolderId = await findClassSubfolder(accessToken, carometroFolderId, driveId, activeClassName);
        if (classFolderId) {
          sessionStorage.setItem(subfolderCacheKey, classFolderId);
        } else {
          setError(`Subpasta da turma "${activeClassName}" não encontrada na pasta "Carômetro".`);
          setLoading(false);
          return;
        }
      }

      // 3. Buscar arquivos da subpasta (se tiver em cache, carrega instantaneamente)
      const photosCacheKey = `carometro_photos_${classFolderId}`;
      const cachedPhotos = sessionStorage.getItem(photosCacheKey);

      if (cachedPhotos && !forceRefresh) {
        try {
          setPhotosMap(JSON.parse(cachedPhotos));
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Erro ao ler cache de fotos do sessionStorage, consultando API...', e);
        }
      }

      // Buscar do Graph API
      const baseUrl = driveId === 'me' 
        ? 'https://graph.microsoft.com/v1.0/me/drive' 
        : `https://graph.microsoft.com/v1.0/drives/${driveId}`;

      const fetchUrl = `${baseUrl}/items/${classFolderId}/children`;
      console.log(`[useCarometro] Buscando fotos da turma "${activeClassName}" em:`, fetchUrl);

      const response = await fetch(
        fetchUrl,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      console.log('[useCarometro] Resposta da API:', data);

      if (data && data.value) {
        console.log(`[useCarometro] Encontrados ${data.value.length} arquivos na pasta.`);
        if (data.value.length > 0) {
          console.log('[useCarometro] Exemplo do primeiro arquivo retornado:', {
            name: data.value[0].name,
            id: data.value[0].id,
            hasDownloadUrl: !!data.value[0]['@microsoft.graph.downloadUrl'],
            downloadUrlPreview: data.value[0]['@microsoft.graph.downloadUrl'] ? data.value[0]['@microsoft.graph.downloadUrl'].substring(0, 60) + '...' : 'null',
            keys: Object.keys(data.value[0])
          });
        }
        
        const mapped = buildPhotosMap(data.value);
        console.log('[useCarometro] Mapa de fotos gerado:', mapped);
        
        setPhotosMap(mapped);
        sessionStorage.setItem(photosCacheKey, JSON.stringify(mapped));
      } else {
        setError('Não foi possível obter os arquivos da pasta da turma.');
      }
    } catch (err) {
      console.error('Erro ao processar carômetro:', err);
      setError('Erro ao carregar fotos do Carômetro.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeClassName]);

  // Efeito para carregar as fotos automaticamente ao mudar de turma
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleRefresh = () => {
    showToast('Limpando cache de fotos e recarregando...', 'info');
    loadPhotos(true);
  };

  return {
    loading,
    error,
    photosMap,
    handleRefresh,
    needsAuth: !accessToken,
    loginMicrosoft
  };
}
