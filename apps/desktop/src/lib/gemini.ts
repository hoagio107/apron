import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { DEFAULT_TAGS } from '@apron/core';

export interface AiModel {
  name: string;
  label: string;
}

export const GEMINI_MODELS: AiModel[] = [
  { name: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Nhanh)' },
  { name: 'gemini-3.5-flash-8b', label: 'Gemini 3.5 Flash 8B (Rất nhanh)' },
  { name: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro (Thông minh)' },
];

export interface ParseRecipeResult {
  title?: string;
  description?: string;
  difficulty?: 'Dễ' | 'Vừa' | 'Khó';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  calories?: number;
  tags?: {
    name: string;
    is_new: boolean;
    category_id?: string;
  }[];
  ingredientSections?: {
    name: string;
    ingredients: {
      name: string;
      amount?: string;
      unit?: string;
    }[];
  }[];
  stepSections?: {
    name: string;
    steps: {
      content: string;
    }[];
  }[];
}

// Hàm hỗ trợ kiểm tra URL hợp lệ
function isValidHttpUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

export async function parseRecipeWithGemini(model: string, text: string, apiKey: string, images: string[] = []): Promise<ParseRecipeResult[]> {
  if (!apiKey) {
    throw new Error('Vui lòng nhập Gemini API Key.');
  }

  let contentToProcess = text;

  // Nếu người dùng nhập vào một URL, tiến hành crawl nội dung trước
  if (text.trim() && isValidHttpUrl(text.trim())) {
    try {
      const response = await tauriFetch(text.trim());
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();
      
      // Basic HTML to Text parsing (loại bỏ các script, style, html tags)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Xoá các thẻ không cần thiết
      doc.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
      
      contentToProcess = doc.body.textContent || doc.body.innerText || text;
    } catch (e) {
      console.warn('Lỗi khi fetch URL, fallback về raw text', e);
      throw new Error('Không thể đọc dữ liệu từ URL này. Vui lòng kiểm tra lại hoặc thử copy/paste văn bản trực tiếp.');
    }
  }
  
  const tagNames = DEFAULT_TAGS.filter(t => t.parent_id !== null).map(t => t.name).join(', ');

  const prompt = `
Bạn là một chuyên gia ẩm thực và một trợ lý ảo phân tích dữ liệu xuất sắc. Nhiệm vụ của bạn là trích xuất và tính toán thông tin công thức nấu ăn từ đoạn văn bản (hoặc trang web, hoặc hình ảnh) dưới đây. 
Nếu nội dung chứa nhiều công thức khác nhau, hãy tách chúng ra.
Hãy trả về DUY NHẤT một đối tượng JSON với cấu trúc chính xác như sau:
{
  "recipes": [
    {
      "title": "Tên món ăn (chuỗi)",
      "description": "Mô tả ngắn gọn (chuỗi)",
      "difficulty": "Dễ", // Chỉ được chọn 1 trong 3: Dễ, Vừa, Khó. Hãy tự đánh giá dựa trên thời gian và các bước nếu không có sẵn.
      "prep_time_minutes": 15, // Thời gian chuẩn bị (số)
      "cook_time_minutes": 30, // Thời gian nấu (số)
      "servings": 4, // Số người ăn (số)
      "calories": 500, // Lượng calo ước tính (số). Hãy tự tính toán và ước lượng tổng calo hoặc calo/khẩu phần nếu bài không đề cập.
      "tags": [
        { "name": "Bữa sáng", "is_new": false },
        { "name": "Giải nhiệt mùa hè", "is_new": true, "category_id": "root-meal" }
      ],
      "ingredientSections": [
        {
          "name": "Tên nhóm (ví dụ: Phần vỏ bánh, Phần nhân, hoặc Mặc định nếu không chia nhóm)",
          "ingredients": [
            { "name": "Tên nguyên liệu (PHẢI VIẾT HOA CHỮ CÁI ĐẦU TIÊN)", "amount": "Số lượng", "unit": "Đơn vị (g, ml, muỗng, v.v)" }
          ]
        }
      ],
      "stepSections": [
        {
          "name": "Tên giai đoạn (ví dụ: Sơ chế, Chế biến, hoặc Thực hiện nếu không chia nhóm)",
          "steps": [
            { "content": "Nội dung hướng dẫn chi tiết của bước này (PHẢI VIẾT HOA CHỮ CÁI ĐẦU TIÊN)" }
          ]
        }
      ]
    }
  ]
}

QUY TẮC QUAN TRỌNG:
1. Đối với Lượng Calories, Độ khó và Tags (Thẻ), nếu dữ liệu không có sẵn, BẠN PHẢI TỰ DỰ ĐOÁN VÀ ĐIỀN VÀO dựa trên kiến thức ẩm thực của bạn.
2. Tại trường "ingredients" và "steps", BẮT BUỘC phải viết hoa chữ cái đầu tiên của câu/nguyên liệu.
3. Trường "tags" PHẢI có ít nhất 3 thẻ.
4. QUY TẮC SINH TAG:
   - Ưu tiên sử dụng tag đã có trong danh sách sau: ${tagNames}. (Nếu dùng tag có sẵn, đặt "is_new": false và bỏ qua category_id)
   - Lưu ý hiểu từ đồng nghĩa: Ví dụ "Ăn sáng" và "Bữa sáng" là giống nhau, hãy dùng tag "Bữa sáng" có sẵn thay vì tạo mới.
   - CHỈ CHO PHÉP TỰ SINH TAG MỚI nếu danh sách trên chưa có khái niệm đó. Nếu tạo tag mới, đặt "is_new": true và BẮT BUỘC cung cấp "category_id" bằng một trong các ID sau:
     + "root-meal": Dành cho Cấu trúc thực đơn, Dịp và sự kiện
     + "root-cooking": Dành cho Phương pháp chế biến
     + "root-ingredient": Dành cho Nguyên liệu chính
     + "root-cuisine": Dành cho Ẩm thực vùng miền và quốc gia
     + "root-diet": Dành cho Chế độ ăn uống và sức khỏe
     + "root-time-difficulty": Dành cho Thời gian và độ khó
5. TUYỆT ĐỐI không thêm bất kỳ văn bản giải thích nào bên ngoài khối JSON. Phải đảm bảo chuẩn định dạng JSON hợp lệ để máy có thể đọc được.

Văn bản đầu vào:
${contentToProcess || '(Không có văn bản, hãy phân tích dựa trên hình ảnh)'}
  `;

  try {
    const parts: any[] = [{ text: prompt }];

    // Thêm hình ảnh nếu có
    if (images && images.length > 0) {
      images.forEach(base64Webp => {
        // base64Webp có dạng "data:image/webp;base64,UklGR..."
        const base64Data = base64Webp.split(',')[1];
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: 'image/webp',
              data: base64Data
            }
          });
        }
      });
    }

    const response = await tauriFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (resultText) {
      try {
        let cleanResultText = resultText.trim();
        if (cleanResultText.startsWith('```json')) {
          cleanResultText = cleanResultText.replace(/^```json\n?/, '');
        }
        if (cleanResultText.endsWith('```')) {
          cleanResultText = cleanResultText.replace(/```$/, '');
        }
        cleanResultText = cleanResultText.trim();

        const parsedJSON = JSON.parse(cleanResultText);
        const recipesRaw = parsedJSON.recipes || (Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON]);
        
        const formatString = (str: string) => {
          if (!str) return str;
          let clean = str.trim();
          // Nếu chuỗi đang bị viết HOA TÀN BỘ, chuyển về chữ thường để fix
          if (clean.length > 0 && clean === clean.toUpperCase()) {
            clean = clean.toLowerCase();
          }
          // Viết hoa chữ cái đầu tiên
          return clean.charAt(0).toUpperCase() + clean.slice(1);
        };

        const results: ParseRecipeResult[] = recipesRaw.map((result: any) => {
          if (result.title) result.title = formatString(result.title);
          
          if (result.ingredientSections) {
            result.ingredientSections = result.ingredientSections.map((section: any) => ({
              ...section,
              ingredients: section.ingredients.map((ing: any) => ({
                ...ing,
                name: formatString(ing.name)
              }))
            }));
          }

          if (result.stepSections) {
            result.stepSections = result.stepSections.map((section: any) => ({
              ...section,
              steps: section.steps.map((step: any) => ({
                ...step,
                content: formatString(step.content)
              }))
            }));
          }

          return result as ParseRecipeResult;
        });

        return results;
      } catch (parseError) {
        console.error('Lỗi parse JSON từ Gemini:', parseError);
        console.log('Raw output:', resultText);
        throw new Error('Dữ liệu AI trả về quá dài hoặc không đúng định dạng. Vui lòng chia nhỏ nội dung và thử lại.');
      }
    }
    throw new Error('No response content from Gemini');
  } catch (error) {
    console.error('Error generating recipe with Gemini:', error);
    throw error;
  }
}
