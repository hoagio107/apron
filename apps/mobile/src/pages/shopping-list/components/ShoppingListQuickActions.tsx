import { ShoppingBasket, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { toast } from '@/ui';

export function ShoppingListQuickActions() {
  const { addItem } = useShoppingListStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Quick Action 1 */}
      <div 
        className="bg-success/10 dark:bg-success/15 border border-success/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-success/20 transition-colors group"
        onClick={() => toast.info('Đang mở danh sách nguyên liệu hay dùng...')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-success">Thêm từ hay dùng</span>
            <span className="text-xs text-default-500">Thêm nhanh từ danh sách hay dùng</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-success group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Quick Action 2 */}
      <div 
        className="bg-primary/10 dark:bg-primary/15 border border-primary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors group"
        onClick={() => toast.info('Kéo thả công thức từ cột bên phải vào danh sách để thêm nguyên liệu!')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary">Thêm từ công thức</span>
            <span className="text-xs text-default-500">Chọn từ công thức nấu ăn</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Quick Action 3 */}
      <div 
        className="bg-secondary/10 dark:bg-secondary/15 border border-secondary/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors group"
        onClick={() => addItem('Thịt bò (AI gợi ý)', '500', 'g', 'Thịt & Hải sản')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-secondary">AI gợi ý cần mua</span>
            <span className="text-xs text-default-500">Dựa trên nguyên liệu trong tủ lạnh</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-0.5 transition-transform" />
      </div>

    </div>
  );
}
