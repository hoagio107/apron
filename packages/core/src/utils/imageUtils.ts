export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MAX_VIDEO_SIZE_MB = 50;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 2000;
const DEFAULT_WEBP_QUALITY = 0.8;

/**
 * Validates if a file is an image or video and within the size limit.
 */
export function validateMediaFile(file: File): { valid: boolean; type: 'image' | 'video' | 'unknown'; error?: string } {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return { valid: false, type: 'unknown', error: 'Chỉ chấp nhận file ảnh hoặc video.' };
  }

  if (isImage && file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, type: 'image', error: `Ảnh vượt quá dung lượng cho phép (${MAX_FILE_SIZE_MB}MB).` };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return { valid: false, type: 'video', error: `Video vượt quá dung lượng cho phép (${MAX_VIDEO_SIZE_MB}MB).` };
  }

  return { valid: true, type: isImage ? 'image' : 'video' };
}

function renderImageElementToWebP(img: HTMLImageElement, quality: number): string {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}

/**
 * Converts an image File to a WebP Data URL.
 * Scales down if the image is too large.
 */
export function convertToWebP(file: File, quality = DEFAULT_WEBP_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(renderImageElementToWebP(img, quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts an image URL to a WebP Data URL.
 */
export function convertUrlToWebPDataUrl(url: string, quality = DEFAULT_WEBP_QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        resolve(renderImageElementToWebP(img, quality));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image from URL'));
    img.src = url;
  });
}

/**
 * Formats bytes into a human readable string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Normalizes a local image file path or URL into a portable relative `images/{filename}` path.
 */
export function toRelativeImagePath(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const normalized = path.replace(/\\/g, '/');
  const match = normalized.match(/(?:^|\/)images\/([^/]+)$/i);
  if (match) {
    return `images/${match[1]}`;
  }

  if (/^[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg|gif|svg)$/i.test(normalized)) {
    return `images/${normalized}`;
  }

  return normalized;
}


