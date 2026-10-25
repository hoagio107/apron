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
  Autocomplete,
  AutocompleteItem
} from '@/ui';
import {
  Trash2,
  Camera,
  ImagePlus,
  Tag,
  Layers,
  Scale,
  X
} from 'lucide-react';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { useUnitStore } from '../../../store/useUnitStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { FormField } from '../../../components/shared/form/FormField';

interface IngredientModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: IngredientMeta | null;
  onSave: (
    data: { name: string; default_category?: string; default_unit?: string; image_url?: string },
    id?: string
  ) => Promise<void> | void;
  onDeleteRequest?: (item: IngredientMeta) => void;
}

const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'lít',
  'quả',
  'củ',
  'bắp',
  'trái',
  'thìa cà phê',
  'thìa canh',
  'muỗng',
  'bó',
  'gói',
  'lon',
  'hộp',
  'chai',
  'lát',
  'cây',
  'tép',
  'khay'
];

export function IngredientModal({
  isOpen,
  onOpenChange,
  item,
  onSave,
  onDeleteRequest
}: IngredientModalProps) {
  const isEditing = Boolean(item);
  const { units } = useUnitStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES.VEGGIES);
  const [unit, setUnit] = useState('g');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combine store units and common units
  const allUnits = Array.from(
    new Set([...units.map(u => u.name), ...COMMON_UNITS])
  );

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setCategory(item.default_category || autoCategorizeIngredient(item.name));
        setUnit(item.default_unit || 'g');
        setImageUrl(item.image_url);
        setHasManuallySelectedCategory(Boolean(item.default_category));
      } else {
        setName('');
        setCategory(CATEGORIES.VEGGIES);
        setUnit('g');
        setImageUrl(undefined);
        setHasManuallySelectedCategory(false);
      }
    }
  }, [isOpen, item]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasManuallySelectedCategory && !isEditing) {
      const autoCat = autoCategorizeIngredient(val.trim());
      setCategory(autoCat);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setIsSubmitting(true);
      await onSave(
        {
          name: trimmed,
          default_category: category,
          default_unit: unit.trim() || undefined,
          image_url: imageUrl
        },
        item?.id
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom"
      classNames={{
        wrapper: 'items-end sm:items-center',
        base: 'm-0 sm:m-4 max-h-[92vh] rounded-t-3xl sm:rounded-2xl bg-background border-t sm:border border-divider flex flex-col overflow-hidden max-w-lg w-full shadow-2xl',
        body: 'p-4 overflow-y-auto',
        header: 'p-4 pb-2 border-b border-divider flex justify-between items-center',
        footer: 'p-4 pt-3 border-t border-divider bg-background/95 backdrop-blur-md'
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.bg}`}>
                  <CategoryIcon className={`w-4 h-4 ${theme.text}`} />
                </div>
                <span>{isEditing ? 'Chỉnh sửa nguyên liệu' : 'Thêm nguyên liệu mới'}</span>
              </div>
            </ModalHeader>

            <ModalBody className="flex flex-col gap-4">
              {/* Image Upload / Avatar */}
              <div className="flex flex-col items-center justify-center gap-2 py-1">
                <div
                  className="relative cursor-pointer group w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-divider hover:border-primary/60 transition-colors flex items-center justify-center bg-default-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name || 'Nguyên liệu'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-default-400 gap-1">
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-[10px] font-medium">Tải ảnh</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> Đổi ảnh
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className="h-7 text-[11px] rounded-lg px-2.5"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    {imageUrl ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
                  </Button>
                  {imageUrl && (
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      className="h-7 text-[11px] rounded-lg px-2"
                      onPress={() => setImageUrl(undefined)}
                    >
                      <X className="w-3 h-3 mr-0.5" /> Gỡ ảnh
                    </Button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>

              {/* Tên nguyên liệu */}
              <FormField label="Tên nguyên liệu" icon={Tag}>
                <Input
                  placeholder="VD: Thịt ba chỉ, Cà chua bi, Hành hoa..."
                  value={name}
                  onValueChange={handleNameChange}
                  isRequired
                  size="lg"
                  variant="flat"
                  classNames={{
                    inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                    input: 'font-semibold text-sm sm:text-base'
                  }}
                />
              </FormField>

              {/* Nhóm phân loại */}
              <FormField label="Nhóm phân loại" icon={Layers}>
                <Select
                  aria-label="Chọn nhóm phân loại"
                  selectedKeys={[category]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    if (val) {
                      setCategory(val);
                      setHasManuallySelectedCategory(true);
                    }
                  }}
                  size="lg"
                  variant="flat"
                  classNames={{
                    trigger: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                    value: 'font-semibold text-sm'
                  }}
                >
                  {Object.values(CATEGORIES).map((cat) => {
                    const cTheme = getCategoryTheme(cat);
                    const CIcon = cTheme.icon;
                    return (
                      <SelectItem
                        key={cat}
                        textValue={cat}
                        startContent={
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cTheme.bg}`}>
                            <CIcon className={`w-3.5 h-3.5 ${cTheme.text}`} />
                          </div>
                        }
                      >
                        {cat}
                      </SelectItem>
                    );
                  })}
                </Select>
              </FormField>

              {/* Đơn vị mặc định */}
              <FormField label="Đơn vị mặc định" icon={Scale}>
                <Autocomplete
                  aria-label="Chọn hoặc nhập đơn vị mặc định"
                  placeholder="Chọn hoặc nhập đơn vị (VD: g, kg, quả...)"
                  inputValue={unit}
                  onInputChange={(val) => setUnit(val)}
                  onSelectionChange={(key) => {
                    if (key) setUnit(String(key));
                  }}
                  allowsCustomValue
                  size="lg"
                  variant="flat"
                  inputProps={{
                    classNames: {
                      inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                      input: 'font-medium text-sm'
                    }
                  }}
                >
                  {allUnits.map((u) => (
                    <AutocompleteItem key={u} textValue={u}>
                      {u}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </FormField>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between gap-2">
              {isEditing && onDeleteRequest && item ? (
                <Button
                  isIconOnly
                  color="danger"
                  variant="flat"
                  className="h-12 w-12 rounded-xl shrink-0"
                  onPress={() => onDeleteRequest(item)}
                  aria-label="Xoá nguyên liệu"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button
                  variant="flat"
                  onPress={() => onOpenChange(false)}
                  isDisabled={isSubmitting}
                  className="h-12 rounded-xl px-4 text-sm font-medium"
                >
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!name.trim()}
                  className="h-12 rounded-xl px-6 text-sm font-semibold shadow-xs"
                >
                  {isEditing ? 'Lưu thay đổi' : 'Thêm nguyên liệu'}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
