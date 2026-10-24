import { ShoppingBasket, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { toast } from '@/ui';

export function ShoppingListQuickActions() {
  const { addItem } = useShoppingListStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Quick Action 1 */}
      <div 
        className="bg-success-50/50 border border-success-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-success-50 transition-colors group"
        onClick={() => toast.info('Đang mở danh sách nguyên liệu hay dùng...')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success shrink-0">
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-success-800">Thêm từ hay dùng</span>
            <span className="text-xs text-success-600">Thêm nhanh từ danh sách hay dùng</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-success-400 group-hover:text-success-600 transition-colors" />
      </div>

      {/* Quick Action 2 */}
      <div 
        className="bg-primary-50/50 border border-primary-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary-50 transition-colors group"
        onClick={() => toast.info('Kéo thả công thức từ cột bên phải vào danh sách để thêm nguyên liệu!')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary-800">Thêm từ công thức</span>
            <span className="text-xs text-primary-600">Chọn từ công thức nấu ăn</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-colors" />
      </div>

      {/* Quick Action 3 */}
      <div 
        className="bg-secondary-50/50 border border-secondary-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary-50 transition-colors group"
        onClick={() => addItem('Thịt bò (AI gợi ý)', '500', 'g', 'Thịt & Hải sản')}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-secondary-800">AI gợi ý cần mua</span>
            <span className="text-xs text-secondary-600">Dựa trên nguyên liệu trong tủ lạnh</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-secondary-400 group-hover:text-secondary-600 transition-colors" />
      </div>

    </div>
  );
}
