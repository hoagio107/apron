import { create } from 'zustand';
import { CollectionRepository } from '../db/collection-repository';
import type { Collection, CollectionFolder, CollectionItem } from '../types/collection';

interface CollectionState {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  fetchCollections: (force?: boolean) => Promise<void>;
  addCollection: (collection: Collection) => Promise<void>;
  updateCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  deleteBulkCollections: (ids: string[]) => Promise<void>;

  // Folder / Item operations on active collection
  addFolder: (collectionId: string, folder: CollectionFolder) => Promise<void>;
  updateFolder: (collectionId: string, folder: CollectionFolder) => Promise<void>;
  deleteFolder: (collectionId: string, folderId: string) => Promise<void>;

  addItemToFolder: (collectionId: string, folderId: string, item: CollectionItem) => Promise<void>;
  updateItemInFolder: (collectionId: string, folderId: string, item: CollectionItem) => Promise<void>;
  deleteItemFromFolder: (collectionId: string, folderId: string, itemId: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchCollections: async (force = false) => {
    if (!force && get().hasFetched && get().collections.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await CollectionRepository.getAll();
      set({ collections: data, isLoading: false, hasFetched: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch collections';
      set({ error: msg, isLoading: false });
    }
  },

  addCollection: async (collection: Collection) => {
    try {
      await CollectionRepository.save(collection);
      const newCollection = { ...collection, id: collection.id || crypto.randomUUID() };
      set((state) => ({ collections: [newCollection, ...state.collections] }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add collection';
      set({ error: msg });
      throw e;
    }
  },

  updateCollection: async (collection: Collection) => {
    try {
      await CollectionRepository.save(collection);
      set((state) => ({
        collections: state.collections.map((c) => (c.id === collection.id ? collection : c)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update collection';
      set({ error: msg });
      throw e;
    }
  },

  deleteCollection: async (id: string) => {
    try {
      await CollectionRepository.delete(id);
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete collection';
      set({ error: msg });
      throw e;
    }
  },

  deleteBulkCollections: async (ids: string[]) => {
    try {
      await CollectionRepository.deleteBulk(ids);
      const idSet = new Set(ids);
      set((state) => ({
        collections: state.collections.filter((c) => !idSet.has(c.id)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to bulk delete collections';
      set({ error: msg });
      throw e;
    }
  },

  addFolder: async (collectionId: string, folder: CollectionFolder) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: [...(col.folders || []), folder],
    };
    await get().updateCollection(updated);
  },

  updateFolder: async (collectionId: string, folder: CollectionFolder) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map((f) => (f.id === folder.id ? folder : f)),
    };
    await get().updateCollection(updated);
  },

  deleteFolder: async (collectionId: string, folderId: string) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).filter((f) => f.id !== folderId),
    };
    await get().updateCollection(updated);
  },

  addItemToFolder: async (collectionId: string, folderId: string, item: CollectionItem) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: [item, ...(f.items || [])],
        };
      }),
    };
    await get().updateCollection(updated);
  },

  updateItemInFolder: async (collectionId: string, folderId: string, item: CollectionItem) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: (f.items || []).map((i) => (i.id === item.id ? item : i)),
        };
      }),
    };
    await get().updateCollection(updated);
  },

  deleteItemFromFolder: async (collectionId: string, folderId: string, itemId: string) => {
    const col = get().collections.find((c) => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map((f) => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: (f.items || []).filter((i) => i.id !== itemId),
        };
      }),
    };
    await get().updateCollection(updated);
  },
}));
