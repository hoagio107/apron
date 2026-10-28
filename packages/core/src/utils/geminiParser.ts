import { TIP_CATEGORIES } from '../types/tip';
import { DEFAULT_COOKING_UNITS, normalizeUnit, splitUnitAndExtra } from './unitNormalizer';
import { sanitizeHtml } from './sanitize';

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

const PREP_ACTION_REGEX = /cắt|thái|băm|xay|nạo|rửa|luộc|ngâm|bóc|lột|đập|ướp|chia|rang|nướng|vắt|khoanh|lát|khúc|sợi/i;

function formatSentenceCase(str: string): string {
  if (!str || typeof str !== 'string') return str;
  let clean = str.trim();
  if (clean.length > 0 && clean === clean.toUpperCase()) {
    clean = clean.toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function sanitizeIngredientName(rawName: string): { name: string; prepNote: string } {
  let name = formatSentenceCase(rawName);
  let prepNote = '';

  const commaIdx = name.indexOf(',');
  if (commaIdx !== -1) {
    const before = name.slice(0, commaIdx).trim();
    const after = name.slice(commaIdx + 1).trim();
    if (PREP_ACTION_REGEX.test(after)) {
      name = before;
      prepNote = `${before} ${after}`;
    }
  }

  const parenMatch = name.match(/^(.*?)\((.*?)\)$/);
  if (parenMatch) {
    const before = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    if (PREP_ACTION_REGEX.test(inside)) {
      name = before;
      prepNote = `${before} ${inside}`;
    }
  }

  return { name, prepNote };
}

export function buildRecipePrompt(
  text: string,
  _existingIngredients: string[] = [],
  existingTips: { id: string; title: string }[] = [],
  existingUnits: string[] = []
): string {
  const tagHierarchyText = [
    '   - Bữa ăn / Dịp lễ: Bữa sáng, Điểm tâm, Bánh mì, Bữa chính (Trưa/Tối), Cơm gia đình, Món tiệc, Ăn vặt, Cuối tuần',
    '   - Loại món: Món chính (Cơm), Món nước (Bún/Phở), Khai vị / Ăn nhẹ, Đồ uống, Tráng miệng, Nước chấm / Sốt',
    '   - Cách chế biến: Canh / Súp, Hầm / Ninh, Kho / Om, Hấp / Luộc, Chiên / Rán, Xào, Nướng, Làm bánh',
    '   - Nguyên liệu chính: Thịt heo, Thịt bò, Gà / Vịt, Hải sản, Cá, Tôm, Rau củ & Nấm, Đậu phụ',
    '   - Văn hóa ẩm thực: Việt Nam - Miền Bắc, Miền Trung, Miền Nam, Âu Mỹ, Hàn Quốc, Nhật Bản',
    '   - Chế độ ăn: Eat Clean / Healthy, Keto / Low-carb, Thuần chay, Giảm cân',
  ].join('\n');

  const mergedUnits = Array.from(
    new Set([
      ...DEFAULT_COOKING_UNITS,
      ...existingUnits.map((u) => normalizeUnit(u)).filter(Boolean),
    ])
  );
  const unitNames = mergedUnits.join(', ');
  const tipsStr = existingTips.length > 0 ? existingTips.map((t) => `[${t.id}] ${t.title}`).join(', ') : 'Không có';

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
4. BẮT BUỘC CHUẨN HOÁ ĐƠN VỊ ĐO LƯỜNG THUẦN TÚY (CỰC KỲ QUAN TRỌNG):
   - Danh sách đơn vị tính hiện có trong Database: ${unitNames}.
   - Trường "unit" CHỈ ĐƯỢC CHỨA DANH TỪ ĐƠN VỊ ĐO LƯỜNG THUẦN TÚY (1 - 2 từ chỉ đơn vị).
     * Ví dụ ĐÚNG: "g", "kg", "ml", "lít", "muỗng canh", "muỗng cà phê", "quả", "củ", "tép", "nhánh", "bó", "chén".
     * Ví dụ SAI (lẫn tên nguyên liệu vào đơn vị): "g nước tương", "mc nước tương", "ml sữa tươi", "muỗng canh dầu hào" -> BẮT BUỘC tách "Nước tương", "Sữa tươi", "Dầu hào" sang trường "name", còn "unit" chỉ giữ đúng "g", "muỗng canh", "ml".
     * Ví dụ SAI (lẫn hành động sơ chế/trạng thái vào đơn vị): "quả đập dập", "củ thái lát", "tép băm nhỏ", "miếng cắt khúc", "quả chín" -> Trường "unit" CHỈ ĐƯỢC GHI "quả", "củ", "tép", "miếng"; phần sơ chế ("đập dập", "thái lát", "băm nhỏ", "cắt khúc") BẮT BUỘC phải chuyển vào bước Sơ chế trong "stepSections"!
   - Phải quy đổi từ viết tắt hoặc từ địa phương về đơn vị chuẩn trong Database:
     * "mc", "thìa canh", "thìa súp", "tbsp" -> "muỗng canh"
     * "mcf", "cf", "thìa cà phê", "thìa cf", "tsp" -> "muỗng cà phê"
     * "gr", "gram", "gam" -> "g"
     * "kilo", "kilogram" -> "kg"
     * "l", "lit" -> "lít"
   - CHỈ bổ sung đơn vị mới ngoài danh sách Database ở trên nếu đó thực sự là một ĐƠN VỊ ĐO LƯỜNG THUẦN TÚY hợp lệ (ví dụ: "khay", "túi", "vắt", "con") và chưa có trong danh sách.
   - Tuyệt đối tách riêng 3 trường: tên nguyên liệu thuần túy ("name"), số lượng ("amount") và đơn vị tính thuần túy ("unit").
5. BẮT BUỘC GẮN THẺ TAG TỪ DANH MỤC PHÂN CẤP:
   Hãy chọn 2 - 5 thẻ tag phù hợp nhất từ các nhóm sau:
${tagHierarchyText}
   - BẮT BUỘC chọn đúng 1 thẻ thuộc nhóm "Nguyên liệu chính" (ví dụ: "Thịt bò", "Thịt heo", "Gà / Vịt", "Hải sản", "Cá", "Tôm", "Rau củ & Nấm", "Đậu phụ") để phân loại món ăn.
   - Nếu dùng tag có sẵn trong danh sách trên: đặt "is_new": false.
   - Nếu thực sự cần tag mới chưa có trong danh mục: đặt "is_new": true và gán "category_id" bằng 1 trong các nhóm ("root-meal", "root-dish-type", "root-cooking", "root-ingredient", "root-cuisine", "root-diet").
${existingTips.length > 0 ? `6. Dò tìm trong danh sách mẹo: ${tipsStr}. Nếu có mẹo liên quan, trả về mảng linked_tips chứa ID của mẹo đó.` : ''}
7. TUYỆT ĐỐI CHỈ TRẢ VỀ MÃ JSON, KHÔNG CÓ BẤT KỲ LỜI CHÀO HAY VĂN BẢN NÀO BÊN NGOÀI KHỐI JSON.`;
}

interface RawGeminiIngredient {
  name?: string;
  amount?: string | number;
  unit?: string;
  [key: string]: unknown;
}

interface RawGeminiStep {
  content?: string;
  instruction?: string;
  [key: string]: unknown;
}

interface RawGeminiRecipe {
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
    name?: string;
    ingredients?: (string | RawGeminiIngredient)[];
  }[];
  ingredients?: (string | RawGeminiIngredient)[];
  stepSections?: {
    name?: string;
    steps?: (string | RawGeminiStep)[];
  }[];
  steps?: (string | RawGeminiStep)[];
  linked_tips?: string[];
  suggested_tip?: {
    title: string;
    content: string;
  };
}

export function parseGeminiResponse(rawText: string): ParseRecipeResult[] {
  if (!rawText || !rawText.trim()) {
    throw new Error('Vui lòng dán kết quả từ Gemini.');
  }

  let text = rawText.trim();

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

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

  let parsedJSON: unknown;
  try {
    parsedJSON = JSON.parse(text);
  } catch (err: unknown) {
    console.error('Lỗi parse JSON từ Gemini:', err, 'Nội dung:', text);
    throw new Error(
      'Không thể phân tích mã JSON từ Gemini. Vui lòng đảm bảo bạn đã copy toàn bộ khối JSON trả về từ Gemini Web.'
    );
  }

  const parsedObj =
    parsedJSON && typeof parsedJSON === 'object' && !Array.isArray(parsedJSON)
      ? (parsedJSON as { recipes?: unknown })
      : undefined;
  const rawList = parsedObj?.recipes || (Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON]);
  const recipesRaw: RawGeminiRecipe[] = Array.isArray(rawList)
    ? rawList.filter((r): r is RawGeminiRecipe => Boolean(r && typeof r === 'object'))
    : [];

  if (recipesRaw.length === 0) {
    throw new Error('Không tìm thấy công thức hợp lệ trong khối JSON.');
  }

  return recipesRaw.map((rawItem: RawGeminiRecipe) => {
    const { ingredients: rawFlatIngredients, steps: rawFlatSteps, ...restRaw } = rawItem;
    const result: ParseRecipeResult = {
      ...restRaw,
      ingredientSections: undefined,
      stepSections: undefined,
    };
    if (result.title) result.title = formatSentenceCase(result.title);
    if (typeof result.notes === 'string') result.notes = sanitizeHtml(result.notes);
    if (result.suggested_tip && typeof result.suggested_tip.content === 'string') {
      result.suggested_tip = {
        ...result.suggested_tip,
        content: sanitizeHtml(result.suggested_tip.content),
      };
    }

    const extractedPreps: string[] = [];

    const mapIngredients = (ingredients: (string | RawGeminiIngredient)[]) =>
      ingredients.map((ing) => {
        const rawName = typeof ing === 'string' ? ing : ing?.name || '';
        const rawUnit = typeof ing === 'object' && ing !== null ? ing.unit || '' : '';
        const { name: sanitizedName, prepNote } = sanitizeIngredientName(rawName);
        const { unit: cleanUnit, extra: unitExtra } = splitUnitAndExtra(rawUnit);

        let finalName = sanitizedName;
        if (prepNote) extractedPreps.push(prepNote);

        if (unitExtra) {
          if (PREP_ACTION_REGEX.test(unitExtra)) {
            const targetName = finalName || 'Nguyên liệu';
            extractedPreps.push(`${targetName} ${unitExtra}`);
          } else if (!finalName) {
            finalName = formatSentenceCase(unitExtra);
          }
        }

        return {
          ...(typeof ing === 'object' && ing !== null ? ing : {}),
          name: finalName,
          amount: typeof ing === 'object' && ing?.amount !== undefined ? String(ing.amount) : '',
          unit: cleanUnit,
        };
      });

    if (Array.isArray(rawItem.ingredientSections)) {
      result.ingredientSections = rawItem.ingredientSections.map((section) => ({
        ...section,
        name: formatSentenceCase(section?.name || 'Nguyên liệu'),
        ingredients: Array.isArray(section?.ingredients) ? mapIngredients(section.ingredients) : [],
      }));
    } else if (Array.isArray(rawFlatIngredients)) {
      result.ingredientSections = [
        {
          name: 'Nguyên liệu chính',
          ingredients: mapIngredients(rawFlatIngredients),
        },
      ];
    }

    if (Array.isArray(rawItem.stepSections)) {
      result.stepSections = rawItem.stepSections.map((section) => ({
        ...section,
        name: formatSentenceCase(section?.name || 'Thực hiện'),
        steps: Array.isArray(section?.steps)
          ? section.steps.map((step) => ({
              ...(typeof step === 'object' && step !== null ? step : {}),
              content: sanitizeHtml(typeof step === 'string' ? step : step?.content || ''),
            }))
          : [],
      }));
    } else if (Array.isArray(rawFlatSteps)) {
      result.stepSections = [
        {
          name: 'Thực hiện',
          steps: rawFlatSteps.map((step) => ({
            content: sanitizeHtml(typeof step === 'string' ? step : step?.content || step?.instruction || ''),
          })),
        },
      ];
    }

    if (extractedPreps.length > 0 && Array.isArray(result.stepSections) && result.stepSections.length > 0) {
      const firstSection = result.stepSections[0];
      const prepText = `Sơ chế: ${extractedPreps.join('; ')}.`;
      const alreadyHas = firstSection.steps.some((s) => (s.content || '').includes(extractedPreps[0]));
      if (!alreadyHas) {
        firstSection.steps.unshift({ content: sanitizeHtml(`<p>${prepText}</p>`) });
      }
    }

    return result;
  });
}

export function buildTipPrompt(text: string): string {
  const categoriesStr = TIP_CATEGORIES.map((c) => `"${c.id}" (${c.name}: ${c.description})`).join(', ');

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
1. "category_id" BẮT BUỘC phải là một trong các id: ${TIP_CATEGORIES.map((c) => `"${c.id}"`).join(', ')}.
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
  let data: { title?: unknown; category_id?: unknown; content?: unknown } | null = null;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Lỗi parse JSON mẹo từ Gemini:', err);
    throw new Error('Không thể phân tích mã JSON từ Gemini. Vui lòng kiểm tra lại nội dung đã dán.');
  }

  const validCatIds: readonly string[] = TIP_CATEGORIES.map((c) => c.id);
  const rawCategoryId = typeof data?.category_id === 'string' ? data.category_id : '';
  const categoryId = validCatIds.includes(rawCategoryId) ? rawCategoryId : 'cooking';

  return {
    title: typeof data?.title === 'string' ? data.title.trim() : '',
    category_id: categoryId,
    content: sanitizeHtml(typeof data?.content === 'string' ? data.content : ''),
  };
}

