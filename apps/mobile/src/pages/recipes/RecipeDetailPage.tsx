import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Button, Modal, ModalContent, ModalBody, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tabs, Tab, Spinner, toast } from '@/ui';
import { ArrowLeft, Edit, Clock, Star, Flame, Play, Info, Share, Check, Image as ImageIcon, Plus, Gauge, Timer, Minus, Carrot, ChefHat, Link as LinkIcon, Video, Tag, X, Calendar, ShoppingCart, Printer, Download, ImageDown, ChevronDown, ChevronUp, History, GitFork, Sparkles, Trash2 } from 'lucide-react';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { useMealPlanStore } from '../../store/useMealPlanStore';
import { ImageManager } from '../../lib/image-manager';
import { DEFAULT_TAGS } from '@apron/core';
import { exportToPdf, exportToPng, printRecipe } from '../../lib/exportUtils';
import { CookingModeModal } from '../../components/recipes/CookingModeModal';
import { CookingRatingModal } from '../../components/recipes/CookingRatingModal';
import { RecipeSnapshotModal } from '../../components/recipes/RecipeSnapshotModal';
import { RecipePrintTemplate } from '../../components/recipes/RecipePrintTemplate';
import { MealPlannerSelectModal } from './components/MealPlannerSelectModal';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { useTranslation } from 'react-i18next';

export function RecipeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { recipes, updateRecipe, deleteRecipe, fetchRecipes, isLoading } = useRecipeStore();
  
  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  const recipe = useMemo(() => {
    if (!id) return null;
    return recipes.find(r => r.id === id) || null;
  }, [id, recipes]);

  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [targetServingsStr, setTargetServingsStr] = useState<string>('');
  
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);
  const [isRatingModeOpen, setIsRatingModeOpen] = useState(false);
  const [snapshotData, setSnapshotData] = useState<{snapshot: any, date: string, rating?: number, notes?: string} | null>(null);
  const [isRelatedExpanded, setIsRelatedExpanded] = useState(true);

  const { addItems } = useShoppingListStore();
  const { addMealPlanEntry } = useMealPlanStore();
  const [isMealPlannerModalOpen, setIsMealPlannerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleBack = () => {
    const state = location.state as { from?: string } | null;
    if (state?.from) {
      navigate(state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/recipes');
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe?.id) return;
    try {
      await deleteRecipe(recipe.id);
      toast.success(t('common.status.deletedSuccessfully', { defaultValue: 'Đã xoá công thức thành công' }));
      navigate('/recipes', { replace: true });
    } catch (e) {
      console.error(e);
      toast.error(t('common.status.errorOccurred'));
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe?.ingredients) return;
    const items = recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: scaleQuantity(ing.quantity) || undefined,
      unit: ing.unit || undefined
    }));
    try {
      await addItems(items);
      toast.success(t('recipes.detail.addedToShoppingSuccess'));
    } catch (e) {
      console.error(e);
      toast.error(t('common.status.errorOccurred'));
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    let text = `🍳 ${recipe.title}\n\n`;
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      text += `🛒 ${t('recipes.detail.ingredients')}:\n`;
      recipe.ingredients.forEach(ing => {
        text += `- ${scaleQuantity(ing.quantity) || ''} ${ing.unit || ''} ${ing.name}\n`;
      });
      text += `\n`;
    }
    if (recipe.steps && recipe.steps.length > 0) {
      text += `📝 ${t('recipes.detail.instructions')}:\n`;
      recipe.steps.forEach((step, idx) => {
        text += `${idx + 1}. ${step.instruction}\n`;
      });
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('recipes.detail.copiedRecipeSuccess'));
    } catch (e) {
      console.error(e);
      toast.error(t('common.status.errorOccurred'));
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPng = async () => {
    if (!recipe) return;
    try {
      setIsExporting(true);
      await exportToPng('recipe-print-template', `${recipe.title}.png`);
      toast.success('Đã xuất ảnh công thức!');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất ảnh công thức. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!recipe) return;
    try {
      setIsExporting(true);
      await exportToPdf('recipe-print-template', `${recipe.title}.pdf`);
      toast.success('Đã xuất PDF công thức!');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất PDF công thức. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printRecipe();
  };

  const handleAddToMealPlan = async (date: string, slotId: string) => {
    if (!recipe) return;
    try {
      await addMealPlanEntry(date, {
        recipe_id: recipe.id!,
        meal_type: slotId,
      });
      toast.success(t('recipes.detail.addedToMealPlanSuccess'));
    } catch (e) {
      console.error(e);
      toast.error(t('common.status.errorOccurred'));
    }
  };

  const handleCookingComplete = async (rating: number, notes: string, action: 'done' | 'edit') => {
    if (!recipe) return;
    const { cooking_history: _cooking_history, ...recipeSnapshot } = recipe;
    
    const newHistory = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      rating,
      notes,
      recipe_snapshot: recipeSnapshot
    };
    
    const updatedRecipe = {
      ...recipe,
      cooking_history: [...(recipe.cooking_history || []), newHistory].slice(-10)
    };
    
    await updateRecipe(updatedRecipe);
    
    setIsRatingModeOpen(false);
    
    if (action === 'edit') {
      navigate(`/recipes/new?edit=${recipe.id}`);
    }
  };

  const handleCookingFinish = () => {
    setIsCookingModeOpen(false);
    setIsRatingModeOpen(true);
  };

  const getAverageRating = () => {
    if (!recipe?.cooking_history || recipe.cooking_history.length === 0) return 0;
    const sum = recipe.cooking_history.reduce((acc: number, curr: any) => acc + curr.rating, 0);
    return Number((sum / recipe.cooking_history.length).toFixed(1));
  };
  const averageRating = getAverageRating();

  const targetServings = useMemo(() => {
    const val = parseFloat(targetServingsStr);
    return isNaN(val) || val <= 0 ? 1 : val;
  }, [targetServingsStr]);

  const { isOpen: isLightboxOpen, onOpen: openLightbox, onClose: closeLightbox } = useDisclosure();
  const [lightboxData, setLightboxData] = useState<{ type: 'image' | 'video', url: string } | null>(null);

  const handleOpenLightbox = (type: 'image' | 'video', url: string) => {
    setLightboxData({ type, url });
    openLightbox();
  };

  const scaleQuantity = (q: any) => {
    if (typeof q !== 'number') return q;
    if (!recipe) return q;
    const ratio = targetServings / recipe.servings;
    return Math.round(q * ratio * 10) / 10;
  };

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    if (recipe) {
      setCurrentDisplayImage(recipe.image_url || (recipe.images && recipe.images.length > 0 ? recipe.images[0] : null));
      setTargetServingsStr(recipe.servings?.toString() || '1');
    }
  }, [recipe]);

  const toggleIngredient = (index: number) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCheckedIngredients(newSet);
  };

  // Group ingredients by group field
  const ingredientGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (!recipe?.ingredients) return groups;
    recipe.ingredients.forEach((ing) => {
      const g = ing.group || 'Chung';
      if (!groups[g]) groups[g] = [];
      groups[g].push(ing);
    });
    return groups;
  }, [recipe?.ingredients]);

  // Group steps
  const stepGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const stepsSource = recipe?.steps || (recipe as any)?.instructions;
    if (!stepsSource) return groups;
    stepsSource.forEach((step: any) => {
      const g = step.group || step.group_name || 'Các bước thực hiện';
      if (!groups[g]) groups[g] = [];
      
      // Map mock data format to standard format
      let instructionText = step.instruction;
      if (!instructionText) {
        instructionText = step.title ? `<b>${step.title}</b><br/>${step.content}` : step.content;
      }
      
      groups[g].push({
        ...step,
        instruction: instructionText
      });
    });
    return groups;
  }, [recipe?.steps, (recipe as any)?.instructions]);

  const variants = useMemo(() => {
    if (!recipe) return [];
    if (recipe.parent_id) {
      const parent = recipes.find(r => r.id === recipe.parent_id);
      const siblings = recipes.filter(r => r.parent_id === recipe.parent_id);
      const list = [parent, ...siblings].filter(Boolean) as typeof recipes;
      const seen = new Set<string>();
      return list.filter(item => {
        if (!item?.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } else {
      const children = recipes.filter(r => r.parent_id === recipe.id);
      if (children.length === 0) return [];
      return [recipe, ...children];
    }
  }, [recipe, recipes]);

  // Danh sách biến thể trong đó Bản gốc LUÔN xếp đầu tiên
  const sortedVariants = useMemo(() => {
    if (!recipe) return [];
    let original: typeof recipe | undefined;
    let variantsList: typeof recipes = [];

    if (recipe.parent_id) {
      original = recipes.find(r => r.id === recipe.parent_id);
      variantsList = recipes.filter(r => r.parent_id === recipe.parent_id);
    } else {
      original = recipe;
      variantsList = recipes.filter(r => r.parent_id === recipe.id);
    }

    if (variantsList.length === 0) return [];

    const list = [original, ...variantsList].filter(Boolean) as typeof recipes;
    const seen = new Set<string>();
    return list.filter(item => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [recipe, recipes]);

  const allSteps = useMemo(() => Object.values(stepGroups).flat(), [stepGroups]);

  if (!recipe) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Spinner size="lg" color="primary" />
          <p className="text-default-500 text-sm">{t('common.status.loading')}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">{t('recipes.empty.title')}</h2>
        <Button className="mt-4" onPress={() => navigate('/recipes')}>{t('common.actions.back')}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full xl:pt-6 xl:pb-12 xl:px-8 animate-in fade-in duration-300 gap-0 xl:gap-8 bg-background xl:bg-transparent min-h-screen xl:min-h-0 pb-32 xl:pb-12 text-foreground" id="recipe-content">
      {variants.length > 0 && (
        <div className="hidden xl:flex w-full justify-center mb-[-1rem]">
          <Tabs 
            aria-label="Biến thể công thức"
            selectedKey={recipe.id}
            onSelectionChange={(key) => navigate(`/recipes/${key}`)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary font-medium"
            }}
          >
            {variants.map(v => (
              <Tab 
                key={v.id!} 
                title={
                  <div className="flex items-center gap-1.5">
                    {!v.parent_id ? <Sparkles className="w-3.5 h-3.5 text-amber-500" /> : <GitFork className="w-3.5 h-3.5 text-secondary-500" />}
                    <span>{!v.parent_id ? `⭐ ${v.title}` : v.title}</span>
                  </div>
                }
              />
            ))}
          </Tabs>
        </div>
      )}

      {/* --- MOBILE HERO --- */}
      <div className="flex xl:hidden flex-col w-full relative">
        <div className="relative w-full aspect-square bg-default-100 overflow-hidden">
           {recipe.images && recipe.images.length > 0 ? (
             <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" onScroll={(e) => {
                 const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
                 if (recipe.images?.[idx]) setCurrentDisplayImage(recipe.images[idx]);
             }}>
               {recipe.images.map((img, idx) => (
                 <div key={idx} className="w-full h-full shrink-0 snap-center relative" onClick={() => handleOpenLightbox('image', img)}>
                   <img src={ImageManager.getAssetUrl(img)} className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
           ) : recipe.image_url ? (
             <img src={ImageManager.getAssetUrl(recipe.image_url)} className="w-full h-full object-cover" onClick={() => handleOpenLightbox('image', recipe.image_url!)} />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-default-300">
               <ImageIcon className="w-12 h-12" />
             </div>
           )}

           {recipe.images && recipe.images.length > 1 && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md">
               {recipe.images.map((img, idx) => (
                 <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentDisplayImage === img ? 'bg-white w-3' : 'bg-white/50'}`} />
               ))}
             </div>
           )}


           <div className="absolute top-4 left-4 z-10">
             <Button 
               isIconOnly 
               className="bg-background/80 dark:bg-black/60 backdrop-blur-md shadow-md text-foreground rounded-full w-10 h-10 min-w-0 p-0 flex items-center justify-center border border-white/20 dark:border-white/10 hover:bg-background active:scale-95 transition-all"
               onPress={handleBack}
                aria-label={t('common.actions.back')}
             >
               <ArrowLeft className="w-5 h-5" />
             </Button>
           </div>

           <div className="absolute top-4 right-4 z-10">
             <Dropdown>
               <DropdownTrigger>
                 <Button 
                  isIconOnly 
                  className="bg-background/80 dark:bg-black/60 backdrop-blur-md shadow-md text-foreground rounded-full w-10 h-10 min-w-0 p-0 flex items-center justify-center border border-white/20 dark:border-white/10 hover:bg-background active:scale-95 transition-all"
                  aria-label={t('common.actions.more')}
                >
                   <div className="flex gap-1">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      <div className="w-1 h-1 bg-current rounded-full" />
                      <div className="w-1 h-1 bg-current rounded-full" />
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem key="cook" startContent={<Play className="w-4 h-4"/>} onPress={() => setIsCookingModeOpen(true)}>{t('recipes.detail.cookMode')}</DropdownItem>
                  <DropdownItem key="plan" startContent={<Calendar className="w-4 h-4"/>} onPress={() => setIsMealPlannerModalOpen(true)}>{t('recipes.actions.addToMealPlan')}</DropdownItem>
                  <DropdownItem key="cart" startContent={<ShoppingCart className="w-4 h-4"/>} onPress={handleAddToShoppingList}>{t('recipes.detail.addToShopping')}</DropdownItem>
                  <DropdownItem key="share" startContent={<Share className="w-4 h-4"/>} onPress={handleShare}>{t('common.actions.share')}</DropdownItem>
                  <DropdownItem key="edit" startContent={<Edit className="w-4 h-4"/>} onPress={() => navigate(`/recipes/new?edit=${recipe.id}`, { state: { from: '/recipes' } })}>{t('common.actions.edit')}</DropdownItem>
                  <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => setIsDeleteModalOpen(true)}>{t('common.actions.delete')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
         </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-foreground flex-1 min-w-0">
              {recipe.title}
            </h1>
            {sortedVariants.length > 1 && (
              <div className="shrink-0 pt-0.5">
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <button 
                      type="button"
                      className="w-7 h-7 rounded-full bg-default-100 dark:bg-default-100/70 hover:bg-default-200 text-default-600 hover:text-foreground active:scale-95 transition-all inline-flex items-center justify-center shrink-0 border border-divider/40"
                      aria-label="Danh sách biến thể"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Danh sách biến thể công thức"
                    onAction={(key) => navigate(`/recipes/${key}`)}
                    className="min-w-[220px] max-w-[280px]"
                  >
                    {sortedVariants.map((v, index) => {
                      const isCurrent = v.id === recipe.id;
                      const isOriginal = index === 0;
                      return (
                        <DropdownItem
                          key={v.id!}
                          textValue={v.title}
                          className={isCurrent ? 'text-primary font-semibold' : ''}
                          startContent={
                            isOriginal ? (
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 mr-1" />
                            ) : null
                          }
                          endContent={
                            isCurrent ? (
                              <Check className="w-4 h-4 text-primary shrink-0 stroke-[2.5]" />
                            ) : null
                          }
                        >
                          <span className="text-sm line-clamp-1">{v.title}</span>
                        </DropdownItem>
                      );
                    })}
                  </DropdownMenu>
                </Dropdown>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-1">
            <div className="flex flex-row items-center gap-1.5 text-default-600 dark:text-default-400">
              <Gauge className="w-4 h-4 shrink-0 text-primary" />
              <span className="text-[14px] leading-none font-medium">{recipe.difficulty || '-'}</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-600 dark:text-default-400">
              <Flame className="w-4 h-4 shrink-0 text-danger" />
              <span className="text-[14px] leading-none font-medium">{recipe.calories || '-'} kcal</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-600 dark:text-default-400">
              <Clock className="w-4 h-4 shrink-0 text-secondary" />
              <span className="text-[14px] leading-none font-medium">{recipe.prep_time || 0}p</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-600 dark:text-default-400">
              <Timer className="w-4 h-4 shrink-0 text-warning" />
              <span className="text-[14px] leading-none font-medium">{recipe.cook_time || 0}p</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-600 dark:text-default-400">
              <Star className={`w-4 h-4 shrink-0 ${averageRating > 0 ? 'fill-warning-400 text-warning-400' : 'text-default-400'}`} />
              <span className="text-[14px] leading-none font-semibold text-foreground">
                {averageRating > 0 ? averageRating : 'N/A'}
              </span>
    

          {/* Quick Actions row on mobile */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-divider/40 overflow-x-auto no-scrollbar">
            <Button size="sm" color="primary" variant="solid" className="font-semibold text-xs shrink-0" startContent={<Play className="w-3.5 h-3.5"/>} onPress={() => setIsCookingModeOpen(true)}>
              {t('recipes.detail.cookMode')}
            </Button>
            <Button size="sm" variant="flat" className="font-semibold text-xs border border-default-200 shrink-0" startContent={<Calendar className="w-3.5 h-3.5"/>} onPress={() => setIsMealPlannerModalOpen(true)}>
              {t('recipes.actions.addToMealPlan')}
            </Button>
            <Button size="sm" variant="flat" className="font-semibold text-xs border border-default-200 shrink-0" startContent={<ShoppingCart className="w-3.5 h-3.5 text-success"/>} onPress={handleAddToShoppingList}>
              {t('recipes.detail.addToShopping')}
            </Button>
            <Button 
              size="sm" 
              isIconOnly 
              variant="flat" 
              className="border border-default-200 text-primary shrink-0" 
              title={t('common.actions.edit')}
              onPress={() => navigate(`/recipes/new?edit=${recipe.id}`, { state: { from: '/recipes' } })}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button 
              size="sm" 
              isIconOnly 
              variant="flat" 
              color="danger" 
              className="border border-danger-200 dark:border-danger-900/50 text-danger shrink-0" 
              title={t('common.actions.delete')}
              onPress={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE TABS --- */}
      <div className="flex xl:hidden w-full flex-col">
        <Tabs 
          aria-label="Mobile Tabs" 
          fullWidth
          variant="solid"
          color="primary"
          size="sm"
          classNames={{
            base: "w-full sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 py-1.5 border-b border-divider/40 shadow-xs",
            tabList: "bg-default-100/80 dark:bg-default-50/50 p-0.5 rounded-xl gap-1 w-full border border-divider/20",
            tab: "h-9 rounded-lg font-medium text-default-600 data-[selected=true]:text-primary-foreground data-[selected=true]:font-semibold transition-all text-sm",
            cursor: "bg-primary rounded-lg shadow-xs",
            panel: "p-0",
          }}
        >
          <Tab 
            key="ingredients" 
            title={
              <div className="flex items-center justify-center gap-1.5">
                <Carrot className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm tracking-tight">{t('recipes.detail.ingredients')}</span>
              </div>
            }
          >
             <div className="p-4 pt-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Carrot className="w-5 h-5 text-success" /> {t('recipes.detail.ingredients')}
                  </h2>
                  <div className="flex items-center gap-2 bg-default-100 dark:bg-default-100/70 border border-default-200/50 dark:border-divider px-2 py-1 rounded-full text-sm font-medium">
                    <span className="text-default-500 mr-1 hidden sm:inline ml-2">{t('recipes.detail.scaleServings')}</span>
                    <div className="w-6 h-6 flex items-center justify-center bg-content1 dark:bg-default-200 rounded-full cursor-pointer shadow-xs text-foreground active:text-primary transition-all shrink-0 border border-divider/40 active:scale-95" onClick={() => setTargetServingsStr(Math.max(0.1, targetServings - 1).toString())}><Minus className="w-3 h-3" /></div>
                    <input type="number" className="w-12 text-center bg-transparent border-none outline-none text-sm font-bold p-0 text-foreground" value={targetServingsStr} onChange={(e) => setTargetServingsStr(e.target.value)} />
                    <div className="w-6 h-6 flex items-center justify-center bg-content1 dark:bg-default-200 rounded-full cursor-pointer shadow-xs text-foreground active:text-primary transition-all shrink-0 border border-divider/40 active:scale-95" onClick={() => setTargetServingsStr((targetServings + 1).toString())}><Plus className="w-3 h-3" /></div>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {Object.entries(ingredientGroups).map(([group, ingredients], gIndex) => (
                    <div key={group} className="flex flex-col gap-3">
                      {group !== 'Chung' && <h3 className="font-bold text-sm text-default-500 dark:text-default-400 uppercase tracking-wider">{group}</h3>}
                      <div className="flex flex-col gap-3">
                        {ingredients.map((ing, i) => {
                          const globalIndex = gIndex * 100 + i;
                          const isChecked = checkedIngredients.has(globalIndex);
                          return (
                            <div key={globalIndex} className="flex items-start gap-3.5 group cursor-pointer py-2" onClick={() => toggleIngredient(globalIndex)}>
                              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-default-300 dark:border-default-600 group-hover:border-primary'}`}>{isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}</div>
                              <div className={`flex items-start justify-between flex-1 gap-3 min-w-0 transition-opacity ${isChecked ? 'opacity-50 line-through' : ''}`}>
                                <span className="font-semibold text-foreground text-base sm:text-lg leading-snug break-words flex-1">{ing.name}</span>
                                <span className="text-base sm:text-lg font-bold text-default-600 dark:text-default-300 shrink-0 text-right ml-2 whitespace-nowrap mt-0.5">
                                  {scaleQuantity(ing.quantity)} {ing.unit}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </Tab>
          <Tab 
            key="instructions" 
            title={
              <div className="flex items-center justify-center gap-1.5">
                <ChefHat className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm tracking-tight">{t('recipes.detail.instructions')}</span>
              </div>
            }
          >
             <div className="p-4 pt-3">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <ChefHat className="w-5 h-5 text-success" /> {t('recipes.detail.instructions')}
                </h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(stepGroups).map(([group, steps]) => (
                    <div key={group} className="flex flex-col">
                      {group !== 'Các bước thực hiện' && (
                        <div className="flex items-center gap-2 mb-3.5 mt-2 first:mt-0">
                          <span className="w-2-h-2 rounded-full bg-primary shrink-0" />
                          <h3 className="text-base font-bold text-foreground tracking-tight">{group}</h3>
                        </div>
                      )}
                      <div className="flex flex-col">
                        {steps.map((step, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-9 h-9 rounded-full bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-300 border border-primary/20 font-bold flex items-center justify-center shrink-0 text-base shadow-2xs">{i + 1}</div>
                              {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-default-200 dark:bg-divider my-2" />}
                            </div>
                            <div className="flex flex-col gap-3 pb-7 pt-1 flex-1">
                              <div className="text-foreground text-base sm:text-lg leading-relaxed prose prose-base dark:prose-invert max-w-none prose-p:my-1.5 prose-p:text-base sm:prose-p:text-lg prose-ul:my-1 font-normal" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                              {((step.images && step.images.length > 0) || step.image_url) && (
                                <div className="mt-1">
                                  {step.images && step.images.length > 0 ? (
                                    <div className={`grid gap-2 ${step.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                      {step.images.map((imgUrl: string, imgIdx: number) => (
                                        <div key={imgIdx} className="aspect-video rounded-xl overflow-hidden relative cursor-pointer border border-default-200/60 dark:border-divider/50 shadow-xs active:scale-[0.98] transition-all bg-default-100" onClick={() => handleOpenLightbox('image', imgUrl)}>
                                          <img src={ImageManager.getAssetUrl(imgUrl)} className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  ) : step.image_url ? (
                                    <div className="w-full sm:w-64 aspect-video rounded-xl overflow-hidden relative cursor-pointer border border-default-200/60 dark:border-divider/50 shadow-xs active:scale-[0.98] transition-all bg-default-100" onClick={() => handleOpenLightbox('image', step.image_url!)}>
                                      <img src={ImageManager.getAssetUrl(step.image_url)} className="w-full h-full object-cover" />
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </Tab>
          <Tab 
            key="info" 
            title={
              <div className="flex items-center justify-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm tracking-tight">{t('recipes.detail.overview')}</span>
              </div>
            }
          >
             <div className="p-4 pt-3 flex flex-col gap-6">
                {recipe.notes && (
                  <div className="flex flex-col gap-2">
                     <h3 className="font-bold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-warning-500" /> {t('recipes.detail.notes')}</h3>
                     <div 
                       className="text-sm leading-relaxed text-amber-950 dark:text-amber-100 bg-amber-500/10 dark:bg-amber-500/15 p-4 rounded-xl border border-amber-500/30 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 [&_*]:text-amber-950 dark:[&_*]:text-amber-100 [&_strong]:text-amber-950 dark:[&_strong]:text-amber-50 [&_b]:text-amber-950 dark:[&_b]:text-amber-50 [&_li]:text-amber-950/90 dark:[&_li]:text-amber-100/90" 
                       dangerouslySetInnerHTML={{ __html: recipe.notes }} 
                     />
                  </div>
                )}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                     <h3 className="font-bold text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-default-500" /> {t('recipes.filter.tags')}</h3>
                     <div className="flex flex-wrap gap-2">
                       {recipe.tags.map(tagId => {
                          const t = DEFAULT_TAGS.find(x => x.id === tagId || x.slug === tagId);
                          const displayName = t ? t.name : tagId.replace(/-/g, ' ');
                          return <span key={tagId} className="px-3 py-1 bg-default-100 dark:bg-default-100/70 border border-default-200/50 dark:border-divider rounded-full text-sm font-medium text-default-700 dark:text-default-300 capitalize">{displayName}</span>;
                       })}
                     </div>
                  </div>
                )}
                {recipe.video_url && (
                   <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-sm flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Video</h3>
                      <div className="w-full aspect-video bg-default-100 rounded-2xl flex items-center justify-center overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox('video', recipe.video_url!)}>
                         {currentDisplayImage && <img src={ImageManager.getAssetUrl(currentDisplayImage)} className="w-full h-full object-cover blur-sm opacity-50" />}
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center"><Play className="w-6 h-6 ml-1 fill-current" /></div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Mobile Cooking History */}
                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" /> {t('recipes.detail.ratingHistory')}
                      </h3>
                      {recipe.cooking_history && recipe.cooking_history.length > 0 && (
                        <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {recipe.cooking_history.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col mt-1">
                      {recipe.cooking_history && recipe.cooking_history.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {recipe.cooking_history.slice().reverse().map((history) => (
                            <div 
                              key={history.id} 
                              className={`p-3 -mx-3 flex flex-col gap-2 rounded-xl transition-colors ${history.recipe_snapshot ? 'cursor-pointer hover:bg-default-100 dark:hover:bg-default-100/50 active:bg-default-100' : ''}`}
                              onClick={() => {
                                if (history.recipe_snapshot) {
                                  setSnapshotData({ 
                                    snapshot: history.recipe_snapshot, 
                                    date: history.date,
                                    rating: history.rating,
                                    notes: history.notes
                                  });
                                }
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-default-500 font-medium">
                                  {new Date(history.date).toLocaleDateString(undefined, { 
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < history.rating ? 'fill-current text-warning-400' : 'text-default-300 dark:text-default-600'}`} />
                                  ))}
                                </div>
                              </div>
                              {history.notes && (
                                <p className="text-sm text-default-700 dark:text-default-300 italic border-l-2 border-default-300 dark:border-default-700 pl-3">{history.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-default-400 bg-default-50 dark:bg-default-100/30 border border-dashed border-default-200 dark:border-divider rounded-xl">
                          <History className="w-5 h-5" />
                          <span className="text-sm text-default-400">{t('recipes.detail.noCookingHistory')}</span>
                        </div>
                      )}
                    </div>
                 </div>
             </div>
          </Tab>
        </Tabs>
      </div>

      <div className="hidden xl:flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column (Hero + Content) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
          <div className="flex items-center">
            <Button
              variant="light"
              size="sm"
              onPress={handleBack}
              startContent={<ArrowLeft className="w-4 h-4" />}
              className="text-default-600 dark:text-default-400 hover:text-foreground font-medium -ml-2"
            >
              {t('recipes.detail.backToList')}
            </Button>
          </div>
          
          {/* Intro Section (Split Image / Details) */}
          <div className="app-card flex flex-col xl:flex-row gap-8 w-full p-6">
            {/* Image */}
            <div className="w-full xl:w-2/5 shrink-0">
              <div className="flex gap-3 items-start">
                {/* Thumbnails (Vertical) */}
                {recipe.images && recipe.images.length > 1 && (
                  <div className="flex flex-col gap-3 overflow-y-auto scrollbar-hide shrink-0 max-h-[400px] p-1">
                    {recipe.images.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden cursor-pointer shrink-0 transition-all ${currentDisplayImage === img ? 'ring-2 ring-primary ring-offset-2 opacity-100 shadow-sm' : 'opacity-50 hover:opacity-100 hover:scale-[1.02]'}`}
                        onClick={() => setCurrentDisplayImage(img)}
                      >
                        <img src={ImageManager.getAssetUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div 
                  className="flex-1 aspect-square rounded-3xl overflow-hidden bg-default-100 shadow-none relative cursor-pointer group"
                  onClick={() => currentDisplayImage && handleOpenLightbox('image', currentDisplayImage)}
                >
                  {currentDisplayImage ? (
                    <img 
                      src={ImageManager.getAssetUrl(currentDisplayImage)} 
                      alt={recipe.title}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-default-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Details */}
            <div className="flex flex-col flex-1 gap-5">
               <div className="flex flex-col gap-2.5">
                 <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-foreground flex items-center gap-3">
                   <span>{recipe.title}</span>
                 </h1>
               </div>
               
               <div className="flex items-center gap-2 text-default-600 font-medium">
                 <div className="flex gap-1 text-warning-400">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-4 h-4 ${averageRating > 0 && i < Math.round(averageRating) ? 'fill-current text-warning-400' : 'text-default-300'}`} />
                   ))}
                 </div>
                 {averageRating > 0 ? (
                   <span className="text-foreground font-bold">{averageRating}</span>
                 ) : (
                   <span className="text-default-500 font-medium text-sm italic">{t('common.status.empty')}</span>
                 )}
               </div>
               
               <div className="flex flex-wrap gap-2 mt-2">
                 <Button color="primary" variant="solid" className="font-semibold px-6" startContent={<Play className="w-4 h-4"/>} onPress={() => setIsCookingModeOpen(true)}>
                   {t('recipes.detail.cookMode')}
                 </Button>
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<Calendar className="w-4 h-4"/>} onPress={() => setIsMealPlannerModalOpen(true)}>
                   {t('recipes.actions.addToMealPlan')}
                 </Button>
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<ShoppingCart className="w-4 h-4 text-success"/>} onPress={handleAddToShoppingList}>
                   {t('recipes.detail.addToShopping')}
                 </Button>
                 
                 <Dropdown>
                   <DropdownTrigger>
                     <Button isIconOnly variant="flat" className="border border-default-200" isLoading={isExporting}>
                       <Share className="w-4 h-4" />
                     </Button>
                   </DropdownTrigger>
                   <DropdownMenu aria-label="Export Actions">
                     <DropdownItem key="copy" startContent={<Share className="w-4 h-4"/>} onPress={handleShare}>{t('common.actions.copy')}</DropdownItem>
                     <DropdownItem key="png" startContent={<ImageDown className="w-4 h-4"/>} onPress={handleExportPng}>{t('recipes.detail.exportPng')}</DropdownItem>
                     <DropdownItem key="pdf" startContent={<Download className="w-4 h-4"/>} onPress={handleExportPdf}>{t('recipes.detail.exportPdf')}</DropdownItem>
                     <DropdownItem key="print" startContent={<Printer className="w-4 h-4"/>} onPress={handlePrint}>{t('common.actions.print')}</DropdownItem>
                   </DropdownMenu>
                 </Dropdown>
                 
                 <Button 
                    isIconOnly 
                    variant="flat" 
                    className="border border-default-200 text-primary" 
                    title={t('common.actions.edit')}
                    onPress={() => navigate(`/recipes/new?edit=${recipe.id}`, { state: { from: '/recipes' } })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    isIconOnly 
                    variant="flat" 
                    color="danger" 
                    className="border border-danger-200 dark:border-danger-900/50 text-danger hover:bg-danger/10 dark:hover:bg-danger/20 dark:hover:bg-danger-900/20" 
                    title={t('common.actions.delete')}
                    onPress={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
               
               {/* Meta Stats Row instead of Notes */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">{t('recipes.filter.difficulty')}</span>
                    <span className="font-bold text-foreground">{recipe.difficulty || '-'}</span>
                  </div>
                  
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-warning/10 text-warning mb-1">
                      <Flame className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Calories</span>
                    <span className="font-bold text-foreground">{recipe.calories || '-'} kcal</span>
                  </div>
                  
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-secondary/10 text-secondary mb-1">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">{t('recipes.filter.prepTime')}</span>
                    <span className="font-bold text-foreground">{recipe.prep_time || 0} {t('common.time.minutes')}</span>
                  </div>
                  
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-success/10 text-success mb-1">
                      <Timer className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">{t('recipes.filter.cookingMethod')}</span>
                    <span className="font-bold text-foreground">{recipe.cook_time || 0} {t('common.time.minutes')}</span>
                  </div>
               </div>

               {/* Tags */}
               {recipe.tags && recipe.tags.length > 0 && (
                 <div className="flex flex-wrap items-center gap-2">
                   <div className="flex items-center gap-1.5 text-sm font-semibold text-default-500 mr-1">
                     <Tag className="w-4 h-4" /> {t('recipes.filter.tags')}:
                   </div>
                   {recipe.tags.map(tag => {
                      const t = DEFAULT_TAGS.find(x => x.id === tag || x.slug === tag || x.name.toLowerCase() === tag.toLowerCase());
                      const displayName = t ? t.name : tag;
                      return <span key={tag} className="px-3 py-1 bg-default-100 dark:bg-default-100/70 border border-default-200/50 dark:border-divider rounded-full text-sm font-medium text-default-700 dark:text-default-300">{displayName}</span>;
                   })}
                 </div>
               )}

               {/* Source */}
               {recipe.source && (
                 <div className="flex flex-wrap items-center gap-2 mt-1">
                   <div className="flex items-center gap-1.5 text-sm font-semibold text-default-500 mr-1">
                     <LinkIcon className="w-4 h-4" /> Nguồn:
                   </div>
                   <span className="text-sm font-medium text-primary active:underline cursor-pointer" onClick={() => {
                     try {
                       if (recipe.source?.startsWith('http')) {
                         window.open(recipe.source, '_blank');
                       } else {
                         window.open(`https://www.google.com/search?q=${encodeURIComponent(recipe.source!)}`, '_blank');
                       }
                     } catch {}
                   }}>
                     {recipe.source}
                   </span>
                 </div>
               )}
            </div>
          </div>

          {/* Main Content Split (Ingredients & Instructions) */}
          <div className="flex-1 min-w-0 w-full grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Ingredients */}
            <div className="app-card xl:col-span-2 flex flex-col gap-6 p-6 h-fit">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Carrot className="w-6 h-6 text-success" />
                  {t('recipes.detail.ingredients')}
                </h2>
                <div className="flex items-center gap-2 bg-default-100 dark:bg-default-100/70 border border-default-200/50 dark:border-divider px-2 py-1 rounded-full text-sm font-medium">
                  <span className="text-default-500 mr-1 hidden sm:inline ml-2">{t('recipes.detail.scaleServings')}</span>
                  <div 
                    className="w-6 h-6 flex items-center justify-center bg-content1 dark:bg-default-200 rounded-full cursor-pointer shadow-xs text-foreground active:text-primary transition-all shrink-0 border border-divider/40 active:scale-95"
                    onClick={() => {
                      const val = Math.max(0.1, targetServings - 1);
                      setTargetServingsStr(Number.isInteger(val) ? val.toString() : val.toFixed(1));
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="w-12 text-center bg-transparent border-none outline-none text-sm font-bold p-0 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={targetServingsStr}
                    onChange={(e) => setTargetServingsStr(e.target.value)}
                  />
                  <div 
                    className="w-6 h-6 flex items-center justify-center bg-content1 dark:bg-default-200 rounded-full cursor-pointer shadow-xs text-foreground active:text-primary transition-all shrink-0 border border-divider/40 active:scale-95"
                    onClick={() => {
                      const val = targetServings + 1;
                      setTargetServingsStr(Number.isInteger(val) ? val.toString() : val.toFixed(1));
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-5">
                {Object.entries(ingredientGroups).map(([group, ingredients], gIndex) => (
                  <div key={group} className="flex flex-col gap-3">
                    {group !== 'Chung' && <h3 className="font-bold text-sm text-default-400 uppercase tracking-wider">{group}</h3>}
                    
                    <div className="flex flex-col gap-3">
                      {ingredients.map((ing, i) => {
                        const globalIndex = gIndex * 100 + i;
                        const isChecked = checkedIngredients.has(globalIndex);
                        
                        return (
                          <div 
                            key={globalIndex}
                            className="flex items-start gap-3.5 group cursor-pointer py-2"
                            onClick={() => toggleIngredient(globalIndex)}
                          >
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-default-300 dark:border-default-600 group-hover:border-primary'}`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </div>
                            <div className={`flex items-start justify-between flex-1 gap-3 min-w-0 transition-opacity ${isChecked ? 'opacity-50 line-through' : ''}`}>
                              <span className="font-semibold text-foreground text-base lg:text-lg leading-snug break-words flex-1">{ing.name}</span>
                              <span className="text-base lg:text-lg font-bold text-default-600 dark:text-default-300 shrink-0 text-right ml-2 whitespace-nowrap mt-0.5">
                                {scaleQuantity(ing.quantity)} {ing.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking Instructions (Timeline format) */}
            <div className="app-card xl:col-span-3 flex flex-col gap-6 p-6">
               <h2 className="text-2xl font-bold flex items-center gap-2">
                 <ChefHat className="w-6 h-6 text-success" />
                 {t('recipes.detail.instructions')}
               </h2>
               
               <div className="flex flex-col gap-2">
                 {Object.entries(stepGroups).map(([group, steps]) => (
                   <div key={group} className="flex flex-col">
                     {group !== 'Các bước thực hiện' && (
                       <div className="flex items-center gap-2 mb-4 mt-2 first:mt-0">
                         <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                         <h3 className="text-lg font-bold text-foreground">{group}</h3>
                       </div>
                     )}
                     
                     <div className="flex flex-col">
                       {steps.map((step, i) => (
                         <div key={i} className="flex gap-4">
                           <div className="flex flex-col items-center">
                             <div className="w-9 h-9 rounded-full bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-300 border border-primary/20 font-bold flex items-center justify-center shrink-0 text-base">
                               {i + 1}
                             </div>
                             {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-default-200 dark:bg-divider my-2" />}
                           </div>
                           <div className="flex flex-col gap-3 pb-7 pt-1 flex-1">
                             <div 
                               className="text-foreground leading-relaxed prose prose-base dark:prose-invert max-w-none prose-p:my-1.5 prose-p:text-base lg:prose-p:text-lg prose-ul:my-1 prose-ol:my-1 font-normal text-base lg:text-lg"
                               dangerouslySetInnerHTML={{ __html: step.instruction }}
                             />
                             
                             {/* Render Images if available */}
                             {((step.images && step.images.length > 0) || step.image_url) && (
                               <div className="flex flex-wrap gap-2 mt-2">
                                 {step.images && step.images.length > 0 ? (
                                   step.images.map((imgUrl: string, imgIdx: number) => (
                                     <div 
                                       key={imgIdx} 
                                       className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative group cursor-pointer bg-default-100"
                                       onClick={() => handleOpenLightbox('image', imgUrl)}
                                     >
                                       <img 
                                         src={ImageManager.getAssetUrl(imgUrl)} 
                                         alt={`Bước ${i + 1} hình ${imgIdx + 1}`}
                                         className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                       />
                                     </div>
                                   ))
                                 ) : step.image_url ? (
                                   <div 
                                     className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative group cursor-pointer bg-default-100"
                                     onClick={() => handleOpenLightbox('image', step.image_url!)}
                                   >
                                     <img 
                                       src={ImageManager.getAssetUrl(step.image_url)} 
                                       alt={`Bước ${i + 1}`}
                                       className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                     />
                                   </div>
                                 ) : null}
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col">
          <div className="app-card p-4 flex flex-col w-full">
            <Tabs aria-label="Recipe Sidebar Tabs" color="primary" variant="underlined" fullWidth classNames={{ cursor: "w-full bg-primary", tabList: "w-full relative rounded-none p-0 border-b border-default-200", tab: "px-0 h-12" }}>
              
              <Tab key="overview" title={<span className="text-base font-medium">{t('recipes.detail.overview')}</span>}>
                <div className="flex flex-col divide-y divide-default-100 mt-2">
                  {/* Video */}
                  {recipe.video_url && (
                     <div className="py-5 first:pt-2 last:pb-0 flex flex-col gap-4">
                        <h3 className="font-bold text-base flex items-center gap-2"><Video className="w-5 h-5 text-primary" /> Video</h3>
                        <div 
                          className="w-full aspect-video bg-default-100 rounded-2xl flex items-center justify-center overflow-hidden relative cursor-pointer group"
                          onClick={() => handleOpenLightbox('video', recipe.video_url!)}
                        >
                           {currentDisplayImage && (
                             <img src={ImageManager.getAssetUrl(currentDisplayImage)} className="w-full h-full object-cover blur-sm opacity-50 group-hover:opacity-40 transition-opacity" />
                           )}
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-6 h-6 ml-1 fill-current" />
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Related Recipes */}
                  {recipe.related_recipes && recipe.related_recipes.length > 0 && (
                     <div className="py-5 first:pt-2 last:pb-0 flex flex-col gap-4">
                        <div 
                          className="flex justify-between items-center cursor-pointer group"
                          onClick={() => setIsRelatedExpanded(!isRelatedExpanded)}
                        >
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-primary" /> {t('recipes.detail.relatedRecipes')}
                          </h3>
                          <div className="p-1 rounded-full active:bg-default-100 transition-colors">
                            {isRelatedExpanded ? (
                              <ChevronUp className="w-5 h-5 text-default-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-default-400" />
                            )}
                          </div>
                        </div>
                        {isRelatedExpanded && (
                          <div className="flex flex-col gap-2">
                            {recipe.related_recipes.map(rel => {
                               const extra = recipes.find(r => r.id === rel.id);
                               return (
                               <div 
                                 key={rel.id} 
                                 className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-default-100 cursor-pointer transition-colors"
                                 onClick={() => navigate(`/recipes/${rel.id}`)}
                               >
                                  <div className="w-12 h-12 rounded-lg bg-default-200 overflow-hidden shrink-0">
                                     {rel.image_url && <img src={ImageManager.getAssetUrl(rel.image_url)} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                    <span className="font-medium text-sm line-clamp-2 leading-tight">{rel.title}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-default-500 mt-1">
                                      {extra?.taste_score ? (
                                        <span className="flex items-center gap-0.5" title={t('recipes.filter.tasteScore', 'Đánh giá')}><Star className="w-3 h-3 text-warning" />{extra.taste_score}</span>
                                      ) : null}
                                      {extra?.calories ? (
                                        <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{extra.calories}</span>
                                      ) : null}
                                      {extra?.difficulty ? (
                                        <span className="flex items-center gap-0.5" title={t('recipes.filter.difficulty')}><ChefHat className="w-3 h-3 text-primary" />{extra.difficulty}</span>
                                      ) : null}
                                    </div>
                                  </div>
                               </div>
                               );
                            })}
                          </div>
                        )}
                     </div>
                  )}

                  {/* Notes */}
                  {recipe.notes && (
                    <div className="py-5 first:pt-2 last:pb-0 flex flex-col gap-3">
                       <h3 className="font-bold text-base flex items-center gap-2"><Info className="w-5 h-5 text-warning-500" /> {t('recipes.detail.notes')}</h3>
                       <div 
                         className="text-sm leading-relaxed text-amber-950 dark:text-amber-100 bg-amber-500/10 dark:bg-amber-500/15 p-4 rounded-2xl border border-amber-500/30 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 [&_*]:text-amber-950 dark:[&_*]:text-amber-100 [&_strong]:text-amber-950 dark:[&_strong]:text-amber-50 [&_b]:text-amber-950 dark:[&_b]:text-amber-50 [&_li]:text-amber-950/90 dark:[&_li]:text-amber-100/90"
                         dangerouslySetInnerHTML={{ __html: recipe.notes }}
                       />
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="history" title={
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">{t('recipes.detail.ratingHistory')}</span>
                  {recipe.cooking_history && recipe.cooking_history.length > 0 && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                      {recipe.cooking_history.length}
                    </span>
                  )}
                </div>
              }>
                <div className="flex flex-col mt-2">
                  {recipe.cooking_history && recipe.cooking_history.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {recipe.cooking_history.slice().reverse().map((history) => (
                        <div 
                          key={history.id} 
                          className={`p-3 -mx-3 flex flex-col gap-2 rounded-xl transition-colors ${history.recipe_snapshot ? 'cursor-pointer hover:bg-default-100 dark:hover:bg-default-100/50' : ''}`}
                          onClick={() => {
                            if (history.recipe_snapshot) {
                              setSnapshotData({ 
                                snapshot: history.recipe_snapshot, 
                                date: history.date,
                                rating: history.rating,
                                notes: history.notes
                              });
                            }
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-default-500 font-medium">
                              {new Date(history.date).toLocaleDateString(undefined, { 
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <div className="flex gap-1 text-warning-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < history.rating ? 'fill-current text-warning-400' : 'text-default-300 dark:text-default-600'}`} />
                              ))}
                            </div>
                          </div>
                          {history.notes && (
                            <p className="text-default-700 dark:text-default-300 text-sm whitespace-pre-wrap">{history.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-default-500">{t('recipes.detail.noCookingHistory')}</p>
                    </div>
                  )}
                </div>
              </Tab>

            </Tabs>
          </div>
        </div>
      </div>

      <Modal 
        size="5xl" 
        isOpen={isLightboxOpen} 
        onClose={closeLightbox} 
        placement="center" 
        classNames={{ base: "bg-transparent shadow-none" }} 
        backdrop="blur"
        hideCloseButton
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="p-0 overflow-hidden rounded-3xl flex items-center justify-center relative">
               <Button isIconOnly className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full active:bg-black/70" onPress={onClose}>
                 <X className="w-5 h-5"/>
               </Button>
               {lightboxData?.type === 'image' && (
                 <img src={ImageManager.getAssetUrl(lightboxData.url)} className="w-full max-h-[85vh] object-contain rounded-xl bg-black/20" />
               )}
               {lightboxData?.type === 'video' && (
                 <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                    {(() => {
                      const ytMatch = lightboxData.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                      if (ytMatch && ytMatch[1]) {
                        return (
                          <iframe 
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        );
                      }
                      return (
                        <video className="w-full h-full object-contain" controls autoPlay>
                          <source src={lightboxData.url} />
                        </video>
                      );
                    })()}
                 </div>
               )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      {/* Cooking Mode Modal */}
      <CookingModeModal 
        isOpen={isCookingModeOpen}
        onClose={() => setIsCookingModeOpen(false)}
        recipe={recipe}
        allSteps={allSteps}
        checkedIngredients={checkedIngredients}
        toggleIngredient={toggleIngredient}
        scaleQuantity={scaleQuantity}
        onFinish={handleCookingFinish}
      />
      
      <CookingRatingModal
        isOpen={isRatingModeOpen}
        onClose={() => setIsRatingModeOpen(false)}
        onComplete={handleCookingComplete}
      />

      <RecipeSnapshotModal
        isOpen={!!snapshotData}
        onClose={() => setSnapshotData(null)}
        snapshot={snapshotData?.snapshot}
        date={snapshotData?.date || ''}
        rating={snapshotData?.rating}
        notes={snapshotData?.notes}
      />
      
      {/* Mobile Sticky Bottom Action Bar */}
      <div className="flex xl:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 dark:bg-content1/80 backdrop-blur-md border-t border-divider z-40 safe-area-inset-bottom items-center gap-3 animate-appearance-in pb-6">
        <Button 
          color="primary"
          className="w-full rounded-full font-bold h-12 shadow-md shadow-primary/30 text-base"
          onPress={() => setIsCookingModeOpen(true)}
          startContent={<Play className="w-5 h-5 fill-current" />}
        >
          {t('recipes.detail.cookMode')}
        </Button>
      </div>
      <MealPlannerSelectModal 
        isOpen={isMealPlannerModalOpen} 
        onOpenChange={setIsMealPlannerModalOpen} 
        onConfirm={handleAddToMealPlan} 
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteRecipe}
        title={t('recipes.actions.deleteConfirmTitle', { defaultValue: 'Xoá công thức' })}
        description={t('recipes.actions.deleteConfirm', { title: recipe?.title || '' })}
      />

      {/* Dedicated Printable & Export Template (mounted via Portal for pristine A4 export & printing) */}
      {recipe && typeof document !== 'undefined' && createPortal(
        <div id="recipe-print-portal" className="recipe-export-offscreen">
          <RecipePrintTemplate 
            recipe={recipe} 
            scaledServings={targetServings} 
            id="recipe-print-template" 
          />
        </div>,
        document.body
      )}
    </div>
  );
}
