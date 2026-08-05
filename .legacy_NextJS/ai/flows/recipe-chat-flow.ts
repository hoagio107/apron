'use server';
/**
 * @fileOverview Một luồng AI chuyên biệt để giải đáp các thắc mắc của người dùng khi đang thực hiện một công thức nấu ăn cụ thể.
 *
 * - askRecipeQuestion - Hàm xử lý câu hỏi về công thức.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecipeChatInputSchema = z.object({
  recipeTitle: z.string(),
  ingredients: z.string(),
  currentStep: z.string(),
  allSteps: z.string(),
  question: z.string(),
});

export type RecipeChatInput = z.infer<typeof RecipeChatInputSchema>;

export async function askRecipeQuestion(input: RecipeChatInput): Promise<string> {
  const { text } = await recipeChatPrompt(input);
  return text;
}

const recipeChatPrompt = ai.definePrompt({
  name: 'recipeChatPrompt',
  input: { schema: RecipeChatInputSchema },
  prompt: `Bạn là đầu bếp trợ lý CookPal. Bạn đang giúp người dùng nấu món "{{{recipeTitle}}}".

Dưới đây là thông tin về món ăn:
Nguyên liệu:
{{{ingredients}}}

Tất cả các bước làm:
{{{allSteps}}}

Người dùng hiện đang ở bước: "{{{currentStep}}}"

Câu hỏi của người dùng: "{{{question}}}"

HƯỚNG DẪN:
1. Trả lời ngắn gọn, tập trung vào giải quyết vấn đề ngay lập tức vì người dùng có thể đang đứng bếp.
2. Nếu họ hỏi về thay thế nguyên liệu, hãy đưa ra các lựa chọn phổ biến trong bếp gia đình.
3. Nếu họ hỏi về lỗi (mặn, cay, cháy...), hãy đưa ra mẹo "chữa cháy" nhanh.
4. Giữ tông giọng khích lệ và bình tĩnh.

Hãy trả lời bằng tiếng Việt.`,
});
