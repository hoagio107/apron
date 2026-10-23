import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@/ui';
import { Tags, Plus, Check } from 'lucide-react';

interface TagSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableTags: string[];
  onConfirm: (tags: string[]) => void;
  recipeCount?: number;
}

export function TagSelectModal({ isOpen, onOpenChange, availableTags, onConfirm, recipeCount = 1 }: TagSelectModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Combine existing available tags with any newly added ones during this session
  const [sessionTags, setSessionTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTags([]);
      setNewTagInput('');
      setSessionTags([...availableTags]);
    }
  }, [isOpen, availableTags]);

  const handleConfirm = () => {
    onConfirm(selectedTags);
    onOpenChange(false);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !sessionTags.includes(trimmed)) {
      setSessionTags([...sessionTags, trimmed].sort());
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    } else if (trimmed && sessionTags.includes(trimmed) && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setNewTagInput('');
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Gắn thẻ
              {recipeCount > 1 && (
                <span className="text-sm font-normal text-default-500">
                  Đang gắn thẻ cho {recipeCount} công thức
                </span>
              )}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Thêm thẻ mới..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewTag();
                    }}
                    startContent={<Tags className="w-4 h-4 text-default-400" />}
                    className="flex-1"
                  />
                  <Button 
                    isIconOnly 
                    color="primary" 
                    variant="flat" 
                    onPress={handleAddNewTag}
                    isDisabled={!newTagInput.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">Thẻ có sẵn</span>
                  {sessionTags.length === 0 ? (
                    <p className="text-sm text-default-400 italic">Chưa có thẻ nào được tạo.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sessionTags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <div 
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all
                              ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-default-100 text-default-700 active:bg-default-200'}
                            `}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button color="primary" onPress={handleConfirm} isDisabled={selectedTags.length === 0}>
                Xác nhận
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
