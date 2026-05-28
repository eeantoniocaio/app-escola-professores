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
        const found = data.value.find(item => item.folder && normalizeName(item.name) === 'carometro');
        if (found) {
          return { id: found.id, driveId: found.parentReference?.driveId || 'me' };
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao pesquisar pasta Carômetro via search:', err);
  }

  // 2. Fallback: Listar diretório raiz
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/children?$select=name,id,folder,parentReference`,
      { headers }
    );
    const data = await response.json();
    if (data && data.value) {
      const found = data.value.find(item => item.folder && normalizeName(item.name) === 'carometro');
      if (found) {
        return { id: found.id, driveId: found.parentReference?.driveId || 'me' };
      }
    }
  } catch (err) {
    console.error('Erro ao listar raiz do OneDrive:', err);
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
