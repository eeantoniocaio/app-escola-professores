import { useMemo } from 'react';

export const GRADE_COLORS = {
  '6': '#1CB0F6', // Macaw
  '7': '#FF4B4B', // Cardinal
  '8': '#FFC800', // Bee
  '9': '#FF9600', // Fox
  '1': '#CE82FF', // Beetle
  '2': '#2B70C9', // Humpback
  '3': '#58CC02'  // Feather Green
};

export const getTurmaColor = (nome) => {
  if (!nome) return 'var(--color-primary)';
  const match = nome.match(/^(\d+)/);
  if (match) {
    const num = match[1];
    return GRADE_COLORS[num] || 'var(--color-primary)';
  }
  return 'var(--color-primary)';
};

export default function useTurmasData({ turmas = [], alunos = [], selectedSerie, selectedTurmaSigla, studentSearchTerm }) {
  // Lógica de Parsing das Turmas: extrair Série e Sigla da Turma (Ex: "6º A" -> Série: "6º", Sigla: "A")
  const parsedTurmas = useMemo(() => {
    return turmas.map(t => {
      const nome = t.nome.trim();
      // Match a number + suffix and space + letter/number (Ex: "6º A", "1º EM B")
      const match = nome.match(/^(.*?)\s+([A-Za-z0-9])$/);
      if (match) {
        return {
          ...t,
          serie: match[1],
          turmaSigla: match[2]
        };
      }
      // Match without space (Ex: "6ºA")
      const matchNoSpace = nome.match(/^(.*?)(([A-Za-z0-9]))$/);
      if (matchNoSpace) {
        return {
          ...t,
          serie: matchNoSpace[1],
          turmaSigla: matchNoSpace[2]
        };
      }
      return {
        ...t,
        serie: nome,
        turmaSigla: 'Geral'
      };
    });
  }, [turmas]);

  // Lista única de Séries ordenada pedagogicamente
  const sortedSeriesList = useMemo(() => {
    const series = Array.from(new Set(parsedTurmas.map(t => t.serie)));
    const getSerieRank = (serieName) => {
      const order = ['6', '7', '8', '9', '1', '2', '3'];
      const match = serieName.match(/^(\d+)/);
      if (match) {
        const num = match[1];
        const index = order.indexOf(num);
        return index !== -1 ? index : 999;
      }
      return 999;
    };
    return [...series].sort((a, b) => {
      const rankA = getSerieRank(a);
      const rankB = getSerieRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });
  }, [parsedTurmas]);

  // Siglas de turmas disponíveis para a série selecionada
  const availableTurmaSiglas = useMemo(() => {
    if (!selectedSerie) return [];
    return Array.from(new Set(
      parsedTurmas
        .filter(t => t.serie === selectedSerie)
        .map(t => t.turmaSigla)
    )).sort();
  }, [parsedTurmas, selectedSerie]);

  // Turma ativa com base na série e sigla selecionadas
  const activeClass = useMemo(() => {
    return parsedTurmas.find(t => t.serie === selectedSerie && t.turmaSigla === selectedTurmaSigla);
  }, [parsedTurmas, selectedSerie, selectedTurmaSigla]);

  // Alunos pertencentes à turma selecionada
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    return (alunos || [])
      .filter(a => a.turma === activeClass.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, activeClass]);

  // Alunos filtrados por nome na busca de alunos
  const filteredStudents = useMemo(() => {
    const term = studentSearchTerm.trim().toLowerCase();
    if (term.length < 2) return [];
    return (alunos || [])
      .filter(a => a.nome.toLowerCase().includes(term))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, studentSearchTerm]);

  return {
    parsedTurmas,
    sortedSeriesList,
    availableTurmaSiglas,
    activeClass,
    classStudents,
    filteredStudents,
    getTurmaColor
  };
}
