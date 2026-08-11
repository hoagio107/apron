import { useState, useEffect, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@apron/ui';
import { Search, Link as LinkIcon } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { ImageManager } from '../../../lib/image-manager';

interface ParentRecipeSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  onConfirm: (parentId: string) => void;
  recipeCount?: number;
}

export function ParentRecipeSelectModal({ isOpen, onOpenChange, recipes, onConfirm, recipeCount = 1 }: ParentRecipeSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedParentId(null);
    }
  }, [isOpen]);

  // Only recipes that are not variants themselves can be parents
  const availableParents = useMemo(() => {
    return recipes.filter(r => !r.parent_id);
  }, [recipes]);

  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return availableParents;
    const q = searchQuery.toLowerCase();
    return availableParents.filter(r => r.title.toLowerCase().includes(q));
  }, [availableParents, searchQuery]);

  const handleConfirm = () => {
    if (selectedParentId) {
      onConfirm(selectedParentId);
      onOpenChange(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Gán công thức gốc (Parent Recipe)
              {recipeCount > 1 && (
                <span className="text-sm font-normal text-default-500">
                  Sẽ gán {recipeCount} công thức được chọn làm biến thể của công thức dưới đây.
                </span>
              )}
            </ModalHeader>
            <ModalBody>
              <Input
                placeholder="Tìm công thức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="w-4 h-4 text-default-400" />}
                className="mb-2"
                isClearable
                onClear={() => setSearchQuery('')}
              />

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {filteredParents.length === 0 ? (
                  <p className="text-sm text-default-400 italic text-center py-4">Không tìm thấy công thức nào.</p>
                ) : (
                  filteredParents.map(recipe => (
                    <div
                      key={recipe.id}
                      onClick={() => setSelectedParentId(recipe.id!)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                        selectedParentId === recipe.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-transparent hover:bg-default-100'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-default-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {recipe.image_url ? (
                          <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-default-400 text-xs">No img</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-sm truncate">{recipe.title}</span>
                        {recipe.tags && recipe.tags.length > 0 && (
                          <span className="text-xs text-default-500 truncate">{recipe.tags.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button color="primary" onPress={handleConfirm} isDisabled={!selectedParentId} startContent={<LinkIcon className="w-4 h-4" />}>
                Xác nhận Gán
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
