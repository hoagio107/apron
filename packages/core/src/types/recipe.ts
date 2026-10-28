
export type Difficulty = 'Dễ' | 'Vừa' | 'Khó';

export interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
  group?: string;
  ingredient_id?: string;
}

export type RecipeIngredient = Ingredient;

export interface Step {
  instruction: string;
  image_url?: string;
  images?: string[];
  group?: string;
}

export interface RelatedRecipeRef {
  id: string;
  title: string;
  slug: string;
  image_url: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  icon?: string;
  description?: string;
}

export interface CookingHistory {
  id: string;
  date: string;
  rating: number;
  notes?: string;
  recipe_snapshot?: Omit<Recipe, 'cooking_history'>;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  parent_id?: string | null;
  prep_time: number;
  cook_time: number;
  difficulty: Difficulty;
  calories: number;
  taste_score: number;
  servings: number;
  main_ingredients?: string[];
  cooking_method?: string;
  dish_type?: string;
  cuisine?: string;
  occasions?: string[];
  dietary?: string[];
  source?: string;
  description?: string;
  thumbnail_url?: string;
  total_time_minutes?: number;
  ingredients: Ingredient[];
  steps: Step[];
  author_id: string;
  tags?: string[];
  notes?: string;
  video_url?: string;
  images?: string[];
  related_recipes?: RelatedRecipeRef[];
  linked_tips?: string[];
  cooking_history?: CookingHistory[];
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  category?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// Meal Plan Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;

export interface MealSlotConfig {
  id: string; // usually same as meal_type, e.g., 'breakfast' or custom uuid
  name: string; // display name, e.g., 'Bữa sáng'
}

export interface MealPlanEntry {
  id: string;
  recipe_id?: string;
  meal_type: MealType; // references MealSlotConfig.id
  notes?: string;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  slots: MealSlotConfig[]; // Ordered list of slots for the day
  meals: MealPlanEntry[];
}

export const MEAL_TYPE_LABELS: Record<string, { label: string, color: string }> = {
  breakfast: { label: 'Bữa sáng', color: 'bg-blue-100 text-blue-600' },
  lunch: { label: 'Bữa trưa', color: 'bg-orange-100 text-orange-600' },
  dinner: { label: 'Bữa tối', color: 'bg-purple-100 text-purple-600' },
  snack: { label: 'Ăn nhẹ', color: 'bg-green-100 text-green-600' }
};

// Course specific types
export interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url?: string;
  duration_minutes?: number;
  attached_recipe_ids?: string[];
  hero_image_url?: string;
  rating?: number;
  notes?: string;
  attachments?: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  icon?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  author_id: string;
  level: 'Cơ bản' | 'Nâng cao' | 'Chuyên gia';
  modules: CourseModule[];
  created_at?: string;
  source?: string;
  teacher?: string;
  rating?: number;
}

export const MAIN_INGREDIENTS = [
  {
    group: 'Thịt',
    items: [
      { id: 'pork', name: 'Thịt heo' },
      { id: 'beef', name: 'Thịt bò' },
      { id: 'chicken', name: 'Gà / Vịt' },
      { id: 'lamb', name: 'Cừu / Dê' }
    ]
  },
  {
    group: 'Hải sản',
    items: [
      { id: 'fish', name: 'Cá' },
      { id: 'shrimp', name: 'Tôm' },
      { id: 'crab', name: 'Cua / Ghẹ' },
      { id: 'squid', name: 'Mực / Bạch tuộc' }
    ]
  },
  {
    group: 'Rau củ & Nấm',
    items: [
      { id: 'vegetable', name: 'Rau lá xanh' },
      { id: 'root-veg', name: 'Củ quả' },
      { id: 'mushroom', name: 'Nấm các loại' },
      { id: 'tofu', name: 'Đậu phụ' }
    ]
  },
  {
    group: 'Ngũ cốc & Tinh bột',
    items: [
      { id: 'rice', name: 'Gạo / Cơm' },
      { id: 'noodle', name: 'Mì / Bún / Phở' },
      { id: 'bread', name: 'Bánh mì' },
      { id: 'oats', name: 'Yến mạch' }
    ]
  }
];

export const COOKING_METHODS = [
  {
    group: 'Nấu ướt',
    items: [
      { id: 'soup', name: 'Canh / Súp' },
      { id: 'stew', name: 'Hầm / Ninh' },
      { id: 'braise', name: 'Kho / Om' },
      { id: 'steam', name: 'Hấp / Luộc' }
    ]
  },
  {
    group: 'Nấu khô',
    items: [
      { id: 'fry', name: 'Chiên / Rán' },
      { id: 'stir-fry', name: 'Xào' },
      { id: 'grill', name: 'Nướng' },
      { id: 'bake', name: 'Làm bánh' }
    ]
  }
];

export const DISH_TYPES = [
  { id: 'main', name: 'Món chính (Cơm)' },
  { id: 'noodle-soup', name: 'Món nước (Bún/Phở)' },
  { id: 'appetizer', name: 'Khai vị / Ăn nhẹ' },
  { id: 'dessert', name: 'Tráng miệng' },
  { id: 'drink', name: 'Đồ uống' },
  { id: 'sauce', name: 'Nước chấm / Sốt' }
];

export const CUISINES = [
  { id: 'vn-north', name: 'Việt Nam - Miền Bắc' },
  { id: 'vn-central', name: 'Việt Nam - Miền Trung' },
  { id: 'vn-south', name: 'Việt Nam - Miền Nam' },
  { id: 'western', name: 'Âu Mỹ' },
  { id: 'korean', name: 'Hàn Quốc' },
  { id: 'japanese', name: 'Nhật Bản' }
];

export const OCCASIONS = [
  { id: 'breakfast', name: 'Bữa sáng' },
  { id: 'lunch', name: 'Bữa trưa' },
  { id: 'dinner', name: 'Bữa tối' },
  { id: 'snack', name: 'Ăn vặt' },
  { id: 'weekend', name: 'Cuối tuần' },
  { id: 'party', name: 'Tiệc tùng' }
];

export const DIETARY = [
  { id: 'healthy', name: 'Eat Clean / Healthy' },
  { id: 'keto', name: 'Keto / Low-carb' },
  { id: 'vegan', name: 'Thuần chay' },
  { id: 'diet', name: 'Giảm cân' }
];

export const DEFAULT_TAGS: Tag[] = [
  // Nhóm Bữa ăn / Dịp
  { id: 'root-meal', name: 'Bữa ăn / Dịp lễ', slug: 'bua-an-dip-le', parent_id: null },
  { id: '1', name: 'Bữa sáng', slug: 'bua-sang', parent_id: 'root-meal' },
  { id: '2', name: 'Điểm tâm', slug: 'diem-tam', parent_id: '1' },
  { id: '3', name: 'Bánh mì', slug: 'banh-mi', parent_id: '1' },
  { id: '4', name: 'Bữa chính (Trưa/Tối)', slug: 'bua-chinh', parent_id: 'root-meal' },
  { id: '5', name: 'Cơm gia đình', slug: 'com-gia-dinh', parent_id: '4' },
  { id: '6', name: 'Món tiệc', slug: 'mon-tiec', parent_id: 'root-meal' },
  { id: '7', name: 'Ăn vặt', slug: 'an-vat', parent_id: 'root-meal' },
  { id: 'occasion-weekend', name: 'Cuối tuần', slug: 'cuoi-tuan', parent_id: 'root-meal' },

  // Nhóm Loại món
  { id: 'root-dish-type', name: 'Loại món', slug: 'loai-mon', parent_id: null },
  { id: 'dish-main', name: 'Món chính (Cơm)', slug: 'mon-chinh-com', parent_id: 'root-dish-type' },
  { id: 'dish-noodle', name: 'Món nước (Bún/Phở)', slug: 'mon-nuoc', parent_id: 'root-dish-type' },
  { id: 'dish-appetizer', name: 'Khai vị / Ăn nhẹ', slug: 'khai-vi', parent_id: 'root-dish-type' },
  { id: '8', name: 'Đồ uống', slug: 'do-uong', parent_id: 'root-dish-type' },
  { id: '9', name: 'Tráng miệng', slug: 'trang-mieng', parent_id: 'root-dish-type' },
  { id: 'dish-sauce', name: 'Nước chấm / Sốt', slug: 'nuoc-cham', parent_id: 'root-dish-type' },

  // Nhóm Văn hóa ẩm thực
  { id: 'root-cuisine', name: 'Văn hóa ẩm thực', slug: 'van-hoa-am-thuc', parent_id: null },
  { id: 'cuisine-vn-north', name: 'Việt Nam - Miền Bắc', slug: 'vn-bac', parent_id: 'root-cuisine' },
  { id: 'cuisine-vn-central', name: 'Việt Nam - Miền Trung', slug: 'vn-trung', parent_id: 'root-cuisine' },
  { id: 'cuisine-vn-south', name: 'Việt Nam - Miền Nam', slug: 'vn-nam', parent_id: 'root-cuisine' },
  { id: 'cuisine-western', name: 'Âu Mỹ', slug: 'au-my', parent_id: 'root-cuisine' },
  { id: 'cuisine-korean', name: 'Hàn Quốc', slug: 'han-quoc', parent_id: 'root-cuisine' },
  { id: 'cuisine-japanese', name: 'Nhật Bản', slug: 'nhat-ban', parent_id: 'root-cuisine' },

  // Nhóm Cách chế biến
  { id: 'root-cooking', name: 'Cách chế biến', slug: 'cach-che-bien', parent_id: null },
  { id: 'cook-soup', name: 'Canh / Súp', slug: 'canh-sup', parent_id: 'root-cooking' },
  { id: 'cook-stew', name: 'Hầm / Ninh', slug: 'ham-ninh', parent_id: 'root-cooking' },
  { id: 'cook-braise', name: 'Kho / Om', slug: 'kho-om', parent_id: 'root-cooking' },
  { id: 'cook-steam', name: 'Hấp / Luộc', slug: 'hap-luoc', parent_id: 'root-cooking' },
  { id: 'cook-fry', name: 'Chiên / Rán', slug: 'chien-ran', parent_id: 'root-cooking' },
  { id: 'cook-stir-fry', name: 'Xào', slug: 'xao', parent_id: 'root-cooking' },
  { id: 'cook-grill', name: 'Nướng', slug: 'nuong', parent_id: 'root-cooking' },
  { id: 'cook-bake', name: 'Làm bánh', slug: 'lam-banh', parent_id: 'root-cooking' },

  // Nhóm Nguyên liệu chính
  { id: 'root-ingredient', name: 'Nguyên liệu chính', slug: 'nguyen-lieu-chinh', parent_id: null },
  { id: 'ing-meat', name: 'Thịt các loại', slug: 'thit', parent_id: 'root-ingredient' },
  { id: 'ing-pork', name: 'Thịt heo', slug: 'thit-heo', parent_id: 'ing-meat' },
  { id: 'ing-beef', name: 'Thịt bò', slug: 'thit-bo', parent_id: 'ing-meat' },
  { id: 'ing-chicken', name: 'Gà / Vịt', slug: 'ga-vit', parent_id: 'ing-meat' },
  { id: 'ing-seafood', name: 'Hải sản', slug: 'hai-san', parent_id: 'root-ingredient' },
  { id: 'ing-fish', name: 'Cá', slug: 'ca', parent_id: 'ing-seafood' },
  { id: 'ing-shrimp', name: 'Tôm', slug: 'tom', parent_id: 'ing-seafood' },
  { id: 'ing-veg', name: 'Rau củ & Nấm', slug: 'rau-cu-nam', parent_id: 'root-ingredient' },
  { id: 'ing-mushroom', name: 'Nấm', slug: 'nam', parent_id: 'ing-veg' },
  { id: 'ing-tofu', name: 'Đậu phụ', slug: 'dau-phu', parent_id: 'root-ingredient' },

  // Nhóm Chế độ ăn
  { id: 'root-diet', name: 'Chế độ ăn', slug: 'che-do-an', parent_id: null },
  { id: 'diet-healthy', name: 'Eat Clean / Healthy', slug: 'eat-clean', parent_id: 'root-diet' },
  { id: 'diet-keto', name: 'Keto / Low-carb', slug: 'keto', parent_id: 'root-diet' },
  { id: 'diet-vegan', name: 'Thuần chay', slug: 'thuan-chay', parent_id: 'root-diet' },
  { id: 'diet-weight', name: 'Giảm cân', slug: 'giam-can', parent_id: 'root-diet' },

  // Nhóm Thời gian & Độ khó
  { id: 'root-time-difficulty', name: 'Thời gian & Độ khó', slug: 'thoi-gian-do-kho', parent_id: null },
];

export const DEFAULT_TAGS_MAP: ReadonlyMap<string, Tag> = new Map(
  DEFAULT_TAGS.map((t) => [t.id, t])
);

export interface Unit {
  id: string;
  name: string;
  conversion_rate?: number;
  base_unit?: string;
}
