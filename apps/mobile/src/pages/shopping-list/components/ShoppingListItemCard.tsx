import { Checkbox, Button, Autocomplete, AutocompleteItem } from '@/ui';
import { Minus, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { CATEGORIES } from '@apron/core';
import { Avatar } from '@/ui';
import { ImageManager } from '../../../lib/image-manager';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { useUnitStore } from '../../../store/useUnitStore';

interface ShoppingListItemCardProps {
  item: any;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
  onUpdateUnit?: (id: string, newUnit: string) => void;
}

export function ShoppingListItemCard({ item, onToggle, onRemove, onUpdateQuantity, onUpdateUnit }: ShoppingListItemCardProps) {
  const { getIngredientMetaByName } = useIngredientCatalogStore();
  const { units } = useUnitStore();
  const meta = getIngredientMetaByName(item.name);
  const imageUrl = meta?.image_url;



  const handleIncrement = () => {
    const qty = parseInt(item.quantity?.toString() || '0');
    if (!isNaN(qty)) {
      onUpdateQuantity?.(item.id, qty + 1);
    }
  };

  const handleDecrement = () => {
    const qty = parseInt(item.quantity?.toString() || '0');
    if (!isNaN(qty) && qty > 0) {
      onUpdateQuantity?.(item.id, qty - 1);
    }
  };

  return (
    <div className={`app-card flex items-center gap-4 p-3 transition-all ${item.checked ? 'opacity-60' : 'hover:bg-content2'}`}>
      <Checkbox 
        isSelected={item.checked}
        onValueChange={() => onToggle(item.id)}
        size="md"
        classNames={{
          wrapper: "border-2 border-default-300 before:border-transparent data-[selected=true]:border-primary"
        }}
        radius="full"
      />
      
      {(() => {
        const theme = getCategoryTheme(item.group || meta?.default_category);
        const Icon = theme.icon;
        
        return imageUrl ? (
          <Avatar 
            src={ImageManager.getAssetUrl(imageUrl)} 
            radius="lg" 
            showFallback
            className="w-12 h-12 flex-shrink-0 bg-default-100" 
            fallback={<Icon className="w-6 h-6 text-default-400" />}
          />
        ) : (
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
            <Icon className="w-6 h-6" />
          </div>
        );
      })()}

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-foreground truncate ${item.checked ? 'line-through text-default-500' : ''}`}>
          {item.name || item.title || item.ingredient_name || 'Nguyên liệu không tên'}
        </h3>
      </div>

      <div className="flex items-center gap-0">
        <div className="flex items-center gap-0">
        <Button 
          isIconOnly 
          size="md" 
          variant="light" 
          className="text-default-500 w-6 h-6 min-w-6"
          onPress={handleDecrement}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-sm font-medium w-6 text-center">{item.quantity || 1}</span>
        <Button 
          isIconOnly 
          size="md" 
          variant="light" 
          className="text-primary w-6 h-6 min-w-6"
          onPress={handleIncrement}
        >
          <Plus className="w-3 h-3" />
        </Button>
        </div>
        
        <Autocomplete 
          size="sm"
          variant="flat"
          className="w-36"
          placeholder="Đơn vị"
          defaultSelectedKey={item.unit}
          defaultInputValue={item.unit || ''}
          allowsCustomValue
          onSelectionChange={(key) => {
            if (key !== null) {
              onUpdateUnit?.(item.id, key.toString());
            }
          }}
          onInputChange={(val) => {
            onUpdateUnit?.(item.id, val);
          }}
          aria-label="Đơn vị"
          classNames={{ 
            base: "w-36 h-8",
            clearButton: "hover:bg-transparent data-[hover=true]:bg-transparent",
            selectorButton: "hidden"
          }}
          inputProps={{
            classNames: {
              input: "text-sm",
              inputWrapper: "px-2 h-8 min-h-8 bg-transparent shadow-none hover:bg-default-100/50 data-[hover=true]:bg-default-100/50 group-data-[focus=true]:bg-default-100/50"
            }
          }}
        >
          {units.map((u) => (
            <AutocompleteItem key={u.name} value={u.name}>
              {u.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </div>

      <Dropdown>
        <DropdownTrigger>
          <Button isIconOnly variant="light" size="md" className="text-default-400">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Item actions">
          <DropdownItem 
            key="delete" 
            className="text-danger" 
            color="danger" 
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={() => onRemove(item.id)}
          >
            Xóa
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
