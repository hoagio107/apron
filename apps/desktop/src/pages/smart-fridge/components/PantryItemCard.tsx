import { useRef, useState } from 'react';
import { Card, CardBody, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from '@/ui';
import { Trash2, MoreHorizontal, Check, X, Pencil } from 'lucide-react';
import type { PantryItem } from '@apron/core';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { usePantryStore } from '../../../store/usePantryStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';

interface PantryItemCardProps {
  item: PantryItem;
  onRemove: (id: string) => void;
}

const isExpired = (date?: string) => {
  if (!date) return false;
  return new Date(date).getTime() < new Date().getTime();
};

const isNearExpiry = (date?: string) => {
  if (!date) return false;
  const daysUntil = (new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
  return daysUntil > 0 && daysUntil <= 3;
};

export function PantryItemCard({ item, onRemove }: PantryItemCardProps) {
  const { getIngredientMetaByName, updateIngredientMeta, addIngredientMeta } = useIngredientCatalogStore();
  const { updateItem } = usePantryStore();
  const meta = getIngredientMetaByName(item.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editQty, setEditQty] = useState(String(item.quantity));
  const [editExpiry, setEditExpiry] = useState(item.expiry_date || '');

  const expired = isExpired(item.expiry_date);
  const nearExpiry = isNearExpiry(item.expiry_date);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (meta) {
          updateIngredientMeta(meta.id, { image_url: base64String });
        } else {
          addIngredientMeta(item.name, { image_url: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = () => {
    updateItem(item.id, {
      quantity: Number(editQty) || item.quantity,
      expiry_date: editExpiry || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditQty(String(item.quantity));
    setEditExpiry(item.expiry_date || '');
    setIsEditing(false);
  };

  const theme = getCategoryTheme(item.group);
  const Icon = theme.icon;

  return (
    <div className="flex flex-col group relative gap-2">
      
      {/* Action Menu (Top Right) */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly variant="flat" size="sm" className="bg-background/80 backdrop-blur-md shadow-sm text-default-600 hover:text-default-900">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Ingredient actions">
            <DropdownItem
              key="edit"
              startContent={<Pencil className="w-4 h-4" />}
              onPress={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={() => onRemove(item.id)}
            >
              Xóa nguyên liệu
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Image/Icon */}
      <div 
        className={`relative cursor-pointer shrink-0 group/img w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden transition-all ${expired ? 'ring-2 ring-danger-400' : nearExpiry ? 'ring-2 ring-warning-400' : 'bg-default-50 hover:opacity-90'}`}
        onClick={() => fileInputRef.current?.click()}
        title="Nhấn để cập nhật ảnh"
      >
        {meta?.image_url ? (
          <img src={meta.image_url} className="w-full h-full object-cover" alt={item.name} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center transition-colors ${theme.bg} ${theme.text}`}>
            <Icon className="w-12 h-12 opacity-80" />
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col items-start text-left px-1">
        {isEditing ? (
          <div className="flex flex-col gap-2 w-full mt-1">
            <Input
              type="number"
              size="sm"
              placeholder="SL"
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
              aria-label="Số lượng"
              endContent={<span className="text-xs text-default-400">{item.unit}</span>}
            />
            <Input
              type="date"
              size="sm"
              value={editExpiry}
              onChange={e => setEditExpiry(e.target.value)}
              aria-label="Ngày hết hạn"
            />
            <div className="flex justify-start gap-2 mt-1">
              <Button isIconOnly size="sm" color="success" variant="flat" onPress={handleSaveEdit}>
                <Check className="w-4 h-4" />
              </Button>
              <Button isIconOnly size="sm" variant="flat" onPress={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full items-start gap-0.5">
            <div className="font-semibold text-base line-clamp-1 w-full text-foreground" title={item.name}>
              {item.name}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-default-500 font-medium">
                {item.quantity} {item.unit}
              </span>
              {item.expiry_date && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${expired ? 'bg-danger-100 text-danger-700' : nearExpiry ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'}`}>
                  {expired ? 'Hết hạn' : nearExpiry ? 'Sắp hết' : 'Còn tươi'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
