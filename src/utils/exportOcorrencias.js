import { jsPDF } from 'jspdf';

export const exportOcorrenciasCSV = (filteredRows) => {
  const headers = ['Professor(a)', 'Disciplina', 'Turma', 'Data', 'Aula', 'Alunos Envolvidos', 'Descrição', 'Ação do Professor', 'Intervenção da Gestão'];
  
  const rows = filteredRows.map(row => [
    `"${row.professor}"`,
    `"${row.disciplina || '-'}"`,
    `"${row.turma || '-'}"`,
    `"${row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}"`,
    `"${row.aula || '-'}"`,
    `"${row.alunos && row.alunos.length > 0 ? row.alunos.join(', ') : '-'}"`,
    `"${row.descricao ? row.descricao.replace(/"/g, '""') : '-'}"`,
    `"${row.acao_professor ? row.acao_professor.replace(/"/g, '""') : '-'}"`,
    `"${row.intervencao_gestao ? row.intervencao_gestao.replace(/"/g, '""') : '-'}"`
  ].join(';')); // Using Semicolon for better Excel compatibility in pt-BR locales
  
  // UTF-8 BOM is \uFEFF
  const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "historico_ocorrencias.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOcorrenciasPDF = (filteredRows, filters) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape format A4
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('E.E. Antônio Caio - Histórico de Ocorrências', 14, 15);
  
  // Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
  
  const appliedFilters = [];
  if (filters.filterProf) appliedFilters.push(`Professor(a): ${filters.filterProf}`);
  if (filters.filterDisciplina) appliedFilters.push(`Disciplina: ${filters.filterDisciplina}`);
  if (filters.filterTurma) appliedFilters.push(`Turma: ${filters.filterTurma}`);
  if (filters.filterAluno) appliedFilters.push(`Aluno(a): ${filters.filterAluno}`);
  if (filters.filterData) appliedFilters.push(`Data: ${new Date(filters.filterData + 'T12:00:00').toLocaleDateString('pt-BR')}`);
  
  const filtersText = appliedFilters.length > 0 ? appliedFilters.join(' | ') : 'Todas as ocorrências';
  doc.text(`Filtros: ${filtersText}`, 14, 27);
  
  // Separator Line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 30, 283, 30);
  
  // Table Headers
  let y = 37;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Professor / Disciplina', 14, y);
  doc.text('Turma/Aula', 65, y);
  doc.text('Data', 90, y);
  doc.text('Alunos Envolvidos', 115, y);
  doc.text('Descrição / Ações', 170, y);
  
  doc.line(14, y + 2, 283, y + 2);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  filteredRows.forEach((row) => {
    if (y > 185) {
      doc.addPage();
      y = 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Professor / Disciplina', 14, y);
      doc.text('Turma/Aula', 65, y);
      doc.text('Data', 90, y);
      doc.text('Alunos Envolvidos', 115, y);
      doc.text('Descrição / Ações', 170, y);
      doc.line(14, y + 2, 283, y + 2);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    
    const profText = doc.splitTextToSize(`${row.professor}\n(${row.disciplina || '-'})`, 48);
    const classText = `${row.turma || '-'}\n${row.aula || '-'}`;
    const dataText = row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
    
    const studentsText = doc.splitTextToSize(row.alunos && row.alunos.length > 0 ? row.alunos.join(', ') : '-', 50);
    
    const descContent = `Relato: ${row.descricao || '-'}` +
      (row.acao_professor ? `\n\nAção Professor: ${row.acao_professor}` : '') +
      (row.intervencao_gestao ? `\n\nIntervenção Gestão: ${row.intervencao_gestao}` : '');
      
    const descText = doc.splitTextToSize(descContent, 110);
    
    const rowHeight = Math.max(
      profText.length * 4,
      studentsText.length * 4,
      descText.length * 4,
      8
    ) + 4;
    
    doc.text(profText, 14, y);
    doc.text(classText, 65, y);
    doc.text(dataText, 90, y);
    doc.text(studentsText, 115, y);
    doc.text(descText, 170, y);
    
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y + rowHeight - 2, 283, y + rowHeight - 2);
    
    y += rowHeight;
  });
  
  doc.save('historico_ocorrencias.pdf');
};
