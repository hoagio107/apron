import { RecipeRepository } from '../db/recipe-repository';
import { TipRepository } from '../db/tip-repository';
import { CourseRepository } from '../db/course-repository';
import { MealPlanRepository } from '../db/meal-plan-repository';
import type { Recipe, Course, MealPlan, MealSlotConfig } from '../types/recipe';

export const INITIAL_MOCK_RECIPES: Recipe[] = [
  {
    id: 'recipe-pho-bo-gia-truyen',
    title: 'Phở Bò Gia Truyền',
    slug: 'pho-bo-gia-truyen',
    description: 'Công thức nấu phở bò chuẩn vị Bắc với nước dùng thanh ngọt từ xương hầm, thơm nức mùi thảo quả, hoa hồi và quế chi.',
    prep_time: 30,
    cook_time: 180,
    servings: 4,
    difficulty: 'Vừa',
    author_id: 'admin',
    tags: ['món-nước', 'bữa-sáng', 'thịt-bò'],
    ingredients: [
      { name: 'Xương bò', quantity: 1, unit: 'kg', group: 'Nguyên liệu chính' },
      { name: 'Thịt bò (thăn, nạm, gầu)', quantity: 500, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Bánh phở tươi', quantity: 1, unit: 'kg', group: 'Nguyên liệu chính' },
      { name: 'Hành tây', quantity: 2, unit: 'củ', group: 'Rau & Gia vị' },
      { name: 'Gừng', quantity: 1, unit: 'củ', group: 'Rau & Gia vị' },
      { name: 'Gói gia vị quế, hồi, thảo quả', quantity: 1, unit: 'gói', group: 'Gia vị thảo mộc' },
      { name: 'Hành lá, rau mùi, húng quế', quantity: 100, unit: 'g', group: 'Rau ăn kèm' }
    ],
    steps: [
      {
        instruction: 'Xương bò rửa sạch, ngâm nước muối loãng 30 phút. Chần ngập nước sôi 5 phút với gừng đập dập rồi rửa lại thật sạch dưới vòi nước lạnh.',
        group: 'Sơ chế & khử mùi xương bò'
      },
      {
        instruction: 'Nướng sém vỏ hành tây và gừng. Rang thơm hoa hồi, quế, thảo quả cho vào túi lọc. Cho xương vào nồi cùng 3 lít nước, đun sôi rồi hạ nhỏ lửa ninh liu riu 2-3 tiếng, vớt bọt liên tục để nước trong veo.',
        group: 'Nướng thơm thảo mộc & ninh nước dùng'
      },
      {
        instruction: 'Trần bánh phở qua nước sôi xếp vào tô, trải đều thịt bò thái mỏng, rắc hành ngò thái nhỏ và chan nước dùng đang sôi sùng sục. Thưởng thức kèm chanh ớt và dấm tỏi.',
        group: 'Thưởng thức bát phở nóng hổi'
      }
    ],
    calories: 450,
    taste_score: 4.8,
    image_url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80',
    created_at: '2026-10-23T08:00:00.000Z',
    updated_at: '2026-10-23T08:00:00.000Z'
  },
  {
    id: 'recipe-salad-ga-nuong-bo-qua',
    title: 'Salad Gà Nướng Bơ Quả',
    slug: 'salad-ga-nuong-bo-qua',
    description: 'Món salad thanh nhẹ, giàu đạm và chất béo tốt với ức gà áp chảo mọng nước và bơ sáp béo ngậy sốt chanh leo.',
    prep_time: 15,
    cook_time: 15,
    servings: 2,
    difficulty: 'Dễ',
    author_id: 'admin',
    tags: ['ăn-kiêng', 'salad', 'bữa-trưa'],
    ingredients: [
      { name: 'Ức gà tươi', quantity: 300, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Bơ sáp chín', quantity: 1, unit: 'quả', group: 'Nguyên liệu chính' },
      { name: 'Cà chua bi', quantity: 100, unit: 'g', group: 'Rau củ' },
      { name: 'Xà lách Romaine hoặc xà lách mỡ', quantity: 150, unit: 'g', group: 'Rau củ' },
      { name: 'Ngô ngọt tách hạt luộc chín', quantity: 50, unit: 'g', group: 'Rau củ' },
      { name: 'Dầu oliu extra virgin', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt' },
      { name: 'Nước cốt chanh, muối tiêu, mật ong', quantity: 1, unit: 'muỗng', group: 'Nước sốt' }
    ],
    steps: [
      {
        instruction: 'Ức gà dần nhẹ cho đều độ dày, ướp chút muối, tiêu và dầu oliu trong 10 phút. Áp chảo vàng đều 2 mặt mỗi mặt khoảng 5-6 phút cho chín tới, để nguội 3 phút rồi thái lát.',
        group: 'Ướp và áp chảo ức gà'
      },
      {
        instruction: 'Bơ bổ đôi, bỏ hạt thái miếng vừa ăn. Cà chua bi cắt đôi. Xà lách rửa sạch để ráo nước rồi xé khúc vừa miệng.',
        group: 'Sơ chế rau quả tươi'
      },
      {
        instruction: 'Pha sốt dầu oliu, chanh, mật ong và tiêu. Xếp rau xà lách, cà chua, ngô ngọt, bơ và thịt gà lên đĩa, rưới đều nước sốt trước khi dùng.',
        group: 'Trộn salad & thưởng thức'
      }
    ],
    calories: 320,
    taste_score: 4.5,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    created_at: '2026-10-23T08:05:00.000Z',
    updated_at: '2026-10-23T08:05:00.000Z'
  },
  {
    id: 'recipe-suon-xao-chua-ngot',
    title: 'Sườn Xào Chua Ngọt',
    slug: 'suon-xao-chua-ngot',
    description: 'Món ăn đưa cơm gia đình truyền thống với miếng sườn chiên vàng óng ả hòa quyện lớp sốt chua ngọt đậm đà, sánh mịn.',
    prep_time: 20,
    cook_time: 30,
    servings: 4,
    difficulty: 'Vừa',
    author_id: 'admin',
    tags: ['món-chính', 'bữa-tối', 'thịt-heo'],
    ingredients: [
      { name: 'Sườn thăn / sườn non heo', quantity: 600, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Hành khô, tỏi băm nhuyễn', quantity: 3, unit: 'củ', group: 'Gia vị' },
      { name: 'Nước mắm ngon', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt' },
      { name: 'Đường cát trắng', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt' },
      { name: 'Dấm gạo hoặc cốt chanh', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt' },
      { name: 'Tương cà / tương ớt', quantity: 1, unit: 'muỗng canh', group: 'Nước sốt' }
    ],
    steps: [
      {
        instruction: 'Sườn chặt miếng 3-4cm, chần qua nước sôi rồi rửa sạch. Rán sườn trong chảo ngập dầu lửa vừa cho tới khi sườn se vàng đều 2 mặt.',
        group: 'Chần và chiên sườn'
      },
      {
        instruction: 'Khuấy tan hỗn hợp: 2 muỗng nước mắm, 2 muỗng đường, 2 muỗng dấm, 1 muỗng tương cà và 3 muỗng nước lọc cho vừa khẩu vị chua ngọt hài hòa.',
        group: 'Pha sốt chua ngọt'
      },
      {
        instruction: 'Phi thơm hành tỏi băm, đổ sườn đã chiên vào đảo đều, trút phần nước sốt vào đun lửa nhỏ cho tới khi sốt sánh sệt lại và bám đều quanh từng miếng sườn.',
        group: 'Rim sườn lên màu cánh gián'
      }
    ],
    calories: 600,
    taste_score: 4.9,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    created_at: '2026-10-23T08:10:00.000Z',
    updated_at: '2026-10-23T08:10:00.000Z'
  },
  {
    id: 'recipe-canh-suon-ham-rau-cu',
    title: 'Canh Sườn Hầm Rau Củ',
    slug: 'canh-suon-ham-rau-cu',
    description: 'Nước canh trong veo ngọt lịm từ sườn non hầm cùng ngô ngọt, cà rốt và khoai tây bổ dưỡng cho cả gia đình.',
    prep_time: 15,
    cook_time: 45,
    servings: 4,
    difficulty: 'Dễ',
    author_id: 'admin',
    tags: ['món-canh', 'bữa-cơm', 'thịt-heo'],
    ingredients: [
      { name: 'Sườn heo non', quantity: 500, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Bắp ngô ngọt', quantity: 1, unit: 'bắp', group: 'Rau củ' },
      { name: 'Cà rốt', quantity: 2, unit: 'củ', group: 'Rau củ' },
      { name: 'Khoai tây', quantity: 2, unit: 'củ', group: 'Rau củ' },
      { name: 'Hành hoa, ngò rí', quantity: 50, unit: 'g', group: 'Rau thơm' },
      { name: 'Hạt nêm, muối, tiêu xay', quantity: 1, unit: 'muỗng', group: 'Gia vị' }
    ],
    steps: [
      {
        instruction: 'Sườn chặt khúc vừa ăn, chần qua nước sôi 3 phút rồi rửa lại sạch. Cà rốt, khoai tây gọt vỏ tỉa hoa; bắp ngô cắt khúc 3cm.',
        group: 'Sơ chế nguyên liệu'
      },
      {
        instruction: 'Cho sườn và ngô ngọt vào nồi với 1.5 lít nước, đun sôi hớt bọt rồi hạ lửa ninh trong 25 phút.',
        group: 'Ninh sườn lấy nước ngọt'
      },
      {
        instruction: 'Cho cà rốt và khoai tây vào nấu thêm 15 phút tới khi các loại củ chín mềm bở. Nêm gia vị vừa miệng, rắc hành ngò thái nhỏ rồi tắt bếp.',
        group: 'Nấu rau củ chín mềm'
      }
    ],
    calories: 380,
    taste_score: 4.7,
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
    created_at: '2026-10-23T08:15:00.000Z',
    updated_at: '2026-10-23T08:15:00.000Z'
  },
  {
    id: 'recipe-canh-chua-ca-loc-nam-bo',
    title: 'Canh Chua Cá Lóc Nam Bộ',
    slug: 'canh-chua-ca-loc-nam-bo',
    description: 'Hương vị miền Tây đặc trưng với vị chua dịu từ me, cá lóc ngọt thịt nấu cùng dứa, bạc hà, đậu bắp và giá đỗ giòn mát.',
    prep_time: 20,
    cook_time: 25,
    servings: 4,
    difficulty: 'Vừa',
    author_id: 'admin',
    tags: ['món-canh', 'món-cá', 'nam-bộ'],
    ingredients: [
      { name: 'Cá lóc đồng làm sạch', quantity: 600, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Vắt me chín', quantity: 50, unit: 'g', group: 'Gia vị chua' },
      { name: 'Dứa chín (thơm)', quantity: 0.5, unit: 'quả', group: 'Rau củ' },
      { name: 'Cà chua chín', quantity: 2, unit: 'quả', group: 'Rau củ' },
      { name: 'Bạc hà (dọc mùng), đậu bắp', quantity: 150, unit: 'g', group: 'Rau củ' },
      { name: 'Giá đỗ sạch, ngò gai, rau ngổ', quantity: 100, unit: 'g', group: 'Rau thơm' },
      { name: 'Nước mắm, đường phèn, ớt sừng', quantity: 2, unit: 'muỗng', group: 'Gia vị' }
    ],
    steps: [
      {
        instruction: 'Cá lóc xát muối và chanh khử nhớt, cắt khúc dày 2.5cm. Dứa thái lát tam giác, cà chua bổ múi cau. Bạc hà tước vỏ thái vát, đậu bắp cắt chéo.',
        group: 'Sơ chế cá và rau củ'
      },
      {
        instruction: 'Đun sôi 1.2 lít nước, dầm me chín lấy nước cốt chua đổ vào nồi. Thả dứa và cà chua vào đun sôi lại, nêm đường phèn, nước mắm và muối.',
        group: 'Nấu nước dùng me'
      },
      {
        instruction: 'Thả cá lóc vào đun sôi 8-10 phút cho cá chín ngọt thịt, cho tiếp đậu bắp và dọc mùng vào đun 2 phút. Tắt bếp, thêm giá đỗ, rau ngổ, ngò gai và vài lát ớt sừng.',
        group: 'Thả cá và hoàn thiện'
      }
    ],
    calories: 290,
    taste_score: 4.9,
    image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
    created_at: '2026-10-23T08:20:00.000Z',
    updated_at: '2026-10-23T08:20:00.000Z'
  },
  {
    id: 'recipe-bo-luc-lac-hat-tieu-den',
    title: 'Bò Lúc Lắc Hạt Tiêu Đen',
    slug: 'bo-luc-lac-hat-tieu-den',
    description: 'Thịt thăn bò mềm ngọt tự nhiên cắt quân cờ, xào lửa lớn bốc khói cùng ớt chuông, hành tây và sốt tiêu đen cay nồng thơm lừng.',
    prep_time: 20,
    cook_time: 10,
    servings: 3,
    difficulty: 'Vừa',
    author_id: 'admin',
    tags: ['món-xào', 'thịt-bò', 'món-chính'],
    ingredients: [
      { name: 'Thịt thăn bò tươi', quantity: 450, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Ớt chuông xanh, đỏ', quantity: 2, unit: 'quả', group: 'Rau củ' },
      { name: 'Hành tây trắng', quantity: 1, unit: 'củ', group: 'Rau củ' },
      { name: 'Tỏi băm', quantity: 1, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Hạt tiêu đen xay vỡ', quantity: 1, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Dầu hào, xì dầu, bơ lạt', quantity: 2, unit: 'muỗng', group: 'Nước sốt' }
    ],
    steps: [
      {
        instruction: 'Thịt bò cắt khối vuông 2x2cm, ướp với 1 muỗng dầu hào, 1/2 muỗng xì dầu, tiêu đen, tỏi băm và 1 muỗng dầu ăn trong 20 phút cho mềm thơm.',
        group: 'Thái và ướp thịt bò'
      },
      {
        instruction: 'Ớt chuông và hành tây cắt miếng vuông. Đun nóng chảo, xào nhanh rau củ trên lửa lớn trong 2 phút vừa chín tới, giữ được độ giòn ngọt rồi trút ra đĩa.',
        group: 'Xào rau củ giòn ngọt'
      },
      {
        instruction: 'Để chảo thật nóng bốc khói, cho dầu ăn và thịt bò vào áp chảo nhanh tay, lắc đều chảo trong 2-3 phút cho xém cạnh ngoài nhưng bên trong vẫn mọng nước. Thêm chút bơ lạt, trút rau củ vào đảo nhanh rồi tắt bếp.',
        group: 'Lắc bò trên lửa lớn'
      }
    ],
    calories: 420,
    taste_score: 4.8,
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    created_at: '2026-10-23T08:25:00.000Z',
    updated_at: '2026-10-23T08:25:00.000Z'
  },
  {
    id: 'recipe-ca-hoi-ap-chao-bo-chanh',
    title: 'Cá Hồi Áp Chảo Sốt Bơ Chanh',
    slug: 'ca-hoi-ap-chao-sot-bo-chanh',
    description: 'Miếng cá hồi phi lê vàng ruộm da giòn rụm, thịt bên trong mềm ngọt mọng nước phủ đẫm lớp sốt bơ chanh tỏi thơm béo ngậy.',
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    difficulty: 'Dễ',
    author_id: 'admin',
    tags: ['món-âu', 'hải-sản', 'eat-clean'],
    ingredients: [
      { name: 'Phi lê cá hồi tươi còn da', quantity: 350, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Bơ lạt Anchor hoặc President', quantity: 30, unit: 'g', group: 'Nước sốt' },
      { name: 'Chanh vàng', quantity: 1, unit: 'quả', group: 'Nước sốt' },
      { name: 'Tỏi băm nhuyễn', quantity: 1, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Lá hương thảo (rosemary) hoặc ngò tây', quantity: 2, unit: 'nhánh', group: 'Rau thơm' },
      { name: 'Muối biển, tiêu đen xay', quantity: 1, unit: 'chút', group: 'Gia vị' }
    ],
    steps: [
      {
        instruction: 'Dùng khăn giấy thấm thật khô bề mặt miếng cá hồi, đặc biệt là phần da. Khứa nhẹ 2-3 đường trên da để cá không bị cong khi áp chảo. Rắc muối biển và tiêu đen đều 2 mặt, để ngấm 5 phút.',
        group: 'Quy trình chế biến',
        image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'
      },
      {
        instruction: 'Đun nóng chảo chống dính với 1 muỗng dầu oliu trên lửa vừa. Đặt mặt da cá hồi xuống trước, dùng xẻng ấn nhẹ 30 giây để da phẳng. Áp chảo 4-5 phút cho da vàng ruộm giòn tan.',
        group: 'Quy trình chế biến',
        image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'
      },
      {
        instruction: 'Nhẹ nhàng lật mặt thịt cá, áp chảo tiếp trong 2-3 phút cho thịt chín tới vừa (medium-rare) giữ trọn độ ẩm ngọt mọng nước bên trong.',
        group: 'Quy trình chế biến',
        image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80'
      },
      {
        instruction: 'Hạ nhỏ lửa, thả bơ lạt, tỏi băm và hương thảo vào chảo. Vắt nước cốt nửa quả chanh vàng, nghiêng chảo múc sốt bơ rưới liên tục lên miếng cá trong 1 phút rồi dọn ra đĩa thưởng thức.',
        group: 'Quy trình chế biến',
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80'
      }
    ],
    calories: 460,
    taste_score: 4.9,
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    notes: '<b>Bí quyết áp chảo da giòn rụm:</b><br/>• Miếng cá hồi phải thật khô ráo trước khi vào chảo, da ẩm sẽ bị bắn dầu và dai.<br/>• Không lật cá quá sớm khi mặt da chưa vàng giòn tự tách khỏi đáy chảo.<br/>• Sốt bơ chanh chỉ làm trên lửa nhỏ để bơ không bị khét đen.',
    created_at: '2026-10-23T08:30:00.000Z',
    updated_at: '2026-10-24T00:00:00.000Z'
  },
  {
    id: 'recipe-ca-hoi-nuong-noi-chien',
    parent_id: 'recipe-ca-hoi-ap-chao-bo-chanh',
    title: 'Cá Hồi Nướng Nồi Chiên Không Dầu',
    slug: 'ca-hoi-nuong-noi-chien-khong-dau',
    description: 'Biến thể thanh nhẹ, lành mạnh và nhanh gọn từ món Cá Hồi Áp Chảo. Dùng nồi chiên không dầu giữ trọn vị ngọt tươi mát và lớp da giòn rụm.',
    prep_time: 10,
    cook_time: 12,
    servings: 2,
    difficulty: 'Dễ',
    author_id: 'admin',
    tags: ['món-âu', 'hải-sản', 'eat-clean', 'nồi-chiên-không-dầu'],
    ingredients: [
      { name: 'Phi lê cá hồi tươi còn da', quantity: 350, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Dầu oliu nguyên chất', quantity: 1, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Nước cốt chanh vàng', quantity: 1, unit: 'muỗng canh', group: 'Nước sốt' },
      { name: 'Tỏi băm & lá hương thảo khô', quantity: 1, unit: 'muỗng cà phê', group: 'Gia vị' },
      { name: 'Muối biển & tiêu đen xay', quantity: 1, unit: 'chút', group: 'Gia vị' }
    ],
    steps: [
      {
        instruction: 'Thấm thật khô miếng cá hồi. Ướp với dầu oliu, muối biển, tiêu, tỏi băm và hương thảo trong 5 phút.',
        group: 'Ướp gia vị',
        image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'
      },
      {
        instruction: 'Làm nóng nồi chiên không dầu ở 180°C trong 3 phút. Lót giấy nến hoặc quét lớp dầu mỏng vào giỏ nướng. Đặt cá hồi vào nướng ở 180°C trong 10-12 phút tùy độ dày miếng cá.',
        group: 'Nướng nồi chiên không dầu',
        image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'
      },
      {
        instruction: 'Lấy cá ra đĩa, vắt chút cốt chanh vàng lên trên bề mặt và rắc ngò tây thái nhỏ. Thưởng thức ngay khi còn nóng.',
        group: 'Thưởng thức',
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80'
      }
    ],
    calories: 380,
    taste_score: 4.8,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    notes: '<b>Lưu ý khi nướng bằng nồi chiên:</b><br/>• Không nướng quá lâu trên 12 phút để tránh cá bị khô bở.<br/>• Lót giấy nến có đục lỗ thoát khí để da cá giòn đều.',
    created_at: '2026-10-24T08:00:00.000Z',
    updated_at: '2026-10-24T08:00:00.000Z'
  },
  {
    id: 'recipe-bo-kho-banh-mi-sai-gon',
    title: 'Bò Kho Bánh Mì Sài Gòn',
    slug: 'bo-kho-banh-mi-sai-gon',
    description: 'Thịt bò nạm và gân hầm mềm rục hòa quyện nước sốt sánh sệt thơm lừng mùi sả, hoa hồi, quế chi và nước dừa xiêm béo ngọt. Ăn kèm bánh mì giòn tan nóng hổi.',
    prep_time: 30,
    cook_time: 60,
    servings: 4,
    difficulty: 'Vừa',
    author_id: 'admin',
    tags: ['món-bò', 'món-hầm', 'bữa-sáng', 'món-nước'],
    ingredients: [
      { name: 'Nạm bò & gân bò', quantity: 800, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Cà rốt tươi', quantity: 2, unit: 'củ', group: 'Rau củ' },
      { name: 'Nước dừa xiêm tươi', quantity: 1, unit: 'lít', group: 'Nước dùng' },
      { name: 'Sả cây tươi', quantity: 5, unit: 'nhánh', group: 'Gia vị thảo mộc' },
      { name: 'Gói bột gia vị bò kho', quantity: 1, unit: 'gói', group: 'Gia vị thảo mộc' },
      { name: 'Dầu màu điều', quantity: 2, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Bột năng (hoặc bột bắp)', quantity: 1.5, unit: 'muỗng canh', group: 'Gia vị' },
      { name: 'Hành tây, ngò gai, húng quế', quantity: 100, unit: 'g', group: 'Rau ăn kèm' },
      { name: 'Bánh mì Việt Nam', quantity: 4, unit: 'ổ', group: 'Ăn kèm' }
    ],
    steps: [
      {
        instruction: 'Nạm bò và gân bò rửa sạch với nước muối loãng, gừng đập dập và 1 muỗng rượu trắng để khử sạch mùi hoi. Thấm khô rồi cắt khối vuông quân cờ khoảng 3x3cm vừa miệng.',
        group: 'Giai đoạn 1: Sơ chế & Ướp thịt',
        image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'
      },
      {
        instruction: 'Cà rốt gọt vỏ, khứa rãnh tỉa hoa rồi cắt khúc dày khoảng 1.5cm. Sả cây bóc bớt bẹ già, cắt khúc 7cm và đập dập phần gốc để tinh dầu tiết ra thơm nhất. Hành khô, tỏi và gừng băm nhỏ.',
        group: 'Giai đoạn 1: Sơ chế & Ướp thịt',
        image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80'
      },
      {
        instruction: 'Ướp thịt bò với: 1 gói bột gia vị bò kho, 2 muỗng dầu màu điều, 1 muỗng hạt nêm, 1 muỗng đường, 1/2 muỗng tiêu xay, 1 muỗng nước mắm và nửa phần hành tỏi gừng băm. Trộn bóp thật kỹ, để 30 - 45 phút cho ngấm sâu.',
        group: 'Giai đoạn 1: Sơ chế & Ướp thịt',
        image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80'
      },
      {
        instruction: 'Đặt nồi gang hoặc nồi đáy dày lên bếp, cho 2 muỗng dầu màu điều vào đun nóng. Phi thơm phần hành tỏi gừng băm còn lại cùng sả đập dập cho dậy mùi thơm nức.',
        group: 'Giai đoạn 2: Nấu & Hầm nhừ',
        image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80'
      },
      {
        instruction: 'Trút toàn bộ thịt bò đã ướp vào đảo nhanh trên lửa lớn trong 5-7 phút cho đến khi từng thớ thịt săn chắc lại, màu điều áo đều óng ả và tỏa hương thảo mộc ngào ngạt.',
        group: 'Giai đoạn 2: Nấu & Hầm nhừ',
        image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80'
      },
      {
        instruction: 'Đổ 1 lít nước dừa tươi vào nồi ngập thịt. Đun sôi bùng lên rồi hạ lửa nhỏ, liên tục vớt sạch bọt nổi lên để nước dùng trong ngọt. Đậy hé nắp hầm liu riu trong 45-50 phút cho thịt mềm dẻo.',
        group: 'Giai đoạn 2: Nấu & Hầm nhừ',
        image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80'
      },
      {
        instruction: 'Khi thịt đã mềm rục, cho cà rốt vào nấu thêm 15 phút. Hòa tan bột năng với 3 muỗng nước lạnh, từ từ rưới vào nồi khuấy đều tay cho nước sốt sánh mịn sền sệt, nêm nếm lại gia vị cho vừa miệng rồi tắt bếp.',
        group: 'Giai đoạn 2: Nấu & Hầm nhừ',
        image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'
      },
      {
        instruction: 'Múc bò kho ra tô sâu lòng, rắc hành tây thái khoanh mỏng, ngò gai thái nhỏ và vài lát ớt sừng đỏ lên trên. Dọn kèm đĩa rau húng quế tươi ngon.',
        group: 'Giai đoạn 3: Trình bày & Thưởng thức',
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80'
      },
      {
        instruction: 'Thưởng thức khi còn bốc khói nghi ngút. Chấm cùng bánh mì nướng giòn rụm hoặc ăn với hủ tiếu dai, chấm thịt bò vào chén muối tiêu chanh ớt chua cay bùng nổ hương vị.',
        group: 'Giai đoạn 3: Trình bày & Thưởng thức',
        images: [
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'
        ]
      }
    ],
    calories: 580,
    taste_score: 5.0,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    notes: '<b>Bí quyết nấu bò kho ngon chuẩn vị:</b><br/>• Nên chọn nạm bò có lẫn gân trắng để khi hầm thịt mềm béo và gân dẻo giòn sần sật.<br/>• Dùng nước dừa xiêm tự nhiên sẽ giúp nước sốt ngọt thanh tự nhiên mà không cần dùng nhiều mì chính hay đường.<br/>• Bột năng chỉ nên cho từ từ để đạt độ sánh ưng ý, không nên quá đặc.',
    created_at: '2026-10-24T00:00:00.000Z',
    updated_at: '2026-10-24T00:00:00.000Z'
  },
  {
    id: 'recipe-ga-chien-nuoc-mam-gion-rum',
    title: 'Gà Chiên Nước Mắm Giòn Rụm',
    slug: 'ga-chien-nuoc-mam-gion-rum',
    description: 'Cánh gà chiên giòn tan phủ đều lớp nước mắm tỏi ớt kẹo dẻo thơm lừng cay mặn ngọt bùng nổ vị giác.',
    prep_time: 15,
    cook_time: 25,
    servings: 4,
    difficulty: 'Dễ',
    author_id: 'admin',
    tags: ['món-chiên', 'món-nhậu', 'thịt-gà'],
    ingredients: [
      { name: 'Cánh gà hoặc đùi gà tươi', quantity: 600, unit: 'g', group: 'Nguyên liệu chính' },
      { name: 'Bột chiên giòn', quantity: 50, unit: 'g', group: 'Bột chiên' },
      { name: 'Nước mắm ngon', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt mắm' },
      { name: 'Đường cát', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt mắm' },
      { name: 'Tỏi băm, ớt tươi băm', quantity: 2, unit: 'muỗng canh', group: 'Nước sốt mắm' },
      { name: 'Tương ớt', quantity: 1, unit: 'muỗng canh', group: 'Nước sốt mắm' }
    ],
    steps: [
      {
        instruction: 'Cánh gà rửa sạch xoa muối gừng, khứa nhẹ mặt trong cho ngấm gia vị. Lăn đều qua một lớp mỏng bột chiên giòn.',
        group: 'Sơ chế & áo bột cánh gà'
      },
      {
        instruction: 'Chiên lần 1 ở lửa vừa 8-10 phút cho chín đều bên trong. Vớt ra để ráo 5 phút, rồi chiên lần 2 ở lửa to trong 2 phút cho da vàng ươm giòn rụm.',
        group: 'Chiên 2 lần cho giòn lâu'
      },
      {
        instruction: 'Phi thơm tỏi ớt băm, đổ hỗn hợp nước mắm đường tương ớt vào đun sủi bọt sánh lại. Đổ cánh gà giòn vào đảo nhanh 1 phút cho sốt bám đều rồi tắt bếp ngay.',
        group: 'Lắc sốt nước mắm tỏi ớt'
      }
    ],
    calories: 520,
    taste_score: 4.8,
    image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80',
    created_at: '2026-10-23T08:35:00.000Z',
    updated_at: '2026-10-23T08:35:00.000Z'
  }
];

export async function seedMockData() {
  try {
    // 1. Quét công thức hiện tại
    let existingRecipes = await RecipeRepository.getAll();
    
    // Nếu chưa có công thức nào hoặc có ít hơn bộ công thức mẫu
    if (existingRecipes.length === 0) {
      await RecipeRepository.saveBulk(INITIAL_MOCK_RECIPES);
      existingRecipes = await RecipeRepository.getAll();
    } else {
      // Bổ sung các công thức mẫu chuẩn còn thiếu mà không ghi đè dữ liệu người dùng
      for (const mock of INITIAL_MOCK_RECIPES) {
        const found = existingRecipes.find(r => r.slug === mock.slug || r.id === mock.id);
        if (!found) {
          await RecipeRepository.save(mock);
        } else if (!found.image_url || found.image_url === '') {
          // Bổ sung ảnh nếu công thức cũ bị thiếu ảnh
          found.image_url = mock.image_url;
          await RecipeRepository.save(found);
        }
      }
    }

    // 2. Tự động dọn các bản sao trùng lặp hoàn toàn tên món do lỗi reload trước đây
    const titleMap = new Map<string, Recipe[]>();
    for (const r of existingRecipes) {
      if (r.parent_id) continue;
      const key = (r.title || '').trim().toLowerCase();
      if (!key) continue;
      const list = titleMap.get(key) || [];
      list.push(r);
      titleMap.set(key, list);
    }

    for (const [, list] of titleMap.entries()) {
      if (list.length > 1) {
        // Giữ lại 1 bản ghi có nhiều thông tin nhất
        list.sort((a, b) => {
          const scoreA = (a.image_url ? 2 : 0) + (a.ingredients?.length || 0);
          const scoreB = (b.image_url ? 2 : 0) + (b.ingredients?.length || 0);
          return scoreB - scoreA;
        });
        // Xóa các bản sao thừa
        for (let i = 1; i < list.length; i++) {
          if (list[i].id) {
            await RecipeRepository.delete(list[i].id);
          }
        }
      }
    }

    // 3. Seed Tips nếu chưa có
    const tips = await TipRepository.getAll();
    if (tips.length === 0) {
      const mockTips = [
        {
          id: 'tip-chon-xuong-bo',
          title: 'Bí quyết chọn xương bò nấu phở ngon',
          slug: 'bi-quyet-chon-xuong-bo-nau-pho',
          content: 'Nên chọn xương ống bò có màu đỏ tươi, tủy bên trong còn màu hồng. Tránh xương có mùi hôi lạ hoặc màu xỉn đục.',
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
          tags: ['mẹo-chọn-nguyên-liệu'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tip-giu-bo-sap',
          title: 'Cách giữ bơ sáp không bị thâm đen',
          slug: 'cach-giu-bo-sap-khong-bi-tham',
          content: 'Khi cắt bơ mà dùng không hết, hãy quét một lớp dầu oliu mỏng hoặc vắt chút chanh lên bề mặt bơ rồi bọc kín bằng màng bọc thực phẩm, để ngăn mát tủ lạnh.',
          image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80',
          tags: ['mẹo-bảo-quản'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tip-uop-thit-nuong',
          title: 'Mẹo ướp thịt nướng mềm mọng không bị khô',
          slug: 'meo-uop-thit-nuong-mem-mong',
          content: 'Thêm một thìa sữa đặc hoặc nước ép lê/táo vào sốt ướp. Enzyme tự nhiên trong hoa quả sẽ làm mềm thớ thịt mà không làm bở nát.',
          image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
          tags: ['mẹo-chế-biến'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      await TipRepository.saveBulk(mockTips as any);
    }

    // 4. Seed Courses nếu chưa có
    const courses = await CourseRepository.getAll();
    if (courses.length === 0) {
      const mockCourses: Course[] = [
        {
          id: 'course-knife-skills',
          title: 'Kỹ năng Dao Thớt & Sơ Chế Chuyên Nghiệp',
          slug: 'ky-nang-dao-thot-so-che-chuyen-nghiep',
          description: '<p>Nắm vững kỹ thuật cầm dao chuẩn đầu bếp Pháp, các kiểu thái hạt lựu, thái sợi đồng đều và bí quyết sơ chế khử tanh thịt cá giữ trọn dinh dưỡng.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
          author_id: 'chef-alain',
          teacher: 'Chef Alain Nguyễn',
          level: 'Cơ bản',
          rating: 4.9,
          source: 'Apron Academy',
          created_at: new Date().toISOString(),
          modules: [
            {
              id: 'mod-1',
              title: 'Chương 1: Dụng cụ cắt thái & bảo quản dao',
              icon: 'ChefHat',
              lessons: [
                {
                  id: 'les-1-1',
                  title: 'Phân loại các dòng dao cơ bản (Chef knife, Santoku, Paring)',
                  content: '<p>Tìm hiểu cấu trúc lưỡi dao, sự khác biệt giữa góc mài 15° của Nhật Bản (Santoku, Gyuto) và góc mài 20° của phương Tây (Chef knife Đức).</p><h4>3 Dòng dao cốt lõi trong gian bếp:</h4><ul><li><strong>Chef Knife (20-25cm):</strong> Dao đa năng gọt thái rau củ, băm thịt mỡ, phi lê nhẹ. Trọng tâm cân bằng tốt.</li><li><strong>Santoku (16-18cm):</strong> Lưỡi thẳng, mũi vát nhọn, rãnh thoát khí chống dính lát cắt khi thái thực phẩm dính.</li><li><strong>Paring Knife (8-10cm):</strong> Dao tỉa nhỏ gọn dùng gọt vỏ củ quả, tỉa hoa trang trí, lột vỏ tôm.</li></ul>',
                  duration_minutes: 15,
                  video_url: 'https://www.youtube.com/watch?v=G-Fg7l7G1zw',
                  hero_image_url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
                  notes: 'Góc nghiêng mài dao chuẩn nhất là kê đồng xu 1000đ dưới sống dao. Tuyệt đối không rửa dao trong máy rửa bát vì nhiệt độ cao và hoá chất kiềm làm hỏng độ tôi cứng của thép cao cấp.',
                  attachments: [
                    'https://apron.app/docs/huong-dan-bao-quan-dao-thep-nhat.pdf',
                    'https://apron.app/docs/so-do-goc-mai-15-vs-20-do.pdf'
                  ],
                  attached_recipe_ids: ['recipe-ca-hoi-ap-chao-bo-chanh'],
                  rating: 5.0
                },
                {
                  id: 'les-1-2',
                  title: 'Tư thế đứng & kỹ thuật giữ thực phẩm an toàn (The Claw Grip)',
                  content: '<p>Luyện tập thế tay <strong>The Claw Grip</strong> (Móng vuốt mèo) để bảo vệ ngón tay tuyệt đối khi thao tác thái nhanh và nhịp nhàng.</p><h4>3 Quy tắc bàn tay móng vuốt:</h4><ol><li>Đầu ngón tay co gập vào trong, móng tay cắm nhẹ giữ bề mặt nguyên liệu.</li><li>Đốt ngón tay giữa tì nhẹ vào thân phẳng của lưỡi dao làm cữ trượt.</li><li>Ngón cái và ngón út khóa chặt hai bên sườn củ quả giữ thăng bằng.</li></ol>',
                  duration_minutes: 20,
                  video_url: 'https://www.youtube.com/watch?v=20x1e3h9n18',
                  hero_image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
                  notes: 'Tập thao tác chậm rãi với dưa leo hoặc bí ngòi trước khi tăng tốc độ. Khi tư thế tay đã thành phản xạ cơ bắp, tốc độ sẽ tự nhiên tăng lên.',
                  attachments: [
                    'https://apron.app/docs/bai-tap-claw-grip-15-phut-moi-ngay.pdf'
                  ],
                  attached_recipe_ids: ['recipe-canh-suon-ham-rau-cu'],
                  rating: 4.9
                }
              ]
            },
            {
              id: 'mod-2',
              title: 'Chương 2: Các kỹ thuật cắt thái chuẩn ẩm thực quốc tế',
              icon: 'Utensils',
              lessons: [
                {
                  id: 'les-2-1',
                  title: 'Cắt hạt lựu (Brunoise) & sợi que diêm (Julienne)',
                  content: '<p>Quy trình gọt phẳng 4 cạnh, chia thớ và cắt đồng đều các loại củ quả như cà rốt, khoai tây, hành tây theo chuẩn ẩm thực Pháp cổ điển.</p><h4>Kích thước chuẩn nghề bếp:</h4><ul><li><strong>Julienne:</strong> 2mm x 2mm x 4cm (dùng xào, làm gỏi, súp thanh).</li><li><strong>Brunoise:</strong> 2mm x 2mm x 2mm cắt từ Julienne (dùng cho sốt bơ Pháp, consommé, nhân bánh).</li><li><strong>Macedoine:</strong> Hạt lựu trung bình 5mm x 5mm x 5mm.</li></ul>',
                  duration_minutes: 25,
                  hero_image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
                  notes: 'Để hạt lựu vuông vức tuyệt đối, trước hết phải tỉa tròn thành khối hộp chữ nhật (trimming). Phần rìa thừa gom lại để ninh nước dùng ngọt nước, không bỏ phí.',
                  attachments: [
                    'https://apron.app/docs/bang-kich-thuoc-cat-thai-french-knife-cuts.pdf'
                  ],
                  attached_recipe_ids: ['recipe-bo-kho-banh-mi-sai-gon'],
                  rating: 4.8
                },
                {
                  id: 'les-2-2',
                  title: 'Kỹ thuật lóc xương cá & phi lê gia cầm siêu tốc',
                  content: '<p>Hướng dẫn cách luồn lưỡi dao sát khung xương để tận dụng tối đa thịt mà không làm rách thớ da.</p><h4>Quy trình phi lê cá hồi nguyên con:</h4><ol><li>Dùng dao phi lê lưỡi dẻo rạch một đường sát mang cá xuống xương sống.</li><li>Nghiêng lưỡi dao 10° lướt phẳng men theo xương sống từ mang đến đuôi.</li><li>Lật miếng phi lê, dùng nhíp chuyên dụng nhổ sạch hàng xương dăm (pin bones).</li></ol>',
                  duration_minutes: 30,
                  video_url: 'https://www.youtube.com/watch?v=q6O2Hh0m4c4',
                  hero_image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
                  notes: 'Dùng muối hạt bôi lên đầu ngón tay khi giữ đuôi cá lạng da để chống trơn tuột. Lưỡi dao phải bén như dao cạo để không làm nát thớ thịt cá.',
                  attachments: [
                    'https://apron.app/docs/so-do-giai-phau-xuong-ca-hoi.pdf'
                  ],
                  attached_recipe_ids: [
                    'recipe-ca-hoi-ap-chao-bo-chanh',
                    'recipe-ca-hoi-nuong-noi-chien'
                  ],
                  rating: 5.0
                }
              ]
            }
          ]
        },
        {
          id: 'course-sourdough-baking',
          title: 'Nghệ Thuật Làm Bánh Mì Men Tự Nhiên Sourdough',
          slug: 'nghe-thuat-lam-banh-mi-men-tu-nhien-sourdough',
          description: '<p>Hành trình làm chủ chiếc bánh mì men hoang dã giòn rụm vỏ ngoài, xốp mềm bên trong với thớ bánh tổ ong hoàn hảo.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          author_id: 'baker-minh-trang',
          teacher: 'Baker Minh Trang',
          level: 'Nâng cao',
          rating: 4.95,
          source: 'Apron Artisan Bread',
          created_at: new Date().toISOString(),
          modules: [
            {
              id: 'mod-sd-1',
              title: 'Chương 1: Nuôi cấy & duy trì men khởi động (Starter)',
              icon: 'Flame',
              lessons: [
                {
                  id: 'les-sd-1-1',
                  title: 'Lịch trình 7 ngày tạo Starter men bột nguyên cám',
                  content: '<p>Men tự nhiên được hình thành từ vi khuẩn lactic và nấm men hoang dã có sẵn trên vỏ hạt lúa mì và trong không khí.</p><h4>Tỷ lệ cho ăn chuẩn 1:1:1:</h4><ul><li>50g Men cái (Starter)</li><li>50g Nước lọc nhiệt độ phòng (26-28°C)</li><li>50g Bột mì nguyên cám hữu cơ (Whole Wheat)</li></ul>',
                  duration_minutes: 20,
                  video_url: 'https://www.youtube.com/watch?v=2FVfJGTME5s',
                  hero_image_url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&q=80',
                  notes: 'Kiểm tra độ chín của men bằng bài test nổi (Float Test): Múc một thìa men thả vào cốc nước, nếu men nổi bồng bềnh là đã sẵn sàng nhào bột.',
                  attachments: [
                    'https://apron.app/docs/nhat-ky-nuoi-men-7-ngay.pdf'
                  ],
                  rating: 5.0
                },
                {
                  id: 'les-sd-1-2',
                  title: 'Kỹ thuật nhào gập Stretch & Fold tạo thớ bánh tổ ong',
                  content: '<p>Phương pháp không nhào truyền thống: Để men và thời gian tự phát triển mạng lưới Gluten bền vững.</p><ol><li>Thực hiện 4 lượt Stretch & Fold cách nhau 30 phút.</li><li>Nhúng ướt tay để chống dính, kéo căng một góc bột lên cao rồi gập ngược vào tâm.</li><li>Xoay âu 90° và lặp lại cho 4 góc.</li></ol>',
                  duration_minutes: 35,
                  hero_image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
                  notes: 'Nhiệt độ ủ khối bột lý tưởng là 24-26°C. Nếu phòng có máy lạnh quá lạnh, hãy đặt âu bột vào lò vi sóng đóng kín cùng 1 cốc nước sôi.',
                  attachments: [
                    'https://apron.app/docs/bieu-do-nhiet-do-u-sourdough.pdf'
                  ],
                  rating: 4.9
                }
              ]
            }
          ]
        },
        {
          id: 'course-broth-mastery',
          title: 'Nghệ Thuật Nấu Nước Dùng & Món Nước Truyền Thống',
          slug: 'nghe-thuat-nau-nuoc-dung-mon-nuoc',
          description: '<p>Bí quyết ninh xương trong veo thanh ngọt, nướng thảo mộc hoa hồi quế thảo quả thơm lừng và công thức cân bằng gia vị chuẩn vị truyền thống.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
          author_id: 'chef-tuan-hai',
          teacher: 'Bếp trưởng Tuấn Hải',
          level: 'Nâng cao',
          rating: 5.0,
          source: 'Tinh Hoa Ẩm Thực',
          created_at: new Date().toISOString(),
          modules: []
        }
      ];

      for (const course of mockCourses) {
        await CourseRepository.save(course);
      }
    }

    // 5. Seed Meal Plans nếu hôm nay chưa có
    const defaultSlots: MealSlotConfig[] = [
      { id: 'breakfast', name: 'Bữa sáng' },
      { id: 'lunch', name: 'Bữa trưa' },
      { id: 'dinner', name: 'Bữa tối' },
      { id: 'snack', name: 'Ăn nhẹ' },
    ];

    const allRecipes = await RecipeRepository.getAll();
    const phoBo = allRecipes.find(r => r.slug === 'pho-bo-gia-truyen') || allRecipes[0];
    const saladGa = allRecipes.find(r => r.slug === 'salad-ga-nuong-bo-qua') || allRecipes[1] || allRecipes[0];
    const suonXao = allRecipes.find(r => r.slug === 'suon-xao-chua-ngot') || allRecipes[2] || allRecipes[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const existingTodayPlan = await MealPlanRepository.getByDate(todayStr);

    if (!existingTodayPlan && phoBo && saladGa && suonXao) {
      const todayPlan: MealPlan = {
        id: `plan-${todayStr}`,
        date: todayStr,
        slots: defaultSlots,
        meals: [
          {
            id: 'meal-breakfast-today',
            recipe_id: phoBo.id,
            meal_type: 'breakfast',
            notes: 'Thưởng thức nóng sốt kèm chút tương ớt và dấm tỏi'
          },
          {
            id: 'meal-lunch-today',
            recipe_id: saladGa.id,
            meal_type: 'lunch',
            notes: 'Bữa trưa Eat Clean nhẹ nhàng thanh mát'
          },
          {
            id: 'meal-dinner-today',
            recipe_id: suonXao.id,
            meal_type: 'dinner',
            notes: 'Bữa tối gia đình ăn cùng cơm trắng nóng'
          }
        ]
      };
      await MealPlanRepository.save(todayPlan);
    }
  } catch (error) {
    console.error('Failed to seed mock data:', error);
  }
}
