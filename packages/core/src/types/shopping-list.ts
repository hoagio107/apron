export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: number | string;
  unit?: string;
  checked: boolean;
  created_at: string;
  group?: string;
}
