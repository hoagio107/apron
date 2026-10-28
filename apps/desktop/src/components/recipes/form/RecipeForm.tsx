import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema } from './schema';
import type { FormValues } from './schema';
import { PageHeader } from '../../layout/PageHeader';
import { Button, toast } from '@/ui';
import { Save, Sparkles, Layers, X } from 'lucide-react';
import { ImageSection } from './ImageSection';
import { InfoSection } from './InfoSection';
import { MetaSection } from './MetaSection';
import { IngredientsSection } from './IngredientsSection';
import { StepsSection } from './StepsSection';
import { AiAssistModal } from './AiAssistModal';
import { ImageManager } from '../../../lib/image-manager';
import type { Recipe, Tag } from '@apron/core';
import { DEFAULT_TAGS_MAP, normalizeUnit, extractAndNormalizeUnits } from '@apron/core';
import { useUnitStore } from '../../../store/useUnitStore';
import type { ParseRecipeResult } from '../../../lib/gemini';

interface RecipeFormProps {
  initialData?: Recipe;
  onSubmit: (data: any) => Promise<void>;
}

export function RecipeForm({ initialData, onSubmit }: RecipeFormProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = methods.watch((value) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.setItem('recipe_form_draft', JSON.stringify(value));
      }, 500);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
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
    newValues.servings = (data.servings && Number(data.servings) > 0) ? Number(data.servings) : (currentValues.servings || 2);
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
          const found = DEFAULT_TAGS_MAP.get(tagName.toLowerCase()) || 
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
        ingredients: (section.ingredients || [])
          .filter(ing => ing && ing.name && ing.name.trim().length > 0)
          .map(ing => ({
            id: crypto.randomUUID(),
            name: ing.name.trim(),
            quantity: ing.amount ? Number(ing.amount) || ing.amount : 0,
            unit: normalizeUnit(ing.unit || '')
          }))
      }));
    }

    if (data.stepSections && data.stepSections.length > 0) {
      newValues.stepSections = data.stepSections.map(section => ({
        name: section.name || 'Thực hiện',
        steps: (section.steps || [])
          .filter((step: any) => step && ((step as any).content || (step as any).instruction) && ((step as any).content || (step as any).instruction).trim().length > 0)
          .map((step: any) => ({
            id: crypto.randomUUID(),
            instruction: ((step as any).content || (step as any).instruction).trim(),
            images: []
          }))
      }));
    }

    return newValues;
  };

  const handleApplyAiData = (data: ParseRecipeResult) => {
    const unitsInRecipe = extractAndNormalizeUnits(data);
    if (unitsInRecipe.length > 0) {
      useUnitStore.getState().ensureUnits(unitsInRecipe);
    }
    const newValues = mapAiDataToFormValues(data, methods.getValues());
    methods.reset(newValues);
    setBulkRecipes(null);
    setActiveBulkIndex(0);
  };

  const handleApplyAiDataBulk = (dataList: ParseRecipeResult[]) => {
    if (dataList.length === 1) {
      handleApplyAiData(dataList[0]);
      return;
    }
    const allUnits = extractAndNormalizeUnits(dataList);
    if (allUnits.length > 0) {
      useUnitStore.getState().ensureUnits(allUnits);
    }
    const newBulkRecipes = dataList.map(data => mapAiDataToFormValues(data, defaultValues));
    setBulkRecipes(newBulkRecipes);
    setActiveBulkIndex(0);
    methods.reset(newBulkRecipes[0]);
  };

  const handleRemoveBulkRecipe = (idxToRemove: number) => {
    if (!bulkRecipes) return;
    if (bulkRecipes.length <= 1) {
      setBulkRecipes(null);
      setActiveBulkIndex(0);
      return;
    }
    const currentValues = methods.getValues();
    const updatedBulk = [...bulkRecipes];
    updatedBulk[activeBulkIndex] = currentValues;

    const filtered = updatedBulk.filter((_, i) => i !== idxToRemove);
    if (filtered.length === 1) {
      setBulkRecipes(null);
      setActiveBulkIndex(0);
      methods.reset(filtered[0]);
      toast.info('Chỉ còn 1 món, đã chuyển về chế độ chỉnh sửa đơn lẻ');
      return;
    }

    let nextIdx = activeBulkIndex;
    if (activeBulkIndex === idxToRemove) {
      nextIdx = Math.min(idxToRemove, filtered.length - 1);
      methods.reset(filtered[nextIdx]);
    } else if (activeBulkIndex > idxToRemove) {
      nextIdx = activeBulkIndex - 1;
    }
    setActiveBulkIndex(nextIdx);
    setBulkRecipes(filtered);
    toast.info('Đã bỏ công thức khỏi danh sách');
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
        const normUnit = normalizeUnit(ing.unit || '');
        return {
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: normUnit,
          group: section.name
        };
      })
    );

    // Tự động đồng bộ các đơn vị xuất hiện trong công thức vào danh mục Đơn vị tính
    const unitsToSync = Array.from(new Set(flattenedIngredients.map(i => i.unit).filter(Boolean)));
    if (unitsToSync.length > 0) {
      useUnitStore.getState().ensureUnits(unitsToSync);
    }
    
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
      id: (coreValues as any).id || crypto.randomUUID(),
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
      toast.success('Đã lưu công thức thành công!');
    } catch (error: any) {
      console.error('Error saving recipe', error);
      toast.error('Không thể lưu công thức: ' + (error?.message || 'Có lỗi xảy ra'));
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
        toast.error(`Món "${newBulk[i].title || i + 1}" còn thiếu thông tin bắt buộc`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const allFinalData = await Promise.all(newBulk.map(prepareFinalData));
      await onSubmit(allFinalData);
      toast.success(`Đã lưu thành công ${allFinalData.length} công thức!`);
    } catch (error: any) {
      console.error('Error saving bulk recipes', error);
      toast.error('Không thể lưu các công thức: ' + (error?.message || 'Có lỗi xảy ra'));
    } finally {
      setIsSaving(false);
    }
  };

  const currentTitle = methods.watch('title');

  return (
    <FormProvider {...methods}>
      <form 
        onSubmit={bulkRecipes ? (e) => { e.preventDefault(); handleBulkSubmit(); } : methods.handleSubmit(handleSingleSubmit, () => toast.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc'))} 
        className="flex flex-col gap-8 w-full pb-8"
      >
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 -mx-8 px-8 border-b border-divider/50 shadow-2xs">
          <PageHeader 
            title={initialData ? t('recipes.form.editTitle') : (bulkRecipes && bulkRecipes.length > 1 ? t('recipes.form.bulkCreateTitle', { count: bulkRecipes.length }) : t('recipes.form.createTitle'))} 
            className="pt-0 pb-0"
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

                <Button 
                  type="submit"
                  color="primary" 
                  variant="solid"
                  isLoading={isSaving}
                  startContent={!isSaving && <Save className="w-4 h-4" />}
                >
                  {bulkRecipes && bulkRecipes.length > 1 ? t('recipes.form.saveBulkRecipes', { count: bulkRecipes.length }) : t('recipes.form.saveRecipe')}
                </Button>
              </>
            }
          />
        </div>
        
        {bulkRecipes && bulkRecipes.length > 1 && (
          <div className="bg-default-100/70 dark:bg-default-100/20 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Layers className="w-4 h-4" />
                <span>{t('recipes.form.bulkListTitle', { current: activeBulkIndex + 1, total: bulkRecipes.length })}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('recipes.form.bulkExitConfirm'))) {
                    setBulkRecipes(null);
                    setActiveBulkIndex(0);
                    toast.info('Đã chuyển về chế độ chỉnh sửa đơn lẻ');
                  }
                }}
                className="text-xs text-default-400 hover:text-danger flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Thoát hàng loạt
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2 no-scrollbar py-0.5">
              {bulkRecipes.map((recipe, idx) => {
                const isActive = activeBulkIndex === idx;
                const title = isActive ? (currentTitle || `Món ${idx + 1}`) : (recipe.title || `Món ${idx + 1}`);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-xl text-sm whitespace-nowrap transition-all select-none ${
                      isActive 
                        ? 'bg-primary text-white font-semibold shadow-xs' 
                        : 'bg-content1 text-foreground font-medium hover:bg-default-200/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const currentValues = methods.getValues();
                        const newBulk = [...bulkRecipes];
                        newBulk[activeBulkIndex] = currentValues;
                        setBulkRecipes(newBulk);
                        
                        setActiveBulkIndex(idx);
                        methods.reset(newBulk[idx]);
                      }}
                      className="max-w-[200px] truncate text-left font-inherit cursor-pointer"
                    >
                      {idx + 1}. {title}
                    </button>
                    {bulkRecipes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBulkRecipe(idx);
                        }}
                        className={`p-1 rounded-full hover:bg-black/20 transition-colors cursor-pointer ${
                          isActive ? 'text-white' : 'text-default-400 hover:text-danger'
                        }`}
                        title="Bỏ món này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8 w-full">
          {/* Row 1 */}
          <div className="app-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ImageSection />
            <InfoSection currentRecipeId={initialData?.id} />
            <div className="flex flex-col gap-4">
              <MetaSection dynamicTags={dynamicTags} currentRecipeId={initialData?.id} />
            </div>
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
