import { useState, useMemo } from 'react';
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
import { AiAssistModal } from './AiAssistModal';
import { ImageManager } from '../../../lib/image-manager';
import type { Recipe, Tag } from '@apron/core';
import { DEFAULT_TAGS } from '@apron/core';
import type { ParseRecipeResult } from '../../../lib/gemini';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: any) => Promise<void>;
}

export function RecipeForm({ initialData, onSubmit }: RecipeFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const defaultValues: FormValues = useMemo(() => {
    if (initialData) {
      const parsedIngredients = (initialData.ingredients || []).reduce((acc: any[], ing: any) => {
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
      }, []);

      const parsedSteps = (initialData.steps || []).reduce((acc: any[], step: any) => {
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
      }, []);

      return {
        title: initialData.title || '',
        image_url: initialData.image_url || '',
        prep_time: initialData.prep_time || 0,
        cook_time: initialData.cook_time || 0,
        servings: initialData.servings || 1,
        difficulty: initialData.difficulty || 'Dễ',
        calories: initialData.calories || 0,
        taste_score: initialData.taste_score || 0,
        tags: initialData.tags || [],
        images: (initialData as any).images || [],
        deleted_images: [],
        notes: initialData.notes || '',
        video_url: initialData.video_url || '',
        parent_id: initialData.parent_id,
        ingredientSections: parsedIngredients.length > 0 ? parsedIngredients : [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
        stepSections: parsedSteps.length > 0 ? parsedSteps : [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
        related_recipes: initialData.related_recipes || []
      };
    }

    return {
      title: '',
      description: '',
      notes: '',
      difficulty: 'Dễ',
      prep_time: 0,
      cook_time: 0,
      calories: 0,
      taste_score: 0,
      image_url: '',
      servings: 1,
      images: [],
      deleted_images: [],
      tags: [],
      ingredientSections: [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
      stepSections: [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
      related_recipes: []
    };
  }, [initialData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(recipeSchema) as any,
    defaultValues,
    values: initialData ? defaultValues : undefined
  });

  const [dynamicTags, setDynamicTags] = useState<Tag[]>([]);

  const [bulkRecipes, setBulkRecipes] = useState<FormValues[] | null>(null);
  const [activeBulkIndex, setActiveBulkIndex] = useState(0);

  const mapAiDataToFormValues = (data: ParseRecipeResult, currentValues: FormValues): FormValues => {
    const newValues = { ...currentValues };
    if (data.title) newValues.title = data.title;
    if (data.description) newValues.notes = data.description;
    if (data.difficulty) newValues.difficulty = data.difficulty;
    if (data.prep_time_minutes) newValues.prep_time = data.prep_time_minutes;
    if (data.cook_time_minutes) newValues.cook_time = data.cook_time_minutes;
    if (data.servings) newValues.servings = data.servings;
    if (data.calories) newValues.calories = data.calories;
    
    if (data.tags && data.tags.length > 0) {
      const tagIds: string[] = [];
      const newDynamicTags: Tag[] = [];
      
      data.tags.forEach(tagObj => {
        const tagName = typeof tagObj === 'string' ? tagObj : tagObj.name;
        
        if (typeof tagObj !== 'string' && tagObj.is_new) {
          const newId = crypto.randomUUID();
          const newTag: Tag = {
            id: newId,
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            parent_id: tagObj.category_id || null
          };
          newDynamicTags.push(newTag);
          tagIds.push(newId);
        } else {
          const found = DEFAULT_TAGS.find(t => t.name.toLowerCase() === tagName.toLowerCase()) || 
                        dynamicTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
          if (found) {
            tagIds.push(found.id);
          }
        }
      });
      
      if (newDynamicTags.length > 0) {
        setDynamicTags(prev => [...prev, ...newDynamicTags]);
      }
      
      if (tagIds.length > 0) {
        const existingTags = currentValues.tags || [];
        newValues.tags = Array.from(new Set([...existingTags, ...tagIds]));
      }
    }
    
    if (data.ingredientSections && data.ingredientSections.length > 0) {
      newValues.ingredientSections = data.ingredientSections.map(section => ({
        name: section.name || 'Nguyên liệu',
        ingredients: section.ingredients.map(ing => ({
          id: crypto.randomUUID(),
          name: ing.name,
          quantity: ing.amount ? Number(ing.amount) || ing.amount : 0,
          unit: ing.unit || ''
        }))
      }));
    }

    if (data.stepSections && data.stepSections.length > 0) {
      newValues.stepSections = data.stepSections.map(section => ({
        name: section.name || 'Thực hiện',
        steps: section.steps.map(step => ({
          id: crypto.randomUUID(),
          instruction: step.content,
          images: []
        }))
      }));
    }

    return newValues;
  };

  const handleApplyAiData = (data: ParseRecipeResult) => {
    const newValues = mapAiDataToFormValues(data, methods.getValues());
    methods.reset(newValues);
    setBulkRecipes(null);
    setActiveBulkIndex(0);
  };

  const handleApplyAiDataBulk = (dataList: ParseRecipeResult[]) => {
    const newBulkRecipes = dataList.map(data => mapAiDataToFormValues(data, defaultValues));
    setBulkRecipes(newBulkRecipes);
    setActiveBulkIndex(0);
    methods.reset(newBulkRecipes[0]);
  };

  const prepareFinalData = async (data: FormValues) => {
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
    
    if (deleted_images && deleted_images.length > 0) {
      await ImageManager.deleteImages(deleted_images);
    }

    return {
      ...coreValues,
      image_url: finalImageUrl,
      images: finalImages,
      ingredients: flattenedIngredients,
      steps: flattenedSteps,
    };
  };

  const handleSingleSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      const finalData = await prepareFinalData(data);
      await onSubmit(finalData);
    } catch (error) {
      console.error('Error saving recipe', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkRecipes) return;
    
    // Lưu lại tab hiện tại trước khi validate
    const currentValues = methods.getValues();
    const newBulk = [...bulkRecipes];
    newBulk[activeBulkIndex] = currentValues;
    setBulkRecipes(newBulk);

    for (let i = 0; i < newBulk.length; i++) {
      const isValid = recipeSchema.safeParse(newBulk[i]).success;
      if (!isValid) {
        setActiveBulkIndex(i);
        methods.reset(newBulk[i]);
        setTimeout(() => methods.trigger(), 0);
        return;
      }
    }

    try {
      setIsSaving(true);
      const allFinalData = await Promise.all(newBulk.map(prepareFinalData));
      await onSubmit(allFinalData);
    } catch (error) {
      console.error('Error saving bulk recipes', error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTitle = methods.watch('title');

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={bulkRecipes ? (e) => { e.preventDefault(); handleBulkSubmit(); } : methods.handleSubmit(handleSingleSubmit, (errors) => console.log('Validation errors:', errors))} 
        className="flex flex-col gap-8 w-full"
      >
        <div className="sticky top-0 z-50 bg-default-50/80 backdrop-blur-md py-4 -my-4">
          <PageHeader 
          title={initialData ? 'Sửa công thức' : (bulkRecipes ? 'Thêm hàng loạt công thức' : 'Thêm công thức mới')} 
          actions={
            <>
              <Button
                type="button"
                variant="flat"
                color="secondary"
                startContent={<Sparkles className="w-4 h-4" />}
                onPress={() => setIsAiModalOpen(true)}
              >
                AI hỗ trợ nhập liệu
              </Button>

              {(!initialData || methods.formState.isDirty) && (
                <Button 
                  type="submit"
                  color="primary" 
                  variant="solid"
                  isLoading={isSaving}
                  startContent={!isSaving && <Save className="w-4 h-4" />}
                >
                  {bulkRecipes ? `Lưu ${bulkRecipes.length} Công Thức` : 'Lưu Công Thức'}
                </Button>
              )}
            </>
          }
        />
        </div>
        
        {bulkRecipes && bulkRecipes.length > 1 && (
          <div className="flex overflow-x-auto border-b border-default-200 w-full">
            {bulkRecipes.map((recipe, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                   const currentValues = methods.getValues();
                   const newBulk = [...bulkRecipes];
                   newBulk[activeBulkIndex] = currentValues;
                   setBulkRecipes(newBulk);
                   
                   setActiveBulkIndex(idx);
                   methods.reset(newBulk[idx]);
                }}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeBulkIndex === idx 
                    ? 'border-primary text-primary bg-primary-50/50' 
                    : 'border-transparent text-default-500 hover:text-default-700 hover:bg-default-100/50'
                }`}
              >
                {idx === activeBulkIndex ? (currentTitle || `Công thức ${idx + 1}`) : (recipe.title || `Công thức ${idx + 1}`)}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-8 w-full">
          {/* Row 1 */}
          <div className="rounded-xl p-6 bg-content1 shadow-none grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ImageSection />
            <InfoSection />
            <MetaSection dynamicTags={dynamicTags} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <IngredientsSection />
            <StepsSection />
          </div>
        </div>
      </form>
      <AiAssistModal 
        isOpen={isAiModalOpen} 
        onOpenChange={setIsAiModalOpen} 
        onApply={handleApplyAiData} 
        onApplyBulk={handleApplyAiDataBulk}
      />
    </FormProvider>
  );
}
