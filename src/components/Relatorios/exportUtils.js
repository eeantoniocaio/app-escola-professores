import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Register fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const exportCSV = (filteredRows) => {
  const headers = ['Professor(a)', 'Evento', 'Tipo/Status', 'Data', 'Gestor(a)', 'Solicitante', 'Solicitado Em', 'Prazo de Entrega', 'Descrição', 'Anexo'];
  
  const rows = filteredRows.map(row => [
    `"${row.teacher}"`,
    `"${row.evento}"`,
    `"${row.foraDoPlaz ? 'Entrega fora do prazo' : row.tipo}"`,
    `"${row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
    `"${row.gestor || '-'}"`,
    `"${row.solicitante}"`,
    `"${row.dataSolicitacao ? new Date(row.dataSolicitacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
    `"${row.prazoEntrega ? new Date(row.prazoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}"`,
    `"${row.description ? row.description.replace(/"/g, '""') : '-'}"`,
    `"${row.fileName ? row.fileName + (row.fileSize ? ' (' + row.fileSize + ')' : '') : '-'}"`
  ].join(';')); // Using semicolon for better Excel compatibility in pt-BR locales
  
  // UTF-8 BOM is \uFEFF
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "relatorio_evidencias_pedagogicas.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportPDF = (filteredRows, filters) => {
  // Extract applied filters for the header
  const appliedFilters = [];
  if (filters.filterTeacher !== 'todos') appliedFilters.push(`Professor(a): ${filters.filterTeacher}`);
  if (filters.filterTipo !== 'todos') appliedFilters.push(`Tipo: ${filters.filterTipo}`);
  if (filters.filterDate) appliedFilters.push(`Data: ${new Date(filters.filterDate + 'T00:00:00').toLocaleDateString('pt-BR')}`);
  if (filters.filterEvent !== 'todos') {
    const evName = filters.events.find(e => e.id.toString() === filters.filterEvent)?.evento;
    if (evName) appliedFilters.push(`Evento: ${evName}`);
  }
  if (filters.filterSolicitante !== 'todos') appliedFilters.push(`Solicitante: ${filters.filterSolicitante}`);

  const filtersText = appliedFilters.length > 0 
    ? appliedFilters.join(' | ')
    : 'Nenhum filtro específico aplicado (Todos os registros)';

  // Table body construction
  const tableBody = [
    // Header Row
    [
      { text: 'Professor(a)', style: 'tableHeader' },
      { text: 'Status/Tipo', style: 'tableHeader' },
      { text: 'Data', style: 'tableHeader' },
      { text: 'Gestor(a)', style: 'tableHeader' },
      { text: 'Evento', style: 'tableHeader' },
      { text: 'Prazo', style: 'tableHeader' },
      { text: 'Descrição', style: 'tableHeader' }
    ]
  ];

  filteredRows.forEach((row, index) => {
    const isLate = row.foraDoPlaz;
    const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
    
    tableBody.push([
      { text: row.teacher, style: isLate ? 'lateCell' : 'cell', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: isLate ? '⚠️ Entrega fora do prazo' : row.tipo, style: isLate ? 'lateBadge' : 'badge', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: row.date ? new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-', style: 'cell', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: row.gestor || '-', style: 'cell', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: row.evento, style: 'cell', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: row.prazoEntrega ? new Date(row.prazoEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-', style: 'cell', fillColor: isLate ? '#fff5f7' : bgColor },
      { text: row.description || '-', style: 'descCell', fillColor: isLate ? '#fff5f7' : bgColor }
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
        text: 'Relatório de Ocorrências e Evidências Docentes',
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
        text: `Resumo: ${filteredRows.length} registros exibidos. (Atrasados: ${filteredRows.filter(r => r.foraDoPlaz).length})`,
        style: 'summaryText',
        margin: [0, 0, 0, 10]
      },

      // Table
      {
        table: {
          headerRows: 1,
          widths: ['18%', '14%', '9%', '12%', '14%', '9%', '24%'],
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
              { text: 'Professor(a) / Ciência', alignment: 'center', margin: [0, 5, 0, 0], fontSize: 10, bold: true }
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
        background: '#f4f6f8' // light gray background simulation? wait, pdfmake doesn't support background on text directly like this, but let's keep it simple
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
      lateCell: {
        fontSize: 9,
        bold: true,
        color: '#8B3A52'
      },
      badge: {
        fontSize: 8,
        bold: true,
        color: '#4a3f8a'
      },
      lateBadge: {
        fontSize: 8,
        bold: true,
        color: '#8B3A52'
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

  pdfMake.createPdf(docDefinition).download('relatorio_evidencias_institucional.pdf');
};
