import { describe, it, expect, beforeEach } from 'vitest';
import { useShoppingListStore } from '../store/useShoppingListStore';
import { setStorageProvider } from '../storage';
import { MockStorageProvider } from './mockStorage';
import { CATEGORIES } from '../utils/ingredientParser';

describe('useShoppingListStore', () => {
  beforeEach(() => {
    const mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
    useShoppingListStore.setState({ items: [], isLoading: false });
  });

  it('adds an item and automatically categorizes group', async () => {
    await useShoppingListStore.getState().addItem('Thịt bò bắp', 500, 'g');

    const { items } = useShoppingListStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Thịt bò bắp');
    expect(items[0].quantity).toBe(500);
    expect(items[0].unit).toBe('g');
    expect(items[0].group).toBe(CATEGORIES.MEAT_SEAFOOD);
    expect(items[0].checked).toBe(false);
  });

  it('adds multiple items via addItems', async () => {
    await useShoppingListStore.getState().addItems([
      { name: 'Rau muống', quantity: 1, unit: 'bó' },
      { name: 'Trứng gà', quantity: 10, unit: 'quả' }
    ]);

    const { items } = useShoppingListStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].group).toBe(CATEGORIES.VEGGIES);
    expect(items[1].group).toBe(CATEGORIES.DAIRY_EGGS);
  });

  it('toggles item checked status', async () => {
    await useShoppingListStore.getState().addItem('Muối trắng');
    const itemId = useShoppingListStore.getState().items[0].id;

    await useShoppingListStore.getState().toggleItem(itemId);
    expect(useShoppingListStore.getState().items[0].checked).toBe(true);

    await useShoppingListStore.getState().toggleItem(itemId);
    expect(useShoppingListStore.getState().items[0].checked).toBe(false);
  });

  it('clears completed items', async () => {
    await useShoppingListStore.getState().addItem('Item 1');
    await useShoppingListStore.getState().addItem('Item 2');
    const id1 = useShoppingListStore.getState().items[0].id;

    await useShoppingListStore.getState().toggleItem(id1);
    expect(useShoppingListStore.getState().items.find(i => i.id === id1)?.checked).toBe(true);

    await useShoppingListStore.getState().clearCompleted();
    const remaining = useShoppingListStore.getState().items;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Item 2');
  });
});
