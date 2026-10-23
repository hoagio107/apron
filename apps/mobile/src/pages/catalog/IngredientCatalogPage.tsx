import { useState, useRef } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { useIngredientCatalogStore } from '../../store/useIngredientCatalogStore';
import { Button, Avatar, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@/ui';
import { Trash2, Plus, ImagePlus, BookOpen } from 'lucide-react';
import { CATEGORIES } from '@apron/core';
import { useUnitStore } from '../../store/useUnitStore';
import { useRecipeStore } from '../../store/useRecipeStore';

export function IngredientCatalogPage() {
  const { getAllIngredients, updateIngredientMeta, addIngredientMeta, removeIngredientMeta } = useIngredientCatalogStore();
  const { recipes, updateIngredientInRecipes, removeIngredientFromRecipes, detachIngredientFromRecipes } = useRecipeStore();
  const { units } = useUnitStore();
  const items = getAllIngredients();
  
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [group, setGroup] = useState('');
  const [image, setImage] = useState<string | undefined>();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = (existingItem?: any) => {
    if (existingItem) {
      setEditingId(existingItem.id);
      setName(existingItem.name);
      setUnit(existingItem.default_unit || '');
      setGroup(existingItem.default_category || '');
      setImage(existingItem.image_url);
    } else {
      setEditingId('');
      setName('');
      setUnit('');
      setGroup('');
      setImage(undefined);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    if (editingId) {
      // If we rename it, cascade to recipes
      const oldItem = items.find(i => i.id === editingId);
      if (oldItem && oldItem.name !== name.trim()) {
        await updateIngredientInRecipes(editingId, name.trim());
      }
      
      updateIngredientMeta(editingId, {
        name: name.trim(),
        default_category: group || undefined,
        default_unit: unit || undefined,
        image_url: image
      });
    } else {
      addIngredientMeta(name.trim(), {
        default_category: group || undefined,
        default_unit: unit || undefined,
        image_url: image
      });
    }
    
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (itemId: string, itemName: string) => {
    const affectedRecipes = recipes.filter(r => r.ingredients?.some(i => i.ingredient_id === itemId));
    
    if (affectedRecipes.length > 0) {
      const choice = window.prompt(
        `Nguyên liệu "${itemName}" đang được dùng trong ${affectedRecipes.length} công thức.\n` +
        `Bạn muốn làm gì?\n` +
        `1: Xóa hoàn toàn khỏi các công thức.\n` +
        `2: Giữ lại trong công thức dưới dạng chữ (mất liên kết).`
      );
      
      if (choice === '1') {
        await removeIngredientFromRecipes(itemId);
      } else if (choice === '2') {
        await detachIngredientFromRecipes(itemId);
      } else {
        return; // Cancel
      }
    } else {
      if (!window.confirm(`Bạn có chắc muốn xóa "${itemName}" khỏi từ điển?`)) return;
    }
    
    removeIngredientMeta(itemId);
  };

  return (
    <div className="h-full flex flex-col pt-6 bg-default-50/50">
      <PageHeader 
        title="Từ điển nguyên liệu" 
        description="Quản lý toàn bộ danh mục nguyên liệu, hình ảnh và phân loại"
        className="pt-0"
        showBackButton={false}
        actions={
          <Button isIconOnly color="primary" onPress={() => handleOpen()}>
            <Plus className="w-5 h-5" />
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-default-300" />}
            title="Từ điển đang trống"
            description="Bấm 'Thêm nguyên liệu' để bắt đầu xây dựng từ điển của bạn."
            action={
              <Button color="primary" onPress={() => handleOpen()} startContent={<Plus className="w-4 h-4" />}>
                Thêm nguyên liệu
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 md:gap-6">
            {items.map(item => (
              <div 
                key={item.name} 
                onClick={() => handleOpen(item)} 
                className="cursor-pointer group flex flex-col gap-2 hover:-translate-y-1 transition-transform"
              >
                <div className="w-full aspect-square bg-default-100 rounded-2xl overflow-hidden relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-default-400">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-center px-1">
                  <h3 className="font-bold text-sm line-clamp-1" title={item.name}>{item.name}</h3>
                  <p className="text-xs text-default-500 mt-1">
                    {item.default_category || 'Chưa phân loại'}
                    {item.default_unit ? ` • ${item.default_unit}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingId ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div 
                className="relative cursor-pointer group w-24 h-24"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <Avatar src={image} className="w-24 h-24 text-large" radius="lg" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-default-100 flex items-center justify-center text-default-400 group-hover:bg-default-200 transition-colors">
                    <ImagePlus className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Đổi ảnh</span>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
            </div>
            
            <div className="flex flex-col gap-4">
              <Input 
                label="Tên nguyên liệu" 
                placeholder="VD: Thịt bò" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
              />
              
              <Select
                label="Nhóm phân loại (Mặc định)"
                selectedKeys={group ? [group] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setGroup(val);
                }}
              >
                {Object.values(CATEGORIES).map(cat => (
                  <SelectItem key={cat}>{cat}</SelectItem>
                ))}
              </Select>
              
              <Select
                label="Đơn vị (Mặc định)"
                selectedKeys={unit ? [unit] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setUnit(val);
                }}
              >
                {units.map(u => (
                  <SelectItem key={u.name}>{u.name}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            {editingId ? (
              <Button isIconOnly color="danger" variant="light" size="md" onPress={() => {
                handleDelete(editingId, name);
                onClose();
              }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : <div></div>}
            <div className="flex gap-2">
              <Button color="default" variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button color="primary" onPress={handleSave}>
                Lưu
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
