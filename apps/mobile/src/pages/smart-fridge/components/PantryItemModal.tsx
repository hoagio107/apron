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
  AutocompleteItem,
  Avatar
} from '@/ui';
import { 
  Calendar, 
  Trash2, 
  Camera, 
  Layers, 
  Tag, 
  Scale, 
  Image as ImageIcon
} from 'lucide-react';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import type { PantryItem } from '@apron/core';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { FormField } from '../../../components/shared/form/FormField';

interface PantryItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PantryItem | null;
  onSave: (itemData: Omit<PantryItem, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
}

const COMMON_UNITS = ['g', 'kg', 'ml', 'lít', 'quả', 'hộp', 'bó', 'gói', 'củ', 'lon', 'chai', 'khay', 'túi'];

export function PantryItemModal({
  isOpen,
  onOpenChange,
  item,
  onSave,
  onDelete
}: PantryItemModalProps) {
  const isEditing = Boolean(item);
  const { getAllIngredients, getIngredientMetaByName, updateIngredientMeta, addIngredientMeta } = useIngredientCatalogStore();
  const catalogItems = getAllIngredients();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('gam');
  const [group, setGroup] = useState<string>(CATEGORIES.VEGGIES);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setQuantity(String(item.quantity || 1));
        setUnit(item.unit || 'gam');
        setGroup(item.group || autoCategorizeIngredient(item.name));
        setExpiryDate(item.expiry_date || '');
        setNotes(item.notes || '');
        const meta = getIngredientMetaByName(item.name);
        setImageUrl(meta?.image_url || null);
      } else {
        setName('');
        setQuantity('1');
        setUnit('gam');
        setGroup(CATEGORIES.VEGGIES);
        setExpiryDate('');
        setNotes('');
        setImageUrl(null);
      }
    }
  }, [isOpen, item, getIngredientMetaByName]);

  const handleNameChange = (val: string) => {
    setName(val);
    const matched = getIngredientMetaByName(val.trim());
    if (matched) {
      if (matched.default_category) setGroup(matched.default_category);
      if (matched.default_unit) setUnit(matched.default_unit);
      if (matched.image_url) setImageUrl(matched.image_url);
    } else {
      const autoCat = autoCategorizeIngredient(val.trim());
      setGroup(autoCat);
    }
  };

  const handleQuickAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const trimmedName = name.trim();
    // Save image to catalog if uploaded
    if (imageUrl) {
      const existing = getIngredientMetaByName(trimmedName);
      if (existing) {
        updateIngredientMeta(existing.id, { image_url: imageUrl, default_category: group, default_unit: unit });
      } else {
        addIngredientMeta(trimmedName, { image_url: imageUrl, default_category: group, default_unit: unit });
      }
    }

    onSave({
      name: trimmedName,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'đơn vị',
      group,
      expiry_date: expiryDate || undefined,
      added_date: item?.added_date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined
    }, item?.id);

    onOpenChange(false);
  };

  const theme = getCategoryTheme(group);
  const CategoryIcon = theme.icon;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom"
      classNames={{
        wrapper: 'items-end sm:items-center',
        base: 'm-0 sm:m-4 max-h-[92vh] rounded-t-3xl sm:rounded-2xl bg-background border-t sm:border border-divider flex flex-col overflow-hidden max-w-lg w-full',
        body: 'p-4 overflow-y-auto',
        header: 'p-4 pb-2 border-b border-divider flex justify-between items-center',
        footer: 'p-4 pt-3 border-t border-divider bg-background/95 backdrop-blur-md'
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.bg}`}>
                  <CategoryIcon className={`w-4 h-4 ${theme.text}`} />
                </div>
                <span>{isEditing ? 'Chỉnh sửa nguyên liệu' : 'Thêm vào tủ lạnh'}</span>
              </div>
              {isEditing && onDelete && (
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                  className="h-8 w-8 rounded-lg"
                  onPress={() => {
                    if (item) onDelete(item.id);
                    onOpenChange(false);
                  }}
                  aria-label="Xoá nguyên liệu"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </ModalHeader>

            <ModalBody className="flex flex-col gap-4">
              {/* Tên nguyên liệu */}
              <FormField label="Tên nguyên liệu" icon={Tag}>
                <Autocomplete
                  placeholder="VD: Thịt ba chỉ, Trứng gà, Cà chua..."
                  inputValue={name}
                  onInputChange={handleNameChange}
                  onSelectionChange={(key) => {
                    if (key) handleNameChange(String(key));
                  }}
                  allowsCustomValue
                  size="lg"
                  variant="flat"
                  inputProps={{
                    classNames: {
                      inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                      input: 'font-semibold text-base'
                    }
                  }}
                >
                  {catalogItems
                    .filter(ci => !name || ci.name.toLowerCase().includes(name.toLowerCase()))
                    .slice(0, 8)
                    .map((ci) => (
                      <AutocompleteItem
                        key={ci.name}
                        textValue={ci.name}
                        startContent={
                          ci.image_url ? (
                            <Avatar src={ci.image_url} alt={ci.name} size="sm" className="shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-default-200 flex items-center justify-center shrink-0 text-xs">
                              🥗
                            </div>
                          )
                        }
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{ci.name}</span>
                          <span className="text-tiny text-default-400">{ci.default_category || 'Nguyên liệu'}</span>
                        </div>
                      </AutocompleteItem>
                    ))}
                </Autocomplete>
              </FormField>

              {/* Danh mục */}
              <FormField label="Danh mục" icon={Layers}>
                <Select
                  selectedKeys={new Set([group])}
                  onSelectionChange={(keys) => setGroup(Array.from(keys)[0] as string)}
                  variant="flat"
                  size="md"
                  classNames={{
                    trigger: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                  }}
                >
                  {Object.values(CATEGORIES).map(cat => {
                    const cTheme = getCategoryTheme(cat);
                    const CIcon = cTheme.icon;
                    return (
                      <SelectItem key={cat} textValue={cat}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cTheme.bg}`}>
                            <CIcon className={`w-3.5 h-3.5 ${cTheme.text}`} />
                          </div>
                          <span className="font-medium text-sm">{cat}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              </FormField>

              {/* Số lượng & Đơn vị */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Số lượng" icon={Scale}>
                  <Input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    variant="flat"
                    placeholder="1"
                    classNames={{
                      inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                      input: 'font-semibold'
                    }}
                  />
                </FormField>

                <FormField label="Đơn vị" icon={Scale}>
                  <Autocomplete
                    placeholder="gam, quả..."
                    inputValue={unit}
                    onInputChange={setUnit}
                    onSelectionChange={(key) => key && setUnit(String(key))}
                    allowsCustomValue
                    variant="flat"
                    inputProps={{
                      classNames: {
                        inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                        input: 'font-medium'
                      }
                    }}
                  >
                    {COMMON_UNITS.map(u => (
                      <AutocompleteItem key={u} textValue={u}>
                        {u}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </FormField>
              </div>

              {/* Hạn sử dụng (Expiry Date) */}
              <FormField label="Hạn sử dụng" icon={Calendar}>
                <div className="flex flex-col gap-2">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    variant="flat"
                    classNames={{
                      inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                    }}
                  />
                  {/* Phím tắt chọn ngày nhanh */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                    <span className="text-[11px] text-default-400 font-medium shrink-0">HSD:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDays(3)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-default-100 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                    >
                      +3 ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDays(7)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-default-100 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                    >
                      +1 tuần
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDays(14)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-default-100 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                    >
                      +2 tuần
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddDays(30)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-default-100 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                    >
                      +1 tháng
                    </button>
                    {expiryDate && (
                      <button
                        type="button"
                        onClick={() => setExpiryDate('')}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 transition-colors shrink-0"
                      >
                        Bỏ HSD
                      </button>
                    )}
                  </div>
                </div>
              </FormField>

              {/* Ảnh minh hoạ */}
              <FormField label="Ảnh nguyên liệu" icon={ImageIcon}>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border border-divider/60 transition-all ${
                      imageUrl ? 'bg-default-100' : `${theme.bg} ${theme.text}`
                    }`}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <CategoryIcon className="w-8 h-8 opacity-80" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Button
                      size="sm"
                      variant="flat"
                      className="w-fit font-medium text-xs h-8 px-3 rounded-xl"
                      startContent={<Camera className="w-3.5 h-3.5" />}
                      onPress={() => fileInputRef.current?.click()}
                    >
                      {imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                    </Button>
                    <span className="text-[11px] text-default-400">
                      Tự động lưu vào thư viện nguyên liệu
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </FormField>
            </ModalBody>

            <ModalFooter className="flex gap-3">
              <Button
                variant="flat"
                className="flex-1 h-12 rounded-xl font-medium"
                onPress={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                color="primary"
                className="flex-1 h-12 rounded-xl font-semibold shadow-none"
                onPress={handleSubmit}
                isDisabled={!name.trim()}
              >
                {isEditing ? 'Lưu thay đổi' : 'Thêm vào tủ'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
