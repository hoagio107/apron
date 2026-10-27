import { describe, it, expect, beforeEach } from 'vitest';
import { useCollectionStore } from '../store/useCollectionStore';
import { setStorageProvider } from '../storage';
import { MockStorageProvider } from './mockStorage';
import type { Collection, CollectionFolder, CollectionItem } from '../types/collection';

describe('useCollectionStore', () => {
  beforeEach(() => {
    const mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
    useCollectionStore.setState({ collections: [], isLoading: false, error: null });
  });

  const baseCollection: Collection = {
    id: 'col-1',
    title: 'Thực đơn ăn dặm cho bé',
    description: 'Tổng hợp các món dinh dưỡng',
    folders: [
      {
        id: 'f-1',
        name: 'Giai đoạn 1',
        items: []
      }
    ],
    created_at: new Date().toISOString()
  };

  it('adds a collection and updates store state', async () => {
    await useCollectionStore.getState().addCollection(baseCollection);

    const { collections } = useCollectionStore.getState();
    expect(collections).toHaveLength(1);
    expect(collections[0].title).toBe('Thực đơn ăn dặm cho bé');
    expect(collections[0].folders).toHaveLength(1);
  });

  it('updates a collection in store state', async () => {
    await useCollectionStore.getState().addCollection(baseCollection);

    const updated: Collection = {
      ...baseCollection,
      title: 'Thực đơn ăn dặm cho bé (Đã cập nhật)'
    };
    await useCollectionStore.getState().updateCollection(updated);

    const { collections } = useCollectionStore.getState();
    expect(collections[0].title).toBe('Thực đơn ăn dặm cho bé (Đã cập nhật)');
  });

  it('adds and updates folders within a collection', async () => {
    await useCollectionStore.getState().addCollection(baseCollection);

    const newFolder: CollectionFolder = {
      id: 'f-2',
      name: 'Giai đoạn 2 (7-8 tháng)',
      items: []
    };
    await useCollectionStore.getState().addFolder('col-1', newFolder);

    let col = useCollectionStore.getState().collections.find(c => c.id === 'col-1');
    expect(col?.folders).toHaveLength(2);
    expect(col?.folders?.[1].name).toBe('Giai đoạn 2 (7-8 tháng)');

    // Update folder name
    await useCollectionStore.getState().updateFolder('col-1', {
      id: 'f-2',
      name: 'Giai đoạn 2 (Ăn thô)',
      items: []
    });

    col = useCollectionStore.getState().collections.find(c => c.id === 'col-1');
    expect(col?.folders?.[1].name).toBe('Giai đoạn 2 (Ăn thô)');
  });

  it('adds and deletes items within a folder', async () => {
    await useCollectionStore.getState().addCollection(baseCollection);

    const item: CollectionItem = {
      id: 'item-1',
      title: 'Cháo rây 1:10',
      image_url: 'chao-ray.jpg',
      notes: 'Bắt đầu tuần đầu tiên'
    };

    await useCollectionStore.getState().addItemToFolder('col-1', 'f-1', item);

    let col = useCollectionStore.getState().collections.find(c => c.id === 'col-1');
    expect(col?.folders?.[0].items).toHaveLength(1);
    expect(col?.folders?.[0].items?.[0].title).toBe('Cháo rây 1:10');

    // Delete item
    await useCollectionStore.getState().deleteItemFromFolder('col-1', 'f-1', 'item-1');
    col = useCollectionStore.getState().collections.find(c => c.id === 'col-1');
    expect(col?.folders?.[0].items).toHaveLength(0);
  });

  it('deletes a collection from store state', async () => {
    await useCollectionStore.getState().addCollection(baseCollection);
    expect(useCollectionStore.getState().collections).toHaveLength(1);

    await useCollectionStore.getState().deleteCollection('col-1');
    expect(useCollectionStore.getState().collections).toHaveLength(0);
  });
});
