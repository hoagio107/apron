import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema } from './schema';
import type { FormValues } from './schema';
import { PageHeader } from '../../layout/PageHeader';
import { Button } from '@apron/ui';
import { Save, Sparkles } from 'lucide-react';
import { ImageSection } from './ImageSection';
import { InfoSection } from './InfoSection';
import { MetaSection } from './MetaSection';
import { IngredientsSection } from './IngredientsSection';
import { StepsSection } from './StepsSection';
import { ImageManager } from '../../../lib/image-manager';
import type { Recipe } from '@apron/core';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: any) => Promise<void>;
}

export function RecipeForm({ initialData, onSubmit }: RecipeFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues: FormValues = initialData ? {
    title: initialData.title,
    image_url: initialData.image_url,
    prep_time: initialData.prep_time,
    cook_time: initialData.cook_time,
    servings: initialData.servings,
    difficulty: initialData.difficulty,
    calories: initialData.calories,
    tags: initialData.tags || [],
    images: (initialData as any).images || [],
    deleted_images: [],
    notes: initialData.notes,
    video_url: initialData.video_url,
    parent_id: initialData.parent_id,
    ingredientSections: (initialData.ingredients || []).reduce((acc: any[], ing: any) => {
      const group = acc.find((g: any) => g.name === (ing.group || 'Chung'));
      const newIng = { 
        id: crypto.randomUUID(), 
        name: ing.name || '', 
        quantity: typeof ing.quantity === 'number' || typeof ing.quantity === 'string' ? ing.quantity : 0, 
        unit: ing.unit || '' 
      };
      if (group) {
        group.ingredients.push(newIng);
      } else {
        acc.push({ name: ing.group || 'Chung', ingredients: [newIng] });
      }
      return acc;
    }, []) || [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
    stepSections: (initialData.steps || []).reduce((acc: any[], step: any) => {
      const group = acc.find((g: any) => g.name === (step.group || 'Chung'));
      const newStep = {
        id: crypto.randomUUID(),
        instruction: step.instruction || '',
        images: step.images || []
      };
      if (group) {
        group.steps.push(newStep);
      } else {
        acc.push({ name: step.group || 'Chung', steps: [newStep] });
      }
      return acc;
    }, []) || [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
    related_recipes: initialData.related_recipes || []
  } : {
    title: '',
    image_url: '',
    servings: 1,
    images: [],
    deleted_images: [],
    tags: [],
    ingredientSections: [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
    stepSections: [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
    related_recipes: []
  };

  const methods = useForm<FormValues>({
    resolver: zodResolver(recipeSchema) as any,
    defaultValues
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      
      // Process images via ImageManager
      const finalImageUrl = data.image_url ? await ImageManager.commitImage(data.image_url) : undefined;
      const finalImages = data.images && data.images.length > 0 
        ? await Promise.all(data.images.map(url => ImageManager.commitImage(url))) 
        : [];

      // Chuyển đổi dạng cha-con về mảng phẳng cho backend giống bản NextJS
      const flattenedIngredients = data.ingredientSections.flatMap(section => 
        section.ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit || '',
          group: section.name
        }))
      );
      
      const flattenedStepsPromises = data.stepSections.flatMap(section => 
        section.steps.map(async step => ({
          instruction: step.instruction,
          images: step.images ? await Promise.all(step.images.map(img => ImageManager.commitImage(img))) : [],
          group: section.name
        }))
      );
      
      const flattenedSteps = await Promise.all(flattenedStepsPromises);
      
      const { ingredientSections: _ingredientSections, stepSections: _stepSections, deleted_images, ...coreValues } = data;
      
      const finalData = {
        ...coreValues,
        image_url: finalImageUrl,
        images: finalImages,
        ingredients: flattenedIngredients,
        steps: flattenedSteps,
      };

      if (deleted_images && deleted_images.length > 0) {
        await ImageManager.deleteImages(deleted_images);
      }

      await onSubmit(finalData);
    } catch (error) {
      console.error('Error saving recipe', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="flex flex-col gap-8 w-full">
        <PageHeader 
          title={initialData ? 'Sửa công thức' : 'Thêm công thức mới'} 
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="flat"
                color="secondary"
                startContent={<Sparkles className="w-4 h-4" />}
              >
                AI hỗ trợ nhập liệu
              </Button>

              <Button 
                type="submit"
                color="primary" 
                variant="solid"
                isLoading={isSaving}
                startContent={!isSaving && <Save className="w-4 h-4" />}
              >
                Lưu Công Thức
              </Button>
            </div>
          }
        />
        
        <div className="flex flex-col gap-8 w-full">
          {/* Row 1 */}
          <div className="rounded-xl p-6 bg-content1 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ImageSection />
            <InfoSection />
            <MetaSection />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <IngredientsSection />
            <StepsSection />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
