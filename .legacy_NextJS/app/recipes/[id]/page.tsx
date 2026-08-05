
"use client";

import { use, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/use-recipes';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Edit3, Heart, 
  Loader2, 
  Clock, Star, Flame,
  AlertTriangle,
  Trash2,
  ShoppingCart,
  X,
  MoreVertical,
  Play,
  Printer,
  Share2,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecipeHero } from '@/components/recipes/RecipeHero';
import { RecipeIngredients } from '@/components/recipes/RecipeIngredients';
import { RecipeSteps } from '@/components/recipes/RecipeSteps';
import { CookingMode } from '@/components/recipes/CookingMode';
import { RecipePrintView } from '@/components/recipes/RecipePrintView';

export default function RecipeDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { recipes, toggleFavorite, deleteRecipes, loading } = useRecipes();
  const { list, toggleRecipeInList } = useShoppingList();
  const { toast } = useToast();
  
  const recipe = useMemo(() => recipes.find(r => r.id === id), [recipes, id]);

  const variants = useMemo(() => {
    if (!recipe) return [];
    const rootId = recipe.parent_id || recipe.id;
    return recipes
      .filter(r => r.id === rootId || r.parent_id === rootId)
      .sort((a, b) => (a.id === rootId ? -1 : 1));
  }, [recipes, recipe]);

  const isFavorite = !!recipe?.is_favorite;
  const isInShoppingList = recipe ? list.recipe_ids.includes(recipe.id) : false;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<Set<string>>(new Set());
  const [isCookingMode, setIsCookingMode] = useState(false);

  const openDeleteModal = () => {
      if (!recipe) return;
      setSelectedDeleteIds(new Set([recipe.id]));
      setIsDeleteModalOpen(true);
  };

  const toggleVariantSelection = (vid: string) => {
      setSelectedDeleteIds(prev => {
          const next = new Set(prev);
          if (next.has(vid)) next.delete(vid);
          else next.add(vid);
          return next;
      });
  };

  const confirmDelete = async () => {
      const ids = Array.from(selectedDeleteIds);
      if (ids.length === 0) return;

      setIsDeleting(true);
      try {
          await deleteRecipes(ids);
          toast({ title: `Đã xóa ${ids.length} công thức.` });
          setIsDeleteModalOpen(false);
          
          const currentId = recipe?.id;
          if (currentId && ids.includes(currentId)) {
              const remaining = variants.filter(v => !ids.includes(v.id));
              if (remaining.length > 0) {
                  router.push(`/recipes/${remaining[0].id}`);
              } else {
                  router.push('/');
              }
          }
      } catch (error) {
          toast({ variant: "destructive", title: "Lỗi khi xóa dữ liệu." });
      } finally {
          setIsDeleting(false);
      }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!recipe) return;
    const shareData = {
      title: recipe.title,
      text: `Xem công thức món ${recipe.title} trên My Recipe`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Đã sao chép liên kết", description: "Bạn có thể dán link để gửi cho bạn bè." });
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;
  if (!recipe) return <div className="p-20 text-center text-gray-500">Không tìm thấy món ăn.</div>;

  const MobileNavbar = () => (
    <div className="fixed top-0 left-0 right-0 z-30 px-4 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-none h-14 flex items-center justify-between print:hidden">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="font-bold text-sm truncate max-w-[180px] font-headline">{recipe.title}</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-gray-100">
          <DropdownMenuItem 
            onClick={() => toggleFavorite(recipe.id, isFavorite)} 
            className="rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer"
          >
            <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-gray-400")} />
            {isFavorite ? 'Đã thích' : 'Yêu thích'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => toggleRecipeInList(recipe.id)} 
            className="rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer"
          >
            <ShoppingCart className={cn("w-4 h-4", isInShoppingList ? "text-green-600" : "text-gray-400")} />
            {isInShoppingList ? 'Đã thêm' : 'Đi chợ'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleShare} 
            className="rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-blue-500" />
            Chia sẻ
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handlePrint} 
            className="rounded-xl p-3 font-bold flex items-center gap-3 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            In công thức
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-xl p-3 font-bold cursor-pointer">
            <Link href={`/recipes/${recipe.id}/edit`} className="flex items-center gap-3 text-blue-600">
              <Edit3 className="w-4 h-4" />
              Sửa
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={openDeleteModal} 
            className="rounded-xl p-3 font-bold flex items-center gap-3 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const DesktopNavbar = () => (
    <div className="fixed top-0 left-64 right-0 z-30 px-8 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-none h-16 flex items-center justify-between print:hidden">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold truncate max-w-md font-headline">{recipe.title}</h1>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handlePrint}
          className="rounded-xl font-bold h-10 px-4 gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-none"
        >
          <Printer className="w-4 h-4" /> In
        </Button>
        <Button 
          variant="outline" 
          onClick={handleShare}
          className="rounded-xl font-bold h-10 px-4 gap-2 border-gray-200 bg-white text-blue-600 hover:bg-blue-50 shadow-none"
        >
          <Share2 className="w-4 h-4" /> Chia sẻ
        </Button>
        <Button 
          variant="outline"
          className={cn(
            "rounded-xl font-bold h-10 px-5 gap-2 shadow-none transition-all border-gray-200", 
            isInShoppingList ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "bg-white text-gray-400"
          )}
          onClick={() => toggleRecipeInList(recipe.id)}
        >
          <ShoppingCart className="w-4 h-4" /> {isInShoppingList ? 'Đã thêm' : 'Đi chợ'}
        </Button>
        <Link href={`/recipes/${recipe.id}/edit`}>
          <Button className="rounded-xl font-bold h-10 px-5 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-none border-none">
            <Edit3 className="w-4 h-4" /> Sửa
          </Button>
        </Link>
        <Button 
          className="rounded-xl font-bold h-10 px-5 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-none border-none" 
          onClick={openDeleteModal}
        >
          <Trash2 className="w-4 h-4" /> Xóa
        </Button>
        <Button 
          variant="outline" 
          className={cn(
            "rounded-xl font-bold h-10 px-5 gap-2 transition-all shadow-none border-gray-200", 
            isFavorite ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : "bg-white text-gray-400"
          )}
          onClick={() => toggleFavorite(recipe.id, isFavorite)}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} /> {isFavorite ? 'Đã thích' : 'Yêu thích'}
        </Button>
      </div>
    </div>
  );

  const VariantTabs = () => {
    if (variants.length <= 1) return null;

    return (
      <div className="sticky top-14 md:top-16 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 shadow-none print:hidden">
        {isMobile ? (
          <div className="px-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-14 px-6 rounded-none bg-transparent text-orange-600 font-black uppercase tracking-[0.15em] border-b-[3px] border-orange-600 shadow-none hover:bg-transparent"
                >
                  <span className="truncate flex-1 text-left mr-2">{recipe.title}</span>
                  <ChevronDown className="w-5 h-5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[calc(100vw-2rem)] rounded-2xl p-2 shadow-2xl border-gray-100">
                {variants.map((v) => (
                  <DropdownMenuItem 
                    key={v.id} 
                    asChild
                    className={cn(
                      "rounded-xl p-3 font-bold cursor-pointer transition-colors",
                      v.id === recipe.id ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Link href={`/recipes/${v.id}`}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{v.title}</span>
                        {v.id === recipe.id && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto flex justify-center -mb-[1px] px-4 overflow-x-auto no-scrollbar">
            {variants.map((v) => (
              <Link 
                key={v.id} 
                href={`/recipes/${v.id}`} 
                className={cn(
                  "whitespace-nowrap px-6 py-4 text-[10px] md:text-sm transition-all border-b-[3px] font-black uppercase tracking-[0.15em] shadow-none",
                  v.id === recipe.id 
                    ? "text-orange-600 border-orange-600 bg-orange-50/30 rounded-t-xl" 
                    : "text-gray-400 border-transparent hover:text-gray-600"
                )}
              >
                {v.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MobileView = () => (
    <div className="max-w-[1600px] mx-auto pt-14 print:hidden">
      <MobileNavbar />
      <VariantTabs />
      <div className="px-4 pt-4 pb-32 space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-headline leading-tight">{recipe.title}</h1>
        </div>

        <RecipeHero recipe={recipe} />
        
        <Button 
          onClick={() => setIsCookingMode(true)}
          className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-lg shadow-none border-none transition-transform active:scale-95"
        >
          <Play className="w-5 h-5 mr-2 fill-current" /> Bắt đầu nấu ngay
        </Button>

        <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100">
          <div className="flex items-center flex-col text-center gap-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thời gian</p>
            <p className="font-bold text-xs">{recipe.cook_time + recipe.prep_time}'</p>
          </div>
          <div className="flex items-center flex-col text-center gap-1 border-x border-gray-100">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Star className="w-5 h-5 fill-current" /></div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Đánh giá</p>
            <p className="font-bold text-xs">{recipe.taste_score}/5</p>
          </div>
          <div className="flex items-center flex-col text-center gap-1">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Flame className="w-5 h-5" /></div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Calories</p>
            <p className="font-bold text-xs">{recipe.calories}</p>
          </div>
        </div>

        <RecipeIngredients ingredients={recipe.ingredients} servings={recipe.servings} notes={recipe.notes} />
        <RecipeSteps steps={recipe.steps} videoUrl={recipe.video_url} />
      </div>
    </div>
  );

  const DesktopView = () => (
    <div className="max-w-[1600px] mx-auto pt-16 print:hidden">
      <DesktopNavbar />
      <VariantTabs />
      <div className="mt-6 pb-32 px-8">
        <div className="grid grid-cols-12 gap-12 items-start">
          <div className="col-span-4 2xl:col-span-3 space-y-8 sticky top-32">
            <RecipeHero recipe={recipe} />
            
            <Button 
              onClick={() => setIsCookingMode(true)}
              className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-[1.25rem] font-bold text-xl shadow-none border-none transition-all hover:-translate-y-1 active:translate-y-0"
            >
              <Play className="w-6 h-6 mr-3 fill-current" /> Bắt đầu nấu ngay
            </Button>

            <RecipeIngredients ingredients={recipe.ingredients} servings={recipe.servings} notes={recipe.notes} />
          </div>

          <div className="col-span-8 2xl:col-span-9 space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white font-headline leading-tight">{recipe.title}</h1>
              
              <div className="flex items-center gap-10 py-8 border-y border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian nấu</p>
                    <p className="text-lg font-bold">{recipe.prep_time + recipe.cook_time} phút</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-x border-gray-100 px-10">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><Star className="w-6 h-6 fill-current" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đánh giá món</p>
                    <p className="text-lg font-bold">{recipe.taste_score}/5.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Flame className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Năng lượng</p>
                    <p className="text-lg font-bold">{recipe.calories} Kcal</p>
                  </div>
                </div>
              </div>
            </div>

            <RecipeSteps steps={recipe.steps} videoUrl={recipe.video_url} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {isMobile ? <MobileView /> : <DesktopView />}

      <RecipePrintView recipe={recipe} />

      {isCookingMode && <CookingMode recipe={recipe} onClose={() => setIsCookingMode(false)} />}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-[calc(100%-2rem)] md:max-w-md shadow-2xl p-8 border-none overflow-hidden">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold font-headline text-gray-800">Xóa công thức?</h2>
                    
                    {variants.length > 1 ? (
                        <div className="w-full space-y-4">
                            <p className="text-gray-500 text-sm">Chọn các biến thể bạn muốn xóa:</p>
                            <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-2xl no-scrollbar">
                                {variants.map(v => (
                                    <label key={v.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedDeleteIds.has(v.id)}
                                            onChange={() => toggleVariantSelection(v.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-bold text-gray-700 truncate">{v.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 leading-relaxed">
                            Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa công thức này?
                        </p>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-2xl h-12 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 shadow-none">Hủy</Button>
                    <Button 
                        onClick={confirmDelete}
                        disabled={isDeleting || (variants.length > 1 && selectedDeleteIds.size === 0)}
                        className="flex-1 rounded-2xl h-12 font-bold bg-red-600 hover:bg-red-700 text-white shadow-none transition-transform active:scale-95 border-none"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Xóa ${selectedDeleteIds.size} món`}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
