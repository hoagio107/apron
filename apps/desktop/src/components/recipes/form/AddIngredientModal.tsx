import { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  Select, 
  SelectItem,
  Avatar 
} from '@/ui';
import { Plus, ImagePlus, Database } from 'lucide-react';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import { useIngredientCatalogStore, type IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { useUnitStore } from '../../../store/useUnitStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';

interface AddIngredientModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess: (newIngredient: IngredientMeta) => void;
}

export function AddIngredientModal({
  isOpen,
  onOpenChange,
  initialName = '',
  onSuccess
}: AddIngredientModalProps) {
  const { addIngredientMeta } = useIngredientCatalogStore();
  const { units } = useUnitStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('g');
  const [image, setImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const trimmed = initialName.trim();
      setName(trimmed);
      
      const suggestedCat = trimmed ? autoCategorizeIngredient(trimmed) : (CATEGORIES.OTHERS || 'Khác');
      setCategory(suggestedCat);

      const defaultU = suggestedCat === CATEGORIES.SPICES_SAUCES ? 'muỗng' : 'g';
      setUnit(defaultU);
      setImage(undefined);
    }
  }, [isOpen, initialName]);

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

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newIngredient = addIngredientMeta(trimmed, {
      default_category: category || undefined,
      default_unit: unit || undefined,
      image_url: image
    });

    onSuccess(newIngredient);
    onOpenChange(false);
  };

  const currentTheme = getCategoryTheme(category);
  const CategoryIcon = currentTheme.icon;

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="lg"
      backdrop="opaque"
      classNames={{
        base: "bg-content1 border border-divider/40 rounded-2xl shadow-2xl",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2.5 px-6 py-4 border-b border-divider/40">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-semibold text-foreground">
                  Thêm nguyên liệu vào Database
                </span>
                <span className="text-tiny text-default-400 font-normal">
                  Lưu vào từ điển nguyên liệu để dùng lại cho các công thức khác
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="p-6 flex flex-col gap-6">
              {/* Tải ảnh đại diện */}
              <div className="flex items-center gap-4 py-2 px-0">
                <div 
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {image ? (
                    <Avatar src={image} className="w-16 h-16 text-large" radius="lg" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-default-100 flex items-center justify-center text-default-400 group-hover:bg-default-200 transition-colors border border-dashed border-default-300">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-tiny font-medium">Đổi ảnh</span>
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-foreground">Hình ảnh minh họa</span>
                  <span className="text-tiny text-default-400">
                    Tuỳ chọn tải ảnh cho nguyên liệu để dễ nhận diện trong danh mục
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* Tên nguyên liệu */}
              <Input 
                label="Tên nguyên liệu" 
                labelPlacement="outside"
                placeholder="VD: Ức gà, Hành lá, Muối hột..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
                variant="bordered"
                classNames={{
                  inputWrapper: "border-default-200 focus-within:!border-primary",
                  label: "text-xs font-semibold text-default-700",
                }}
              />

              {/* Nhóm phân loại */}
              <Select
                label="Nhóm phân loại (Danh mục)"
                labelPlacement="outside"
                placeholder="Chọn nhóm phân loại"
                selectedKeys={category ? [category] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setCategory(val);
                }}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 focus-within:!border-primary",
                  label: "text-xs font-semibold text-default-700",
                }}
                startContent={
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${currentTheme.bg} ${currentTheme.text} shrink-0`}>
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                }
              >
                {Object.values(CATEGORIES).map((cat) => {
                  const theme = getCategoryTheme(cat);
                  const Icon = theme.icon;
                  return (
                    <SelectItem 
                      key={cat} 
                      textValue={cat}
                      startContent={
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${theme.bg} ${theme.text}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      }
                    >
                      {cat}
                    </SelectItem>
                  );
                })}
              </Select>

              {/* Đơn vị đo */}
              <Select
                label="Đơn vị đo mặc định"
                labelPlacement="outside"
                placeholder="Chọn đơn vị đo"
                selectedKeys={unit ? [unit] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setUnit(val);
                }}
                variant="bordered"
                classNames={{
                  trigger: "border-default-200 focus-within:!border-primary",
                  label: "text-xs font-semibold text-default-700",
                }}
              >
                {units.map((u) => (
                  <SelectItem key={u.name} textValue={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-divider/40 flex justify-end gap-2 bg-content1">
              <Button 
                variant="light" 
                color="default" 
                onPress={onClose}
              >
                Hủy
              </Button>
              <Button 
                color="primary" 
                variant="solid"
                className="text-white font-medium"
                onPress={handleSave}
                isDisabled={!name.trim()}
                startContent={<Plus className="w-4 h-4" />}
              >
                Lưu vào Database
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
