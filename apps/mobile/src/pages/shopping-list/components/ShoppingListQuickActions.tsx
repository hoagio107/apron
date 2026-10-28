import { ShoppingBasket, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { toast } from '@/ui';

export function ShoppingListQuickActions() {
  const { t } = useTranslation();
  const { addItem } = useShoppingListStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Quick Action 1 */}
      <div 
        className="bg-success/10 dark:bg-success/15 border border-success/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-success/20 transition-colors group"
        onClick={() => toast.info(t('shopping.openFrequentHint'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-success">{t('shopping.addFrequent')}</span>
            <span className="text-xs text-default-500">{t('shopping.addFrequentDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-success group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Quick Action 2 */}
      <div 
        className="bg-primary/10 dark:bg-primary/15 border border-primary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors group"
        onClick={() => toast.info(t('shopping.dragRecipeHint'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">{t('shopping.addFromRecipe')}</span>
            <span className="text-xs text-default-500">{t('shopping.addFromRecipeDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Quick Action 3 */}
      <div 
        className="bg-secondary/10 dark:bg-secondary/15 border border-secondary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors group"
        onClick={() => addItem(t('shopping.aiSampleBeef'), '500', 'g', t('shopping.meatSeafood'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-secondary">{t('shopping.aiSuggestedItems')}</span>
            <span className="text-xs text-default-500">{t('shopping.aiSuggestedDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-0.5 transition-transform" />
      </div>

    </div>
  );
}

