import { 
  RecipeRepository, 
  TipRepository, 
  CourseRepository, 
  MealPlanRepository,
  type Recipe,
  type Course,
  type MealPlan,
  type MealSlotConfig
} from '@apron/core';
import { deduplicateRecipes } from './duplicateUtils';

export async function seedMockData() {
  try {
    // 1. Seed Recipes nếu chưa có
    let recipes = await RecipeRepository.getAll();
    if (recipes.length === 0) {
      const mockRecipes: Recipe[] = [
        {
          id: crypto.randomUUID(),
          title: 'Phở Bò Gia Truyền',
          slug: 'pho-bo-gia-truyen',
          description: 'Công thức nấu phở bò chuẩn vị Bắc với nước dùng thanh ngọt từ xương, thơm mùi thảo quả và quế hồi.',
          prep_time: 30,
          cook_time: 180,
          servings: 4,
          difficulty: 'Trung bình',
          status: 'published',
          visibility: 'public',
          tags: ['món-nước', 'bữa-sáng', 'thịt-bò'],
          ingredients: [
            { name: 'Xương bò', quantity: 1, unit: 'kg' },
            { name: 'Thịt bò (thăn, nạm, gầu)', quantity: 500, unit: 'g' },
            { name: 'Bánh phở tươi', quantity: 1, unit: 'kg' },
            { name: 'Hành tây', quantity: 2, unit: 'củ' },
            { name: 'Gừng', quantity: 1, unit: 'củ' },
            { name: 'Quế, hồi, thảo quả', quantity: 1, unit: 'gói' },
            { name: 'Hành lá, rau mùi, húng quế', quantity: 100, unit: 'g' }
          ],
          instructions: [
            {
              step_number: 1,
              title: 'Sơ chế nguyên liệu',
              content: 'Xương bò rửa sạch, chần qua nước sôi 5 phút rồi rửa lại. Nướng sơ gừng và hành tây cho thơm.'
            },
            {
              step_number: 2,
              title: 'Ninh nước dùng',
              content: 'Cho xương vào nồi áp suất cùng gừng, hành tây nướng, gia vị quế hồi. Ninh trong 2-3 tiếng. Sau đó vớt bọt để nước trong.'
            },
            {
              step_number: 3,
              title: 'Thưởng thức',
              content: 'Trần bánh phở, xếp thịt bò thái mỏng lên trên, chan nước dùng đang sôi và thêm hành mùi.'
            }
          ],
          calories: 450,
          taste_score: 4.8,
          image_url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          title: 'Salad Gà Nướng Bơ Quả',
          slug: 'salad-ga-nuong-bo-qua',
          description: 'Món salad nhẹ nhàng, tốt cho sức khỏe với ức gà nướng mềm và bơ sáp béo ngậy.',
          prep_time: 15,
          cook_time: 15,
          servings: 2,
          difficulty: 'Dễ',
          status: 'published',
          visibility: 'public',
          tags: ['ăn-kiêng', 'salad', 'bữa-trưa'],
          ingredients: [
            { name: 'Ức gà', quantity: 300, unit: 'g' },
            { name: 'Bơ sáp', quantity: 1, unit: 'quả' },
            { name: 'Cà chua bi', quantity: 100, unit: 'g' },
            { name: 'Rau xà lách', quantity: 150, unit: 'g' },
            { name: 'Dầu oliu, chanh, muối, tiêu', quantity: 1, unit: 'muỗng' }
          ],
          instructions: [
            {
              step_number: 1,
              title: 'Ướp và nướng gà',
              content: 'Ức gà ướp muối tiêu 10 phút, áp chảo hoặc nướng chín tới, thái miếng vừa ăn.'
            },
            {
              step_number: 2,
              title: 'Chuẩn bị rau củ',
              content: 'Bơ thái lát, cà chua bi cắt đôi, xà lách rửa sạch xé nhỏ.'
            },
            {
              step_number: 3,
              title: 'Trộn salad',
              content: 'Pha sốt dầu oliu chanh, trộn đều các nguyên liệu và rưới sốt lên trên.'
            }
          ],
          calories: 320,
          taste_score: 4.5,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          title: 'Sườn Xào Chua Ngọt',
          slug: 'suon-xao-chua-ngot',
          description: 'Món đưa cơm nhất cho gia đình với miếng sườn mềm hòa quyện nước sốt chua ngọt đậm đà.',
          prep_time: 20,
          cook_time: 30,
          servings: 4,
          difficulty: 'Trung bình',
          status: 'published',
          visibility: 'public',
          tags: ['món-chính', 'bữa-tối', 'thịt-heo'],
          ingredients: [
            { name: 'Sườn non', quantity: 500, unit: 'g' },
            { name: 'Hành khô, tỏi', quantity: 2, unit: 'củ' },
            { name: 'Nước mắm, đường, dấm, tương ớt', quantity: 3, unit: 'muỗng' }
          ],
          instructions: [
            {
              step_number: 1,
              title: 'Chiên sườn',
              content: 'Sườn non chặt miếng vừa ăn, luộc sơ rồi chiên vàng đều các mặt.'
            },
            {
              step_number: 2,
              title: 'Làm sốt chua ngọt',
              content: 'Pha hỗn hợp: 2 mắm, 2 đường, 1 dấm, 1 tương ớt, 1 nước lọc. Khuấy đều.'
            },
            {
              step_number: 3,
              title: 'Hoàn thiện',
              content: 'Phi thơm hành tỏi, đổ sốt vào đun sôi, cho sườn vào đảo đều đến khi sốt sệt lại, bám đều quanh miếng sườn.'
            }
          ],
          calories: 600,
          taste_score: 4.9,
          image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      await RecipeRepository.saveBulk(mockRecipes as any);
      recipes = await RecipeRepository.getAll();
    } else {
      // Tự động sửa ảnh nếu recipe cũ bị lỗi URL 404
      for (const r of recipes) {
        let changed = false;
        if (r.slug === 'pho-bo-gia-truyen' && (r.image_url?.includes('1582878826629') || !r.image_url)) {
          r.image_url = 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80';
          changed = true;
        }
        if (r.slug === 'suon-xao-chua-ngot' && (r.image_url?.includes('8111142154eaa') || !r.image_url)) {
          r.image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80';
          changed = true;
        }
        if (changed) {
          await RecipeRepository.save(r);
        }
      }
    }

    // Tự động lọc và loại bỏ các công thức trùng lặp trong database nếu có
    const { redundantRecipeIds } = deduplicateRecipes(recipes);
    if (redundantRecipeIds.length > 0) {
      await RecipeRepository.deleteBulk(redundantRecipeIds);
      recipes = await RecipeRepository.getAll();
    }

    // 2. Seed Tips nếu chưa có
    const tips = await TipRepository.getAll();
    if (tips.length === 0) {
      const mockTips = [
        {
          id: crypto.randomUUID(),
          title: 'Bí quyết chọn xương bò nấu phở ngon',
          slug: 'bi-quyet-chon-xuong-bo-nau-pho',
          content: 'Nên chọn xương ống bò, có màu đỏ tươi, tủy bên trong còn màu hồng. Tránh xương có mùi hôi lạ hoặc màu xỉn.',
          image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
          tags: ['mẹo-chọn-nguyên-liệu'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          title: 'Cách giữ bơ sáp không bị thâm',
          slug: 'cach-giu-bo-sap-khong-bi-tham',
          content: 'Khi cắt bơ mà dùng không hết, hãy quét một lớp dầu oliu mỏng hoặc vắt chút chanh lên bề mặt bơ rồi bọc kín bằng màng bọc thực phẩm, để tủ lạnh.',
          image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80',
          tags: ['mẹo-bảo-quản'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
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

    // 3. Seed Courses nếu chưa có
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
                  content: 'Tìm hiểu cấu trúc lưỡi dao, sự khác biệt giữa góc mài 15° của Nhật và 20° của phương Tây, cách chọn dao vừa vặn với kích cỡ bàn tay.',
                  duration_minutes: 15,
                  hero_image_url: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&q=80',
                  rating: 5.0
                },
                {
                  id: 'les-1-2',
                  title: 'Tư thế đứng & kỹ thuật giữ thực phẩm an toàn (The Claw Grip)',
                  content: 'Luyện tập thế tay móng vuốt để bảo vệ ngón tay tuyệt đối khi thao tác thái nhanh và nhịp nhàng.',
                  duration_minutes: 20,
                  hero_image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
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
                  content: 'Quy trình gọt phẳng cạnh, chia thớ và cắt đồng đều các loại củ quả như cà rốt, khoai tây, hành tây.',
                  duration_minutes: 25,
                  hero_image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
                  rating: 4.8
                },
                {
                  id: 'les-2-2',
                  title: 'Kỹ thuật lóc xương cá & phi lê gia cầm siêu tốc',
                  content: 'Mẹo luồn mũi dao sát khung xương để tận dụng tối đa thịt mà không làm rách da.',
                  duration_minutes: 30,
                  hero_image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
                  rating: 5.0
                }
              ]
            }
          ]
        },
        {
          id: 'course-broth-mastery',
          title: 'Nghệ Thuật Nấu Nước Dùng & Món Nước Truyền Thống',
          slug: 'nghe-thuat-nau-nuoc-dung-mon-nuoc',
          description: '<p>Bí quyết ninh xương trong veo thanh ngọt, nướng thảo mộc hoa hồi quế thảo quả thơm lừng và công thức cân bằng gia vị nước phở bò, bún bò chuẩn vị truyền thống.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
          author_id: 'chef-tuan-hai',
          teacher: 'Bếp trưởng Tuấn Hải',
          level: 'Nâng cao',
          rating: 5.0,
          source: 'Tinh Hoa Ẩm Thực',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          modules: [
            {
              id: 'mod-broth-1',
              title: 'Chương 1: Nguyên lý hầm xương & kiểm soát bọt',
              icon: 'Flame',
              lessons: [
                {
                  id: 'les-b-1',
                  title: 'Khử tanh tủy xương bò & kỹ thuật chần nước đầu',
                  content: 'Cách rửa xương bằng giấm gừng, chần ngập nước sôi để loại bỏ hoàn toàn máu đọng và tạp chất.',
                  duration_minutes: 20,
                  hero_image_url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80',
                  rating: 5.0
                },
                {
                  id: 'les-b-2',
                  title: 'Nhiệt độ sôi lăn tăn & bí quyết giữ nước dùng trong như hổ phách',
                  content: 'Tại sao không được đậy nắp kín khi ninh xương và cách dùng lòng trắng trứng để lọc trong nước dùng bị đục.',
                  duration_minutes: 35,
                  hero_image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
                  rating: 4.9
                }
              ]
            },
            {
              id: 'mod-broth-2',
              title: 'Chương 2: Phối trộn thảo mộc & nêm gia vị',
              icon: 'Sparkles',
              lessons: [
                {
                  id: 'les-b-3',
                  title: 'Kỹ thuật rang nướng hành gừng thảo quả quế hồi',
                  content: 'Thời điểm vàng thả túi thảo mộc vào nồi nước dùng để hương thơm lan tỏa sâu mà không bị đen nước.',
                  duration_minutes: 25,
                  hero_image_url: 'https://images.unsplash.com/photo-1505253758473-96b3015f240a?w=800&q=80',
                  rating: 5.0
                }
              ]
            }
          ]
        },
        {
          id: 'course-eat-clean-prep',
          title: 'Eat Clean & Meal Prep Cho Người Bận Rộn',
          slug: 'eat-clean-meal-prep-cho-nguoi-ban-ron',
          description: '<p>Chỉ với 2 giờ cuối tuần, chuẩn bị trọn gói bữa ăn lành mạnh cho 5 ngày làm việc. Tiết kiệm 40% chi phí chợ búa, kiểm soát calo và tràn đầy năng lượng.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
          author_id: 'coach-emma',
          teacher: 'HLV Emma Phạm',
          level: 'Cơ bản',
          rating: 4.8,
          source: 'Healthy Kitchen',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          modules: [
            {
              id: 'mod-ec-1',
              title: 'Chương 1: Quy hoạch hộp đựng & bảo quản thực phẩm',
              icon: 'Box',
              lessons: [
                {
                  id: 'les-ec-1',
                  title: 'Chọn hộp thủy tinh chân không & nguyên tắc chia ngăn khoa học',
                  content: 'Cách sắp xếp thực phẩm theo quy tắc 50% rau xanh, 25% đạm nạc, 25% tinh bột chậm.',
                  duration_minutes: 18,
                  hero_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
                  rating: 4.8
                }
              ]
            },
            {
              id: 'mod-ec-2',
              title: 'Chương 2: 5 Công thức sốt salad healthy bất bại',
              icon: 'Salad',
              lessons: [
                {
                  id: 'les-ec-2',
                  title: 'Sốt mè rang chua ngọt & sốt chanh leo sữa chua Hy Lạp',
                  content: 'Cách pha nước sốt sánh mịn không dùng dầu mỡ công nghiệp, bảo quản lạnh dùng dần trong 2 tuần.',
                  duration_minutes: 22,
                  hero_image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
                  rating: 4.9
                }
              ]
            }
          ]
        },
        {
          id: 'course-sourdough-baking',
          title: 'Nghệ Thuật Bánh Mì Men Tự Nhiên (Sourdough)',
          slug: 'nghe-thuat-banh-mi-men-tu-nhien-sourdough',
          description: '<p>Tự nuôi men tự nhiên từ táo và bột mì, hiểu sâu về mạng lưới gluten, kỹ thuật gấp bột coil fold và nướng bánh vỏ giòn rụm với thớ ruột rỗng tổ ong xốp mềm.</p>',
          thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          author_id: 'chef-lan-vy',
          teacher: 'Pastry Chef Lan Vy',
          level: 'Chuyên gia',
          rating: 4.9,
          source: 'Baking Masterclass',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          modules: [
            {
              id: 'mod-sd-1',
              title: 'Chương 1: Nuôi dưỡng và làm quen với Men Khởi Động (Starter)',
              icon: 'Activity',
              lessons: [
                {
                  id: 'les-sd-1',
                  title: 'Lịch cho men ăn hàng ngày & nhận biết đỉnh men nở cực đại',
                  content: 'Hiểu về vi khuẩn axit lactic và nấm men hoang dã, thử nghiệm thả nổi men nở trong nước (Float test).',
                  duration_minutes: 30,
                  hero_image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
                  rating: 5.0
                }
              ]
            }
          ]
        }
      ];

      for (const course of mockCourses) {
        await CourseRepository.save(course);
      }
    }

    // 4. Seed Meal Plans nếu hôm nay chưa có
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

    const getDateStr = (offsetDays: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const todayStr = getDateStr(0);
    const existingTodayPlan = await MealPlanRepository.getByDate(todayStr);

    if (!existingTodayPlan && phoBo && saladGa && suonXao) {
      const plansToSeed: MealPlan[] = [
        // Hôm nay
        {
          id: `plan-${todayStr}`,
          date: todayStr,
          slots: defaultSlots,
          meals: [
            {
              id: crypto.randomUUID(),
              recipe_id: phoBo.id,
              meal_type: 'breakfast',
              notes: 'Thưởng thức nóng sốt kèm quẩy giòn và chút tương ớt, dấm tỏi'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: saladGa.id,
              meal_type: 'lunch',
              notes: 'Bữa trưa Eat Clean nhẹ nhàng, giàu đạm và vitamin'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: suonXao.id,
              meal_type: 'dinner',
              notes: 'Bữa tối gia đình sum họp, ăn kèm cơm trắng nóng hổi'
            }
          ]
        },
        // Ngày mai (+1)
        {
          id: `plan-${getDateStr(1)}`,
          date: getDateStr(1),
          slots: defaultSlots,
          meals: [
            {
              id: crypto.randomUUID(),
              recipe_id: saladGa.id,
              meal_type: 'breakfast',
              notes: 'Bắt đầu ngày mới tươi mát đầy sảng khoái'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: suonXao.id,
              meal_type: 'lunch',
              notes: 'Cơm trưa hộp mang đi làm tiện lợi'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: phoBo.id,
              meal_type: 'dinner',
              notes: 'Đổi vị bữa tối với tô phở bò ấm bụng'
            }
          ]
        },
        // Ngày mốt (+2)
        {
          id: `plan-${getDateStr(2)}`,
          date: getDateStr(2),
          slots: defaultSlots,
          meals: [
            {
              id: crypto.randomUUID(),
              recipe_id: phoBo.id,
              meal_type: 'breakfast',
              notes: 'Bữa sáng nhanh gọn nạp năng lượng'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: saladGa.id,
              meal_type: 'lunch',
              notes: 'Salad gà thanh nhẹ'
            }
          ]
        },
        // Hôm qua (-1)
        {
          id: `plan-${getDateStr(-1)}`,
          date: getDateStr(-1),
          slots: defaultSlots,
          meals: [
            {
              id: crypto.randomUUID(),
              recipe_id: suonXao.id,
              meal_type: 'lunch',
              notes: 'Cơm sườn xào đậm đà'
            },
            {
              id: crypto.randomUUID(),
              recipe_id: phoBo.id,
              meal_type: 'dinner',
              notes: 'Nấu phở bò chiêu đãi cả nhà'
            }
          ]
        }
      ];

      for (const plan of plansToSeed) {
        await MealPlanRepository.save(plan);
      }
    }
  } catch (error) {
    console.error('Failed to seed mock data:', error);
  }
}
