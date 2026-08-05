
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, Check, X, ChefHat } from 'lucide-react';
import { Recipe } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';
import { useRecipes } from '@/hooks/use-recipes';
import { ImageUploader } from './ImageUploader';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecipes: Recipe[];
}

export function BulkImageUploadModal({ 
  isOpen, 
  onClose, 
  selectedRecipes 
}: BulkImageUploadModalProps) {
  const { updateRecipe } = useRecipes();
  const [isSaving, setIsSaving] = useState(false);
  const [tempImages, setTempImages] = useState<Record<string, string>>({});

  const handleImageChange = (recipeId: string, url: string) => {
    setTempImages(prev => ({ ...prev, [recipeId]: url }));
  };

  const handleSave = async () => {
    const entries = Object.entries(tempImages);
    if (entries.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const promises = entries.map(([id, url]) => updateRecipe(id, { image_url: url }));
      await Promise.all(promises);
      setTempImages({});
      onClose();
    } catch (e) {
      console.error("Bulk upload save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] rounded-[2.5rem] p-0 overflow-hidden flex flex-col h-[85vh] gap-0 border-none shadow-none">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <div className="flex justify-between items-center pr-10">
            <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" /> Thêm ảnh hàng loạt
            </DialogTitle>
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              {selectedRecipes.length}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-white dark:bg-gray-900">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex flex-col gap-3 p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate flex-1 font-body">{recipe.title}</p>
                </div>
                
                <ImageUploader 
                  value={tempImages[recipe.id] !== undefined ? tempImages[recipe.id] : recipe.image_url} 
                  onChange={(url) => handleImageChange(recipe.id, url)}
                  className="border-none shadow-none bg-transparent p-0"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-gray-50/50 flex flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="rounded-2xl font-bold h-12 flex-1 shadow-none"
          >
            Hủy bỏ
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold px-4 md:px-10 h-12 shadow-none text-white border-none flex-[2] transition-transform active:scale-95"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />}
            Lưu tất cả ảnh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
