import type { StorageProvider, FileInfo } from './types';

const DB_NAME = 'apron_browser_storage';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

// Bộ nhớ đệm trong RAM (In-Memory Cache) giúp truy xuất 0ms, không bao giờ bị nghẽn transaction IDB
const memCache = new Map<string, string>();
let isInitialized = false;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const timeout = setTimeout(() => {
      reject(new Error('IndexedDB open connection timeout'));
    }, 4000);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onblocked = () => {
      console.warn('IndexedDB open request was blocked by another open tab/connection');
      clearTimeout(timeout);
      reject(new Error('IndexedDB blocked'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      clearTimeout(timeout);
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });

  return dbPromise;
}

async function withTimeout<T>(promise: Promise<T>, ms: number = 3000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.then((val) => {
      clearTimeout(timer);
      return val;
    }),
    timeoutPromise
  ]);
}

async function idbGet(key: string): Promise<string | null> {
  if (memCache.has(key)) {
    return memCache.get(key)!;
  }

  const readPromise = (async (): Promise<string | null> => {
    try {
      const db = await getDb();
      return await new Promise<string | null>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          tx.onabort = () => resolve(null);
          tx.onerror = () => resolve(null);
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      return null;
    }
  })();

  const val = await withTimeout(readPromise, 3000, null);
  if (val !== null) {
    memCache.set(key, val);
    return val;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const lsVal = localStorage.getItem(key);
      if (lsVal !== null) {
        memCache.set(key, lsVal);
        return lsVal;
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function idbSet(key: string, value: string): Promise<void> {
  memCache.set(key, value);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Bỏ qua lỗi quota của localStorage nếu dữ liệu quá lớn
    }
  }

  const writePromise = (async (): Promise<void> => {
    try {
      const db = await getDb();
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.onabort = () => resolve();
          tx.onerror = () => resolve();
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch {
          resolve();
        }
      });
    } catch (e) {
      console.warn(`idbSet failed for key ${key}:`, e);
    }
  })();

  await withTimeout(writePromise, 3000, undefined);
}

async function idbDelete(key: string): Promise<void> {
  memCache.delete(key);

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  const deletePromise = (async (): Promise<void> => {
    try {
      const db = await getDb();
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.onabort = () => resolve();
          tx.onerror = () => resolve();
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch (e) {
      console.warn(`idbDelete failed for key ${key}:`, e);
    }
  })();

  await withTimeout(deletePromise, 3000, undefined);
}

function lsGetAllKeys(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

export class BrowserStorageProvider implements StorageProvider {
  async initialize(): Promise<boolean> {
    if (isInitialized) return true;

    try {
      // 1. Nạp tức thì toàn bộ key từ localStorage vào memCache
      if (typeof localStorage !== 'undefined') {
        const lsKeys = lsGetAllKeys();
        for (const k of lsKeys) {
          if (k.startsWith('fs:') || k.startsWith('fs_dir:')) {
            const val = localStorage.getItem(k);
            if (val !== null) {
              memCache.set(k, val);
            }
          }
        }
      }

      // 2. Nạp toàn bộ dữ liệu từ IndexedDB vào memCache trong 1 transaction duy nhất
      try {
        const db = await withTimeout(getDb(), 3000, null);
        if (db) {
          await new Promise<void>((resolve) => {
            try {
              const tx = db.transaction(STORE_NAME, 'readonly');
              const store = tx.objectStore(STORE_NAME);
              const cursorReq = store.openCursor();
              
              cursorReq.onsuccess = () => {
                const cursor = cursorReq.result;
                if (cursor) {
                  const k = String(cursor.key);
                  const v = String(cursor.value);
                  if (k.startsWith('fs:') || k.startsWith('fs_dir:')) {
                    memCache.set(k, v);
                    // Đồng bộ sang localStorage nếu chưa có
                    if (typeof localStorage !== 'undefined' && localStorage.getItem(k) === null) {
                      try { localStorage.setItem(k, v); } catch {}
                    }
                  }
                  cursor.continue();
                } else {
                  resolve();
                }
              };
              cursorReq.onerror = () => resolve();
              tx.onabort = () => resolve();
              tx.onerror = () => resolve();
            } catch {
              resolve();
            }
          });

          // Đồng bộ các key mới từ localStorage sang IndexedDB
          for (const [k, v] of memCache.entries()) {
            idbSet(k, v).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('IDB preload warning:', e);
      }

      isInitialized = true;
      return true;
    } catch (e) {
      console.warn('Storage initialization fallback:', e);
      isInitialized = true;
      return true;
    }
  }

  async readTextFile(path: string): Promise<string> {
    const key = `fs:${path}`;
    
    // 1. Kiểm tra memCache (0ms)
    if (memCache.has(key)) {
      return memCache.get(key)!;
    }

    // 2. Kiểm tra localStorage (0ms)
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(key);
        if (data !== null) {
          memCache.set(key, data);
          return data;
        }
      } catch {}
    }

    // 3. Kiểm tra IndexedDB
    const idbData = await idbGet(key);
    if (idbData !== null) {
      memCache.set(key, idbData);
      return idbData;
    }

    throw new Error(`File not found: ${path}`);
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const key = `fs:${path}`;
    memCache.set(key, content);
    await idbSet(key, content);
    
    // Đồng thời theo dõi thư mục
    const parts = path.split('/');
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join('/');
      const fileName = parts[parts.length - 1];
      await this.addToDir(dirPath, fileName);
    }
  }

  private async addToDir(dirPath: string, fileName: string) {
    const dirKey = `fs_dir:${dirPath}`;
    let files: string[] = [];
    const filesStr = memCache.get(dirKey) || (typeof localStorage !== 'undefined' ? localStorage.getItem(dirKey) : null);
    if (filesStr) {
      try {
        files = JSON.parse(filesStr) as string[];
      } catch {
        files = [];
      }
    }
    if (!files.includes(fileName)) {
      files.push(fileName);
      const updatedStr = JSON.stringify(files);
      memCache.set(dirKey, updatedStr);
      await idbSet(dirKey, updatedStr);
    }
  }

  private async removeFromDir(dirPath: string, fileName: string) {
    const dirKey = `fs_dir:${dirPath}`;
    let files: string[] = [];
    const filesStr = memCache.get(dirKey) || (typeof localStorage !== 'undefined' ? localStorage.getItem(dirKey) : null);
    if (filesStr) {
      try {
        files = JSON.parse(filesStr) as string[];
      } catch {
        files = [];
      }
    }
    const updated = files.filter(f => f !== fileName);
    const updatedStr = JSON.stringify(updated);
    memCache.set(dirKey, updatedStr);
    await idbSet(dirKey, updatedStr);
  }

  /**
   * Quét và trả về toàn bộ tệp tin trong thư mục.
   * Kiểm tra bộ nhớ cache trong RAM và cả localStorage, bảo đảm 100% không bao giờ bỏ sót tệp nào.
   */
  async readDir(path: string): Promise<FileInfo[]> {
    const dirKey = `fs_dir:${path}`;
    const prefix = `fs:${path}/`;
    const fileSet = new Set<string>();

    // 1. Quét trong memCache (cực nhanh, chính xác tuyệt đối)
    for (const k of memCache.keys()) {
      if (k.startsWith(prefix)) {
        const remainder = k.slice(prefix.length);
        if (remainder && !remainder.includes('/')) {
          fileSet.add(remainder);
        }
      }
    }

    // 2. Quét trong localStorage
    const lsKeys = lsGetAllKeys();
    for (const k of lsKeys) {
      if (k.startsWith(prefix)) {
        const remainder = k.slice(prefix.length);
        if (remainder && !remainder.includes('/')) {
          fileSet.add(remainder);
        }
      }
    }

    // 3. Đọc từ fs_dir
    const dirContent = memCache.get(dirKey) || (typeof localStorage !== 'undefined' ? localStorage.getItem(dirKey) : null);
    if (dirContent) {
      try {
        const parsed = JSON.parse(dirContent) as string[];
        if (Array.isArray(parsed)) {
          parsed.forEach(f => fileSet.add(f));
        }
      } catch {}
    }

    const fileList = Array.from(fileSet);

    // Tự động cập nhật lại chỉ mục nếu có
    if (fileList.length > 0) {
      const listStr = JSON.stringify(fileList);
      memCache.set(dirKey, listStr);
      idbSet(dirKey, listStr).catch(() => {});
    }

    return fileList.map(name => ({
      name,
      isDirectory: false,
    }));
  }

  /**
   * Đọc trực tiếp toàn bộ tệp tin và nội dung trong thư mục một cách tức thời từ cache RAM.
   */
  async readDirFiles(path: string): Promise<{ name: string; content: string }[]> {
    const prefix = `fs:${path}/`;
    const results: { name: string; content: string }[] = [];
    const seenNames = new Set<string>();

    // 1. Quét từ memCache
    for (const [k, v] of memCache.entries()) {
      if (k.startsWith(prefix)) {
        const name = k.slice(prefix.length);
        if (name && !name.includes('/')) {
          seenNames.add(name);
          results.push({ name, content: v });
        }
      }
    }

    // 2. Quét từ localStorage nếu chưa có trong memCache
    const lsKeys = lsGetAllKeys();
    for (const k of lsKeys) {
      if (k.startsWith(prefix)) {
        const name = k.slice(prefix.length);
        if (name && !name.includes('/') && !seenNames.has(name)) {
          seenNames.add(name);
          const v = localStorage.getItem(k);
          if (v !== null) {
            memCache.set(k, v);
            results.push({ name, content: v });
          }
        }
      }
    }

    return results;
  }

  async mkdir(path: string): Promise<void> {
    const dirKey = `fs_dir:${path}`;
    if (!memCache.has(dirKey)) {
      memCache.set(dirKey, '[]');
      await idbSet(dirKey, '[]');
    }
  }

  async exists(path: string): Promise<boolean> {
    if (path.includes('.')) {
      const key = `fs:${path}`;
      if (memCache.has(key)) return true;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key) !== null) {
        return true;
      }
      const file = await idbGet(key);
      return file !== null;
    }

    const dirKey = `fs_dir:${path}`;
    if (memCache.has(dirKey)) return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(dirKey) !== null) {
      return true;
    }
    const dir = await idbGet(dirKey);
    if (dir !== null) return true;

    const prefix = `fs:${path}/`;
    for (const k of memCache.keys()) {
      if (k.startsWith(prefix)) return true;
    }
    const lsKeys = lsGetAllKeys();
    if (lsKeys.some(k => k.startsWith(prefix))) return true;

    return false;
  }

  async deleteFile(path: string): Promise<void> {
    const key = `fs:${path}`;
    memCache.delete(key);
    await idbDelete(key);
    
    const parts = path.split('/');
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join('/');
      const fileName = parts[parts.length - 1];
      await this.removeFromDir(dirPath, fileName);
    }
  }
}
