export interface Tip {
  id: string;
  title: string;
  category_id: string;
  content: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
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
