export interface CollectionItem {
  id: string;
  title: string;
  image_url?: string;
  recipe_id?: string;
  notes?: string;
  created_at?: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  items: CollectionItem[];
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  folders: CollectionFolder[];
  created_at?: string;
  updated_at?: string;
}
