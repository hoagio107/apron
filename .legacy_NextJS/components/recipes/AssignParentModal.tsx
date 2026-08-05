
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, Loader2, Layers, X } from 'lucide-react';
import { Recipe } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';

interface AssignParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (parentId: string) => Promise<void>;
  allRecipes: Recipe[];
  excludeIds: string[];
}

export function AssignParentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  allRecipes,
  excludeIds 
}: AssignParentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    // Loại bỏ các món đang được chọn (vì chúng sẽ là con) và chỉ lấy các món gốc (không có parent_id)
    const candidates = allRecipes.filter(r => !excludeIds.includes(r.id) && (!r.parent_id || r.parent_id === ""));
    
    if (!term) return candidates;
    return candidates.filter(r => r.title.toLowerCase().includes(term));
  }, [allRecipes, searchTerm, excludeIds]);

  const handleConfirm = async () => {
    if (!selectedParentId) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedParentId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-3xl p-0 overflow-hidden flex flex-col h-[70vh] gap-0 border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" /> Chọn công thức cha
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <Input 
              placeholder="Tìm món làm gốc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-none rounded-xl font-bold shadow-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-white">
          {filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id}
              onClick={() => setSelectedParentId(recipe.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer",
                selectedParentId === recipe.id 
                  ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100" 
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={recipe.image_url || 'https://picsum.photos/100'} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate font-body">{recipe.title}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Công thức gốc</p>
              </div>
              {selectedParentId === recipe.id && (
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white stroke-[3px]" />
                </div>
              )}
            </div>
          ))}
          {filteredRecipes.length === 0 && (
            <div className="py-10 text-center opacity-30">
              <Search className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase">Không tìm thấy món phù hợp</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50/50 flex flex-row gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="rounded-xl font-bold h-12 bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-none border-none flex-1"
          >
            <X className="w-4 h-4 mr-1 md:mr-2" /> Hủy
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || !selectedParentId}
            className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold px-4 md:px-10 h-12 shadow-none text-white border-none flex-[2]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <><Check className="w-4 h-4 mr-1 md:mr-2" /> Xác nhận</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
