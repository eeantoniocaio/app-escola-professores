/**
 * Normaliza uma string de pasta ou arquivo para comparação tolerante
 */
export function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/º/g, '')
    .replace(/ª/g, '')
    .replace(/[\s\.\-_]+/g, '') // remove espaços, pontos, traços, underlines
    .trim();
}

/**
 * Normaliza o nome do aluno (mantendo espaços, mas removendo acentos e extensão do arquivo)
 */
export function normalizeStudentName(name) {
  if (!name) return '';
  // Remove extensão de arquivo (ex: .jpg, .png)
  const nameWithoutExt = name.replace(/\.[^/.]+$/, "");
  return nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Varre o OneDrive para encontrar a pasta raiz do Carômetro
 */
export async function findCarometroFolder(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  
  // 1. Tentar busca direta pela API Search
  try {
    const searchTerms = ['Carometro', 'Carômetro'];
    for (const term of searchTerms) {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${encodeURIComponent(term)}')?$select=name,id,folder,parentReference`,
        { headers }
      );
      const data = await response.json();
      if (data && data.value) {
        // Encontra qualquer item que seja pasta e tenha nome normalizado carometro
        const found = data.value.find(item => {
          const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
          return isFolder && normalizeName(item.name) === 'carometro';
        });
        if (found) {
          console.log('[photoService] Encontrado Carômetro via search API:', found.name);
          return { id: found.id, driveId: found.parentReference?.driveId || 'me' };
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao pesquisar pasta Carômetro via search:', err);
  }

  // 2. Fallback: Listar diretório raiz e buscar no primeiro nível de subpastas
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/children?$select=name,id,folder,parentReference`,
      { headers }
    );
    const data = await response.json();
    if (data && data.value) {
      // 2a. Buscar diretamente no raiz
      const foundInRoot = data.value.find(item => {
        const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
        return isFolder && normalizeName(item.name) === 'carometro';
      });
      if (foundInRoot) {
        console.log('[photoService] Encontrado Carômetro no raiz:', foundInRoot.name);
        return { id: foundInRoot.id, driveId: foundInRoot.parentReference?.driveId || 'me' };
      }

      // 2b. Buscar dentro de pastas no raiz (como "2026", "Documentos")
      const rootFolders = data.value.filter(item => {
        const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
        return isFolder;
      });

      // Ordenar para verificar primeiro pastas que parecem anos (ex: 2026) ou "documents"
      rootFolders.sort((a, b) => {
        const aIsYear = /^\d{4}$/.test(a.name);
        const bIsYear = /^\d{4}$/.test(b.name);
        if (aIsYear && !bIsYear) return -1;
        if (!aIsYear && bIsYear) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log('[photoService] Varrendo subpastas do raiz:', rootFolders.map(f => f.name));

      // Limita a busca a no máximo 10 pastas do raiz para evitar overhead excessivo
      const foldersToSearch = rootFolders.slice(0, 10);
      const searchPromises = foldersToSearch.map(async (folder) => {
        try {
          const subRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${folder.id}/children?$select=name,id,folder,parentReference`,
            { headers }
          );
          const subData = await subRes.json();
          if (subData && subData.value) {
            const found = subData.value.find(item => {
              const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
              return isFolder && normalizeName(item.name) === 'carometro';
            });
            if (found) return found;
          }
        } catch (subErr) {
          console.warn(`Erro ao listar filhos da pasta ${folder.name}:`, subErr);
        }
        return null;
      });

      const results = await Promise.all(searchPromises);
      const foundInSubfolder = results.find(item => item !== null);
      if (foundInSubfolder) {
        console.log('[photoService] Encontrado Carômetro dentro da pasta:', foundInSubfolder.name);
        return { id: foundInSubfolder.id, driveId: foundInSubfolder.parentReference?.driveId || 'me' };
      }
    }
  } catch (err) {
    console.error('Erro no fallback de busca da pasta do Carômetro:', err);
  }

  return null;
}

/**
 * Encontra a subpasta da turma dentro da pasta Carômetro
 */
export async function findClassSubfolder(accessToken, carometroFolderId, driveId, className) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const targetNorm = normalizeName(className);

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${carometroFolderId}/children?$select=name,id,folder`,
      { headers }
    );
    const data = await response.json();
    if (data && data.value) {
      // Procurar pasta que combine com a turma normalizada
      const found = data.value.find(item => {
        if (!item.folder) return false;
        const folderNorm = normalizeName(item.name);
        return folderNorm.includes(targetNorm) || targetNorm.includes(folderNorm);
      });
      if (found) return found.id;
    }
  } catch (err) {
    console.error(`Erro ao buscar subpasta da turma ${className}:`, err);
  }
  return null;
}

/**
 * Constrói o mapa de fotos vinculando os nomes normalizados às URLs temporárias do OneDrive
 */
export function buildPhotosMap(files) {
  const map = {};
  if (!files) return map;

  files.forEach(file => {
    // Apenas arquivos de imagem comuns
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    const downloadUrl = file['@microsoft.graph.downloadUrl'];

    if (isImage && downloadUrl) {
      const normName = normalizeStudentName(file.name);
      map[normName] = downloadUrl;
    }
  });

  return map;
}
