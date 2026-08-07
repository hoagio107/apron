import * as z from 'zod';

export const recipeSchema = z.object({
  title: z.string().min(2, "Vui lòng nhập tên món"),
  image_url: z.string().optional().or(z.string().length(0)),
  prep_time: z.coerce.number().min(0).optional(),
  cook_time: z.coerce.number().min(0).optional(),
  servings: z.coerce.number().min(1),
  difficulty: z.enum(['Dễ', 'Vừa', 'Khó']).optional(),
  calories: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  deleted_images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  video_url: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  related_recipes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string().nullable().optional(),
    image_url: z.string().nullable().optional()
  })).optional(),
  ingredientSections: z.array(z.object({
    name: z.string().min(1, "Tên nhóm"),
    ingredients: z.array(z.object({
      id: z.string(), 
      name: z.string().min(1, "Nhập tên"),
      quantity: z.preprocess((val) => (val === '' ? 0 : val), z.union([z.string(), z.number()])),
      unit: z.string().optional().or(z.string().length(0))
    }))
  })),
  stepSections: z.array(z.object({
    name: z.string().min(1, "Tên giai đoạn"),
    steps: z.array(z.object({
      id: z.string(),
      instruction: z.string().min(1, "Nhập nội dung"),
      images: z.array(z.string())
    }))
  }))
});

export type FormValues = z.infer<typeof recipeSchema>;
