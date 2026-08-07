import type { Recipe } from '@apron/core';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Phở Bò Gia Truyền',
    slug: 'pho-bo-gia-truyen',
    image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?q=80&w=1000&auto=format&fit=crop',
    prep_time: 30,
    cook_time: 240,
    difficulty: 'Khó',
    calories: 450,
    taste_score: 4.8,
    servings: 4,
    tags: ['Món nước', 'Việt Nam - Miền Bắc', 'Bữa chính'],
    author_id: 'a1',
    ingredients: [
      { name: 'Xương ống bò', quantity: 1, unit: 'kg', group: 'Nước dùng' },
      { name: 'Thịt bò phi lê', quantity: 300, unit: 'g', group: 'Thịt' },
      { name: 'Bánh phở tươi', quantity: 1, unit: 'kg', group: 'Chính' },
      { name: 'Hành tây', quantity: 1, unit: 'củ', group: 'Gia vị' },
      { name: 'Gừng', quantity: 1, unit: 'củ', group: 'Gia vị' },
      { name: 'Hoa hồi, thảo quả, quế', quantity: 1, unit: 'gói', group: 'Gia vị' },
    ],
    steps: [
      { instruction: 'Nướng hành tây và gừng cho thơm, sau đó cạo sạch vỏ.', group: 'Nước dùng' },
      { instruction: 'Chần xương bò qua nước sôi để làm sạch.', group: 'Nước dùng' },
      { instruction: 'Hầm xương bò với nước, hành tây, gừng và gói gia vị phở trong ít nhất 4 tiếng.', group: 'Nước dùng' },
      { instruction: 'Thái mỏng thịt bò phi lê.', group: 'Thịt' },
      { instruction: 'Chần bánh phở, xếp thịt lên trên và chan nước dùng nóng hổi.', group: 'Hoàn thiện' }
    ],
    notes: 'Phở sẽ ngon hơn nếu ăn kèm với quẩy và một chút tương ớt Bắc.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    is_favorite: true
  },
  {
    id: 'r2',
    title: 'Cơm Tấm Sườn Bì Chả',
    slug: 'com-tam-suon-bi-cha',
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000&auto=format&fit=crop',
    prep_time: 60,
    cook_time: 45,
    difficulty: 'Vừa',
    calories: 650,
    taste_score: 4.9,
    servings: 2,
    tags: ['Món chính (Cơm)', 'Việt Nam - Miền Nam'],
    author_id: 'a1',
    ingredients: [
      { name: 'Sườn cốt lết', quantity: 500, unit: 'g', group: 'Thịt' },
      { name: 'Gạo tấm', quantity: 300, unit: 'g', group: 'Chính' },
      { name: 'Bì heo sợi', quantity: 100, unit: 'g', group: 'Đồ ăn kèm' },
      { name: 'Thịt heo xay', quantity: 200, unit: 'g', group: 'Chả trứng' },
      { name: 'Trứng vịt', quantity: 3, unit: 'quả', group: 'Chả trứng' },
    ],
    steps: [
      { instruction: 'Ướp sườn với sả băm, mật ong, nước mắm, tỏi trong ít nhất 1 tiếng.', group: 'Chuẩn bị' },
      { instruction: 'Nấu cơm tấm bằng nồi cơm điện.', group: 'Nấu cơm' },
      { instruction: 'Trộn thịt xay, trứng, mộc nhĩ băm nhỏ để làm chả trứng hấp.', group: 'Làm chả' },
      { instruction: 'Nướng sườn trên than hoa cho vàng đều.', group: 'Nướng thịt' },
      { instruction: 'Bày cơm ra dĩa, thêm sườn, chả, bì và mỡ hành.', group: 'Hoàn thiện' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    is_favorite: false
  },
  {
    id: 'r3',
    title: 'Salad Bơ Ức Gà',
    slug: 'salad-bo-uc-ga',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
    prep_time: 15,
    cook_time: 15,
    difficulty: 'Dễ',
    calories: 320,
    taste_score: 4.5,
    servings: 1,
    tags: ['Eat Clean / Healthy', 'Giảm cân', 'Khai vị / Ăn nhẹ'],
    author_id: 'a1',
    ingredients: [
      { name: 'Ức gà', quantity: 150, unit: 'g', group: 'Chính' },
      { name: 'Bơ sáp', quantity: 1, unit: 'trái', group: 'Chính' },
      { name: 'Rau xà lách', quantity: 100, unit: 'g', group: 'Rau' },
      { name: 'Cà chua bi', quantity: 50, unit: 'g', group: 'Rau' },
      { name: 'Sốt mè rang', quantity: 2, unit: 'muỗng canh', group: 'Sốt' },
    ],
    steps: [
      { instruction: 'Áp chảo ức gà với chút muối tiêu cho chín vàng.', group: 'Sơ chế thịt' },
      { instruction: 'Rửa sạch rau xà lách, cắt đôi cà chua bi, thái lát bơ.', group: 'Sơ chế rau' },
      { instruction: 'Thái ức gà thành miếng vừa ăn.', group: 'Hoàn thiện' },
      { instruction: 'Trộn đều các nguyên liệu với sốt mè rang và thưởng thức.', group: 'Hoàn thiện' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    is_favorite: true
  },
  {
    id: 'r4',
    title: 'Spaghetti Sốt Bò Băm',
    slug: 'spaghetti-sot-bo-bam',
    image_url: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?q=80&w=1000&auto=format&fit=crop',
    prep_time: 15,
    cook_time: 30,
    difficulty: 'Dễ',
    calories: 550,
    taste_score: 4.7,
    servings: 2,
    tags: ['Âu Mỹ', 'Món chính (Cơm)'],
    author_id: 'a1',
    ingredients: [
      { name: 'Mì Ý', quantity: 200, unit: 'g', group: 'Chính' },
      { name: 'Thịt bò băm', quantity: 200, unit: 'g', group: 'Thịt' },
      { name: 'Sốt cà chua', quantity: 1, unit: 'chai', group: 'Sốt' },
      { name: 'Hành tây', quantity: 0.5, unit: 'củ', group: 'Gia vị' },
      { name: 'Phô mai Parmesan', quantity: 50, unit: 'g', group: 'Trang trí' },
    ],
    steps: [
      { instruction: 'Luộc mì Ý trong nước sôi có pha chút muối khoảng 8-10 phút.', group: 'Luộc mì' },
      { instruction: 'Xào hành tây cho thơm, thêm thịt bò băm vào xào chín.', group: 'Làm sốt' },
      { instruction: 'Đổ sốt cà chua vào đun nhỏ lửa 10 phút.', group: 'Làm sốt' },
      { instruction: 'Trộn mì Ý với sốt và rắc phô mai lên trên.', group: 'Hoàn thiện' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    is_favorite: false
  },
  {
    id: 'r5',
    title: 'Bánh Mì Chảo',
    slug: 'banh-mi-chao',
    image_url: 'https://images.unsplash.com/photo-1629851173693-5bb8a1c97a22?q=80&w=1000&auto=format&fit=crop',
    prep_time: 10,
    cook_time: 15,
    difficulty: 'Dễ',
    calories: 400,
    taste_score: 4.6,
    servings: 1,
    tags: ['Bánh mì', 'Bữa sáng'],
    author_id: 'a1',
    ingredients: [
      { name: 'Bánh mì', quantity: 1, unit: 'ổ', group: 'Chính' },
      { name: 'Trứng gà', quantity: 2, unit: 'quả', group: 'Topping' },
      { name: 'Xúc xích', quantity: 1, unit: 'cây', group: 'Topping' },
      { name: 'Pate', quantity: 50, unit: 'g', group: 'Topping' },
      { name: 'Sốt cà chua chua ngọt', quantity: 3, unit: 'muỗng', group: 'Sốt' },
    ],
    steps: [
      { instruction: 'Cắt xúc xích khía hình hoa, áp chảo cho chín.', group: 'Chế biến' },
      { instruction: 'Đập trứng ốp la vào chảo, thêm pate và xúc xích.', group: 'Chế biến' },
      { instruction: 'Rưới sốt cà chua lên trên và đun sôi nhẹ.', group: 'Hoàn thiện' },
      { instruction: 'Dọn ra ăn kèm với bánh mì nóng giòn.', group: 'Hoàn thiện' }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    is_favorite: true
  }
];
