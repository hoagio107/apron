import { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema } from './schema';
import type { FormValues } from './schema';

import { Button, Tabs, Tab, PageHeader } from '@/ui';
import { Sparkles, FileText, Utensils, ChefHat } from 'lucide-react';
import { ImageSection } from './ImageSection';
import { InfoSection } from './InfoSection';
import { MetaSection } from './MetaSection';
import { IngredientsSection } from './IngredientsSection';
import { StepsSection } from './StepsSection';
import { LinkedTipsSection } from './LinkedTipsSection';
import { AiAssistModal } from './AiAssistModal';
import { ImageManager } from '../../../lib/image-manager';
import type { Recipe, Tag } from '@apron/core';
import { DEFAULT_TAGS } from '@apron/core';
import type { ParseRecipeResult } from '../../../lib/gemini';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { BottomActionStepper } from '../../shared/BottomActionStepper';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: any) => Promise<void>;
}

interface TabHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  hasError?: boolean;
}

function TabHeader({ icon: Icon, label, count, hasError }: TabHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 relative py-1">
      <Icon className="w-4 h-4 shrink-0" />
      <span className="font-semibold text-xs sm:text-sm tracking-tight">{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-default-200/80 dark:bg-default-100 text-default-700 dark:text-default-300 group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground">
          {count}
        </span>
      )}
      {hasError && (
        <span
          className="w-2 h-2 rounded-full bg-danger shrink-0 ring-2 ring-background animate-pulse"
          title="Có trường cần kiểm tra lại"
        />
      )}
    </div>
  );
}

export function RecipeForm({ initialData, onSubmit }: RecipeFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState('info');
  const { addIngredientMeta, getIngredientMetaByName } = useIngredientCatalogStore();

  const defaultValues: FormValues = useMemo(() => {
    if (initialData) {
      const parsedIngredients = (initialData.ingredients || []).reduce((acc: any[], ing: any) => {
        const group = acc.find((g: any) => g.name === (ing.group || 'Chung'));
        const newIng = { 
          id: crypto.randomUUID(), 
          ingredient_id: ing.ingredient_id,
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
        source: initialData.source || '',
        parent_id: initialData.parent_id || null,
        ingredientSections: parsedIngredients.length > 0 ? parsedIngredients : [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
        stepSections: parsedSteps.length > 0 ? parsedSteps : [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
        related_recipes: initialData.related_recipes || [],
        linked_tips: initialData.linked_tips || []
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
      video_url: '',
      source: '',
      parent_id: null,
      ingredientSections: [{ name: 'Nguyên liệu chính', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] }],
      stepSections: [{ name: 'Thực hiện', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] }],
      related_recipes: [],
      linked_tips: []
    };
  }, [initialData]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(recipeSchema) as any,
    defaultValues: () => {
      if (initialData) return Promise.resolve(defaultValues);
      
      const draft = localStorage.getItem('recipe_form_draft');
      if (draft) {
        try {
          return Promise.resolve(JSON.parse(draft));
        } catch (e) {
          console.error("Failed to parse recipe draft", e);
        }
      }
      return Promise.resolve(defaultValues);
    },
    values: initialData ? defaultValues : undefined
  });

  useEffect(() => {
    if (initialData) return;
    const subscription = methods.watch((value) => {
      localStorage.setItem('recipe_form_draft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [methods, initialData]);

  const [dynamicTags, setDynamicTags] = useState<Tag[]>([]);

  const [bulkRecipes, setBulkRecipes] = useState<FormValues[] | null>(null);
  const [activeBulkIndex, setActiveBulkIndex] = useState(0);

  const mapAiDataToFormValues = (data: ParseRecipeResult, currentValues: FormValues): FormValues => {
    const newValues = { ...currentValues };
    if (data.title) newValues.title = data.title;
    if (data.notes) {
      newValues.notes = data.notes;
    } else if (data.description && !newValues.notes) {
      newValues.notes = data.description;
    }
    if (data.difficulty) newValues.difficulty = data.difficulty;
    if (data.prep_time_minutes) newValues.prep_time = data.prep_time_minutes;
    if (data.cook_time_minutes) newValues.cook_time = data.cook_time_minutes;
    if (data.servings) newValues.servings = data.servings;
    if (data.calories) newValues.calories = data.calories;
    if (data.linked_tips) newValues.linked_tips = Array.from(new Set([...(currentValues.linked_tips || []), ...data.linked_tips]));
    
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
        ingredients: section.ingredients.map(ing => {
          const matchedMeta = getIngredientMetaByName(ing.name);
          return {
            id: crypto.randomUUID(),
            ingredient_id: matchedMeta?.id,
            name: matchedMeta ? matchedMeta.name : ing.name,
            quantity: ing.amount ? Number(ing.amount) || ing.amount : 0,
            unit: ing.unit || matchedMeta?.default_unit || ''
          };
        })
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
      section.ingredients.map(ing => {
        let finalIngredientId = (ing as any).ingredient_id;
        const nameTrimmed = ing.name.trim();
        if (nameTrimmed && !finalIngredientId) {
          const existing = getIngredientMetaByName(nameTrimmed);
          if (existing) {
            finalIngredientId = existing.id;
          } else {
            const added = addIngredientMeta(nameTrimmed, { default_unit: ing.unit || undefined });
            finalIngredientId = added.id;
          }
        }
        return {
          ingredient_id: finalIngredientId,
          name: nameTrimmed,
          quantity: ing.quantity,
          unit: ing.unit || '',
          group: section.name
        };
      })
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
    if (!initialData) {
      localStorage.removeItem('recipe_form_draft');
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
  const watchedIngredientSections = methods.watch('ingredientSections');
  const watchedStepSections = methods.watch('stepSections');

  const ingredientCount = useMemo(() => {
    if (!watchedIngredientSections || !Array.isArray(watchedIngredientSections)) return 0;
    return watchedIngredientSections.reduce((sum, section) => sum + (section.ingredients?.length || 0), 0);
  }, [watchedIngredientSections]);

  const stepCount = useMemo(() => {
    if (!watchedStepSections || !Array.isArray(watchedStepSections)) return 0;
    return watchedStepSections.reduce((sum, section) => sum + (section.steps?.length || 0), 0);
  }, [watchedStepSections]);

  const { errors } = methods.formState;

  const hasInfoError = Boolean(
    errors.title || 
    errors.prep_time || 
    errors.cook_time || 
    errors.servings || 
    errors.difficulty || 
    errors.calories ||
    errors.tags ||
    errors.notes ||
    errors.video_url ||
    errors.source
  );

  const hasIngredientsError = Boolean(errors.ingredientSections);
  const hasStepsError = Boolean(errors.stepSections);

  const onInvalid = (validationErrors: any) => {
    console.log('Validation errors:', validationErrors);
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length === 0) return;
    
    const tabMap: Record<string, string> = {
      title: 'info',
      image_url: 'info',
      prep_time: 'info',
      cook_time: 'info',
      servings: 'info',
      difficulty: 'info',
      calories: 'info',
      tags: 'info',
      notes: 'info',
      video_url: 'info',
      source: 'info',
      ingredientSections: 'ingredients',
      stepSections: 'steps'
    };
    
    const firstErrorKey = errorKeys[0];
    const targetTab = tabMap[firstErrorKey] || 'info';
    
    if (activeStep !== targetTab) {
      setActiveStep(targetTab);
    }
  };

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={bulkRecipes ? (e) => { e.preventDefault(); handleBulkSubmit(); } : methods.handleSubmit(handleSingleSubmit, onInvalid)} 
        className="flex flex-col gap-0 w-full"
      >

        
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

        <PageHeader
          title={bulkRecipes && bulkRecipes.length > 1 ? "Nhập nhiều công thức" : (initialData ? "Chỉnh sửa công thức" : "Tạo công thức mới")}
          showBackButton
          className="px-4 pt-4 pb-2"
        />

        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 py-2 border-b border-divider/60 shadow-sm mb-4">
          <Tabs
            aria-label="Các phần của công thức"
            selectedKey={activeStep}
            onSelectionChange={(key) => setActiveStep(key.toString())}
            color="primary"
            variant="solid"
            fullWidth
            size="md"
            classNames={{
              base: "w-full",
              tabList: "bg-default-100/90 dark:bg-default-50/60 p-1 rounded-2xl gap-1 w-full border border-divider/30",
              tab: "h-11 rounded-xl font-medium text-default-600 data-[selected=true]:text-primary-foreground data-[selected=true]:font-semibold transition-all",
              cursor: "bg-primary rounded-xl shadow-sm",
            }}
          >
            <Tab 
              key="info" 
              title={<TabHeader icon={FileText} label="Thông tin" hasError={hasInfoError} />} 
            />
            <Tab 
              key="ingredients" 
              title={<TabHeader icon={Utensils} label="Nguyên liệu" count={ingredientCount} hasError={hasIngredientsError} />} 
            />
            <Tab 
              key="steps" 
              title={<TabHeader icon={ChefHat} label="Cách làm" count={stepCount} hasError={hasStepsError} />} 
            />
          </Tabs>
        </div>

        <div className="flex flex-col w-full bg-background px-0">
          <div className="px-4 pt-0 pb-32">
            {activeStep === 'info' && (
              <div className="flex flex-col gap-6">
                <ImageSection />
                <InfoSection currentRecipeId={initialData?.id} />
                <MetaSection dynamicTags={dynamicTags} currentRecipeId={initialData?.id} />
                <LinkedTipsSection />
              </div>
            )}
            {activeStep === 'ingredients' && (
              <IngredientsSection />
            )}
            {activeStep === 'steps' && (
              <StepsSection />
            )}
          </div>
        </div>

        <BottomActionStepper
          canGoBack={activeStep !== 'info'}
          onBack={() => {
            if (activeStep === 'steps') setActiveStep('ingredients');
            else if (activeStep === 'ingredients') setActiveStep('info');
          }}
          isLastStep={activeStep === 'steps' || Boolean(initialData)}
          onNext={() => {
            if (activeStep === 'info') setActiveStep('ingredients');
            else if (activeStep === 'ingredients') setActiveStep('steps');
          }}
          isSaving={isSaving}
          submitText={initialData ? "Lưu thay đổi" : "Lưu công thức"}
          extraAction={
            <Button
              type="button"
              variant="flat"
              color="secondary"
              onPress={() => setIsAiModalOpen(true)}
              className="shrink-0 font-medium h-12 px-6"
            >
              <Sparkles className="w-5 h-5 mr-1" /> AI Nhập
            </Button>
          }
        />
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
