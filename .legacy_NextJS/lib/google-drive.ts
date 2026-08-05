/**
 * @fileOverview Dịch vụ tải ảnh và sao lưu dữ liệu lên Google Drive thông qua Google Apps Script Proxy.
 */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrLa-SrJnWSAA6nIIbo_UFpt2DxGNE9x-zVDINiwEr1N3Rrcoh0wumtO2KZ-bCHj9xeA/exec';
const FOLDER_ID = '10T-0NN0bILfD8rr2KgMKnTP9sydoATXq';

/**
 * Helper để chuyển đổi File hoặc Blob sang chuỗi Data URI (Base64).
 */
async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string || '');
    reader.onerror = error => reject(error);
  });
}

/**
 * Tải ảnh lên thư mục được chỉ định trên Google Drive.
 */
export async function uploadImageToDrive(file: File): Promise<string> {
  try {
    const base64 = await fileToBase64(file);

    if (!base64) throw new Error('Không thể đọc dữ liệu tệp tin.');

    const payload = {
      folderId: FOLDER_ID,
      file: base64,
      filename: file.name,
      mimeType: file.type
    };

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Kết nối thất bại (HTTP ${response.status})`);
    }

    const result = await response.json();
    
    if (result && result.success && result.url) {
      return result.url;
    } else {
      throw new Error(result?.error?.toString() || 'Máy chủ không trả về đường dẫn ảnh.');
    }
  } catch (error: any) {
    console.error('Upload error detail:', error);
    throw new Error(error?.message || 'Lỗi không xác định khi tải ảnh.');
  }
}

/**
 * Sao lưu toàn bộ dữ liệu JSON lên Drive. 
 * Đã cập nhật để gửi file dưới dạng Base64 tương thích với script proxy.
 */
export async function saveBackupToDrive(jsonString: string): Promise<boolean> {
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const base64 = await fileToBase64(blob);

    const payload = {
      action: 'backup',
      folderId: FOLDER_ID,
      file: base64,
      filename: `my-recipe-backup-${new Date().toISOString().substring(0, 10)}.json`,
      mimeType: 'application/json'
    };

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Máy chủ sao lưu phản hồi lỗi (HTTP ${response.status})`);
    }

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      if (responseText.includes('google-signin') || responseText.includes('Service-side error')) {
        throw new Error('Cần cấp quyền truy cập Drive. Vui lòng kiểm tra lại cấu hình Google Apps Script.');
      }
      throw new Error('Dữ liệu từ máy chủ không hợp lệ (Không phải JSON).');
    }

    if (result && result.success) {
      return true;
    } else {
      const rawError = result?.error;
      const errorMsg = typeof rawError === 'string' ? rawError : (rawError ? JSON.stringify(rawError) : 'Lỗi sao lưu Drive không xác định');
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('Backup error detail:', error);
    throw new Error(error?.message || 'Không thể thực hiện sao lưu lên Google Drive.');
  }
}
