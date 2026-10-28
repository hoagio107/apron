import { ShoppingBasket, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShoppingListStore } from '../../../store/useShoppingListStore';

export function ShoppingListQuickActions() {
  const { t } = useTranslation();
  const { addItem } = useShoppingListStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Quick Action 1 */}
      <div 
        className="bg-success/10 dark:bg-success/15 border border-success-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-success/10 dark:hover:bg-success/20 transition-colors group"
        onClick={() => alert(t('shopping.openFrequentHint'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success shrink-0">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-success-800">{t('shopping.addFrequent')}</span>
            <span className="text-xs text-success-600">{t('shopping.addFrequentDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-success-400 group-hover:text-success-600 transition-colors" />
      </div>

      {/* Quick Action 2 */}
      <div 
        className="bg-primary/10 dark:bg-primary/15 border border-primary-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group"
        onClick={() => alert(t('shopping.dragRecipeHint'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary-800">{t('shopping.addFromRecipe')}</span>
            <span className="text-xs text-primary-600">{t('shopping.addFromRecipeDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-colors" />
      </div>

      {/* Quick Action 3 */}
      <div 
        className="bg-secondary/10 dark:bg-secondary/15 border border-secondary-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors group"
        onClick={() => addItem(t('shopping.aiSampleBeef'), '500', 'g', t('shopping.meatSeafood'))}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-secondary-800">{t('shopping.aiSuggestedItems')}</span>
            <span className="text-xs text-secondary-600">{t('shopping.aiSuggestedDesc')}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-secondary-400 group-hover:text-secondary-600 transition-colors" />
      </div>

    </div>
  );
}

