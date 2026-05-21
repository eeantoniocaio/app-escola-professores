import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Register fonts safely (compat with Vite and CommonJS exports)
pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFonts;

export const exportOcorrenciasCSV = (filteredRows) => {
  const headers = ['Professor(a)', 'Disciplina', 'Turma', 'Data', 'Alunos Envolvidos', 'Descrição', 'Ação do Professor', 'Intervenção da Gestão'];
  
  const rows = filteredRows.map(row => [
    `"${row.professor}"`,
    `"${row.disciplina || '-'}"`,
    `"${row.turma || '-'}"`,
    `"${row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}"`,
    `"${row.alunos && row.alunos.length > 0 ? row.alunos.join(', ') : '-'}"`,
    `"${row.descricao ? row.descricao.replace(/"/g, '""') : '-'}"`,
    `"${row.acao_professor ? row.acao_professor.replace(/"/g, '""') : '-'}"`,
    `"${row.intervencao_gestao ? row.intervencao_gestao.replace(/"/g, '""') : '-'}"`
  ].join(';')); // Using semicolon for better Excel compatibility in pt-BR locales
  
  // UTF-8 BOM is \uFEFF
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historico_ocorrencias.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOcorrenciasPDF = (filteredRows, filters) => {
  // Extract applied filters for the header
  const appliedFilters = [];
  if (filters.filterProf) appliedFilters.push(`Professor(a): ${filters.filterProf}`);
  if (filters.filterDisciplina) appliedFilters.push(`Disciplina: ${filters.filterDisciplina}`);
  if (filters.filterTurma) appliedFilters.push(`Turma: ${filters.filterTurma}`);
  if (filters.filterAluno) appliedFilters.push(`Aluno(a): ${filters.filterAluno}`);
  if (filters.filterData) appliedFilters.push(`Data: ${new Date(filters.filterData + 'T12:00:00').toLocaleDateString('pt-BR')}`);

  const filtersText = appliedFilters.length > 0 
    ? appliedFilters.join(' | ')
    : 'Nenhum filtro específico aplicado (Todas as ocorrências)';

  // Table body construction
  const tableBody = [
    // Header Row
    [
      { text: 'Prof / Disc / Turma', style: 'tableHeader' },
      { text: 'Data', style: 'tableHeader' },
      { text: 'Alunos', style: 'tableHeader' },
      { text: 'Descrição / Contexto', style: 'tableHeader' },
      { text: 'Ação / Intervenção', style: 'tableHeader' }
    ]
  ];

  filteredRows.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
    
    tableBody.push([
      { 
        stack: [
          { text: row.professor, bold: true },
          { text: `${row.disciplina || '-'}`, fontSize: 8, color: '#7f8c8d', margin: [0, 2, 0, 0] },
          row.turma ? { text: `Turma: ${row.turma}`, fontSize: 8, color: '#7f8c8d' } : {}
        ],
        style: 'cell', 
        fillColor: bgColor 
      },
      { text: row.data ? new Date(row.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-', style: 'cell', fillColor: bgColor },
      { text: row.alunos && row.alunos.length > 0 ? row.alunos.join(', ') : '-', style: 'cell', fillColor: bgColor },
      { text: row.descricao || '-', style: 'descCell', fillColor: bgColor },
      { 
        stack: [
          row.acao_professor ? { text: [ { text: 'Prof: ', bold: true }, row.acao_professor ], fontSize: 8, margin: [0,0,0,2] } : {},
          row.intervencao_gestao ? { text: [ { text: 'Gestão: ', bold: true, color: '#4c1d95' }, row.intervencao_gestao ], fontSize: 8 } : {}
        ],
        style: 'cell', 
        fillColor: bgColor 
      }
    ]);
  });

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 60, 40, 60],
    
    // Header (repeats on every page)
    header: function(currentPage, pageCount) {
      return {
        margin: [40, 20, 40, 0],
        columns: [
          {
            text: 'E.E. Antônio Caio\nPortal de Evidências Pedagógicas',
            style: 'headerTitle'
          },
          {
            text: `Gerado em: ${new Date().toLocaleString('pt-BR')}\nResponsável: Coordenação Pedagógica`,
            style: 'headerMeta',
            alignment: 'right'
          }
        ]
      };
    },

    // Footer (repeats on every page)
    footer: function(currentPage, pageCount) {
      return {
        margin: [40, 0, 40, 20],
        columns: [
          {
            text: 'Portal de Evidências Pedagógicas — Sistema de Avaliação Docente',
            style: 'footerText'
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            style: 'footerText',
            alignment: 'right'
          }
        ]
      };
    },

    content: [
      {
        text: 'Histórico de Ocorrências em Sala de Aula',
        style: 'documentTitle',
        margin: [0, 10, 0, 5]
      },
      {
        text: `Filtros Aplicados: ${filtersText}`,
        style: 'filtersSection',
        margin: [0, 0, 0, 20]
      },
      
      // Summary line
      {
        text: `Resumo: ${filteredRows.length} ocorrências exibidas.`,
        style: 'summaryText',
        margin: [0, 0, 0, 10]
      },

      // Table
      {
        table: {
          headerRows: 1,
          widths: ['20%', '8%', '16%', '28%', '28%'],
          body: tableBody
        },
        layout: {
          hLineWidth: function (i, node) {
            return (i === 0 || i === node.table.body.length) ? 0 : 1;
          },
          vLineWidth: function (i, node) {
            return 0; // No vertical lines for modern look
          },
          hLineColor: function (i, node) {
            return '#e0e0e0';
          },
          paddingTop: function(i, node) { return 8; },
          paddingBottom: function(i, node) { return 8; },
          paddingLeft: function(i, node) { return 4; },
          paddingRight: function(i, node) { return 4; },
        }
      },

      // Signatures
      {
        margin: [0, 60, 0, 0],
        columns: [
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
              { text: 'Coordenação Pedagógica', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 10, bold: true }
            ],
            alignment: 'center'
          },
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
              { text: 'Gestor(a) Escolar', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 10, bold: true }
            ],
            alignment: 'center'
          }
        ]
      }
    ],

    styles: {
      headerTitle: {
        fontSize: 10,
        bold: true,
        color: '#4a4a4a'
      },
      headerMeta: {
        fontSize: 9,
        color: '#7a7a7a'
      },
      documentTitle: {
        fontSize: 18,
        bold: true,
        color: '#2c3e50'
      },
      filtersSection: {
        fontSize: 9,
        color: '#555555',
        italics: true,
        background: '#f4f6f8'
      },
      summaryText: {
        fontSize: 10,
        bold: true,
        color: '#34495e'
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: '#7f8c8d',
        fillColor: '#ffffff',
        border: [false, false, false, true] // bottom border only
      },
      cell: {
        fontSize: 9,
        color: '#2c3e50'
      },
      descCell: {
        fontSize: 8,
        color: '#7f8c8d'
      },
      footerText: {
        fontSize: 8,
        color: '#95a5a6'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  pdfMake.createPdf(docDefinition).download('historico_ocorrencias.pdf');
};
