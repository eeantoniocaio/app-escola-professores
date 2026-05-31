/**
 * Normaliza uma string para fins de comparação (remove acentos, espaços extras e caixa alta)
 */
export function normalizeString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // remove múltiplos espaços
}

/**
 * Encontra o índice da coluna de nome no cabeçalho
 */
export function findNameColumnIndex(header) {
  for (let c = 0; c < header.length; c++) {
    const val = normalizeString(header[c]);
    if (val === 'nome' || val === 'aluno' || val.includes('nome do aluno') || val.includes('nome do(a) aluno') || val.includes('nome')) return c;
  }
  return -1;
}

/**
 * Encontra o índice da linha do aluno na planilha
 */
export function findStudentRow(values, studentName) {
  if (!values || values.length < 2) return -1;
  const normalizedSearchName = normalizeString(studentName);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    for (let c = 0; c < row.length; c++) {
      const val = normalizeString(row[c]);
      // Comparação exata ou contida
      if (val === normalizedSearchName || (val && (val.includes(normalizedSearchName) || normalizedSearchName.includes(val)))) {
        return r;
      }
    }
  }
  return -1;
}

/**
 * Encontra a linha de cabeçalho na planilha.
 * Geralmente é a primeira linha, mas às vezes pode haver linhas em branco no topo.
 */
export function findHeaderRowIndex(values) {
  if (!values || values.length === 0) return -1;
  // Buscamos nas primeiras 15 linhas para suportar planilhas com cabeçalhos maiores / decorativos
  for (let r = 0; r < Math.min(values.length, 15); r++) {
    const row = values[r];
    const hasName = row.some(cell => {
      const normalized = normalizeString(cell);
      return normalized === 'nome' || 
             normalized === 'aluno' || 
             normalized === 'nome do aluno' || 
             normalized === 'nome do(a) aluno' ||
             normalized === 'registro de aluno' ||
             normalized === 'registro do aluno' ||
             normalized === 'ra';
    });
    if (hasName) return r;
  }
  return 0; // fallback
}

/**
 * Extrai as frequências dos bimestres, frequência final e total de faltas para o aluno.
 */
export function getAlunoFrequencia(values, studentName, turmaNome) {
  if (!values || values.length < 2) {
    return { error: 'Planilha sem dados suficientes.' };
  }

  const studentRowIdx = findStudentRow(values, studentName);
  if (studentRowIdx === -1) {
    return { error: `Aluno "${studentName}" não encontrado nesta aba da planilha.` };
  }

  const headerRowIdx = findHeaderRowIndex(values);
  const header = values[headerRowIdx];
  const studentRow = values[studentRowIdx];

  console.log('--- EXCEL HEADERS FOUND ---', header);
  console.log('--- EXCEL STUDENT ROW ---', studentRow);

  // Inicializar variáveis de retorno
  let frequencia1Bimestre = '---';
  let frequencia2Bimestre = '---';
  let frequencia3Bimestre = '---';
  let frequencia4Bimestre = '---';
  let frequenciaFinal = '---';
  let totalFaltas = 0;
  let raVal = '';
  let digVal = '';

  const nameColIdx = findNameColumnIndex(header);

  // Percorrer as colunas para identificar os dados
  for (let c = 0; c < header.length; c++) {
    if (c === nameColIdx) continue;

    const headerVal = normalizeString(header[c]);
    if (!headerVal) continue;

    const cellVal = String(studentRow[c] || '').trim();

    // 0. Identificar R.A. e Dígito
    if (headerVal === 'ra' || headerVal === 'registro de aluno' || headerVal === 'registro do aluno' || headerVal === 'registro') {
      raVal = cellVal || raVal;
    } else if (headerVal === 'dig' || headerVal === 'digito' || headerVal === 'dig ra' || headerVal === 'dig. ra' || headerVal === 'digito ra' || headerVal === 'digito do ra' || headerVal === 'dig.ra') {
      digVal = cellVal || digVal;
    }

    // 1. Identificar Frequência por Bimestre
    else if (headerVal.includes('1') && (headerVal.includes('bim') || headerVal.includes('bimonthly')) && (headerVal.includes('freq') || headerVal.includes('%') || headerVal.includes('pres'))) {
      frequencia1Bimestre = cellVal || frequencia1Bimestre;
    } else if (headerVal.includes('2') && (headerVal.includes('bim') || headerVal.includes('bimonthly')) && (headerVal.includes('freq') || headerVal.includes('%') || headerVal.includes('pres'))) {
      frequencia2Bimestre = cellVal || frequencia2Bimestre;
    } else if (headerVal.includes('3') && (headerVal.includes('bim') || headerVal.includes('bimonthly')) && (headerVal.includes('freq') || headerVal.includes('%') || headerVal.includes('pres'))) {
      frequencia3Bimestre = cellVal || frequencia3Bimestre;
    } else if (headerVal.includes('4') && (headerVal.includes('bim') || headerVal.includes('bimonthly')) && (headerVal.includes('freq') || headerVal.includes('%') || headerVal.includes('pres'))) {
      frequencia4Bimestre = cellVal || frequencia4Bimestre;
    } 
    // Fallbacks mais diretos ("1º bim", "1ºb", "1b")
    else if (headerVal === '1º bim' || headerVal === '1ºb' || headerVal === '1b' || headerVal === '1º bimestre' || headerVal === '1 bimestre' || headerVal === '1 bim') {
      frequencia1Bimestre = cellVal || frequencia1Bimestre;
    } else if (headerVal === '2º bim' || headerVal === '2ºb' || headerVal === '2b' || headerVal === '2º bimestre' || headerVal === '2 bimestre' || headerVal === '2 bim') {
      frequencia2Bimestre = cellVal || frequencia2Bimestre;
    } else if (headerVal === '3º bim' || headerVal === '3ºb' || headerVal === '3b' || headerVal === '3º bimestre' || headerVal === '3 bimestre' || headerVal === '3 bim') {
      frequencia3Bimestre = cellVal || frequencia3Bimestre;
    } else if (headerVal === '4º bim' || headerVal === '4ºb' || headerVal === '4b' || headerVal === '4º bimestre' || headerVal === '4 bimestre' || headerVal === '4 bim') {
      frequencia4Bimestre = cellVal || frequencia4Bimestre;
    }
    
    // 2. Identificar Frequência Final
    else if (
      (headerVal.includes('final') && (headerVal.includes('freq') || headerVal.includes('%') || headerVal.includes('f.'))) || 
      headerVal === 'freq final' || 
      headerVal === 'frequencia final' || 
      headerVal === 'f final' || 
      headerVal === 'f. final' ||
      headerVal === 'frequencia' ||
      headerVal === '% freq'
    ) {
      frequenciaFinal = cellVal || frequenciaFinal;
    }

    // 3. Somar colunas chamadas "Total" de Faltas
    else if (
      headerVal === 'total' || 
      headerVal.includes('total de faltas') || 
      headerVal.includes('total faltas') || 
      headerVal === 'total f' || 
      headerVal === 'total.f' ||
      headerVal === 'faltas'
    ) {
      const numFaltas = parseInt(cellVal, 10);
      if (!isNaN(numFaltas)) {
        totalFaltas += numFaltas;
      }
    }
  }

  // Tratar e formatar as porcentagens caso venham como números puros
  const formatPercent = (val) => {
    if (!val || val === '---') return val;
    // Se for formato string como "85%", manter
    if (val.includes('%')) return val;
    
    const numeric = parseFloat(val.replace(',', '.'));
    if (!isNaN(numeric)) {
      // Se for decimal entre 0 e 1 (ex: 0.85 -> 85%)
      if (numeric > 0 && numeric <= 1) {
        return `${Math.round(numeric * 100)}%`;
      }
      // Se for número de 1 a 100
      if (numeric > 1 && numeric <= 100) {
        return `${Math.round(numeric)}%`;
      }
    }
    return val;
  };

  const alunoNomePlanilha = nameColIdx !== -1 ? studentRow[nameColIdx] : studentName;
  const formattedRA = raVal ? (digVal ? `${raVal}-${digVal}` : raVal) : '';

  return {
    turma: turmaNome,
    aluno: alunoNomePlanilha || studentName,
    frequencia1Bimestre: formatPercent(frequencia1Bimestre),
    frequencia2Bimestre: formatPercent(frequencia2Bimestre),
    frequencia3Bimestre: formatPercent(frequencia3Bimestre),
    frequencia4Bimestre: formatPercent(frequencia4Bimestre),
    frequenciaFinal: formatPercent(frequenciaFinal),
    totalFaltas,
    ra: formattedRA
  };
}
