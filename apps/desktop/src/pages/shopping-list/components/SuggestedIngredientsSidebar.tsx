import { Button } from '@/ui';
import { Plus, Sparkles } from 'lucide-react';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { CATEGORIES } from '@apron/core';

const SUGGESTIONS = [
  {
    category: CATEGORIES.VEGGIES,
    icon: '🥦',
    items: ['Hành lá', 'Tỏi', 'Ớt', 'Chanh', 'Sả', 'Gừng', 'Hành tây', 'Cà chua', 'Rau mùi']
  },
  {
    category: CATEGORIES.MEAT_SEAFOOD,
    icon: '🥩',
    items: ['Thịt heo xay', 'Thịt bò', 'Thịt ba chỉ', 'Ức gà', 'Tôm', 'Cá hồi']
  },
  {
    category: CATEGORIES.DAIRY_EGGS,
    icon: '🥛',
    items: ['Trứng gà', 'Sữa tươi', 'Bơ lạt', 'Phô mai']
  },
  {
    category: CATEGORIES.SPICES_SAUCES,
    icon: '🧂',
    items: ['Nước mắm', 'Dầu ăn', 'Đường', 'Muối', 'Hạt nêm', 'Tiêu', 'Nước tương', 'Tương ớt', 'Dầu hào']
  },
  {
    category: CATEGORIES.GRAINS_CARBS,
    icon: '🍚',
    items: ['Gạo', 'Mì gói', 'Bún khô', 'Bánh mì']
  }
];

export function SuggestedIngredientsSidebar() {
  const { addItem } = useShoppingListStore();

  return (
    <div className="h-full app-card flex flex-col overflow-hidden">
      <div className="p-4">
        <h2 className="app-card-title mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning" />
          Gợi ý thường mua
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <div className="flex flex-col gap-6">
          {SUGGESTIONS.map((section) => (
            <div key={section.category} className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-default-500 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">{section.icon}</span>
                {section.category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <Button
                    key={item}
                    variant="flat"
                    size="sm"
                    color="default"
                    className="bg-default-100 hover:bg-primary-50 hover:text-primary transition-colors text-xs font-medium"
                    startContent={<Plus className="w-3 h-3" />}
                    onPress={() => addItem(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
