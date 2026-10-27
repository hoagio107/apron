const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const NOTION_DIR = 'C:/Users/Admin/Downloads/82332172-31c6-4aff-9401-14660b0bcc3e_ExportBlock-e0caa5c2-c711-4eae-8b20-d7cad8aed5c3';

// App database courses folder
const APP_COURSES_DIR = 'C:/Users/Admin/Documents/CookbookData/courses';
const APP_IMAGES_DIR = 'C:/Users/Admin/Documents/CookbookData/images';

// Downloads folders for user
const DOWNLOADS_COURSES_DIR = 'C:/Users/Admin/Downloads/courses';
const DOWNLOADS_ALL_COURSES_JSON = 'C:/Users/Admin/Downloads/cookbook_courses_import.json';
const DOWNLOADS_IMAGES_DIR = 'C:/Users/Admin/Downloads/CookBook-Non-Duplicates-Images';

[APP_COURSES_DIR, APP_IMAGES_DIR, DOWNLOADS_COURSES_DIR, DOWNLOADS_IMAGES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function decodeHtml(html) {
  return String(html || '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ');
}

function copyImageIfAvailable(rawImgName) {
  if (!rawImgName) return '';
  const decoded = decodeURIComponent(rawImgName);
  const basename = path.basename(decoded);
  const src = path.join(NOTION_DIR, basename);
  if (fs.existsSync(src)) {
    // Copy to app images dir and downloads images dir
    const destApp = path.join(APP_IMAGES_DIR, basename);
    const destDl = path.join(DOWNLOADS_IMAGES_DIR, basename);
    if (!fs.existsSync(destApp)) fs.copyFileSync(src, destApp);
    if (!fs.existsSync(destDl)) fs.copyFileSync(src, destDl);
    return `images/${basename}`;
  }
  return '';
}

function cleanLessonHtml(rawHtml) {
  const m = rawHtml.match(/<div class="page-body">([\s\S]*?)<\/div>\s*<\/article>/);
  if (!m) return '';

  let html = m[1];

  // Remove figure images (since hero image is displayed in hero section)
  html = html.replace(/<figure[\s\S]*?<\/figure>/gi, '');

  // Convert details/summary to heading
  html = html.replace(/<details open="" class="[^"]*"[^>]*><summary><mark[^>]*><strong>(.*?)<\/strong><\/mark><\/summary><div class="indented">/gi, '<h4>$1</h4><div>');
  html = html.replace(/<\/details>/gi, '');
  html = html.replace(/data-notion-[a-z-]+="[^"]*"/gi, '');
  html = html.replace(/id="[^"]*"/gi, '');
  html = html.replace(/class="bulleted-list"/gi, 'class="list-disc pl-5 my-2 space-y-1"');
  html = html.replace(/class=""/gi, '');
  html = html.replace(/dir="auto"/gi, '');
  html = html.replace(/dir="ltr"/gi, '');
  html = html.replace(/style="list-style-type:disc"/gi, '');
  html = html.replace(/\s{2,}/g, ' ');

  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/gi, '');

  return decodeHtml(html.trim());
}

function parseLessonFile(filename, customTitle) {
  const filePath = path.join(NOTION_DIR, filename);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');

  // Title
  const titleM = content.match(/<h1 class="page-title"[^>]*>([\s\S]*?)<\/h1>/);
  const title = customTitle || (titleM ? decodeHtml(titleM[1].replace(/<[^>]+>/g, '')).trim() : '');

  // Hero image
  const imgM = content.match(/data-notion-image="([^">]+)"/) || content.match(/<img[^>]+src="([^">]+\.(?:jpg|png|webp|jpeg))"/i);
  const heroImageUrl = imgM ? copyImageIfAvailable(imgM[1]) : undefined;

  // Cleaned HTML content
  const htmlContent = cleanLessonHtml(content);

  // Generate ID
  const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const hash = crypto.createHash('md5').update(filename + title).digest('hex').slice(0, 6);
  const id = `lesson-${slug}-${hash}`;

  return {
    id,
    title,
    content: htmlContent,
    duration_minutes: 15,
    hero_image_url: heroImageUrl,
    rating: 5,
    notes: ''
  };
}

// ==========================================
// 1. KHÓA HỌC CƠM NẮM (19 BÀI HỌC)
// ==========================================
console.log('Building Course 1: Cơm nắm Onigiri...');
const comNamLessons = [
  // Module 1: Tổng quan & Nấu cơm
  {
    moduleTitle: 'Tổng quan & Kỹ thuật nấu cơm',
    icon: 'CookingPot',
    lessons: [
      { file: 'Bài 1 Tóm tắt và lưu ý 1744320ba42b800488ecca3ca89a0df9.html', title: 'Bài 1: Tóm tắt các bước và lưu ý khi làm cơm nắm' },
      { file: 'Bài 2 Cách nấu cơm 1744320ba42b80b5b153e94cb366c296.html', title: 'Bài 2: Kỹ thuật nấu cơm gạo Nhật, gạo trắng và gạo tím' }
    ]
  },
  // Module 2: Các loại sốt chuyên dụng
  {
    moduleTitle: 'Các loại sốt chuyên dụng cho cơm nắm',
    icon: 'Flame',
    lessons: [
      { file: 'Bài 3 Sốt phô mai 1744320ba42b809c9904edc1b2dd4e0a.html', title: 'Bài 3: Công thức sốt phô mai béo ngậy' },
      { file: 'Bài 4 Sốt Teriyaki 1744320ba42b80bc9c44f85316520c9a.html', title: 'Bài 4: Công thức sốt Teriyaki chuẩn vị Nhật' }
    ]
  },
  // Module 3: Chế biến các loại nhân
  {
    moduleTitle: 'Chế biến các loại nhân mặn đậm đà',
    icon: 'UtensilsCrossed',
    lessons: [
      { file: 'Bài 5 Nhân cá hồi 1744320ba42b806bbbf6c39b95027dd6.html', title: 'Bài 5: Chế biến nhân cá hồi' },
      { file: 'Bài 6 Nhân thịt gà cá diêu hồng cá basa 1744320ba42b800fa282c1bfdb9d7717.html', title: 'Bài 6: Nhân thịt gà / cá diêu hồng / cá basa' },
      { file: 'Bài 7 Nhân thịt heo 19d4320ba42b806a9953e3f995b98e95.html', title: 'Bài 7: Chế biến nhân thịt heo' },
      { file: 'Bài 8 Nhân thịt bò 19d4320ba42b80d09441f481fb6fba19.html', title: 'Bài 8: Chế biến nhân thịt bò' },
      { file: 'Bài 9 Nhân thanh cua, cá ngừ 19d4320ba42b8071a385fd010a875d21.html', title: 'Bài 9: Chế biến nhân thanh cua & cá ngừ' },
      { file: 'Bài 10 Nhân cá bào 19d4320ba42b805da639e209524f2922.html', title: 'Bài 10: Chế biến nhân cá bào Okaka' },
      { file: 'Bài 11 Nhân trứng cuộn 19d4320ba42b80f0a47cc7a3da1e5a16.html', title: 'Bài 11: Chế biến nhân trứng cuộn Tamagoyaki' }
    ]
  },
  // Module 4: Kỹ thuật trộn cơm & Tối ưu cost
  {
    moduleTitle: 'Kỹ thuật trộn cơm & Tối ưu cost',
    icon: 'Scale',
    lessons: [
      { file: 'Bài 12 Các loại cơm cost thấp 19d4320ba42b80b19861d0baa85546c9.html', title: 'Bài 12: Các công thức cơm chi phí thấp kinh doanh' },
      { file: 'Bài 13 Xào các loại rau củ để mix cơm 19d4320ba42b800dbe10ed8cae925178.html', title: 'Bài 13: Xào các loại rau củ để mix cơm' },
      { file: 'Bài 19 Một số nguyên liệu 19d4320ba42b80ea89edc415717add77.html', title: 'Bài 19: Giới thiệu và lưu ý về các nguyên liệu' }
    ]
  },
  // Module 5: Thực hành các món cơm nắm tiêu biểu
  {
    moduleTitle: 'Thực hành các món cơm nắm tiêu biểu',
    icon: 'Sparkles',
    lessons: [
      { file: 'Bài 14 Cơm nắm cá ngừ 19d4320ba42b8070a533e390dcd6ec26.html', title: 'Bài 14: Cơm nắm cá ngừ sốt Mayo' },
      { file: 'Bài 15 Cơm nắm thanh cua mayonaise 19d4320ba42b80818beffd7e1dc9d58b.html', title: 'Bài 15: Cơm nắm thanh cua sốt Mayonnaise' },
      { file: 'Bài 16 Cơm nắm xúc xích - chà bông 19d4320ba42b80299e73fefa7df8929c.html', title: 'Bài 16: Cơm nắm xúc xích - chà bông' },
      { file: 'Bài 17 Cơm nắm bò tiêu đen 19d4320ba42b806094b3fc48b9b0e4fc.html', title: 'Bài 17: Cơm nắm bò tiêu đen áp chảo' }
    ]
  },
  // Module 6: Đóng gói & Bảo quản
  {
    moduleTitle: 'Đóng gói & Bảo quản thành phẩm',
    icon: 'Package',
    lessons: [
      { file: 'Bài 18 Đóng gói 19d4320ba42b8050999fed0f8c8811a3.html', title: 'Bài 18: Kỹ thuật đóng gói màng bọc tam giác & bảo quản' }
    ]
  }
];

const courseComNamModules = comNamLessons.map((m, mIdx) => ({
  id: `module-com-nam-${mIdx + 1}`,
  title: m.moduleTitle,
  icon: m.icon,
  lessons: m.lessons.map(l => parseLessonFile(l.file, l.title)).filter(Boolean)
}));

const courseComNam = {
  id: 'course-com-nam-onigiri-chuan-vi',
  title: 'Khóa học Cơm nắm Onigiri chuẩn vị',
  slug: 'khoa-hoc-com-nam-onigiri-chuan-vi',
  description: 'Khóa học toàn diện gồm 19 bài học chi tiết từ chuẩn bị gạo, kỹ thuật nấu cơm dẻo ngon, pha chế sốt teriyaki & phô mai, chế biến 10 loại nhân cao cấp và kỹ thuật đóng gói bảo quản.',
  thumbnail_url: copyImageIfAvailable('2-cach-lam-com-nam-nhat-ban-onigiri-don-gian-de-lam-nhat--10.jpg'),
  author_id: 'user',
  level: 'Cơ bản',
  teacher: 'Bếp Apron',
  rating: 5,
  modules: courseComNamModules,
  created_at: new Date().toISOString()
};

// ==========================================
// 2. KHÓA HỌC EAT CLEAN & DINH DƯỠNG (13 BÀI HỌC)
// ==========================================
console.log('Building Course 2: Eat Clean & Dinh dưỡng...');
const eatCleanModulesRaw = [
  {
    moduleTitle: 'Nguyên lý Eat Clean nền tảng',
    icon: 'BookOpen',
    lessons: [
      { file: 'Eat Clean là gì 1c34320ba42b80ac87fdc2494535b53b.html', title: 'Eat Clean là gì? Nguyên tắc cơ bản' },
      { file: 'Nguyên tắc quan trọng để giảm cân 1c44320ba42b802c81d1cc712add0c28.html', title: 'Nguyên tắc quan trọng để giảm cân hiệu quả' },
      { file: 'Cách tính BMI, BMR, TDEE 1c44320ba42b80e7b197da943a89c3f9.html', title: 'Công thức tính BMI, BMR và TDEE chuẩn khoa học' }
    ]
  },
  {
    moduleTitle: 'Lựa chọn thực phẩm & Gia vị lành mạnh',
    icon: 'Apple',
    lessons: [
      { file: 'Nguyên tắc chọn thực phẩm Eat Clean 1c44320ba42b80f78422e6d3952eb8c0.html', title: 'Nguyên tắc chọn thực phẩm sạch Eat Clean' },
      { file: 'Gia vị 1c44320ba42b80d8928afa39f15bbd79.html', title: 'Các loại gia vị lành mạnh trong Eat Clean' },
      { file: 'Các loại Đạm 1c54320ba42b80088bffcaf14c6a713c.html', title: 'Phân loại các nguồn đạm chất lượng cao' },
      { file: 'Các loại tinh bột 1c54320ba42b80d699bdcc3642ee3af1.html', title: 'Các loại tinh bột hấp thu chậm (Good Carbs)' },
      { file: 'Các loại rau xanh 1c54320ba42b80ba8915ec20b9bbce3e.html', title: 'Các loại rau xanh giàu vi chất và chất xơ' }
    ]
  },
  {
    moduleTitle: 'Quy trình sơ chế & Tẩm ướp chuẩn',
    icon: 'ChefHat',
    lessons: [
      { file: 'Quy trình sơ chế đạm 1c64320ba42b80eab682f5bcf3c392c8.html', title: 'Quy trình sơ chế các loại thịt đạm' },
      { file: 'Quy trình sơ chế rau củ quả 1c64320ba42b8078976ac10c60a064dc.html', title: 'Quy trình rửa và sơ chế rau củ quả sạch' },
      { file: 'Quy trình tẩm ướp đạm 1c64320ba42b8037b746d9a98f592d90.html', title: 'Quy trình tẩm ướp đạm đậm đà không ngấy' }
    ]
  },
  {
    moduleTitle: 'Meal Prep & Bảo quản thực phẩm',
    icon: 'Refrigerator',
    lessons: [
      { file: 'Cách chuẩn bị bữa ăn Eat Clean hiệu quả 1c44320ba42b801a8990f9d5ac892b95.html', title: 'Cách chuẩn bị bữa ăn Eat Clean nhanh gọn (Meal Prep)' },
      { file: 'Bảo quản thực phẩm 1c44320ba42b8061aa07f9902ab7cd3d.html', title: 'Kỹ thuật bảo quản thực phẩm tươi sống và nấu chín' }
    ]
  }
];

const courseEatCleanModules = eatCleanModulesRaw.map((m, mIdx) => ({
  id: `module-eat-clean-${mIdx + 1}`,
  title: m.moduleTitle,
  icon: m.icon,
  lessons: m.lessons.map(l => parseLessonFile(l.file, l.title)).filter(Boolean)
}));

const courseEatClean = {
  id: 'course-eat-clean-dinh-duong-toan-dien',
  title: 'Kiến thức Eat Clean & Dinh dưỡng toàn diện',
  slug: 'kien-thuc-eat-clean-va-dinh-duong-toan-dien',
  description: 'Trọn bộ kiến thức Eat Clean khoa học gồm 13 chuyên đề: hiểu đúng về ăn sạch, nguyên tắc giảm cân, công thức tính BMI - BMR - TDEE, cách chọn thực phẩm, gia vị, bảo quản và quy trình sơ chế tẩm ướp chuẩn.',
  thumbnail_url: copyImageIfAvailable('1.1.png'),
  author_id: 'user',
  level: 'Cơ bản',
  teacher: 'Chuyên gia Dinh dưỡng',
  rating: 5,
  modules: courseEatCleanModules,
  created_at: new Date().toISOString()
};

// ==========================================
// 3. KHÓA HỌC TỰ LÀM MÌ RAU CỦ & NUI TƯƠI
// ==========================================
console.log('Building Course 3: Mì rau củ & Nui tươi...');
const miRauCuHtml = fs.readFileSync(path.join(NOTION_DIR, 'Mì rau củ c38fe7332af04e8d9279287436564986.html'), 'utf8');

const courseMiRauCu = {
  id: 'course-tu-lam-mi-rau-cu-va-nui-tuoi',
  title: 'Tự làm Mì rau củ & Nui tươi tại nhà',
  slug: 'tu-lam-mi-rau-cu-va-nui-tuoi-tai-nha',
  description: 'Cẩm nang từ A-Z về máy móc, dụng cụ, kỹ thuật tạo màu nước ép tự nhiên từ rau củ quả và công thức chuẩn làm mỳ trứng, bún tươi, phở tươi, nui rau củ bằng máy làm mì.',
  thumbnail_url: copyImageIfAvailable('1000002893.png') || 'images/1000002893.png',
  author_id: 'user',
  level: 'Cơ bản',
  teacher: 'Bếp Apron',
  rating: 5,
  modules: [
    {
      id: 'module-mi-1',
      title: 'Máy móc & Dụng cụ làm mì',
      icon: 'Settings',
      lessons: [
        {
          id: 'lesson-mi-dung-cu',
          title: 'Dụng cụ và máy móc cần thiết làm mì tươi',
          duration_minutes: 15,
          rating: 5,
          content: `
            <h3>1. Dụng cụ đo lường</h3>
            <ul>
              <li><strong>Ca chia thể tích:</strong> Đong chất lỏng (nước ép, trứng, nước lọc).</li>
              <li><strong>Cân điện tử:</strong> Định lượng bột chuẩn xác từng gram.</li>
              <li><strong>Thìa đong:</strong> Đong muối, dầu ăn.</li>
            </ul>
            <h3>2. Dụng cụ đựng & bảo quản</h3>
            <ul>
              <li><strong>Hộp nhựa / Túi hút chân không:</strong> Đựng mì thành phẩm bảo quản tủ đông.</li>
              <li><strong>Lọ thuỷ tinh nắp kín:</strong> Đựng nước ép tạo màu và nước sốt.</li>
            </ul>
            <h3>3. Máy móc</h3>
            <ul>
              <li><strong>Máy ép chậm:</strong> Ép nước rau củ nguyên chất tạo màu đậm đặc.</li>
              <li><strong>Máy làm mì tươi tự động:</strong> Nhào bột và đùn sợi mì, bún, nui, phở.</li>
              <li><strong>Nồi chiên không dầu (NCKD):</strong> Sấy nhẹ sợi mì nếu làm mì khô.</li>
            </ul>
          `
        }
      ]
    },
    {
      id: 'module-mi-2',
      title: 'Nguyên vật liệu & Bảng màu nước ép tự nhiên',
      icon: 'Palette',
      lessons: [
        {
          id: 'lesson-mi-nguyen-lieu-mau',
          title: 'Công thức tạo màu tự nhiên từ rau củ quả',
          duration_minutes: 20,
          rating: 5,
          content: `
            <h3>Nguyên vật liệu cơ bản</h3>
            <ul>
              <li><strong>Bột mì đa dụng (Số 11):</strong> Bột Meizan hoặc tương đương để có độ dai vừa phải.</li>
              <li><strong>Bột năng:</strong> Giúp sợi mì dẻo dai và bóng mượt hơn.</li>
              <li><strong>Chất lỏng:</strong> Trứng gà, dầu mè, nước lọc, nước ép rau củ tạo màu.</li>
              <li><strong>Muối hồng:</strong> 1-2g giúp tạo vị đậm đà và bảo quản sợi mì tốt hơn.</li>
            </ul>
            <h3>Bảng màu nước ép tự nhiên</h3>
            <ul>
              <li><strong>Màu vàng cam:</strong> Gấc, nghệ tươi, cà rốt, bí đỏ hấp ép lấy nước.</li>
              <li><strong>Màu xanh lá:</strong> Cải Kale, cải bó xôi (spinach), cải cầu vồng, bột trà xanh matcha.</li>
              <li><strong>Màu đỏ tím:</strong> Củ dền, bắp cải tím, lá cẩm nấu lấy nước.</li>
              <li><strong>Màu xanh dương:</strong> Hoa đậu biếc ngâm nước ấm.</li>
              <li><strong>Màu đen huyền bí:</strong> Tinh than tre thực phẩm hoặc mè đen rang xay.</li>
            </ul>
          `
        }
      ]
    },
    {
      id: 'module-mi-3',
      title: 'Công thức cơ bản với máy làm mì',
      icon: 'BookOpen',
      lessons: [
        {
          id: 'lesson-mi-trung-mem',
          title: 'Công thức Mỳ trứng mềm & Mỳ trứng dai',
          duration_minutes: 20,
          rating: 5,
          content: `
            <h3>Công thức Mỳ trứng mềm</h3>
            <p>Phù hợp cho bé ăn dặm hoặc người thích sợi mì mềm mượt:</p>
            <ul>
              <li>Bột mì đa dụng: 200g</li>
              <li>Trứng gà: 1 quả (khoảng 50g)</li>
              <li>Nước lọc: 20 - 30ml (tổng chất lỏng 70-80ml)</li>
              <li>Muối: 1g</li>
            </ul>
            <h3>Công thức Mỳ trứng dai</h3>
            <p>Phù hợp làm mì xào, mì ramen, mì nước:</p>
            <ul>
              <li>Bột mì đa dụng: 180g</li>
              <li>Bột năng: 20g (tạo độ dai giòn)</li>
              <li>Trứng gà: 1 quả</li>
              <li>Nước lọc: 25ml</li>
              <li>Dầu ăn: 5ml</li>
            </ul>
          `
        },
        {
          id: 'lesson-mi-pho-bun-nui',
          title: 'Công thức làm Phở tươi, Bún tươi & Nui rau củ',
          duration_minutes: 25,
          rating: 5,
          content: `
            <h3>Công thức Phở tươi & Bún tươi</h3>
            <ul>
              <li>Bột gạo tẻ: 150g</li>
              <li>Bột năng: 50g</li>
              <li>Nước sôi để ấm: 85 - 90ml</li>
              <li>Dầu ăn: 1 muỗng cà phê</li>
              <li>Muối: 1g</li>
            </ul>
            <h3>Công thức Nui rau củ ngũ sắc</h3>
            <ul>
              <li>Bột mì số 11: 170g</li>
              <li>Bột năng: 30g</li>
              <li>Nước ép rau củ màu tuỳ chọn: 75ml</li>
              <li>Muối: 1g</li>
            </ul>
            <p>Đùn nui qua khuôn nui của máy, cắt thành từng khúc 1.5 - 2cm.</p>
          `
        }
      ]
    }
  ],
  created_at: new Date().toISOString()
};

// ==========================================
// 4. KHÓA HỌC BÁNH BAO HOÀN CHỈNH
// ==========================================
console.log('Building Course 4: Kỹ thuật làm Bánh bao hoàn chỉnh...');
const courseBanhBao = {
  id: 'course-ky-thuat-lam-banh-bao-hoan-chinh',
  title: 'Kỹ thuật làm Bánh bao hoàn chỉnh',
  slug: 'ky-thuat-lam-banh-bao-hoan-chinh',
  description: 'Quy trình 8 bước chuẩn làm bánh bao xốp mềm, thơm ngon: chuẩn bị nguyên liệu, ủ men nở chuẩn, làm nhân bánh, cán bột, tạo hình, ủ bánh, kỹ thuật hấp và bảo quản.',
  thumbnail_url: copyImageIfAvailable('1000008845.jpg') || 'images/1000008845.jpg',
  author_id: 'user',
  level: 'Cơ bản',
  teacher: 'Bếp Apron',
  rating: 5,
  modules: [
    {
      id: 'module-banh-bao-1',
      title: 'Quy trình 8 bước làm bánh bao chuẩn',
      icon: 'CheckCircle',
      lessons: [
        {
          id: 'lesson-banh-bao-8-buoc',
          title: '8 bước cơ bản để làm ra chiếc bánh bao hoàn chỉnh',
          duration_minutes: 30,
          rating: 5,
          content: `
            <h3>8 bước cơ bản làm bánh bao:</h3>
            <ol class="list-decimal pl-5 space-y-3">
              <li><strong>Bước 1: Chuẩn bị Nguyên liệu và Dụng cụ cần thiết</strong><br/>Bột mì số 8 hoặc bột bánh bao chuyên dụng, men nở instant dry yeast, bột nở (baking powder), đường, sữa tươi không đường, dầu ăn.</li>
              <li><strong>Bước 2: Kích hoạt & Ủ men</strong><br/>Khuấy men với sữa tươi ấm (khoảng 35°C) và chút đường, để 10-15 phút đến khi men nở bung như gạch cua.</li>
              <li><strong>Bước 3: Chuẩn bị nhân bánh</strong><br/>Ướp thịt xay, mộc nhĩ, nấm hương, hành tây, trứng cút luộc trước 1-2 tiếng để nhân ngấm gia vị và săn chắc.</li>
              <li><strong>Bước 4: Nhào & Trộn bột</strong><br/>Trộn đều hỗn hợp bột và men, nhào đến khi khối bột mịn màng, không dính tay, ấn vào đàn hồi tốt.</li>
              <li><strong>Bước 5: Xử lý bột & Cán bột</strong><br/>
                • <em>Bánh chay:</em> Cán phẳng bột, cuộn tròn lại và chia thành các khúc đều nhau.<br/>
                • <em>Bánh có nhân:</em> Chia bột thành từng viên 40-50g, cán tròn mỏng ở rìa và dày ở giữa, đặt nhân vào và túm mép tạo nếp gấp.
              </li>
              <li><strong>Bước 6: Ủ bánh lần 2</strong><br/>Đặt bánh lên giấy nến, ủ nơi kín gió 30-45 phút đến khi bánh nở phồng gấp rưỡi, sờ vào nhẹ tay như đám mây.</li>
              <li><strong>Bước 7: Hấp bánh chuẩn nhiệt</strong><br/>Đun nước sôi, hạ lửa vừa. Cho bánh vào hấp 15-20 phút. Nhớ lót khăn dưới nắp nồi để nước không nhỏ xuống làm ướt mặt bánh. Sau khi tắt bếp, để yên 5 phút mới mở nắp để bánh không bị xẹp đột ngột.</li>
              <li><strong>Bước 8: Bảo quản</strong><br/>Để bánh nguội hẳn, bọc màng thực phẩm hoặc cho vào túi zip. Để ngăn mát 3-4 ngày, ngăn đông 1-2 tháng. Khi ăn chỉ cần hấp lại 7-10 phút là bánh lại nóng hổi mềm xốp.</li>
            </ol>
          `
        }
      ]
    }
  ],
  created_at: new Date().toISOString()
};

// ALL 4 COURSES
const allCourses = [courseComNam, courseEatClean, courseMiRauCu, courseBanhBao];

// Write individual course files to:
// 1. App database folder (C:/Users/Admin/Documents/CookbookData/courses/<id>.json)
// 2. Downloads folder (C:/Users/Admin/Downloads/courses/<id>.json)
allCourses.forEach(c => {
  const jsonStr = JSON.stringify(c, null, 2);
  fs.writeFileSync(path.join(APP_COURSES_DIR, `${c.id}.json`), jsonStr, 'utf8');
  fs.writeFileSync(path.join(DOWNLOADS_COURSES_DIR, `${c.id}.json`), jsonStr, 'utf8');
  console.log(`Saved course: ${c.title} (${c.id}.json)`);
});

// Write all-in-one import JSON file to Downloads
const coursesImportData = {
  version: '1.0.0',
  exported_at: new Date().toISOString(),
  courses: allCourses
};
fs.writeFileSync(DOWNLOADS_ALL_COURSES_JSON, JSON.stringify(coursesImportData, null, 2), 'utf8');

console.log(`\n==================================================`);
console.log(`SUCCESSFULLY CREATED ALL COURSES!`);
console.log(`1. Saved directly to Database folder: ${APP_COURSES_DIR}`);
console.log(`2. Saved individual files to Downloads: ${DOWNLOADS_COURSES_DIR}`);
console.log(`3. Saved All-In-One JSON to Downloads: ${DOWNLOADS_ALL_COURSES_JSON}`);
console.log(`Total courses created: ${allCourses.length}`);
allCourses.forEach((c, i) => {
  const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  console.log(`  ${i + 1}. [${c.id}] "${c.title}" - ${c.modules.length} modules, ${totalLessons} lessons.`);
});
