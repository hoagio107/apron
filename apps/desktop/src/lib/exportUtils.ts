import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPng(elementId: string, filename: string = 'recipe.png') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element with id ${elementId} not found`);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Lỗi khi xuất ảnh:', err);
    throw err;
  }
}

export async function exportToPdf(elementId: string, filename: string = 'recipe.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element with id ${elementId} not found`);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 size in mm
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    let pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Xử lý trang dài
    if (pdfHeight > pageHeight) {
      while (pdfHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
        pdfHeight -= pageHeight;
        position -= pageHeight;
        if (pdfHeight > 0) {
          pdf.addPage();
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save(filename);
  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    throw err;
  }
}
