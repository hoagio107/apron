import { Capacitor } from '@capacitor/core';
import type { StorageProvider } from './types';
import { TauriStorageProvider } from './tauri';
import { CapacitorStorageProvider } from './capacitor';

export * from './types';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  // Nếu đang chạy trong môi trường Tauri (Desktop)
  // Tauri V2 inject window.__TAURI_INTERNALS__ hoặc chúng ta có thể check object window.__TAURI__
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
  
  if (isTauri) {
    cachedProvider = new TauriStorageProvider();
  } else if (Capacitor.isNativePlatform()) {
    // Nếu đang chạy trên Android / iOS qua Capacitor
    cachedProvider = new CapacitorStorageProvider();
  } else {
    // Fallback khi code chạy thử trên web browser (dev)
    console.warn('Đang chạy ở môi trường Web thuần, Storage sẽ tạm dùng TauriStorageProvider (hoặc có thể viết thêm IndexedDB Provider)');
    // Tạm gọi Tauri, ở chế độ web dev Tauri có plugin mock hoặc tự throw lỗi nếu không setup.
    cachedProvider = new TauriStorageProvider();
  }

  return cachedProvider;
}
