
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/recipes/ImageUploader';
import { Search, Plus, X, Check, Loader2, Sparkles, ShoppingBasket } from 'lucide-react';
import { Recipe } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';
import { useRecipes } from '@/hooks/use-recipes';

interface MenuCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  allRecipes: Recipe[];
}

export function MenuCreateModal({ isOpen, onClose, onSave, allRecipes }: MenuCreateModalProps) {
  const { addRecipe: quickAddRecipeToDb } = useRecipes();
  const [isSaving, setIsSaving] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: 'https://picsum.photos/seed/new-menu/800/600'
  });

  const filteredRecipes = useMemo(() => {
    const term = recipeSearch.toLowerCase().trim();
    const selectedIds = selectedRecipes.map(r => r.id);
    let list = allRecipes.filter(r => !selectedIds.includes(r.id));
    if (term) {
      list = list.filter(r => r.title.toLowerCase().includes(term));
    }
    return list; // Hiển thị đầy đủ thay vì cắt 10 món
  }, [allRecipes, recipeSearch, selectedRecipes]);

  const handleSave = async () => {
    if (!formData.title || selectedRecipes.length === 0) return;
    setIsSaving(true);
    try {
      const slug = formData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      await onSave({
        ...formData,
        slug,
        recipe_ids: selectedRecipes.map(r => r.id)
      });
      // Reset
      setFormData({ title: '', description: '', image_url: 'https://picsum.photos/seed/new-menu/800/600' });
      setSelectedRecipes([]);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickCreate = async () => {
    const name = recipeSearch.trim();
    if (!name) return;
    
    setIsQuickCreating(true);
    try {
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      const newId = await quickAddRecipeToDb({
        title: name,
        slug,
        image_url: '',
        description: 'Món ăn mới đang chờ cập nhật.',
        prep_time: 0,
        cook_time: 0,
        servings: 1,
        difficulty: 'Vừa',
        calories: 0,
        taste_score: 4.5,
        ingredients: [],
        steps: []
      });
      
      if (newId) {
        // Tự động thêm món vừa tạo vào danh sách đã chọn
        const newRecipe = { id: newId as string, title: name, slug, image_url: '', ingredients: [], steps: [] };
        setSelectedRecipes(prev => [...prev, newRecipe as any]);
        setRecipeSearch('');
        setIsDropdownOpen(false);
      }
    } catch (e) {
      console.error("Quick create failed:", e);
    } finally {
      setIsQuickCreating(false);
    }
  };

  const toggleRecipe = (recipe: Recipe) => {
    setSelectedRecipes(prev => [...prev, recipe]);
    setRecipeSearch('');
    setIsDropdownOpen(false);
  };

  const removeRecipe = (id: string) => {
    setSelectedRecipes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl rounded-[2rem] p-0 overflow-hidden flex flex-col h-[85vh] gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <DialogTitle className="text-xl font-bold font-headline">Tạo Thực Đơn Mới</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left */}
            <div className="space-y-6">
              <ImageUploader 
                value={formData.image_url} 
                onChange={(url) => setFormData({...formData, image_url: url})} 
                label="Ảnh bìa thực đơn"
              />
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên thực đơn *</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="VD: Thực đơn tuần 1..."
                    className="h-12 font-bold rounded-xl bg-white shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mô tả</label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Giới thiệu về thực đơn này..."
                    className="rounded-xl resize-y bg-white shadow-none font-medium"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-5 border-b bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 font-headline">
                    Chọn món ăn <span className="text-red-500">*</span>
                  </h3>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">
                    Đã chọn: {selectedRecipes.length}
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Tìm món ăn..."
                    value={recipeSearch}
                    onChange={(e) => { setRecipeSearch(e.target.value); setIsDropdownOpen(true); }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="pl-10 h-11 bg-gray-50 border-none rounded-xl font-bold shadow-none"
                  />

                  {isDropdownOpen && recipeSearch.trim() && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {filteredRecipes.map(r => (
                          <button 
                            key={r.id}
                            type="button"
                            onClick={() => toggleRecipe(r)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors group"
                          >
                            <img src={r.image_url || 'https://picsum.photos/50'} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="font-bold text-sm flex-grow truncate">{r.title}</span>
                            <Plus className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                        
                        {/* Mục Tạo Nhanh Món Mới */}
                        <div className="pt-2 border-t mt-1">
                          <button 
                            type="button"
                            disabled={isQuickCreating}
                            onClick={handleQuickCreate}
                            className="w-full flex items-center gap-3 p-3 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 rounded-xl text-orange-600 font-bold transition-all text-sm"
                          >
                            {isQuickCreating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span className="truncate">Tạo nhanh món "{recipeSearch}"</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {selectedRecipes.length > 0 ? (
                  selectedRecipes.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in-95 duration-200">
                      <img src={r.image_url || 'https://picsum.photos/50'} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <span className="font-bold text-sm flex-grow truncate">{r.title}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeRecipe(r.id)} className="text-gray-300 hover:text-red-500 rounded-full h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                    <ShoppingBasket className="w-12 h-12 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Chưa chọn món ăn</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12">Hủy bỏ</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !formData.title || selectedRecipes.length === 0}
            className="bg-green-600 hover:bg-green-700 rounded-xl font-bold px-10 h-12 shadow-none text-white border-none"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Hoàn tất</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
