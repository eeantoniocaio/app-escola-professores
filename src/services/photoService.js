/**
 * Normaliza uma string de pasta ou arquivo para comparação de turma (ex: "6º Ano A" -> "6a")
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
 * Normaliza o nome do aluno/arquivo para comparação flexível.
 * Remove múltiplas extensões, números de chamada no início, traços, underlines e acentos.
 */
export function normalizeStudentName(name) {
  if (!name) return '';
  
  // Remove extensões de imagem comuns (inclusive múltiplas extensões consecutivas)
  let nameWithoutExt = name;
  while (/\.(jpg|jpeg|png|webp|gif)$/i.test(nameWithoutExt)) {
    nameWithoutExt = nameWithoutExt.replace(/\.[^/.]+$/, "");
  }
  
  // Remove número de chamada/índice no início se houver (ex: "01 - Aluno", "1. Aluno", "02_Aluno")
  nameWithoutExt = nameWithoutExt.replace(/^\s*\d+\s*[\.\-_]?\s*/, "");
  
  return nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\-_]+/g, ' ') // substitui traços e underlines por espaço para separar nomes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compara o nome de uma pasta no OneDrive com o nome da turma para ver se são correspondentes.
 * Trata variações como "6º Ano A", "6º A", "6A", "6-A", etc.
 */
export function classNamesMatch(folderName, className) {
  if (!folderName || !className) return false;
  
  const folderNorm = normalizeName(folderName);
  const classNorm = normalizeName(className);
  
  if (folderNorm.includes(classNorm) || classNorm.includes(folderNorm)) {
    return true;
  }
  
  // Extração inteligente de número (ano/série) e letra (turma)
  const extractGradeAndClass = (str) => {
    const cleaned = str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    
    const numMatch = cleaned.match(/\d+/);
    if (!numMatch) return null;
    const grade = numMatch[0];
    
    // Remove a palavra "ANO" para evitar conflito com letras
    const cleanedWithoutAno = cleaned.replace(/\bANO\b/g, '');
    
    // Captura a última letra de A-Z
    const letterMatch = cleanedWithoutAno.match(/(?:^|\s|\d|º|ª)([A-Z])(?:\s|$)/) || cleanedWithoutAno.match(/([A-Z])$/);
    const letter = letterMatch ? letterMatch[1] : '';
    
    return { grade, letter };
  };
  
  const folderInfo = extractGradeAndClass(folderName);
  const classInfo = extractGradeAndClass(className);
  
  if (folderInfo && classInfo) {
    return folderInfo.grade === classInfo.grade && folderInfo.letter === classInfo.letter;
  }
  
  return false;
}

/**
 * Retorna a URL base correta do Graph API para um driveId específico
 */
function getBaseUrl(driveId) {
  return driveId === 'me' 
    ? 'https://graph.microsoft.com/v1.0/me/drive' 
    : `https://graph.microsoft.com/v1.0/drives/${driveId}`;
}

/**
 * Procura pela pasta "Carômetro" em um Drive específico
 */
async function findCarometroInDrive(accessToken, driveId) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const baseUrl = getBaseUrl(driveId);
  
  // 1. Tentar busca direta pela API Search
  try {
    const searchTerms = ['Carometro', 'Carômetro'];
    for (const term of searchTerms) {
      const response = await fetch(
        `${baseUrl}/root/search(q='${encodeURIComponent(term)}')?$select=name,id,folder,parentReference`,
        { headers }
      );
      const data = await response.json();
      if (data && data.value) {
        const found = data.value.find(item => {
          const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
          return isFolder && normalizeName(item.name) === 'carometro';
        });
        if (found) {
          console.log(`[photoService] Encontrado Carômetro via search API no drive ${driveId}:`, found.name);
          return { id: found.id, driveId: found.parentReference?.driveId || driveId };
        }
      }
    }
  } catch (err) {
    console.warn(`Erro ao pesquisar pasta Carômetro via search no drive ${driveId}:`, err);
  }

  // 2. Fallback: Listar diretório raiz e buscar no primeiro nível de subpastas
  try {
    const response = await fetch(
      `${baseUrl}/root/children?$select=name,id,folder,parentReference`,
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
        console.log(`[photoService] Encontrado Carômetro no raiz do drive ${driveId}:`, foundInRoot.name);
        return { id: foundInRoot.id, driveId: foundInRoot.parentReference?.driveId || driveId };
      }

      // 2b. Buscar dentro de pastas no raiz (como "2026", "Documentos")
      const rootFolders = data.value.filter(item => {
        const isFolder = item.folder || (item.file === undefined && item.image === undefined && item.package === undefined);
        return isFolder;
      });

      rootFolders.sort((a, b) => {
        const aIsYear = /^\d{4}$/.test(a.name);
        const bIsYear = /^\d{4}$/.test(b.name);
        if (aIsYear && !bIsYear) return -1;
        if (!aIsYear && bIsYear) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log(`[photoService] Varrendo subpastas do raiz no drive ${driveId}:`, rootFolders.map(f => f.name));

      const foldersToSearch = rootFolders.slice(0, 10);
      const searchPromises = foldersToSearch.map(async (folder) => {
        try {
          const subRes = await fetch(
            `${baseUrl}/items/${folder.id}/children?$select=name,id,folder,parentReference`,
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
          console.warn(`Erro ao listar filhos da pasta ${folder.name} no drive ${driveId}:`, subErr);
        }
        return null;
      });

      const results = await Promise.all(searchPromises);
      const foundInSubfolder = results.find(item => item !== null);
      if (foundInSubfolder) {
        console.log(`[photoService] Encontrado Carômetro dentro da pasta no drive ${driveId}:`, foundInSubfolder.name);
        return { id: foundInSubfolder.id, driveId: foundInSubfolder.parentReference?.driveId || driveId };
      }
    }
  } catch (err) {
    console.error(`Erro no fallback de busca da pasta do Carômetro no drive ${driveId}:`, err);
  }

  return null;
}

/**
 * Procura pela pasta "Carômetro" nos itens compartilhados com o usuário (Shared with me)
 */
async function findCarometroInShared(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    console.log('[photoService] Procurando pasta "Carômetro" nos itens compartilhados (sharedWithMe)...');
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/drive/sharedWithMe?$select=name,id,folder,remoteItem',
      { headers }
    );
    const data = await response.json();
    if (data && data.value) {
      const found = data.value.find(item => {
        const target = item.remoteItem || item;
        const isFolder = target.folder || (target.file === undefined && target.image === undefined && target.package === undefined);
        return isFolder && normalizeName(target.name) === 'carometro';
      });
      if (found) {
        const remote = found.remoteItem || found;
        console.log('[photoService] Encontrado Carômetro nos compartilhados:', remote.name, 'no drive', remote.parentReference?.driveId);
        return { id: remote.id, driveId: remote.parentReference?.driveId };
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar Carômetro nos itens compartilhados:', err);
  }
  return null;
}

/**
 * Varre o OneDrive para encontrar a pasta raiz do Carômetro, procurando em múltiplos drives.
 */
export async function findCarometroFolder(accessToken, preferredDriveId = null) {
  // 1. Tentar primeiro nos itens compartilhados com o usuário
  const sharedResult = await findCarometroInShared(accessToken);
  if (sharedResult) {
    return sharedResult;
  }

  // 2. Fallback: procurar nos drives específicos
  const drivesToTry = [];
  
  if (preferredDriveId && preferredDriveId !== 'me') {
    drivesToTry.push(preferredDriveId);
  }
  // Drive padrão da planilha do professor se não for a preferida
  if (preferredDriveId !== '302ec50fbf74a18d') {
    drivesToTry.push('302ec50fbf74a18d');
  }
  drivesToTry.push('me');

  const uniqueDrives = Array.from(new Set(drivesToTry));
  console.log('[photoService] Procurando pasta "Carômetro" nos drives:', uniqueDrives);

  for (const driveId of uniqueDrives) {
    const result = await findCarometroInDrive(accessToken, driveId);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Encontra a subpasta da turma dentro da pasta Carômetro
 */
export async function findClassSubfolder(accessToken, carometroFolderId, driveId, className) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const baseUrl = getBaseUrl(driveId);

  try {
    const response = await fetch(
      `${baseUrl}/items/${carometroFolderId}/children?$select=name,id,folder`,
      { headers }
    );
    const data = await response.json();
    if (data && data.value) {
      const found = data.value.find(item => {
        if (!item.folder) return false;
        return classNamesMatch(item.name, className);
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
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    const downloadUrl = file['@microsoft.graph.downloadUrl'];

    if (isImage && downloadUrl) {
      const normName = normalizeStudentName(file.name);
      map[normName] = downloadUrl;
    }
  });

  return map;
}

/**
 * Busca uma foto correspondente a um nome de aluno dentro do mapa de fotos.
 * Realiza comparação tolerante, cobrindo truncamentos de sobrenomes, roll numbers (números de chamada)
 * e pequenas discrepâncias ortográficas.
 */
export function findPhotoInMap(studentName, photosMap) {
  if (!studentName || !photosMap) return null;
  const studentNorm = normalizeStudentName(studentName);
  
  // 1. Caso direto / exato
  if (photosMap[studentNorm]) {
    return photosMap[studentNorm];
  }
  
  // 2. Busca flexível por tokens do nome
  const studentTokens = studentNorm.split(' ').filter(Boolean);
  if (studentTokens.length === 0) return null;
  
  const keys = Object.keys(photosMap);
  let bestMatchKey = null;
  let bestMatchScore = 0;
  
  for (const key of keys) {
    const keyTokens = key.split(' ').filter(Boolean);
    if (keyTokens.length === 0) continue;
    
    // O primeiro nome do aluno e o do arquivo devem bater exatamente
    const firstNameMatches = keyTokens[0] === studentTokens[0];
    if (!firstNameMatches) continue;
    
    // Contagem de tokens correspondentes
    let matchCount = 0;
    for (const token of keyTokens) {
      if (studentTokens.includes(token)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      if (matchCount > bestMatchScore) {
        bestMatchScore = matchCount;
        bestMatchKey = key;
      } else if (matchCount === bestMatchScore && bestMatchKey !== null) {
        // Desempate: escolher o nome com comprimento/termo mais próximo
        const prevKeyTokens = bestMatchKey.split(' ').filter(Boolean);
        const diffCurrent = Math.abs(keyTokens.length - studentTokens.length);
        const diffPrev = Math.abs(prevKeyTokens.length - studentTokens.length);
        if (diffCurrent < diffPrev) {
          bestMatchKey = key;
        }
      }
    }
  }
  
  if (bestMatchKey) {
    const keyTokens = bestMatchKey.split(' ').filter(Boolean);
    
    // Se ambos tiverem pelo menos 2 termos, exigimos pelo menos 2 termos em comum
    if (studentTokens.length >= 2 && keyTokens.length >= 2) {
      if (bestMatchScore >= 2) {
        return photosMap[bestMatchKey];
      }
    } else {
      // Se um deles só tiver um termo (ex: arquivo "Laura.jpg" e aluno "Laura Monteiro")
      if (bestMatchScore >= 1) {
        return photosMap[bestMatchKey];
      }
    }
  }
  
  return null;
}
