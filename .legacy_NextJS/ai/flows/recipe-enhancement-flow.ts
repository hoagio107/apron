'use server';
/**
 * @fileOverview A Genkit flow for enhancing recipes by suggesting ingredient substitutions, improving preparation step clarity, or offering cooking tips.
 *
 * - enhanceRecipe - A function that handles the recipe enhancement process.
 * - RecipeEnhancementInput - The input type for the enhanceRecipe function.
 * - RecipeEnhancementOutput - The return type for the enhanceRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const RecipeEnhancementInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  ingredients: z.string().describe('A list of ingredients for the recipe, one per line.'),
  preparationSteps: z
    .string()
    .describe('Detailed preparation steps for the recipe, step by step.'),
  notes: z.string().optional().describe('Any additional notes or details about the recipe.'),
  enhancementType: z
    .enum(['substitutions', 'clarity', 'tips', 'all'])
    .describe(
      'The type of enhancement requested: "substitutions" for ingredient swaps, "clarity" for step improvements, "tips" for cooking advice, or "all" for everything.'
    )
});
export type RecipeEnhancementInput = z.infer<typeof RecipeEnhancementInputSchema>;

// Output Schema
const RecipeEnhancementOutputSchema = z.object({
  revisedIngredients: z
    .string()
    .optional()
    .describe(
      'The ingredients list, potentially revised for better clarity or structure, if "clarity" or "all" enhancement is requested.'
    ),
  revisedPreparationSteps: z
    .string()
    .optional()
    .describe(
      'The preparation steps, rephrased for better clarity, conciseness, or flow, if "clarity" or "all" enhancement is requested.'
    ),
  suggestedSubstitutions: z
    .string()
    .optional()
    .describe(
      'A list of ingredient substitutions with explanations, if "substitutions" or "all" enhancement is requested.'
    ),
  cookingTips: z
    .string()
    .optional()
    .describe('Relevant cooking tips, tricks, or advice for the recipe, if "tips" or "all" enhancement is requested.'),
  overallSuggestions: z
    .string()
    .optional()
    .describe('Any other general suggestions or improvements for the recipe, if "all" enhancement is requested.')
});
export type RecipeEnhancementOutput = z.infer<typeof RecipeEnhancementOutputSchema>;

// Wrapper function
export async function enhanceRecipe(
  input: RecipeEnhancementInput
): Promise<RecipeEnhancementOutput> {
  return recipeEnhancementFlow(input);
}

// Prompt definition
const recipeEnhancementPrompt = ai.definePrompt({
  name: 'recipeEnhancementPrompt',
  input: {schema: RecipeEnhancementInputSchema},
  output: {schema: RecipeEnhancementOutputSchema},
  prompt: `You are an expert culinary assistant specialized in enhancing recipes. Your task is to provide intelligent suggestions based on the user's request.

Recipe Name: {{{recipeName}}}

Ingredients:
{{{ingredients}}}

Preparation Steps:
{{{preparationSteps}}}

{{#if notes}}
Notes:
{{{notes}}}
{{/if}}

Based on the requested enhancement type "{{{enhancementType}}}", please provide your suggestions.

If the enhancement type is "substitutions" or "all", focus on providing creative and practical ingredient substitutions. Explain why each substitution works.

If the enhancement type is "clarity" or "all", review the preparation steps and ingredients for clarity, conciseness, and completeness. Suggest rephrasing or restructuring as needed.

If the enhancement type is "tips" or "all", offer relevant cooking tips, tricks, or advice that would benefit someone making this recipe.

For "all", provide suggestions for all categories.

Format your response as a JSON object matching the provided schema. Only include fields relevant to the requested enhancement type. For instance, if only "substitutions" are requested, do not include "cookingTips". If "all" is requested, include all relevant fields.
`
});

// Flow definition
const recipeEnhancementFlow = ai.defineFlow(
  {
    name: 'recipeEnhancementFlow',
    inputSchema: RecipeEnhancementInputSchema,
    outputSchema: RecipeEnhancementOutputSchema
  },
  async input => {
    const {output} = await recipeEnhancementPrompt(input);
    if (!output) {
      throw new Error('Failed to generate recipe enhancement output.');
    }
    return output;
  }
);
