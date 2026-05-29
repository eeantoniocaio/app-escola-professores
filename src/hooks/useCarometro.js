import { useState, useEffect, useCallback } from 'react';
import { useGoogleAuth } from '../app/providers/GoogleAuthProvider';
import { useToast } from '../app/providers/ToastProvider';
import { 
  findCarometroFolder, 
  findClassSubfolder, 
  fetchFilesInFolder,
  downloadFileAsBlobUrl,
  buildPhotosMap 
} from '../services/photoService';

export default function useCarometro(activeClassName) {
  const { accessToken, loginGoogle } = useGoogleAuth();
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

      if (!carometroFolderId || forceRefresh) {
        const rootFolder = await findCarometroFolder(accessToken);
        if (rootFolder) {
          carometroFolderId = rootFolder.id;
          localStorage.setItem('carometro_root_folder_id', carometroFolderId);
        } else {
          setError('Pasta "Carômetro" não encontrada no seu Google Drive.');
          setLoading(false);
          return;
        }
      }

      // 2. Localizar subpasta correspondente à turma ativa
      const subfolderCacheKey = `carometro_subfolder_${carometroFolderId}_${activeClassName}`;
      let classFolderId = sessionStorage.getItem(subfolderCacheKey);

      if (!classFolderId || forceRefresh) {
        classFolderId = await findClassSubfolder(accessToken, carometroFolderId, activeClassName);
        if (classFolderId) {
          sessionStorage.setItem(subfolderCacheKey, classFolderId);
        } else {
          setError(`Subpasta da turma "${activeClassName}" não encontrada na pasta "Carômetro".`);
          setLoading(false);
          return;
        }
      }

      // 3. Buscar metadados de arquivos na subpasta (se tiver em cache, carrega instantaneamente)
      const photosCacheKey = `carometro_files_${classFolderId}`;
      const cachedPhotos = sessionStorage.getItem(photosCacheKey);
      let rawMap = {};

      if (cachedPhotos && !forceRefresh) {
        try {
          rawMap = JSON.parse(cachedPhotos);
        } catch (e) {
          console.warn('Erro ao ler cache de fotos do sessionStorage, consultando API...', e);
        }
      }

      if (Object.keys(rawMap).length === 0 || forceRefresh) {
        console.log(`[useCarometro] Buscando fotos da turma "${activeClassName}" no GDrive...`);
        const files = await fetchFilesInFolder(accessToken, classFolderId);
        rawMap = buildPhotosMap(files);
        sessionStorage.setItem(photosCacheKey, JSON.stringify(rawMap));
      }

      // 4. Baixar arquivos de imagem em paralelo e converter para Blob URLs locais
      const keys = Object.keys(rawMap);
      const downloadPromises = keys.map(async (key) => {
        const fileId = rawMap[key];
        const blobUrl = await downloadFileAsBlobUrl(accessToken, fileId);
        return { key, blobUrl };
      });

      const results = await Promise.all(downloadPromises);
      const finalMap = {};
      results.forEach(({ key, blobUrl }) => {
        if (blobUrl) {
          finalMap[key] = blobUrl;
        }
      });

      setPhotosMap(finalMap);
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
    showToast('Limpando cache de fotos e recarregando do Google Drive...', 'info');
    loadPhotos(true);
  };

  return {
    loading,
    error,
    photosMap,
    handleRefresh,
    needsAuth: !accessToken,
    loginMicrosoft: loginGoogle // mantém a assinatura para simplificar compatibilidade no Turmas.jsx
  };
}
