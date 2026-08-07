import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Checkbox, Select, SelectItem, Input, Modal, ModalContent, ModalBody, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@apron/ui';
import { ArrowLeft, Edit, Clock, Target, Star, Flame, Play, Info, ExternalLink, ChevronRight, Share, Check, Send, Search, Image as ImageIcon, Sparkles, Wand2, Plus, Gauge, Timer, Minus, Carrot, ChefHat, Link as LinkIcon, Video, Tag, Bot, X, RefreshCw, Calendar, ShoppingCart, Printer, Download, ImageDown, ChevronLeft } from 'lucide-react';
import { useRecipeStore } from '../../store/useRecipeStore';
import { ImageManager } from '../../lib/image-manager';
import { DEFAULT_TAGS } from '@apron/core';
import { askGemini } from '../../lib/geminiChat';
import { GEMINI_MODELS } from '../../lib/gemini';
import { exportToPdf, exportToPng } from '../../lib/exportUtils';
import { CookingModeModal } from '../../components/recipes/CookingModeModal';
import { CookingRatingModal } from '../../components/recipes/CookingRatingModal';
import { RecipeSnapshotModal } from '../../components/recipes/RecipeSnapshotModal';
import { RecipeFloatingChat } from '../../components/recipes/RecipeFloatingChat';

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

  const handleCookingComplete = async (rating: number, notes: string, action: 'done' | 'edit') => {
    if (!recipe) return;
    const { cooking_history, ...recipeSnapshot } = recipe;
    
    const newHistory = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      rating,
      notes,
      recipe_snapshot: recipeSnapshot
    };
    
    const updatedRecipe = {
      ...recipe,
      cooking_history: [...(recipe.cooking_history || []), newHistory]
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
    if (!recipe || !recipe.cooking_history || recipe.cooking_history.length === 0) return 0;
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
    if (!recipe?.steps) return groups;
    recipe.steps.forEach((step) => {
      const g = step.group || 'Các bước thực hiện';
      if (!groups[g]) groups[g] = [];
      groups[g].push(step);
    });
    return groups;
  }, [recipe?.steps]);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">Không tìm thấy công thức</h2>
        <Button className="mt-4" onPress={() => navigate('/recipes')}>Quay lại</Button>
      </div>
    );
  }

  const categoryId = recipe.tags && recipe.tags.length > 0 ? recipe.tags[0] : null;
  const categoryObj = categoryId ? DEFAULT_TAGS.find(t => t.id === categoryId) : null;
  const category = categoryObj ? categoryObj.name : 'Chung';

  const allSteps = recipe.steps || [];

  return (
    <div className="flex flex-col w-full pb-12 animate-in fade-in duration-300 gap-8" id="recipe-content">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column (Hero + Content) */}
        <div className="flex-1 flex flex-col gap-10 min-w-0 w-full">
          
          {/* Intro Section (Split Image / Details) */}
          <div className="flex flex-col xl:flex-row gap-8 w-full">
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
                 <div 
                   className="flex items-center gap-1 text-sm font-semibold text-default-500 hover:text-foreground cursor-pointer w-fit transition-colors -ml-1 px-1 py-0.5 rounded-lg hover:bg-default-100"
                   onClick={() => navigate(-1)}
                 >
                   <ArrowLeft className="w-4 h-4" />
                   Quay lại
                 </div>
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
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<Calendar className="w-4 h-4"/>}>
                   Kế hoạch
                 </Button>
                 <Button variant="flat" className="font-semibold border border-default-200" startContent={<ShoppingCart className="w-4 h-4 text-success"/>}>
                   Đi chợ
                 </Button>
                 
                 <Dropdown>
                   <DropdownTrigger>
                     <Button isIconOnly variant="flat" className="border border-default-200">
                       <Share className="w-4 h-4" />
                     </Button>
                   </DropdownTrigger>
                   <DropdownMenu aria-label="Export Actions">
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
                  <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl p-4 border border-default-100">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Độ khó</span>
                    <span className="font-bold text-foreground">{recipe.difficulty || 'Chưa rõ'}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl p-4 border border-default-100">
                    <div className="p-2 rounded-full bg-warning/10 text-warning mb-1">
                      <Flame className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Calories</span>
                    <span className="font-bold text-foreground">{recipe.calories || '-'} kcal</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl p-4 border border-default-100">
                    <div className="p-2 rounded-full bg-secondary/10 text-secondary mb-1">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-default-500 font-medium">Sơ chế</span>
                    <span className="font-bold text-foreground">{recipe.prep_time || 0} phút</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl p-4 border border-default-100">
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
            </div>
          </div>

          {/* Main Content Split (Ingredients & Instructions) */}
          <div className="flex-1 min-w-0 w-full grid grid-cols-1 xl:grid-cols-5 gap-8">
            
            {/* Ingredients */}
            <div className="xl:col-span-2 flex flex-col gap-6 bg-white rounded-3xl border border-default-100 shadow-none p-6 h-fit">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Carrot className="w-6 h-6 text-success" />
                  Nguyên liệu
                </h2>
                <div className="flex items-center gap-2 bg-default-100 px-2 py-1 rounded-full text-sm font-medium">
                  <span className="text-default-500 mr-1 hidden sm:inline ml-2">Khẩu phần</span>
                  <div 
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 hover:text-primary transition-colors shrink-0"
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
                    className="w-6 h-6 flex items-center justify-center bg-white rounded-full cursor-pointer shadow-sm text-default-600 hover:text-primary transition-colors shrink-0"
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
            <div className="xl:col-span-3 flex flex-col gap-6 bg-white rounded-3xl border border-default-100 shadow-none p-6">
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
                             <p className="text-default-700 leading-relaxed whitespace-pre-wrap">
                               {step.instruction}
                             </p>
                             
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
        <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Video */}
          {recipe.video_url && (
             <div className="bg-white rounded-3xl border border-default-100 shadow-none p-3 flex flex-col gap-4">
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

          {/* Notes */}
          {recipe.notes && (
            <div className="bg-warning-50 text-warning-900 rounded-3xl p-3 border border-warning-200 shadow-none flex flex-col gap-3">
               <h3 className="font-bold text-base flex items-center gap-2"><Info className="w-5 h-5 text-warning-600" /> Ghi chú</h3>
               <p className="text-sm leading-relaxed">{recipe.notes}</p>
            </div>
          )}



          {/* Related Recipes */}
          {recipe.related_recipes && recipe.related_recipes.length > 0 && (
             <div className="bg-white rounded-3xl border border-default-100 shadow-none p-3 flex flex-col gap-4">
                <h3 className="font-bold text-base flex items-center gap-2"><LinkIcon className="w-5 h-5 text-primary" /> Công thức liên kết</h3>
                <div className="flex flex-col gap-3">
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
             </div>
          )}

          {/* Cooking History */}
          <div className="bg-white rounded-3xl border border-default-100 shadow-none p-6 flex flex-col gap-4 mt-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Lịch sử nấu món
            </h2>
            {recipe.cooking_history && recipe.cooking_history.length > 0 ? (
              <div className="flex flex-col gap-3">
                {recipe.cooking_history.slice().reverse().map((history) => (
                  <div key={history.id} className="p-4 rounded-2xl bg-default-50 border border-default-100 flex flex-col gap-2">
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
                    {history.recipe_snapshot && (
                      <div className="mt-2 flex justify-start">
                        <Button 
                          size="sm" 
                          variant="flat" 
                          color="primary"
                          onPress={() => setSnapshotData({ 
                            snapshot: history.recipe_snapshot, 
                            date: history.date,
                            rating: history.rating,
                            notes: history.notes
                          })}
                        >
                          Xem công thức đã nấu
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-default-50 rounded-2xl border border-dashed border-default-200">
                <p className="text-default-500">Bạn chưa ghi nhận lần nấu nào cho món này.</p>
                <p className="text-default-400 text-sm mt-1">Hãy bấm "Bắt đầu nấu" và hoàn thành để lưu lại đánh giá nhé!</p>
              </div>
            )}
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
        hideCloseButton={true}
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="p-0 overflow-hidden rounded-3xl flex items-center justify-center relative">
               <Button isIconOnly className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full hover:bg-black/70" onPress={onClose}>
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
      
      {/* Floating AI Chat */}
      <RecipeFloatingChat recipe={recipe} />
    </div>
  );
}
