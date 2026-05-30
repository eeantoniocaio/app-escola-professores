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
  
  // Remove extensões de imagem comuns
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
 * Compara o nome de uma pasta com o nome da turma para ver se são correspondentes.
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

const DEFAULT_CAROMETRO_FOLDER_ID = "1unY0OLoN-IbDvMvTbiUUDZh4qMTIJwFd";

/**
 * Retorna o ID oficial da pasta "Carômetro" configurado
 */
export async function findCarometroFolder(accessToken) {
  return { id: DEFAULT_CAROMETRO_FOLDER_ID, name: "CARÔMETRO" };
}

/**
 * Encontra a subpasta da turma dentro da pasta Carômetro no Google Drive
 */
export async function findClassSubfolder(accessToken, carometroFolderId, className) {
  const query = `mimeType = 'application/vnd.google-apps.folder' and '${carometroFolderId}' in parents and trashed = false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!response.ok) throw new Error('Falha ao listar subpastas da pasta Carômetro');
  const data = await response.json();
  const subfolders = data.files || [];
  
  // Filtragem flexível de nome de turma
  const found = subfolders.find(folder => classNamesMatch(folder.name, className));
  return found ? found.id : null;
}

/**
 * Lista todos os arquivos dentro de uma pasta no Google Drive
 */
export async function fetchFilesInFolder(accessToken, folderId) {
  const query = `'${folderId}' in parents and trashed = false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&pageSize=1000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!response.ok) throw new Error('Falha ao listar arquivos no Google Drive');
  const data = await response.json();
  return data.files || [];
}

// Cache global em memória para os Blob URLs das fotos dos alunos
const blobUrlCache = {};

/**
 * Baixa um arquivo de imagem do Google Drive e gera uma URL de Blob local temporária
 */
export async function downloadFileAsBlobUrl(accessToken, fileId) {
  if (blobUrlCache[fileId]) {
    return blobUrlCache[fileId];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (!response.ok) throw new Error(`Falha ao carregar imagem: ${response.statusText}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache[fileId] = blobUrl;
    return blobUrl;
  } catch (err) {
    console.error(`[photoService] Erro ao obter blob para o arquivo ${fileId}:`, err);
    return null;
  }
}

/**
 * Constrói o mapa de fotos vinculando os nomes normalizados das imagens aos seus IDs do Google Drive
 */
export function buildPhotosMap(files) {
  const map = {};
  if (!files) return map;

  files.forEach(file => {
    const isImage = file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    if (isImage) {
      const normName = normalizeStudentName(file.name);
      // Armazena o ID do arquivo no Google Drive
      map[normName] = file.id;
    }
  });

  return map;
}

/**
 * Busca uma foto correspondente a um nome de aluno dentro do mapa de fotos.
 * Realiza comparação tolerante de nomes (igual ao original).
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
  
  const PREPOSITIONS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const studentFiltered = studentTokens.filter(t => !PREPOSITIONS.has(t));
  if (studentFiltered.length === 0) return null;
  
  const keys = Object.keys(photosMap);
  let bestMatchKey = null;
  let bestMatchScore = 0;
  
  for (const key of keys) {
    const keyTokens = key.split(' ').filter(Boolean);
    if (keyTokens.length === 0) continue;
    
    const keyFiltered = keyTokens.filter(t => !PREPOSITIONS.has(t));
    if (keyFiltered.length === 0) continue;
    
    // O primeiro nome do aluno e o do arquivo devem bater exatamente
    const firstNameMatches = keyFiltered[0] === studentFiltered[0];
    if (!firstNameMatches) continue;
    
    // Evita sobrenomes conflitantes
    const keyUnmatched = keyFiltered.filter(t => !studentFiltered.includes(t) && t.length > 1);
    if (keyUnmatched.length > 0) {
      continue;
    }
    
    // Contagem de tokens correspondentes
    let matchCount = 0;
    for (const token of keyFiltered) {
      if (studentFiltered.includes(token)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      if (matchCount > bestMatchScore) {
        bestMatchScore = matchCount;
        bestMatchKey = key;
      } else if (matchCount === bestMatchScore && bestMatchKey !== null) {
        // Desempate
        const prevKeyTokens = bestMatchKey.split(' ').filter(Boolean).filter(t => !PREPOSITIONS.has(t));
        const diffCurrent = Math.abs(keyFiltered.length - studentFiltered.length);
        const diffPrev = Math.abs(prevKeyTokens.length - studentFiltered.length);
        if (diffCurrent < diffPrev) {
          bestMatchKey = key;
        }
      }
    }
  }
  
  if (bestMatchKey) {
    const keyTokens = bestMatchKey.split(' ').filter(Boolean);
    const keyFiltered = keyTokens.filter(t => !PREPOSITIONS.has(t));
    
    if (studentFiltered.length >= 2 && keyFiltered.length >= 2) {
      if (bestMatchScore >= 2) {
        return photosMap[bestMatchKey];
      }
    } else {
      if (bestMatchScore >= 1) {
        return photosMap[bestMatchKey];
      }
    }
  }
  
  return null;
}
