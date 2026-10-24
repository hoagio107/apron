import { useState, useMemo, useEffect } from 'react';
import type { Key } from 'react';
import { Autocomplete, AutocompleteItem, Avatar } from '@/ui';
import { Plus, Check } from 'lucide-react';
import { useIngredientCatalogStore, type IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { ImageManager } from '../../../lib/image-manager';
import { AddIngredientDrawer } from './AddIngredientDrawer';

interface IngredientComboboxProps {
  value?: string;
  ingredientId?: string;
  onChange: (name: string, ingredientId?: string, defaultUnit?: string) => void;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export function IngredientCombobox({
  value = '',
  ingredientId,
  onChange,
  isInvalid,
  errorMessage,
  className
}: IngredientComboboxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [justCreated, setJustCreated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { getAllIngredients } = useIngredientCatalogStore();
  const catalog = getAllIngredients();

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const normalized = inputValue.trim().toLowerCase();

  // Tìm nguyên liệu khớp tên hoàn toàn trong danh mục
  const exactMatch = useMemo(() => {
    if (!normalized) return null;
    return catalog.find(item => item.name.trim().toLowerCase() === normalized);
  }, [catalog, normalized]);

  // Kiểm tra xem đây có phải là nguyên liệu mới cần thêm không
  const isNewIngredient = Boolean(normalized.length > 0 && !exactMatch);

  const handleSelectionChange = (key: Key | null) => {
    if (!key) return;
    const strKey = key.toString();

    // Mở drawer Thêm nguyên liệu khi bấm vào dòng thêm mới
    if (strKey.startsWith('__create_new__')) {
      setIsDrawerOpen(true);
      return;
    }

    const selected = catalog.find(i => i.id === strKey);
    if (selected) {
      onChange(selected.name, selected.id, selected.default_unit);
      setInputValue(selected.name);
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 50);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const trimmed = val.trim();
    const existing = catalog.find(i => i.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      onChange(val, existing.id, existing.default_unit);
    } else {
      onChange(val, undefined, undefined);
    }
  };

  const handleDrawerSuccess = (newIngredient: IngredientMeta) => {
    onChange(newIngredient.name, newIngredient.id, newIngredient.default_unit);
    setInputValue(newIngredient.name);
    setJustCreated(true);
    setTimeout(() => setJustCreated(false), 2000);
  };

  return (
    <>
      <Autocomplete
        allowsCustomValue
        placeholder="Tìm hoặc gõ nguyên liệu..."
        variant="flat"
        className={className || "flex-1"}
        aria-label="Tên nguyên liệu"
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSelectionChange={handleSelectionChange}
        selectedKey={ingredientId || null}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        defaultFilter={(textValue, filterInput) => {
          if (textValue.startsWith('__create_new__')) return true;
          return textValue.toLowerCase().includes(filterInput.toLowerCase());
        }}
        classNames={{
          base: "bg-default-100 hover:bg-default-200 border-none shadow-none rounded-medium",
          listboxWrapper: "max-h-72"
        }}
        inputProps={{
          classNames: {
            inputWrapper: "bg-transparent shadow-none border-none",
          }
        }}
        endContent={
          justCreated ? (
            <div className="flex items-center gap-1 text-success text-xs font-semibold px-2 py-0.5 rounded-md bg-success/15 shrink-0 mr-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Đã lưu DB
            </div>
          ) : null
        }
      >
        {[
          ...catalog.map((item) => {
            const theme = getCategoryTheme(item.default_category);
            const Icon = theme.icon;
            return (
              <AutocompleteItem
                key={item.id}
                textValue={item.name}
                className="data-[hover=true]:bg-default-100 data-[hover=true]:text-default-foreground transition-colors py-1.5"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image_url ? (
                      <Avatar
                        alt={item.name}
                        className="shrink-0 w-7 h-7"
                        size="sm"
                        src={ImageManager.getAssetUrl(item.image_url)}
                        name={item.name}
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-medium truncate text-foreground">{item.name}</span>
                      {item.default_category && (
                        <span className="text-tiny text-default-400 truncate leading-tight">
                          {item.default_category}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.default_unit && (
                    <span className="text-xs text-default-400 shrink-0 font-medium px-1.5 py-0.5 bg-default-100 dark:bg-default-50/10 rounded">
                      {item.default_unit}
                    </span>
                  )}
                </div>
              </AutocompleteItem>
            );
          }),

          ...(isNewIngredient ? [
            <AutocompleteItem
              key="__create_new__"
              textValue={`__create_new__ ${inputValue.trim()}`}
              className="py-2.5 border-t border-divider/40 data-[hover=true]:bg-default-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs text-default-400 font-normal">Thêm mới:</span>
                  <span className="text-sm font-semibold text-primary truncate">"{inputValue.trim()}"</span>
                </div>
              </div>
            </AutocompleteItem>
          ] : [])
        ]}
      </Autocomplete>

      {/* Drawer thêm nguyên liệu đè lên trang công thức */}
      <AddIngredientDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        initialName={inputValue}
        onSuccess={handleDrawerSuccess}
      />
    </>
  );
}
