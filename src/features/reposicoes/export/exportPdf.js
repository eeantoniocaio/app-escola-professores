import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Expose html2canvas globally because jsPDF requires it inside doc.html()
window.html2canvas = html2canvas;

export const exportQuestionsToPdf = async (element, examTitle = 'avaliacao') => {
  try {
    // A4 Dimensions: 210mm x 297mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Custom configurations for jsPDF html method
    const opt = {
      callback: function (pdfDoc) {
        const sanitizedTitle = examTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        pdfDoc.save(`avaliacao_${sanitizedTitle}.pdf`);
      },
      x: 0,
      y: 0,
      width: 210, // Target A4 width in mm
      windowWidth: 794, // Width in pixels of the virtual browser window (794px represents standard A4 at 96 DPI)
      autoPaging: 'text', // Automatically breaks pages dynamically
      margin: [12, 10, 12, 10], // Margins in mm: top, left, bottom, right
      html2canvas: {
        scale: 2, // Double resolution for high definition print quality
        useCORS: true, // Allow cross-origin images (required for Supabase Storage files)
        logging: false,
        allowTaint: true
      }
    };

    await doc.html(element, opt);
    return true;
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    return false;
  }
};
