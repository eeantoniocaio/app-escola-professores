// --- CONFIGURAÇÃO DE SEGURANÇA ---
const SECRET_TOKEN = "antonio-caio-frequencia-token-2026"; // Token compartilhado para evitar acessos externos

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter;
    const jsonBody = e.postData ? JSON.parse(e.postData.contents) : {};
    
    const token = params.token || jsonBody.token;
    if (token !== SECRET_TOKEN) {
      return responseJson({ status: "error", message: "Acesso não autorizado. Token inválido." }, 403);
    }
    
    const action = params.action || jsonBody.action;
    
    // Rota de Teste com Depuração da Célula DM9
    if (action === "test") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = getSheetByName(ss, "6A");
      let debugInfo = {};
      if (sheet) {
        const values = sheet.getDataRange().getValues();
        const headerIdx = findHeaderRowIndex(values);
        const header = values[headerIdx];
        
        // Prioriza a busca na linha de cima (linha 7)
        const dateFormatted = formatDateToDDMM("2026-06-03");
        let dateColIdx = -1;
        if (headerIdx > 0) {
          dateColIdx = findDateColumnIndex(values[headerIdx - 1], dateFormatted);
        }
        if (dateColIdx === -1) {
          dateColIdx = findDateColumnIndex(header, dateFormatted);
        }
        
        debugInfo = {
          headerIdx: headerIdx,
          dateColIdx: dateColIdx,
          // Valor lido da linha 9 (aluna Ana Beatriz), coluna DM (índice 116)
          cellDM9Value: String(values[8][116] || ""), 
          sheetColumnsCount: header.length,
          sheetRowsCount: values.length
        };
      }
      return responseJson({
        status: "success",
        message: "API funcionando!",
        debug: debugInfo
      });
    }
    
    const sheetName = params.sheetName || jsonBody.sheetName;
    const dateStr = params.date || jsonBody.date; // Formato esperado YYYY-MM-DD
    
    if (!action) {
      return responseJson({ status: "error", message: "Ação não especificada." });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "getStudents") {
      return getStudentsAndAttendance(ss, sheetName, dateStr);
    }
    
    if (action === "saveAttendance") {
      const records = jsonBody.records || [];
      return saveAttendance(ss, sheetName, dateStr, records);
    }
    
    return responseJson({ status: "error", message: "Ação desconhecida: " + action });
    
  } catch (error) {
    return responseJson({ status: "error", message: error.toString() });
  }
}

// 1. Busca alunos e presença da data
function getStudentsAndAttendance(ss, sheetName, dateStr) {
  const sheet = getSheetByName(ss, sheetName);
  if (!sheet) {
    return responseJson({ status: "error", message: "Aba '" + sheetName + "' não encontrada na planilha." });
  }
  
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return responseJson({ status: "success", students: [] });
  }
  
  const headerIdx = findHeaderRowIndex(values);
  const header = values[headerIdx];
  
  const nameColIdx = findColumnIndex(header, ["nome", "aluno", "nome do aluno", "nome do(a) aluno"]);
  const raColIdx = findColumnIndex(header, ["ra", "registro de aluno", "registro do aluno", "registro"]);
  const digColIdx = findColumnIndex(header, ["dig", "digito", "dig ra", "dig. ra", "digito ra", "dig.ra"]);
  
  if (nameColIdx === -1 || raColIdx === -1) {
    return responseJson({ status: "error", message: "Cabeçalho da planilha inválido (colunas 'Nome' e 'RA' são obrigatórias)." });
  }
  
  // Converter dateStr (YYYY-MM-DD) para formato de busca DD/MM
  const dateFormatted = formatDateToDDMM(dateStr);
  let dateColIdx = -1;
  
  // Prioriza buscar na linha superior (linha 7) onde as datas realmente ficam
  if (headerIdx > 0) {
    const upperHeader = values[headerIdx - 1];
    dateColIdx = findDateColumnIndex(upperHeader, dateFormatted);
  }
  
  // Se não achar na linha 7, tenta na linha 8
  if (dateColIdx === -1) {
    dateColIdx = findDateColumnIndex(header, dateFormatted);
  }
  
  const studentsList = [];
  
  for (let r = headerIdx + 1; r < values.length; r++) {
    const row = values[r];
    const name = row[nameColIdx];
    const ra = String(row[raColIdx] || '').trim();
    const dig = digColIdx !== -1 ? String(row[digColIdx] || '').trim() : '';
    
    if (!name || !ra) continue; // Linha em branco ou sem RA
    
    // Status do aluno na data selecionada
    let rawStatus = "";
    if (dateColIdx !== -1 && dateColIdx < row.length) {
      rawStatus = String(row[dateColIdx]).trim();
    }
    
    // Mapeamento do status: Faltas são 'F', Atrasos são 'A', Transferidos são 'T', Presenças são '.' ou vazio
    let status = "Presente";
    if (rawStatus === "F" || rawStatus === "f") status = "Falta";
    else if (rawStatus === "A" || rawStatus === "a") status = "Atraso";
    else if (rawStatus === "T" || rawStatus === "t") status = "Transferido";
    
    studentsList.push({
      ra: ra,
      dig: dig,
      name: name,
      status: status
    });
  }
  
  return responseJson({
    status: "success",
    students: studentsList,
    dateColumnExists: (dateColIdx !== -1)
  });
}

// 2. Grava chamada (Lote)
function saveAttendance(ss, sheetName, dateStr, records) {
  const sheet = getSheetByName(ss, sheetName);
  if (!sheet) {
    return responseJson({ status: "error", message: "Aba '" + sheetName + "' não encontrada na planilha." });
  }
  
  const values = sheet.getDataRange().getValues();
  const headerIdx = findHeaderRowIndex(values);
  const header = values[headerIdx];
  
  const raColIdx = findColumnIndex(header, ["ra", "registro de aluno", "registro do aluno", "registro"]);
  const digColIdx = findColumnIndex(header, ["dig", "digito", "dig ra", "dig. ra", "digito ra", "dig.ra"]);
  
  if (raColIdx === -1) {
    return responseJson({ status: "error", message: "Coluna 'RA' não encontrada na planilha." });
  }
  
  const dateFormatted = formatDateToDDMM(dateStr);
  let dateColIdx = -1;
  let matchedInUpperHeader = false;
  
  // Prioriza buscar na linha superior (linha 7) onde as datas realmente ficam
  if (headerIdx > 0) {
    const upperHeader = values[headerIdx - 1];
    dateColIdx = findDateColumnIndex(upperHeader, dateFormatted);
    if (dateColIdx !== -1) {
      matchedInUpperHeader = true;
    }
  }
  
  // Se não achar na linha 7, tenta na linha 8
  if (dateColIdx === -1) {
    dateColIdx = findDateColumnIndex(header, dateFormatted);
  }
  
  // Se a coluna da data não existir em nenhuma das duas, cria uma nova
  if (dateColIdx === -1) {
    dateColIdx = header.length; 
    sheet.insertColumnAfter(dateColIdx);
    
    // Grava a data na linha de cima (linha 7) se houver cabeçalho duplo
    if (headerIdx > 0) {
      sheet.getRange(headerIdx, dateColIdx + 1).setValue(dateFormatted);
      matchedInUpperHeader = true;
    } else {
      sheet.getRange(headerIdx + 1, dateColIdx + 1).setValue(dateFormatted);
    }
  }
  
  // Criar mapa de registros para gravação rápida
  const recordMap = {};
  records.forEach(rec => {
    const key = String(rec.ra).trim() + "_" + String(rec.dig || '').trim();
    recordMap[key] = rec.status;
  });
  
  // Percorrer a planilha e atualizar células
  for (let r = headerIdx + 1; r < values.length; r++) {
    const row = values[r];
    const ra = String(row[raColIdx] || '').trim();
    const dig = digColIdx !== -1 ? String(row[digColIdx] || '').trim() : '';
    const key = ra + "_" + dig;
    
    if (key in recordMap) {
      const status = recordMap[key];
      let charStatus = "."; // Padrão: Presente
      if (status === "Falta") charStatus = "F";
      else if (status === "Atraso") charStatus = "A";
      else if (status === "Transferido") charStatus = "T";
      
      sheet.getRange(r + 1, dateColIdx + 1).setValue(charStatus);
    }
  }
  
  return responseJson({ status: "success", message: "Presenças gravadas com sucesso na planilha!" });
}

// --- HELPERS ---
function getSheetByName(ss, sheetName) {
  const sheets = ss.getSheets();
  const normalizedSearch = normalizeText(sheetName);
  for (let i = 0; i < sheets.length; i++) {
    if (normalizeText(sheets[i].getName()) === normalizedSearch) return sheets[i];
  }
  // Tentar match parcial
  for (let i = 0; i < sheets.length; i++) {
    const sName = normalizeText(sheets[i].getName());
    if (sName.indexOf(normalizedSearch) !== -1 || normalizedSearch.indexOf(sName) !== -1) return sheets[i];
  }
  return null;
}

function findHeaderRowIndex(values) {
  for (let r = 0; r < Math.min(values.length, 15); r++) {
    const row = values[r];
    for (let c = 0; c < row.length; c++) {
      const val = normalizeText(row[c]);
      if (val === "nome" || val === "aluno" || val === "ra") return r;
    }
  }
  return 0;
}

function findColumnIndex(header, searchNames) {
  for (let c = 0; c < header.length; c++) {
    const val = normalizeText(header[c]);
    if (searchNames.some(name => val === name || val.indexOf(name) !== -1)) return c;
  }
  return -1;
}

function findDateColumnIndex(header, targetDate) {
  // targetDate vem no formato "DD/MM" (ex: "03/06")
  const targetParts = targetDate.split('/');
  if (targetParts.length !== 2) return -1;
  const targetDay = parseInt(targetParts[0], 10);
  const targetMonth = parseInt(targetParts[1], 10);
  
  // Obtém o fuso horário da planilha para formatação robusta, evitando erros de fuso horário
  let tz = "America/Sao_Paulo";
  try {
    tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  } catch (err) {
    // Fallback silencioso
  }
  
  for (let c = 0; c < header.length; c++) {
    const val = header[c];
    if (val === undefined || val === null || val === '') continue;
    
    // Cenário 1: A célula é um objeto de data real do Excel/Sheets
    if (val instanceof Date || Object.prototype.toString.call(val) === '[object Date]') {
      try {
        // Formata a data do Sheets usando o fuso horário da planilha para evitar o desvio de 1 dia
        const formattedCell = Utilities.formatDate(val, tz, "dd/MM");
        const cellParts = formattedCell.split('/');
        const day = parseInt(cellParts[0], 10);
        const month = parseInt(cellParts[1], 10);
        if (day === targetDay && month === targetMonth) {
          return c;
        }
      } catch (e) {
        // Fallback caso falte permissão de fuso horário
        const day = val.getDate();
        const month = val.getMonth() + 1; // getMonth() começa em 0
        if (day === targetDay && month === targetMonth) {
          return c;
        }
      }
    }
    
    // Cenário 2: A célula é um texto
    const cellStr = String(val).trim().toLowerCase();
    
    // Busca exata por "03/06" ou "3/6"
    if (cellStr === targetDate || cellStr.replace(/^0/, '') === targetDate.replace(/^0/, '')) {
      return c;
    }
    
    // Busca por formatos como "3-jun", "03-jun", "3 de jun"
    const monthsPt = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const monthName = monthsPt[targetMonth - 1];
    
    if (monthName) {
      const regexStr = "^0?" + targetDay + "[^a-z0-9]*" + monthName;
      const regex = new RegExp(regexStr, "i");
      if (regex.test(cellStr)) {
        return c;
      }
    }
  }
  return -1;
}

function getColumnLetter(colNum) {
  let letter = "";
  let temp;
  while (colNum > 0) {
    temp = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colNum = (colNum - temp - 1) / 26;
  }
  return letter;
}

function formatDateToDDMM(dateStr) {
  // YYYY-MM-DD -> DD/MM
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return parts[2] + "/" + parts[1];
  }
  return dateStr;
}

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/º/g, '')
    .replace(/ª/g, '')
    .replace(/\s+/g, '');
}

function responseJson(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
