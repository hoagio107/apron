import { TIP_CATEGORIES, normalizeUnit } from '@apron/core';
const tauriFetch = window.fetch;

export interface AiModel {
  name: string;
  label: string;
}

export const GEMINI_MODELS: AiModel[] = [
  { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Nhanh, Tiết kiệm)' },
  { name: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B (Rất nhanh)' },
  { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Mới nhất, Cực nhanh)' },
  { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Thông minh, Chi tiết)' },
];

export interface ParseRecipeResult {
  title?: string;
  description?: string;
  difficulty?: 'Dễ' | 'Vừa' | 'Khó';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  calories?: number;
  notes?: string;
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
  linked_tips?: string[];
  suggested_tip?: {
    title: string;
    content: string;
  };
}

export interface ParseTipResult {
  title: string;
  category_id: string;
  content: string;
}

// Hàm hỗ trợ kiểm tra URL hợp lệ
function isValidHttpUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

export function buildRecipePrompt(
  text: string, 
  _existingIngredients: string[] = [],
  existingTips: { id: string, title: string }[] = [],
  existingUnits: string[] = []
): string {
  const tagHierarchyText = [
    '   - Bữa ăn / Dịp lễ: Bữa sáng, Điểm tâm, Bánh mì, Bữa chính (Trưa/Tối), Cơm gia đình, Món tiệc, Ăn vặt, Cuối tuần',
    '   - Loại món: Món chính (Cơm), Món nước (Bún/Phở), Khai vị / Ăn nhẹ, Đồ uống, Tráng miệng, Nước chấm / Sốt',
    '   - Cách chế biến: Canh / Súp, Hầm / Ninh, Kho / Om, Hấp / Luộc, Chiên / Rán, Xào, Nướng, Làm bánh',
    '   - Nguyên liệu chính: Thịt heo, Thịt bò, Gà / Vịt, Hải sản, Cá, Tôm, Rau củ & Nấm, Đậu phụ',
    '   - Văn hóa ẩm thực: Việt Nam - Miền Bắc, Miền Trung, Miền Nam, Âu Mỹ, Hàn Quốc, Nhật Bản',
    '   - Chế độ ăn: Eat Clean / Healthy, Keto / Low-carb, Thuần chay, Giảm cân'
  ].join('\n');

  const unitNames = existingUnits.length > 0 ? existingUnits.join(', ') : 'muỗng canh, muỗng cà phê, g, kg, ml, lít, quả, trái, củ, cái, bó, nhánh, tép, lát, miếng, lon, hộp, gói, chén, bát, chút, xíu';
  const tipsStr = existingTips.length > 0 ? existingTips.map(t => `[${t.id}] ${t.title}`).join(', ') : 'Không có';

  return `Bạn là một chuyên gia ẩm thực và trợ lý phân tích dữ liệu xuất sắc.
Nhiệm vụ: Trích xuất và chuẩn hóa thông tin công thức nấu ăn từ nội dung dưới đây thành MỘT ĐỐI TƯỢNG JSON DUY NHẤT để nhập vào ứng dụng Apron.
Nếu nội dung chứa nhiều công thức khác nhau, hãy tách chúng vào mảng "recipes".

NỘI DUNG ĐẦU VÀO:
"""
${text.trim() || '(Phân tích theo hình ảnh đính kèm nếu có)'}
"""

HÃY TRẢ VỀ DUY NHẤT MỘT KHỐI JSON HỢP LỆ VỚI CẤU TRÚC CHÍNH XÁC NHƯ SAU (KHÔNG KÈM BẤT KỲ VĂN BẢN GIẢI THÍCH NÀO NGOÀI JSON):
{
  "recipes": [
    {
      "title": "Tên món ăn (Viết hoa chữ cái đầu)",
      "description": "Mô tả ngắn gọn, hấp dẫn về món ăn",
      "difficulty": "Dễ", // Chỉ được chọn 1 trong 3: "Dễ", "Vừa", "Khó"
      "prep_time_minutes": 15, // Thời gian chuẩn bị/sơ chế (số phút, số nguyên)
      "cook_time_minutes": 30, // Thời gian nấu (số phút, số nguyên)
      "servings": 4, // Khẩu phần (số người, số nguyên)
      "calories": 450, // Lượng calo ước tính (kcal, số nguyên). Tự ước lượng nếu không có sẵn
      "notes": "<p>Ghi chú thêm, mẹo vặt, lưu ý (dùng thẻ HTML cơ bản như &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;)</p>",
      "tags": [
        { "name": "Bữa sáng", "is_new": false },
        { "name": "Món canh", "is_new": false },
        { "name": "Thịt bò", "is_new": false }
      ],
      "ingredientSections": [
        {
          "name": "Nguyên liệu chính", // Tên nhóm (ví dụ: "Nguyên liệu chính", "Phần sốt", "Gia vị ướp"...)
          "ingredients": [
            { "name": "Thịt bò", "amount": "300", "unit": "g" },
            { "name": "Hành tây", "amount": "1", "unit": "củ" }
          ]
        }
      ],
      "stepSections": [
        {
          "name": "Thực hiện", // Tên giai đoạn (ví dụ: "Sơ chế", "Chế biến", "Hoàn thiện"...)
          "steps": [
            { "content": "<p>Sơ chế nguyên liệu sạch sẽ, cắt miếng vừa ăn.</p>" },
            { "content": "<p>Đun sôi nước, nêm gia vị vừa miệng và hoàn thành món ăn.</p>" }
          ]
        }
      ]
    }
  ]
}

QUY TẮC BẮT BUỘC:
1. Đối với Calories, Độ khó và Thời gian (prep_time_minutes, cook_time_minutes): nếu nguồn không có, BẠN BẮT BUỘC PHẢI TỰ DỰ ĐOÁN VÀ ĐIỀN SỐ THỰC TẾ dựa trên chuyên môn ẩm thực.
2. Tên nguyên liệu và các bước làm: BẮT BUỘC viết hoa chữ cái đầu tiên (Ví dụ: "Thịt ức gà", "Thịt bò", "Hành lá", "Nước mắm").
3. BẮT BUỘC CHUẨN HOÁ TÊN NGUYÊN LIỆU THUẦN TÚY (QUAN TRỌNG NHẤT):
   - Trường "name" CHỈ ĐƯỢC CHỨA DANH TỪ TÊN NGUYÊN LIỆU THUẦN TÚY (Ví dụ ĐÚNG: "Thịt ba chỉ heo", "Thịt bò", "Hành tím", "Tỏi", "Cà chua", "Nấm đông cô", "Tôm khô").
   - TUYỆT ĐỐI KHÔNG ĐƯỢC để hành động sơ chế, hình dáng cắt thái, kích thước hay tình trạng vào tên nguyên liệu (Ví dụ SAI: "Ba chỉ heo, cắt miếng dài, dày khoảng 3 ngón tay", "Hành khô thái lát", "Nấm đông cô ngâm mềm thái sợi", "Tôm khô rửa sạch để ráo", "Thịt heo xay nhuyễn").
   - NẾU NGUYÊN LIỆU GỐC CÓ MÔ TẢ SƠ CHẾ/CẮT THÁI: BẠN BẮT BUỘC PHẢI TÁCH thông tin sơ chế đó (ví dụ: "cắt miếng dài dày khoảng 3 ngón tay") và ĐƯA VÀO BƯỚC SƠ CHẾ TRONG MẢNG CÁC BƯỚC LÀM ("stepSections" / "steps")! Tuyệt đối không để lại trong trường "name".
   - Gọi tên cụ thể, chuẩn xác bằng danh từ tiếng Việt hoàn chỉnh (Ví dụ: "Thịt ba chỉ heo", "Thịt ức gà", "Thịt bò", "Tôm sú", "Hành lá", "Tỏi", "Cà chua"). KHÔNG ghi cộc lốc mơ hồ (như "Gà", "Heo", "Bò", "Củ").
   - TUYỆT ĐỐI KHÔNG GỘP NHIỀU NGUYÊN LIỆU: Không ghi gộp dạng "Gia vị: muối, đường, tiêu, mắm" hay "Hành tỏi băm". Phải tách từng loại nguyên liệu riêng biệt thành từng dòng trong mảng ingredients.
4. BẮT BUỘC CHUẨN HOÁ ĐƠN VỊ ĐO LƯỜNG: Bắt buộc chọn đơn vị có trong danh sách chuẩn sau: ${unitNames}.
   - Phải map từ viết tắt hoặc từ địa phương về đơn vị chuẩn:
     * "mc", "thìa canh", "thìa súp", "tbsp" -> "muỗng canh"
     * "mcf", "cf", "thìa cà phê", "thìa cf", "tsp" -> "muỗng cà phê"
     * "gr", "gram" -> "g"
     * "kilo", "kilogram" -> "kg"
     * "l", "lit" -> "lít"
   - CHỈ bổ sung đơn vị mới nếu đơn vị đó thực sự cần thiết và chưa hề có trong danh sách chuẩn ở trên.
   - Tuyệt đối tách riêng số lượng ("amount") và đơn vị ("unit"), không để lẫn số hoặc đơn vị vào trường tên nguyên liệu ("name").
5. BẮT BUỘC GẮN THẺ TAG TỪ DANH MỤC PHÂN CẤP:
   Hãy chọn 2 - 5 thẻ tag phù hợp nhất từ các nhóm sau:
${tagHierarchyText}
   - BẮT BUỘC chọn đúng 1 thẻ thuộc nhóm "Nguyên liệu chính" (ví dụ: "Thịt bò", "Thịt heo", "Gà / Vịt", "Hải sản", "Cá", "Tôm", "Rau củ & Nấm", "Đậu phụ") để phân loại món ăn.
   - Nếu dùng tag có sẵn trong danh sách trên: đặt "is_new": false.
   - Nếu thực sự cần tag mới chưa có trong danh mục: đặt "is_new": true và gán "category_id" bằng 1 trong các nhóm ("root-meal", "root-dish-type", "root-cooking", "root-ingredient", "root-cuisine", "root-diet").
${existingTips.length > 0 ? `6. Dò tìm trong danh sách mẹo: ${tipsStr}. Nếu có mẹo liên quan, trả về mảng linked_tips chứa ID của mẹo đó.` : ''}
7. TUYỆT ĐỐI CHỈ TRẢ VỀ MÃ JSON, KHÔNG CÓ BẤT KỲ LỜI CHÀO HAY VĂN BẢN NÀO BÊN NGOÀI KHỐI JSON.`;
}

export function parseGeminiResponse(rawText: string): ParseRecipeResult[] {
  if (!rawText || !rawText.trim()) {
    throw new Error('Vui lòng dán kết quả từ Gemini.');
  }

  let text = rawText.trim();
  
  // Loại bỏ markdown code block: ```json ... ``` hoặc ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // Tìm vị trí mở { hoặc [ đầu tiên và } hoặc ] cuối cùng
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  if (startIdx !== -1) {
    const endChar = isArray ? ']' : '}';
    const endIdx = text.lastIndexOf(endChar);
    if (endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }
  }

  let parsedJSON: any;
  try {
    parsedJSON = JSON.parse(text);
  } catch (err: any) {
    console.error('Lỗi parse JSON từ Gemini:', err, 'Nội dung:', text);
    throw new Error('Không thể phân tích mã JSON từ Gemini. Vui lòng đảm bảo bạn đã copy toàn bộ khối JSON trả về từ Gemini Web.');
  }

  const recipesRaw = parsedJSON.recipes || (Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON]);

  const formatString = (str: string) => {
    if (!str || typeof str !== 'string') return str;
    let clean = str.trim();
    if (clean.length > 0 && clean === clean.toUpperCase()) {
      clean = clean.toLowerCase();
    }
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const sanitizeIngredient = (rawName: string) => {
    let name = formatString(rawName);
    let prepNote = '';
    
    // Tách phần mô tả sơ chế sau dấu phẩy nếu có
    const commaIdx = name.indexOf(',');
    if (commaIdx !== -1) {
      const before = name.slice(0, commaIdx).trim();
      const after = name.slice(commaIdx + 1).trim();
      if (/cắt|thái|băm|xay|nạo|rửa|luộc|ngâm|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi/i.test(after)) {
        name = before;
        prepNote = `${before} ${after}`;
      }
    }

    // Tách phần ngoặc đơn mô tả sơ chế
    const parenMatch = name.match(/^(.*?)\((.*?)\)$/);
    if (parenMatch) {
      const before = parenMatch[1].trim();
      const inside = parenMatch[2].trim();
      if (/cắt|thái|băm|xay|nạo|rửa|luộc|ngâm|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi/i.test(inside)) {
        name = before;
        prepNote = `${before} ${inside}`;
      }
    }

    return { name, prepNote };
  };

  const results: ParseRecipeResult[] = recipesRaw.map((result: any) => {
    if (result.title) result.title = formatString(result.title);
    
    const extractedPreps: string[] = [];

    if (result.ingredientSections && Array.isArray(result.ingredientSections)) {
      result.ingredientSections = result.ingredientSections.map((section: any) => ({
        ...section,
        name: formatString(section.name || 'Nguyên liệu'),
        ingredients: Array.isArray(section.ingredients) 
          ? section.ingredients.map((ing: any) => {
              const rawName = typeof ing === 'string' ? ing : ing.name || '';
              const { name, prepNote } = sanitizeIngredient(rawName);
              if (prepNote) extractedPreps.push(prepNote);
              return {
                ...ing,
                name,
                amount: typeof ing === 'object' && ing.amount !== undefined ? String(ing.amount) : '',
                unit: typeof ing === 'object' ? normalizeUnit(ing.unit || '') : ''
              };
            })
          : []
      }));
    } else if (result.ingredients && Array.isArray(result.ingredients)) {
      result.ingredientSections = [{
        name: 'Nguyên liệu chính',
        ingredients: result.ingredients.map((ing: any) => {
          const rawName = typeof ing === 'string' ? ing : ing.name || '';
          const { name, prepNote } = sanitizeIngredient(rawName);
          if (prepNote) extractedPreps.push(prepNote);
          return {
            name,
            amount: typeof ing === 'object' && ing.amount !== undefined ? String(ing.amount) : '',
            unit: typeof ing === 'object' ? normalizeUnit(ing.unit || '') : ''
          };
        })
      }];
    }

    if (result.stepSections && Array.isArray(result.stepSections)) {
      result.stepSections = result.stepSections.map((section: any) => ({
        ...section,
        name: formatString(section.name || 'Thực hiện'),
        steps: Array.isArray(section.steps)
          ? section.steps.map((step: any) => ({
              ...step,
              content: typeof step === 'string' ? step : step.content || ''
            }))
          : []
      }));
    } else if (result.steps && Array.isArray(result.steps)) {
      result.stepSections = [{
        name: 'Thực hiện',
        steps: result.steps.map((step: any) => ({
          content: typeof step === 'string' ? step : step.content || step.instruction || ''
        }))
      }];
    }

    // Nếu có ghi chú sơ chế tách ra từ nguyên liệu, chèn vào bước đầu tiên nếu chưa có
    if (extractedPreps.length > 0 && result.stepSections && result.stepSections.length > 0) {
      const firstSection = result.stepSections[0];
      const prepText = `Sơ chế: ${extractedPreps.join('; ')}.`;
      const alreadyHas = firstSection.steps.some((s: any) => (s.content || '').includes(extractedPreps[0]));
      if (!alreadyHas) {
        firstSection.steps.unshift({ content: `<p>${prepText}</p>` });
      }
    }

    return result as ParseRecipeResult;
  });

  return results;
}

export async function parseRecipeWithGemini(
  model: string, 
  text: string, 
  apiKey: string, 
  images: string[] = [], 
  existingIngredients: string[] = [],
  existingTips: {id: string, title: string}[] = []
): Promise<ParseRecipeResult[]> {
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
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
      contentToProcess = doc.body.textContent || doc.body.innerText || text;
    } catch (e) {
      console.warn('Lỗi khi fetch URL, fallback về raw text', e);
      throw new Error('Không thể đọc dữ liệu từ URL này. Vui lòng kiểm tra lại hoặc thử copy/paste văn bản trực tiếp.');
    }
  }

  const prompt = buildRecipePrompt(contentToProcess, existingIngredients, existingTips);

  try {
    const parts: any[] = [{ text: prompt }];

    if (images && images.length > 0) {
      images.forEach(base64Webp => {
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
      return parseGeminiResponse(resultText);
    }
    throw new Error('No response content from Gemini');
  } catch (error) {
    console.error('Error generating recipe with Gemini:', error);
    throw error;
  }
}

export interface SuggestedRecipe {
  title: string;
  description: string;
  difficulty: 'Dễ' | 'Vừa' | 'Khó';
  prep_time_minutes: number;
  cook_time_minutes: number;
  missing_ingredients: string[];
  ingredients: {
    name: string;
    amount: string;
    unit: string;
  }[];
  steps: {
    content: string;
  }[];
  cookbook_recipe_id?: string | null;
}

export async function suggestRecipesFromPantry(model: string, apiKey: string, pantryItemsStr: string, cookbookStr?: string): Promise<SuggestedRecipe[]> {
  if (!apiKey) {
    throw new Error('Vui lòng nhập Gemini API Key trong phần Cài đặt.');
  }

  const prompt = `
Bạn là một đầu bếp tài ba. Dưới đây là danh sách các nguyên liệu đang có sẵn trong tủ lạnh của người dùng:
${pantryItemsStr}

${cookbookStr ? `Người dùng cũng đã cung cấp danh sách "Sổ tay công thức" của họ:\n${cookbookStr}\n\nHãy ưu tiên ĐỐI CHIẾU và TÌM RA 2-3 món từ chính "Sổ tay công thức" này mà phù hợp nhất với nguyên liệu đang có. Nếu sổ tay không có món nào hợp lý, bạn có thể tự sáng tạo thêm món mới.` : `Dựa vào những nguyên liệu này, hãy gợi ý 3 món ăn ngon nhất có thể làm.`}

Không nhất thiết phải sử dụng TOÀN BỘ nguyên liệu, nhưng cố gắng tận dụng tối đa những gì đang có (ưu tiên nguyên liệu sắp hết hạn).
Nếu cần thêm một vài nguyên liệu phụ (hành lá, gia vị cơ bản, v.v.) thì cũng không sao, hãy liệt kê chúng vào "missing_ingredients".

Trả về DUY NHẤT một đối tượng JSON theo định dạng sau:
{
  "recipes": [
    {
      "title": "Tên món ăn",
      "cookbook_recipe_id": "ID_cua_mon_an", 
      "description": "Mô tả hấp dẫn về món ăn",
      "difficulty": "Dễ", 
      "prep_time_minutes": 15,
      "cook_time_minutes": 20,
      "missing_ingredients": ["Hành lá", "Tiêu"],
      "ingredients": [
        { "name": "Tên nguyên liệu", "amount": "Số lượng", "unit": "Đơn vị" }
      ],
      "steps": [
        { "content": "Bước 1..." },
        { "content": "Bước 2..." }
      ]
    }
  ]
}

Lưu ý: "cookbook_recipe_id" CHỈ ĐIỀN nếu bạn lấy công thức từ Sổ tay (ID cung cấp trong danh sách). Nếu là món mới do bạn tự nghĩ ra, hãy để null.
`;

  try {
    const response = await tauriFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
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
      let cleanResultText = resultText.trim();
      if (cleanResultText.startsWith('```json')) cleanResultText = cleanResultText.replace(/^```json\n?/, '');
      if (cleanResultText.endsWith('```')) cleanResultText = cleanResultText.replace(/```$/, '');
      
      const parsedJSON = JSON.parse(cleanResultText.trim());
      return parsedJSON.recipes || [];
    }
    throw new Error('No response content from Gemini');
  } catch (error) {
    console.error('Error suggesting recipes with Gemini:', error);
    throw error;
  }
}

export interface ParseTipResult {
  title: string;
  category_id: string;
  content: string;
}

export function buildTipPrompt(text: string): string {
  const categoriesStr = TIP_CATEGORIES.map(c => `"${c.id}" (${c.name}: ${c.description})`).join(', ');

  return `Bạn là chuyên gia khoa học thực phẩm và ẩm thực gia đình.
Nhiệm vụ: Tạo một mẹo vặt nhà bếp chuẩn xác, hữu ích từ yêu cầu dưới đây dưới dạng MỘT ĐỐI TƯỢNG JSON DUY NHẤT để nhập vào ứng dụng Apron.

NỘI DUNG / CHỦ ĐỀ ĐẦU VÀO:
"""
${text.trim() || 'Một mẹo vặt nhà bếp khoa học, thông dụng và thiết thực nhất'}
"""

DANH SÁCH CHUYÊN MỤC HỢP LỆ (chọn 1 ID phù hợp nhất):
${categoriesStr}

YÊU CẦU VĂN PHONG & NỘI DUNG (CỰC KỲ QUAN TRỌNG):
1. **Phong cách khoa học, ngắn gọn, súc tích**: Đi thẳng vào vấn đề, không lan man, không viết lời chào hay văn vẻ hoa mỹ.
2. **Giải thích cơ chế khoa học dễ hiểu, đơn giản**: Luôn có phần giải thích ngắn gọn (1 - 2 câu) bản chất khoa học vì sao mẹo này lại hiệu quả. Dùng ngôn từ bình dân, trực quan, gần gũi trong đời sống; TUYỆT ĐỐI TRÁNH từ ngữ quá học thuật, hàn lâm hay công thức chuyên môn phức tạp.
3. **Cấu trúc phần "content"** (sử dụng định dạng HTML chuẩn: <p>, <strong>, <ul>, <li>):
   - **Cách thực hiện:** Các bước thao tác ngắn gọn, gạch đầu dòng rõ ràng.
   - **Cơ chế khoa học:** Giải thích cơ chế đơn giản, dễ hiểu vì sao cách này hiệu quả.
   - **Lưu ý:** (Nếu có, tối đa 1 câu ngắn gọn).

HÃY TRẢ VỀ DUY NHẤT MỘT KHỐI JSON HỢP LỆ VỚI CẤU TRÚC CHÍNH XÁC NHƯ SAU (KHÔNG KÈM BẤT KỲ VĂN BẢN GIẢI THÍCH NÀO NGOÀI JSON):
{
  "title": "Tiêu đề mẹo vặt ngắn gọn, rõ ràng (VD: Cách ướp thịt nướng mềm mọng không khô)",
  "category_id": "cooking", // Chọn chính xác 1 ID trong danh sách chuyên mục trên
  "content": "<p><strong>Cách thực hiện:</strong></p><ul><li>Thêm 1 thìa sữa đặc hoặc nước ép lê/táo vào sốt ướp thịt.</li><li>Trộn đều và ướp khoảng 30 - 45 phút trước khi nướng.</li></ul><p><strong>Cơ chế khoa học:</strong> Enzyme tự nhiên trong hoa quả bẻ gãy nhẹ các sợi protein, giúp thịt giữ nước và mềm mọng từ bên trong thay vì bị khô cứng dưới nhiệt độ cao.</p>"
}

QUY TẮC BẮT BUỘC:
1. "category_id" BẮT BUỘC phải là một trong các id: ${TIP_CATEGORIES.map(c => `"${c.id}"`).join(', ')}.
2. TUYỆT ĐỐI CHỈ TRẢ VỀ MÃ JSON, KHÔNG CÓ BẤT KỲ LỜI CHÀO HAY VĂN BẢN NÀO BÊN NGOÀI KHỐI JSON.`;
}

export function parseTipGeminiResponse(rawText: string): ParseTipResult {
  if (!rawText || !rawText.trim()) {
    throw new Error('Vui lòng dán kết quả từ Gemini.');
  }

  let text = rawText.trim();
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Không tìm thấy định dạng JSON hợp lệ trong nội dung.');
  }

  const jsonStr = text.substring(firstBrace, lastBrace + 1);
  const data = JSON.parse(jsonStr);

  const validCatIds = TIP_CATEGORIES.map(c => c.id);
  const categoryId = validCatIds.includes(data.category_id) ? data.category_id : 'cooking';

  return {
    title: data.title || '',
    category_id: categoryId,
    content: data.content || ''
  };
}

