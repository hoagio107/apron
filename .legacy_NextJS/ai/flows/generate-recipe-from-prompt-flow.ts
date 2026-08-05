
'use server';
/**
 * @fileOverview A Genkit flow for generating multiple complete recipes from text or multiple images.
 *
 * - generateRecipeFromPrompt - A function that handles the recipe generation process.
 * - GenerateRecipeFromPromptInput - The input type for the generateRecipeFromPrompt function.
 * - GenerateRecipeFromPromptOutput - The return type for the generateRecipeFromPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecipeSchema = z.object({
  title: z.string().describe('The name of the recipe.'),
  prep_time: z.number().describe('Preparation time in minutes.'),
  cook_time: z.number().describe('Cooking time in minutes.'),
  servings: z.number().describe('Number of servings.'),
  difficulty: z.enum(['Dễ', 'Vừa', 'Khó']).describe('Cooking difficulty level.'),
  calories: z.number().describe('Estimated calories per serving.'),
  taste_score: z.number().describe('Estimated taste score out of 5.'),
  cooking_method: z.string().describe('Primary cooking method (e.g., mix, fry, steam, bake).'),
  dish_type: z.string().describe('Type of dish (e.g., main, appetizer, dessert).'),
  cuisine: z.string().describe('Cuisine origin (e.g., western, vn-north, japanese).'),
  dietary: z.array(z.string()).describe('Dietary tags (e.g., eat-clean, vegan, keto).'),
  occasions: z.array(z.string()).describe('Suitable occasions (e.g., breakfast, party, weekend).'),
  tags: z.array(z.string()).describe('Keywords for search.'),
  ingredients: z.array(
    z.object({
      name: z.string().describe('Name of the ingredient.'),
      quantity: z.number().or(z.string()).describe('Quantity value.'),
      unit: z.string().describe('Unit of measurement (e.g., g, ml, quả, muỗng).'),
      group: z.string().describe('Group name (e.g., Chính, Gia vị, Sốt).'),
    })
  ).describe('Full list of ingredients.'),
  steps: z.array(
    z.object({
      instruction: z.string().describe('Detailed step-by-step instruction.'),
      group: z.string().describe('Group phase (e.g., Sơ chế, Chế biến, Hoàn thành).'),
    })
  ).describe('Step-by-step cooking process.'),
  notes: z.string().optional().describe('Optional cooking tips or serving suggestions.'),
  video_url: z.string().optional().describe('Empty string if not available.'),
});

const GenerateRecipeFromPromptInputSchema = z.object({
  prompt: z.string().optional().describe('A description or text from a recipe source.'),
  photoDataUris: z.array(z.string()).optional().describe("An array of recipe photos, as data URIs."),
});
export type GenerateRecipeFromPromptInput = z.infer<typeof GenerateRecipeFromPromptInputSchema>;

const GenerateRecipeFromPromptOutputSchema = z.object({
  recipes: z.array(RecipeSchema).describe('A list of structured recipes extracted from the input.'),
});
export type GenerateRecipeFromPromptOutput = z.infer<typeof GenerateRecipeFromPromptOutputSchema>;

export async function generateRecipeFromPrompt(input: GenerateRecipeFromPromptInput): Promise<GenerateRecipeFromPromptOutput> {
  return generateRecipeFromPromptFlow(input);
}

// We define a simplified schema for the actual prompt generation 
// to avoid "exceeds maximum allowed nesting depth" error from Gemini API.
const PromptOutputSchema = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      prep_time: z.number(),
      cook_time: z.number(),
      servings: z.number(),
      difficulty: z.enum(['Dễ', 'Vừa', 'Khó']),
      calories: z.number(),
      taste_score: z.number(),
      cooking_method: z.string(),
      dish_type: z.string(),
      cuisine: z.string(),
      dietary: z.array(z.string()),
      occasions: z.array(z.string()),
      tags: z.array(z.string()),
      // Simplification: using any() for deeply nested arrays of objects
      ingredients: z.array(z.any()).describe('Array of {name, quantity, unit, group}'),
      steps: z.array(z.any()).describe('Array of {instruction, group}'),
      notes: z.string().optional(),
      video_url: z.string().optional(),
    })
  )
});

const recipeGeneratorPrompt = ai.definePrompt({
  name: 'recipeGeneratorPrompt',
  input: { schema: GenerateRecipeFromPromptInputSchema },
  output: { schema: PromptOutputSchema },
  prompt: `You are an expert recipe developer and data analyst named CookPal. 
Your task is to take the provided information (text description or one or more images of recipes) and convert it into a structured JSON list of recipes.

Input Text: {{{prompt}}}
Input Images: {{#each photoDataUris}}{{media url=this}}{{/each}}

INSTRUCTIONS:
1. Analyze all provided images. They may belong to a single long recipe (multiple pages) or several different recipes.
2. Extract all recipes found. If an image is a continuation of a previous recipe, merge the information correctly.
3. For each recipe, calculate/estimate missing metadata like calories, cook_time, or categories based on ingredients and methods.
4. Standardize units (prefer g, ml).
5. Organize ingredients into objects with fields: name, quantity (number or string), unit, and group (e.g., "Chính", "Gia vị").
6. Organize steps into objects with fields: instruction, and group (e.g., "Sơ chế", "Chế biến").
7. Assign appropriate IDs for cuisine, methods, and dietary tags.

Return a JSON object with a "recipes" array. Do not include any summary or description field.`,
});

const generateRecipeFromPromptFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromPromptFlow',
    inputSchema: GenerateRecipeFromPromptInputSchema,
    outputSchema: GenerateRecipeFromPromptOutputSchema,
  },
  async (input) => {
    const { output } = await recipeGeneratorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate recipe output from AI.');
    }
    // Cast to the detailed output schema for the flow return
    return output as GenerateRecipeFromPromptOutput;
  }
);
