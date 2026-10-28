const IMAGE_LOAD_TIMEOUT_MS = 3000;
const PNG_EXPORT_SCALE = 2.5;
const PDF_EXPORT_SCALE = 2.0;
const PDF_JPEG_QUALITY = 0.95;

/**
 * Đợi tất cả hình ảnh trong container tải xong trước khi render canvas
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onDone = () => {
          if (timer !== undefined) clearTimeout(timer);
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        };
        img.addEventListener('load', onDone);
        img.addEventListener('error', onDone);
        timer = setTimeout(onDone, IMAGE_LOAD_TIMEOUT_MS);
      });
    })
  );
}

/**
 * Xuất công thức ra tệp ảnh PNG với độ phân giải cao (2.5x retina print)
 */
export async function exportToPng(elementId: string, filename: string = 'recipe.png') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Không tìm thấy phần tử xuất: ${elementId}`);

  try {
    const [{ default: html2canvas }] = await Promise.all([
      import('html2canvas'),
      waitForImages(element),
    ]);

    const canvas = await html2canvas(element, {
      scale: PNG_EXPORT_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Lỗi khi xuất ảnh PNG:', err);
    throw err;
  }
}

/**
 * Xuất công thức ra tệp PDF chuẩn khổ A4 chất lượng cao
 */
export async function exportToPdf(elementId: string, filename: string = 'recipe.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Không tìm thấy phần tử xuất: ${elementId}`);

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
      waitForImages(element),
    ]);

    const canvas = await html2canvas(element, {
      scale: PDF_EXPORT_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY);

    // Kích thước chuẩn khổ A4 tính theo mm (210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    // Trang 1
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    // Nếu công thức dài hơn 1 trang A4, tự động phân trang
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
  } catch (err) {
    console.error('Lỗi khi xuất PDF:', err);
    throw err;
  }
}

/**
 * Kích hoạt hộp thoại in công thức theo chuẩn A4
 */
export function printRecipe() {
  window.print();
}
