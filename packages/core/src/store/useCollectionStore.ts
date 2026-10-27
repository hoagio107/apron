import { create } from 'zustand';
import { CollectionRepository } from '../db/collection-repository';
import type { Collection, CollectionFolder, CollectionItem } from '../types/collection';

interface CollectionState {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCollections: () => Promise<void>;
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

  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await CollectionRepository.getAll();
      set({ collections: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch collections', isLoading: false });
    }
  },

  addCollection: async (collection: Collection) => {
    try {
      await CollectionRepository.save(collection);
      const newCollection = { ...collection, id: collection.id || crypto.randomUUID() };
      set((state) => ({ collections: [newCollection, ...state.collections] }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to add collection' });
      throw e;
    }
  },

  updateCollection: async (collection: Collection) => {
    try {
      await CollectionRepository.save(collection);
      set((state) => ({
        collections: state.collections.map(c => c.id === collection.id ? collection : c)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to update collection' });
      throw e;
    }
  },

  deleteCollection: async (id: string) => {
    try {
      await CollectionRepository.delete(id);
      set((state) => ({
        collections: state.collections.filter(c => c.id !== id)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete collection' });
      throw e;
    }
  },

  deleteBulkCollections: async (ids: string[]) => {
    try {
      await CollectionRepository.deleteBulk(ids);
      set((state) => ({
        collections: state.collections.filter(c => !ids.includes(c.id))
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk delete collections' });
      throw e;
    }
  },

  addFolder: async (collectionId: string, folder: CollectionFolder) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: [...(col.folders || []), folder]
    };
    await get().updateCollection(updated);
  },

  updateFolder: async (collectionId: string, folder: CollectionFolder) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map(f => f.id === folder.id ? folder : f)
    };
    await get().updateCollection(updated);
  },

  deleteFolder: async (collectionId: string, folderId: string) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).filter(f => f.id !== folderId)
    };
    await get().updateCollection(updated);
  },

  addItemToFolder: async (collectionId: string, folderId: string, item: CollectionItem) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map(f => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: [item, ...(f.items || [])]
        };
      })
    };
    await get().updateCollection(updated);
  },

  updateItemInFolder: async (collectionId: string, folderId: string, item: CollectionItem) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map(f => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: (f.items || []).map(i => i.id === item.id ? item : i)
        };
      })
    };
    await get().updateCollection(updated);
  },

  deleteItemFromFolder: async (collectionId: string, folderId: string, itemId: string) => {
    const col = get().collections.find(c => c.id === collectionId);
    if (!col) return;
    const updated: Collection = {
      ...col,
      folders: (col.folders || []).map(f => {
        if (f.id !== folderId) return f;
        return {
          ...f,
          items: (f.items || []).filter(i => i.id !== itemId)
        };
      })
    };
    await get().updateCollection(updated);
  }
}));
