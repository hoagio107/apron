'use server';
/**
 * @fileOverview A Genkit flow for extracting structured kitchen tips from text or images.
 *
 * - generateTipFromPrompt - A function that handles the tip extraction process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTipFromPromptInputSchema = z.object({
  prompt: z.string().optional().describe('A description or text from a tip source.'),
  photoDataUris: z.array(z.string()).optional().describe("An array of tip photos, as data URIs."),
});
export type GenerateTipFromPromptInput = z.infer<typeof GenerateTipFromPromptInputSchema>;

const GenerateTipFromPromptOutputSchema = z.object({
  tips: z.array(z.object({
    title: z.string().describe('Short, catchy title for the tip.'),
    content: z.string().describe('Detailed content in Markdown format.'),
    category_id: z.enum(['cooking', 'cleaning', 'preservation', 'shopping', 'prep', 'fixing', 'organization', 'tools', 'utilization']).describe('The most appropriate category ID.'),
  })).describe('A list of structured tips extracted from the input.'),
});
export type GenerateTipFromPromptOutput = z.infer<typeof GenerateTipFromPromptOutputSchema>;

export async function generateTipFromPrompt(input: GenerateTipFromPromptInput): Promise<GenerateTipFromPromptOutput> {
  return generateTipFromPromptFlow(input);
}

const tipGeneratorPrompt = ai.definePrompt({
  name: 'tipGeneratorPrompt',
  input: { schema: GenerateTipFromPromptInputSchema },
  output: { schema: GenerateTipFromPromptOutputSchema },
  prompt: `You are an expert home economics consultant and professional chef.
Your task is to analyze the provided input (text or images) and extract useful kitchen tips.

INSTRUCTIONS:
1. THEMATIC GROUPING RULE: Determine if the input describes one core topic or several unrelated hacks. 
   - If the input is about a single subject (e.g., "Frying onions", "Choosing fresh fish", or "Cleaning a blender"), CONSOLIDATE all details into ONE structured tip. 
   - Use Markdown headers (###) and bullet points to organize sub-steps or related advice within that single tip.
   - ONLY output multiple tips if the input explicitly contains a collection of clearly distinct and unrelated kitchen hacks (e.g., a page with 10 different random life hacks).

2. For each tip, write a clear, instructional, and professional title in Vietnamese.

3. Provide the content in helpful Markdown format. Ensure it's comprehensive but concise.

4. Categorize each tip into one of these IDs:
   - cooking (cooking techniques)
   - cleaning (kitchen hygiene)
   - preservation (food storage)
   - shopping (buying advice)
   - prep (preparation shortcuts)
   - fixing (correcting mistakes)
   - organization (kitchen layout)
   - tools (appliance care)
   - utilization (avoiding waste)

Input Text: {{{prompt}}}
Input Images: {{#each photoDataUris}}{{media url=this}}{{/each}}

Return a JSON object with a "tips" array. Use Vietnamese for titles and content.`,
});

const generateTipFromPromptFlow = ai.defineFlow(
  {
    name: 'generateTipFromPromptFlow',
    inputSchema: GenerateTipFromPromptInputSchema,
    outputSchema: GenerateTipFromPromptOutputSchema,
  },
  async (input) => {
    const { output } = await tipGeneratorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate tip output from AI.');
    }
    return output;
  }
);
