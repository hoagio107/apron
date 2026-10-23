import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, ModalContent, ModalBody, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tabs, Tab } from '@/ui';
import { ArrowLeft, Edit, Clock, Star, Flame, Play, Info, Share, Check, Image as ImageIcon, Plus, Gauge, Timer, Minus, Carrot, ChefHat, Link as LinkIcon, Video, Tag, X, Calendar, ShoppingCart, Printer, Download, ImageDown, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { useMealPlanStore } from '../../store/useMealPlanStore';
import { ImageManager } from '../../lib/image-manager';
import { DEFAULT_TAGS } from '@apron/core';
import { exportToPdf, exportToPng } from '../../lib/exportUtils';
import { CookingModeModal } from '../../components/recipes/CookingModeModal';
import { CookingRatingModal } from '../../components/recipes/CookingRatingModal';
import { RecipeSnapshotModal } from '../../components/recipes/RecipeSnapshotModal';
import { RecipeFloatingChat } from '../../components/recipes/RecipeFloatingChat';
import { MealPlannerSelectModal } from './components/MealPlannerSelectModal';

export function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, updateRecipe } = useRecipeStore();
  
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

  const handleAddToShoppingList = async () => {
    if (!recipe?.ingredients) return;
    const items = recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: scaleQuantity(ing.quantity) || undefined,
      unit: ing.unit || undefined
    }));
    try {
      await addItems(items);
      alert('Đã thêm nguyên liệu vào giỏ đi chợ!');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi thêm vào giỏ đi chợ.');
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    let text = `🍳 ${recipe.title}\n\n`;
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      text += `🛒 Nguyên liệu:\n`;
      recipe.ingredients.forEach(ing => {
        text += `- ${scaleQuantity(ing.quantity) || ''} ${ing.unit || ''} ${ing.name}\n`;
      });
      text += `\n`;
    }
    if (recipe.steps && recipe.steps.length > 0) {
      text += `📝 Cách làm:\n`;
      recipe.steps.forEach((step, idx) => {
        text += `${idx + 1}. ${step.instruction}\n`;
      });
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Đã sao chép công thức vào khay nhớ tạm!');
    } catch (e) {
      console.error(e);
      alert('Không thể sao chép.');
    }
  };

  const handleAddToMealPlan = async (date: string, slotId: string) => {
    if (!recipe) return;
    try {
      await addMealPlanEntry(date, {
        recipe_id: recipe.id!,
        meal_type: slotId,
      });
      alert('Đã thêm vào thực đơn!');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi thêm vào thực đơn.');
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
      return [parent, ...siblings].filter(Boolean) as typeof recipes;
    } else {
      const children = recipes.filter(r => r.parent_id === recipe.id);
      if (children.length === 0) return [];
      return [recipe, ...children];
    }
  }, [recipe, recipes]);

  const allSteps = useMemo(() => Object.values(stepGroups).flat(), [stepGroups]);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">Không tìm thấy công thức</h2>
        <Button className="mt-4" onPress={() => navigate('/recipes')}>Quay lại</Button>
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
                title={!v.parent_id ? "Bản gốc" : v.title}
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


           <div className="absolute top-4 right-4 z-10">
             <Dropdown>
               <DropdownTrigger>
                 <Button isIconOnly className="bg-white shadow-md text-default-700 rounded-full w-10 h-10 min-w-0 p-0 flex items-center justify-center">
                   <div className="flex gap-1">
                     <div className="w-1 h-1 bg-current rounded-full" />
                     <div className="w-1 h-1 bg-current rounded-full" />
                     <div className="w-1 h-1 bg-current rounded-full" />
                   </div>
                 </Button>
               </DropdownTrigger>
               <DropdownMenu>
                 <DropdownItem key="cook" startContent={<Play className="w-4 h-4"/>} onPress={() => setIsCookingModeOpen(true)}>Bắt đầu nấu</DropdownItem>
                 <DropdownItem key="plan" startContent={<Calendar className="w-4 h-4"/>} onPress={() => setIsMealPlannerModalOpen(true)}>Lên kế hoạch</DropdownItem>
                 <DropdownItem key="cart" startContent={<ShoppingCart className="w-4 h-4"/>} onPress={handleAddToShoppingList}>Đi chợ</DropdownItem>
                 <DropdownItem key="share" startContent={<Share className="w-4 h-4"/>} onPress={handleShare}>Chia sẻ</DropdownItem>
                 <DropdownItem key="edit" startContent={<Edit className="w-4 h-4"/>} onPress={() => navigate(`/recipes/new?edit=${recipe.id}`)}>Chỉnh sửa</DropdownItem>
               </DropdownMenu>
             </Dropdown>
           </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <h1 className="text-xl font-extrabold leading-tight text-foreground">{recipe.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex flex-row items-center gap-1.5 text-default-500">
              <Gauge className="w-4 h-4 shrink-0" />
              <span className="text-[14px] leading-none">{recipe.difficulty || '-'}</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-500">
              <Flame className="w-4 h-4 shrink-0" />
              <span className="text-[14px] leading-none">{recipe.calories || '-'} kcal</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-500">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-[14px] leading-none">{recipe.prep_time || 0}p</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-500">
              <Timer className="w-4 h-4 shrink-0" />
              <span className="text-[14px] leading-none">{recipe.cook_time || 0}p</span>
            </div>
            <div className="flex flex-row items-center gap-1.5 text-default-500">
              <Star className="w-4 h-4 shrink-0 fill-current" />
              <span className="text-[14px] leading-none">
                {averageRating > 0 ? averageRating : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE TABS --- */}
      <div className="flex xl:hidden w-full flex-col">
        <Tabs 
          aria-label="Mobile Tabs" 
          fullWidth
          variant="underlined"
          color="primary"
          classNames={{
            tabList: "w-full border-b border-default-200",
            tab: "py-4",
            tabContent: "font-semibold text-base",
          }}
        >
          <Tab key="ingredients" title="Nguyên liệu">
             <div className="p-4 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Carrot className="w-5 h-5 text-success" /> Nguyên liệu
                  </h2>
                  <div className="flex items-center gap-2 bg-default-100 px-2 py-1 rounded-full text-sm font-medium">
                    <span className="text-default-500 mr-1 hidden sm:inline ml-2">Khẩu phần</span>
                    <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 active:text-primary shrink-0" onClick={() => setTargetServingsStr(Math.max(0.1, targetServings - 1).toString())}><Minus className="w-3 h-3" /></div>
                    <input type="number" className="w-12 text-center bg-transparent border-none outline-none text-sm font-bold p-0" value={targetServingsStr} onChange={(e) => setTargetServingsStr(e.target.value)} />
                    <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 active:text-primary shrink-0" onClick={() => setTargetServingsStr((targetServings + 1).toString())}><Plus className="w-3 h-3" /></div>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {Object.entries(ingredientGroups).map(([group, ingredients], gIndex) => (
                    <div key={group} className="flex flex-col gap-3">
                      {group !== 'Chung' && <h3 className="font-bold text-xs text-default-400 uppercase tracking-wider">{group}</h3>}
                      <div className="flex flex-col gap-3">
                        {ingredients.map((ing, i) => {
                          const globalIndex = gIndex * 100 + i;
                          const isChecked = checkedIngredients.has(globalIndex);
                          return (
                            <div key={globalIndex} className="flex items-center gap-3 group cursor-pointer" onClick={() => toggleIngredient(globalIndex)}>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-primary border-primary text-white' : 'border-default-300'}`}>{isChecked && <Check className="w-3 h-3" />}</div>
                              <div className={`flex flex-col flex-1 ${isChecked ? 'opacity-50 line-through' : ''}`}>
                                <span className="font-medium text-foreground text-sm">{ing.name}</span>
                                <span className="text-xs text-default-500">{scaleQuantity(ing.quantity)} {ing.unit}</span>
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
          <Tab key="instructions" title="Cách làm">
             <div className="p-4 pt-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <ChefHat className="w-5 h-5 text-success" /> Cách làm
                </h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(stepGroups).map(([group, steps]) => (
                    <div key={group} className="flex flex-col">
                      {group !== 'Các bước thực hiện' && <h3 className="text-md font-bold text-default-700 mb-4">{group}</h3>}
                      <div className="flex flex-col">
                        {steps.map((step, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                              {i < steps.length - 1 && <div className="w-px flex-1 bg-default-200 my-2" />}
                            </div>
                            <div className="flex flex-col gap-3 pb-6 pt-1">
                              <div className="text-default-700 text-sm leading-relaxed prose prose-sm prose-primary max-w-none prose-p:my-1 prose-ul:my-1" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                              {((step.images && step.images.length > 0) || step.image_url) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {step.images && step.images.length > 0 ? (
                                    step.images.map((imgUrl: string, imgIdx: number) => (
                                      <div key={imgIdx} className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox('image', imgUrl)}>
                                        <img src={ImageManager.getAssetUrl(imgUrl)} className="w-full h-full object-cover" />
                                      </div>
                                    ))
                                  ) : step.image_url ? (
                                    <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox('image', step.image_url!)}>
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
          <Tab key="info" title="Khác">
             <div className="p-4 pt-6 flex flex-col gap-6">
                {recipe.notes && (
                  <div className="flex flex-col gap-2">
                     <h3 className="font-bold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-warning-500" /> Ghi chú</h3>
                     <div className="text-sm leading-relaxed text-default-700 bg-warning-50 p-4 rounded-xl border border-warning-100 prose prose-sm prose-warning max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: recipe.notes }} />
                  </div>
                )}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                     <h3 className="font-bold text-sm flex items-center gap-2"><Tag className="w-4 h-4 text-default-500" /> Tags</h3>
                     <div className="flex flex-wrap gap-2">
                       {recipe.tags.map(tagId => {
                          const t = DEFAULT_TAGS.find(x => x.id === tagId || x.slug === tagId);
                          const displayName = t ? t.name : tagId.replace(/-/g, ' ');
                          return <span key={tagId} className="px-3 py-1 bg-default-100 rounded-full text-xs font-medium text-default-700 capitalize">{displayName}</span>;
                       })}
                     </div>
                  </div>
                )}
                {recipe.video_url && (
                   <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-sm flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Video Hướng Dẫn</h3>
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
                        <History className="w-4 h-4 text-primary" /> Lịch sử nấu
                      </h3>
                      {recipe.cooking_history && recipe.cooking_history.length > 0 && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {recipe.cooking_history.length} lần
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col mt-1">
                      {recipe.cooking_history && recipe.cooking_history.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {recipe.cooking_history.slice().reverse().map((history) => (
                            <div 
                              key={history.id} 
                              className={`p-3 -mx-3 flex flex-col gap-2 rounded-xl transition-colors ${history.recipe_snapshot ? 'cursor-pointer hover:bg-default-100' : ''}`}
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
                                <span className="text-xs text-default-500 font-medium">
                                  {new Date(history.date).toLocaleDateString('vi-VN', { 
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < history.rating ? 'fill-current text-warning-400' : 'text-default-300'}`} />
                                  ))}
                                </div>
                              </div>
                              {history.notes && (
                                <p className="text-sm text-default-700 italic border-l-2 border-default-200 pl-3">{history.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-default-400 bg-default-50 rounded-xl">
                          <History className="w-5 h-5" />
                          <span className="text-xs">Chưa có lịch sử nấu nào.<br/>Nhấn "Bắt đầu nấu" để lưu lại!</span>
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
        <div className="flex-1 flex flex-col gap-10 min-w-0 w-full">
          
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
               <div className="flex flex-col gap-2">

                 <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-foreground">{recipe.title}</h1>
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
                   <span className="text-default-500 font-medium text-sm italic">Chưa có đánh giá</span>
                 )}
               </div>
               
               <div className="flex flex-wrap gap-2 mt-2">
                 <Button color="primary" variant="solid" className="font-semibold px-6" startContent={<Play className="w-4 h-4"/>} onPress={() => setIsCookingModeOpen(true)}>
                   Bắt đầu nấu
                 </Button>
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<Calendar className="w-4 h-4"/>} onPress={() => setIsMealPlannerModalOpen(true)}>
                   Kế hoạch
                 </Button>
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<ShoppingCart className="w-4 h-4 text-success"/>} onPress={handleAddToShoppingList}>
                   Đi chợ
                 </Button>
                 
                 <Dropdown>
                   <DropdownTrigger>
                     <Button isIconOnly variant="flat" className="border border-default-200">
                       <Share className="w-4 h-4" />
                     </Button>
                   </DropdownTrigger>
                   <DropdownMenu aria-label="Export Actions">
                     <DropdownItem key="copy" startContent={<Share className="w-4 h-4"/>} onPress={handleShare}>Copy công thức</DropdownItem>
                     <DropdownItem key="png" startContent={<ImageDown className="w-4 h-4"/>} onPress={() => exportToPng('recipe-content', `${recipe.title}.png`)}>Lưu ảnh (PNG)</DropdownItem>
                     <DropdownItem key="pdf" startContent={<Download className="w-4 h-4"/>} onPress={() => exportToPdf('recipe-content', `${recipe.title}.pdf`)}>Xuất PDF</DropdownItem>
                     <DropdownItem key="print" startContent={<Printer className="w-4 h-4"/>} onPress={() => window.print()}>In ấn</DropdownItem>
                   </DropdownMenu>
                 </Dropdown>
                 
                 <Button isIconOnly variant="flat" className="border border-default-200 text-primary" onPress={() => navigate(`/recipes/new?edit=${recipe.id}`)}>
                   <Edit className="w-4 h-4" />
                 </Button>
               </div>
               
               {/* Meta Stats Row instead of Notes */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Độ khó</span>
                    <span className="font-bold text-foreground">{recipe.difficulty || 'Chưa rõ'}</span>
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
                    <span className="text-xs text-default-500 font-medium">Sơ chế</span>
                    <span className="font-bold text-foreground">{recipe.prep_time || 0} phút</span>
                  </div>
                  
                  <div className="app-card flex flex-col items-center justify-center gap-1 p-4">
                    <div className="p-2 rounded-full bg-success/10 text-success mb-1">
                      <Timer className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Nấu</span>
                    <span className="font-bold text-foreground">{recipe.cook_time || 0} phút</span>
                  </div>
               </div>

               {/* Tags */}
               {recipe.tags && recipe.tags.length > 0 && (
                 <div className="flex flex-wrap items-center gap-2">
                   <div className="flex items-center gap-1.5 text-sm font-semibold text-default-500 mr-1">
                     <Tag className="w-4 h-4" /> Tags:
                   </div>
                   {recipe.tags.map(tagId => {
                      const t = DEFAULT_TAGS.find(x => x.id === tagId);
                      return t ? <span key={tagId} className="px-3 py-1 bg-default-100 rounded-full text-xs font-medium text-default-700">{t.name}</span> : null;
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
                     } catch (e) {}
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
                  Nguyên liệu
                </h2>
                <div className="flex items-center gap-2 bg-default-100 px-2 py-1 rounded-full text-sm font-medium">
                  <span className="text-default-500 mr-1 hidden sm:inline ml-2">Khẩu phần</span>
                  <div 
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 active:text-primary transition-colors shrink-0"
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
                    className="w-12 text-center bg-transparent border-none outline-none text-sm font-bold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={targetServingsStr}
                    onChange={(e) => setTargetServingsStr(e.target.value)}
                  />
                  <div 
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 active:text-primary transition-colors shrink-0"
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
                            className="flex items-center gap-3 group cursor-pointer"
                            onClick={() => toggleIngredient(globalIndex)}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-default-300 group-hover:border-primary'}`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className={`flex flex-col flex-1 transition-opacity ${isChecked ? 'opacity-50 line-through' : ''}`}>
                              <span className="font-medium text-foreground">{ing.name}</span>
                              <span className="text-sm text-default-500">{scaleQuantity(ing.quantity)} {ing.unit}</span>
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
                 Cách làm
               </h2>
               
               <div className="flex flex-col gap-2">
                 {Object.entries(stepGroups).map(([group, steps]) => (
                   <div key={group} className="flex flex-col">
                     {group !== 'Các bước thực hiện' && <h3 className="text-lg font-bold text-default-700 mb-4">{group}</h3>}
                     
                     <div className="flex flex-col">
                       {steps.map((step, i) => (
                         <div key={i} className="flex gap-4">
                           <div className="flex flex-col items-center">
                             <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                               {i + 1}
                             </div>
                             {i < steps.length - 1 && <div className="w-px flex-1 bg-default-200 my-2" />}
                           </div>
                           <div className="flex flex-col gap-3 pb-6 pt-1">
                             <div 
                               className="text-default-700 leading-relaxed prose prose-sm prose-primary max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
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
              
              <Tab key="overview" title={<span className="text-base font-medium">Tổng quan</span>}>
                <div className="flex flex-col divide-y divide-default-100 mt-2">
                  {/* Video */}
                  {recipe.video_url && (
                     <div className="py-5 first:pt-2 last:pb-0 flex flex-col gap-4">
                        <h3 className="font-bold text-base flex items-center gap-2"><Video className="w-5 h-5 text-primary" /> Video Hướng Dẫn</h3>
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
                            <LinkIcon className="w-5 h-5 text-primary" /> Công thức liên kết
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
                                        <span className="flex items-center gap-0.5" title="Đánh giá"><Star className="w-3 h-3 text-warning" />{extra.taste_score}</span>
                                      ) : null}
                                      {extra?.calories ? (
                                        <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{extra.calories}</span>
                                      ) : null}
                                      {extra?.difficulty ? (
                                        <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-3 h-3 text-primary" />{extra.difficulty}</span>
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
                       <h3 className="font-bold text-base flex items-center gap-2"><Info className="w-5 h-5 text-warning-500" /> Ghi chú</h3>
                       <div 
                         className="text-sm leading-relaxed text-default-700 bg-warning-50 p-4 rounded-2xl border border-warning-100 prose prose-sm prose-warning max-w-none prose-p:my-1 prose-ul:my-1"
                         dangerouslySetInnerHTML={{ __html: recipe.notes }}
                       />
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="history" title={
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">Lịch sử nấu</span>
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
                          className={`p-3 -mx-3 flex flex-col gap-2 rounded-xl transition-colors ${history.recipe_snapshot ? 'cursor-pointer hover:bg-default-100' : ''}`}
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
                              {new Date(history.date).toLocaleDateString('vi-VN', { 
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <div className="flex gap-1 text-warning-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < history.rating ? 'fill-current text-warning-400' : 'text-default-300'}`} />
                              ))}
                            </div>
                          </div>
                          {history.notes && (
                            <p className="text-default-700 text-sm whitespace-pre-wrap">{history.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-default-500">Bạn chưa ghi nhận lần nấu nào cho món này.</p>
                      <p className="text-default-400 text-sm mt-1">Hãy bấm "Bắt đầu nấu" và hoàn thành để lưu lại đánh giá nhé!</p>
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
      
      {/* Floating AI Chat & Bottom Action Bar */}
      <RecipeFloatingChat 
        recipe={recipe} 
        onStartCooking={() => setIsCookingModeOpen(true)} 
      />
      <MealPlannerSelectModal 
        isOpen={isMealPlannerModalOpen} 
        onOpenChange={setIsMealPlannerModalOpen} 
        onConfirm={handleAddToMealPlan} 
      />
    </div>
  );
}
