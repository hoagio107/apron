'use server';
/**
 * @fileOverview Luồng AI hỗ trợ tìm kiếm món ăn dựa trên nguyên liệu có sẵn.
 * 
 * - findRecipesFromIngredients: Hàm xử lý chính.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartFridgeInputSchema = z.object({
  ingredients: z.string().describe('Danh sách nguyên liệu người dùng đang có (VD: thịt bò, cà chua, hành tây)'),
  existingRecipes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    tags: z.array(z.string()).optional()
  })).describe('Danh sách các món ăn hiện có trong sổ tay để AI đối chiếu')
});

const SmartFridgeOutputSchema = z.object({
  recommendedRecipeIds: z.array(z.string()).describe('Mảng ID của các món ăn phù hợp nhất'),
  advice: z.string().describe('Lời khuyên ngắn gọn từ đầu bếp về cách tận dụng nguyên liệu này')
});

export async function findRecipesFromIngredients(input: z.infer<typeof SmartFridgeInputSchema>) {
  const { output } = await smartFridgePrompt(input);
  return output!;
}

const smartFridgePrompt = ai.definePrompt({
  name: 'smartFridgePrompt',
  input: { schema: SmartFridgeInputSchema },
  output: { schema: SmartFridgeOutputSchema },
  prompt: `Bạn là một đầu bếp thông minh giúp người dùng "dọn sạch tủ lạnh".
Dưới đây là danh sách nguyên liệu người dùng đang có: "{{{ingredients}}}"

Và đây là danh sách các món ăn trong sổ tay của họ:
{{#each existingRecipes}}
- ID: {{id}}, Tên: {{title}}, Tags: {{#each tags}}{{this}} {{/each}}
{{/each}}

NHIỆM VỤ:
1. Dựa trên nguyên liệu có sẵn, hãy chọn ra tối đa 5 món ăn phù hợp nhất từ danh sách sổ tay.
2. Ưu tiên các món có nguyên liệu khớp trực tiếp hoặc có thể biến tấu dễ dàng.
3. Viết một lời khuyên ngắn gọn (khoảng 2 câu) khích lệ người dùng nấu ăn.

Hãy trả về kết quả dưới dạng JSON theo đúng cấu trúc yêu cầu.`,
});
