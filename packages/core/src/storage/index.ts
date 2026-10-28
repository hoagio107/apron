import { Capacitor } from '@capacitor/core';
import type { StorageProvider } from './types';
import { TauriStorageProvider } from './tauri';
import { CapacitorStorageProvider } from './capacitor';
import { BrowserStorageProvider } from './browser';

export * from './types';

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  // Nếu đang chạy trong môi trường Tauri (Desktop)
  const isTauri = typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined;

  if (isTauri) {
    cachedProvider = new TauriStorageProvider();
  } else if (Capacitor.isNativePlatform()) {
    // Nếu đang chạy trên Android / iOS qua Capacitor
    cachedProvider = new CapacitorStorageProvider();
  } else {
    // Fallback khi chạy trên web browser
    cachedProvider = new BrowserStorageProvider();
  }

  return cachedProvider;
}

export function setStorageProvider(provider: StorageProvider | null): void {
  cachedProvider = provider;
}
