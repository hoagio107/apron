"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, X, Check, Loader2, Sparkles } from 'lucide-react';
import { Recipe } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';
import { useRecipes } from '@/hooks/use-recipes';

interface MenuAddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipeIds: string[]) => Promise<void>;
  existingIds: string[];
  allRecipes: Recipe[];
}

export function MenuAddRecipeModal({ isOpen, onClose, onSave, existingIds, allRecipes }: MenuAddRecipeModalProps) {
  const { addRecipe: quickAddRecipeToDb } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const existing = new Set(existingIds);
    let list = allRecipes.filter(r => !existing.has(r.id));
    if (term) {
      list = list.filter(r => r.title.toLowerCase().includes(term));
    }
    return list;
  }, [allRecipes, searchTerm, existingIds]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleQuickCreate = async () => {
    if (!searchTerm.trim()) return;
    setIsQuickCreating(true);
    try {
      const name = searchTerm.trim();
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
        setSelectedIds(prev => new Set(prev).add(newId as string));
        setSearchTerm('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuickCreating(false);
    }
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      await onSave(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-[2rem] p-0 overflow-hidden flex flex-col h-[80vh] gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <div className="flex justify-between items-center pr-10">
            <DialogTitle className="text-xl font-bold font-headline">Thêm món vào thực đơn</DialogTitle>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Đã chọn: {selectedIds.size}</span>
          </div>
        </DialogHeader>

        <div className="p-4 border-b bg-white flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm món ăn hoặc nhập tên món mới..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-none rounded-xl font-bold shadow-none"
            />
          </div>
          {searchTerm.trim() && filteredRecipes.length === 0 && (
            <Button onClick={handleQuickCreate} disabled={isQuickCreating} className="bg-orange-600 rounded-xl font-bold gap-2 text-white border-none shadow-none">
              {isQuickCreating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Tạo nhanh món này
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => toggleSelection(recipe.id)}
                className={cn(
                  "relative group bg-white dark:bg-gray-800 p-2 rounded-2xl border transition-all cursor-pointer shadow-sm",
                  selectedIds.has(recipe.id) ? "border-orange-500 ring-2 ring-orange-100" : "border-transparent hover:border-orange-200"
                )}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                  <img src={recipe.image_url || 'https://picsum.photos/200'} className="w-full h-full object-cover" />
                  <div className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all",
                    selectedIds.has(recipe.id) ? "bg-orange-500 border-orange-500 scale-110" : "bg-black/20"
                  )}>
                    {selectedIds.has(recipe.id) && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white line-clamp-2 leading-tight px-1 font-body">{recipe.title}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-12">Hủy</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || selectedIds.size === 0}
            className="bg-green-600 hover:bg-green-700 rounded-xl font-bold px-10 h-12 shadow-none text-white border-none"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : `Thêm ${selectedIds.size} món`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
