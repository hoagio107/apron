export type PantryItemStatus = 'fresh' | 'near_expiry' | 'expired';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number | string;
  unit: string;
  group?: string;
  expiry_date?: string; // YYYY-MM-DD
  added_date: string; // YYYY-MM-DD
  notes?: string;
}
