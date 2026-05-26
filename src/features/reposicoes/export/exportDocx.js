import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle } from 'docx';

// Helper to get image dimensions and convert image to array buffer
const getImageDimensionsAndBuffer = async (src) => {
  try {
    // 1. Get dimensions
    const dims = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 400, height: 300 });
      img.src = src;
    });

    // 2. Fetch and get buffer
    let buffer;
    if (src.startsWith('data:')) {
      const base64Data = src.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      buffer = bytes.buffer;
    } else {
      const response = await fetch(src);
      const blob = await response.blob();
      buffer = await blob.arrayBuffer();
    }

    return { dims, buffer };
  } catch (err) {
    console.error('Erro ao processar imagem para DOCX:', err);
    return null;
  }
};

export const exportQuestionsToDocx = async (questions, config) => {
  const {
    schoolName = 'E.E. Antônio Caio',
    examTitle = 'Reposição de Atividades / Avaliação Substitutiva',
    professor = '',
    disciplina = '',
    serie = '',
    turma = '',
    date = new Date().toLocaleDateString('pt-BR')
  } = config;

  // Group questions by discipline if there are multiple, or keep order
  const questionsByDiscipline = {};
  questions.forEach(q => {
    const disc = q.disciplina || 'Geral';
    if (!questionsByDiscipline[disc]) {
      questionsByDiscipline[disc] = [];
    }
    questionsByDiscipline[disc].push(q);
  });

  const childrenElements = [];

  // 1. Create Institutional Header Table
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" }
  };

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [
      // Row 1: School Name & Title
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 24, font: "Arial" })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: examTitle, bold: true, size: 20, font: "Arial" })
                ]
              })
            ],
            columnSpan: 2,
            margins: { top: 100, bottom: 100, left: 150, right: 150 }
          })
        ]
      }),
      // Row 2: Metadata Info
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: "PROFESSOR(A): ", bold: true, size: 18, font: "Arial" }),
                  new TextRun({ text: professor.toUpperCase(), size: 18, font: "Arial" })
                ]
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: "DISCIPLINA: ", bold: true, size: 18, font: "Arial" }),
                  new TextRun({ text: (disciplina || 'Várias').toUpperCase(), size: 18, font: "Arial" })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "SÉRIE/TURMA: ", bold: true, size: 18, font: "Arial" }),
                  new TextRun({ text: `${serie} ${turma}`.toUpperCase(), size: 18, font: "Arial" })
                ]
              })
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 150, right: 150 }
          }),
          new TableCell({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: "DATA: ", bold: true, size: 18, font: "Arial" }),
                  new TextRun({ text: date, size: 18, font: "Arial" })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "NOTA: _________", bold: true, size: 18, font: "Arial" })
                ]
              })
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 150, right: 150 }
          })
        ]
      }),
      // Row 3: Student Name
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: "ALUNO(A): __________________________________________________", bold: true, size: 18, font: "Arial" }),
                  new TextRun({ text: "  Nº: ____", bold: true, size: 18, font: "Arial" })
                ]
              })
            ],
            columnSpan: 2,
            margins: { top: 100, bottom: 100, left: 150, right: 150 }
          })
        ]
      })
    ]
  });

  childrenElements.push(headerTable);
  
  // Spacing after header
  childrenElements.push(new Paragraph({ spacing: { after: 360 } }));

  // 2. Loop disciplines and format questions
  let globalIndex = 1;
  const disciplines = Object.keys(questionsByDiscipline);

  for (let dIdx = 0; dIdx < disciplines.length; dIdx++) {
    const currentDiscipline = disciplines[dIdx];
    const disciplineQuestions = questionsByDiscipline[currentDiscipline];

    // Add Section Divider for Disciplines if there are multiple
    if (disciplines.length > 1 || currentDiscipline !== 'Geral') {
      childrenElements.push(
        new Paragraph({
          spacing: { before: 240, after: 120 },
          keepWithNext: true,
          children: [
            new TextRun({ text: `DISCIPLINA: ${currentDiscipline.toUpperCase()}`, bold: true, size: 22, font: "Arial", color: "1e3a8a" }),
            new TextRun({ text: ` (${disciplineQuestions.length} questões)`, italic: true, size: 16, font: "Arial", color: "64748b" })
          ]
        })
      );
      
      // Horizontal Line
      childrenElements.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "cbd5e1" },
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [new TableRow({ children: [new TableCell({ children: [] })] })]
        })
      );
      
      childrenElements.push(new Paragraph({ spacing: { after: 180 } }));
    }

    // Render questions
    for (let qIdx = 0; qIdx < disciplineQuestions.length; qIdx++) {
      const q = disciplineQuestions[qIdx];

      // Question Title
      const habText = q.habilidade ? ` (${q.habilidade})` : '';
      childrenElements.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          keepWithNext: true,
          children: [
            new TextRun({ text: `Questão ${globalIndex})${habText}`, bold: true, size: 20, font: "Arial" })
          ]
        })
      );

      // Enunciado
      const lines = (q.enunciado || '').split('\n');
      lines.forEach((line, lIdx) => {
        childrenElements.push(
          new Paragraph({
            spacing: { after: lIdx === lines.length - 1 ? 120 : 60 },
            keepWithNext: true,
            children: [
              new TextRun({ text: line, size: 20, font: "Arial" })
            ]
          })
        );
      });

      // Support Image
      if (q.imagem_url || q.imagem_base64) {
        const imgSrc = q.imagem_url || q.imagem_base64;
        const imgData = await getImageDimensionsAndBuffer(imgSrc);
        if (imgData) {
          const { dims, buffer } = imgData;
          let width = dims.width;
          let height = dims.height;
          const maxWidth = 450; // max printable width in pixels
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          childrenElements.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 180 },
              keepWithNext: true,
              children: [
                new ImageRun({
                  data: buffer,
                  transformation: {
                    width: width,
                    height: height
                  }
                })
              ]
            })
          );
        }
      }

      // Alternatives
      const numAlts = q.num_alternativas || 4;
      const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, numAlts);

      letters.forEach((letter, idx) => {
        const textAlt = q.alternativas?.[letter] || '';
        childrenElements.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: idx === letters.length - 1 ? 240 : 80 },
            // Keep alternatives together with the question
            keepWithNext: idx === letters.length - 1 ? false : true,
            children: [
              new TextRun({ text: `${letter.toLowerCase()}) `, bold: true, size: 20, font: "Arial" }),
              new TextRun({ text: textAlt, size: 20, font: "Arial" })
            ]
          })
        );
      });

      globalIndex++;
    }
  }

  // 3. Create document instance
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1700, // 3cm
              bottom: 1134, // 2cm
              left: 1700, // 3cm
              right: 1134 // 2cm
            }
          }
        },
        children: childrenElements
      }
    ]
  });

  // 4. Generate and download
  Packer.toBlob(doc).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = examTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `avaliacao_${sanitizedTitle}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  });
};
