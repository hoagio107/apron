
export type Difficulty = 'Dễ' | 'Vừa' | 'Khó';

export interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
  group?: string;
}

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
  ingredients: Ingredient[];
  steps: Step[];
  author_id: string;
  tags?: string[];
  notes?: string;
  video_url?: string;
  related_recipes?: RelatedRecipeRef[];
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
}

// Shopping List Types
export interface ExtraItem {
  id: string;
  name: string;
  is_checked: boolean;
}

export interface ShoppingList {
  recipe_ids: string[];
  extra_items: ExtraItem[];
  checked_ingredients: string[]; // List of ingredient names marked as bought
}

// Meal Plan Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanEntry {
  id: string;
  recipe_id: string;
  meal_type: MealType;
  notes?: string;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  meals: MealPlanEntry[];
}

export const MEAL_TYPE_LABELS: Record<MealType, { label: string, color: string }> = {
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
}

export interface CourseModule {
  id: string;
  title: string;
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

export interface MenuGroup {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  description?: string;
}

export interface Menu {
  id: string;
  title: string;
  slug: string;
  group_slug: string;
  image_url: string;
  description?: string;
  recipe_ids: string[];
  created_at?: string;
}

export interface CalorieItem {
  id: string;
  name: string;
  calories: number;
  quantity: number;
  unit: string;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  notes?: string;
}

export interface Unit {
  id: string;
  name: string;
  conversion_rate?: number;
  base_unit?: string;
}

export interface Tip {
  id: string;
  userId: string;
  title: string;
  slug: string;
  category_id: string;
  content: string;
  image_url?: string;
  createdAt: string;
}

export interface TipCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const TIP_CATEGORIES: TipCategory[] = [
  { id: 'cooking', name: 'Mẹo nấu ăn', icon: 'ChefHat', color: 'bg-orange-100 text-orange-600', description: 'Bí quyết giúp món ăn ngon hơn' },
  { id: 'cleaning', name: 'Mẹo vệ sinh', icon: 'Sparkles', color: 'bg-blue-100 text-blue-600', description: 'Giữ bếp luôn sạch bóng' },
  { id: 'preservation', name: 'Mẹo bảo quản', icon: 'Snowflake', color: 'bg-cyan-100 text-cyan-600', description: 'Giữ thực phẩm tươi lâu' },
  { id: 'shopping', name: 'Mẹo chọn mua', icon: 'ShoppingCart', color: 'bg-green-100 text-green-600', description: 'Chọn đồ tươi ngon nhất' },
  { id: 'prep', name: 'Mẹo sơ chế', icon: 'UtensilsCrossed', color: 'bg-yellow-100 text-yellow-600', description: 'Sơ chế nhanh và đúng cách' },
  { id: 'fixing', name: 'Mẹo "chữa cháy"', icon: 'LifeBuoy', color: 'bg-red-100 text-red-600', description: 'Cứu vãn các món ăn bị lỗi' },
  { id: 'organization', name: 'Sắp xếp & Tổ chức', icon: 'Layers', color: 'bg-purple-100 text-purple-600', description: 'Tối ưu không gian bếp' },
  { id: 'tools', name: 'Chăm sóc dụng cụ', icon: 'Wrench', color: 'bg-gray-100 text-gray-600', description: 'Bảo dưỡng nồi, chảo, dao' },
  { id: 'utilization', name: 'Mẹo tận dụng', icon: 'Recycle', color: 'bg-emerald-100 text-emerald-600', description: 'Tái chế & tránh lãng phí' }
];
