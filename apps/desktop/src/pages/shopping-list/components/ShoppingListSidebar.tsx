import { Sparkles, RefreshCw, List, Circle, CheckCircle2, ShoppingCart, Smartphone, Printer, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/ui';
import { useShoppingListStore } from '../../../store/useShoppingListStore';

// MOCK DATA for AI suggestions
const MOCK_AI_SUGGESTIONS = [
  { id: '1', name: 'Trứng gà', image_url: 'eggs.png', reason: 'Bạn chỉ còn 1 quả' },
  { id: '2', name: 'Sữa tươi', image_url: 'milk.png', reason: 'Bạn chỉ còn 1 lít' },
  { id: '3', name: 'Phô mai', image_url: 'cheese.png', reason: 'Gần hết (còn 30g)' },
  { id: '4', name: 'Bánh mì', image_url: 'bread.png', reason: 'Hết' },
  { id: '5', name: 'Dầu ăn', image_url: 'oil.png', reason: 'Gần hết (còn 100ml)' },
];

export function ShoppingListSidebar() {
  const { items } = useShoppingListStore();
  const totalItems = items.length;
  const pendingItems = items.filter(item => !item.checked).length;
  const completedItems = items.filter(item => item.checked).length;

  return (
    <div className="w-80 shrink-0 flex flex-col gap-6">
      
      {/* AI Suggestion Card */}
      <div className="bg-white rounded-2xl border border-default-100 shadow-none overflow-hidden flex flex-col">
        <div className="p-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2 text-primary-800">
            <Sparkles className="w-4 h-4 text-primary" />
            AI gợi ý bạn cần mua
          </h2>
          <Button variant="light" size="sm" className="text-xs text-default-500 hover:text-primary px-2 min-w-0" endContent={<RefreshCw className="w-3 h-3" />}>
            Cập nhật
          </Button>
        </div>
        <div className="px-4 pb-3">
          <p className="text-xs text-default-500 leading-relaxed">
            Dựa trên nguyên liệu trong tủ lạnh, bạn có thể cần thêm những món sau:
          </p>
        </div>
        
        <div className="flex flex-col">
          {MOCK_AI_SUGGESTIONS.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between py-3 px-4 hover:bg-default-50 transition-colors border-t border-default-100 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-default-100 flex items-center justify-center text-xl overflow-hidden shrink-0">
                  {/* Fake emoji since we don't have images */}
                  {idx === 0 ? '🥚' : idx === 1 ? '🥛' : idx === 2 ? '🧀' : idx === 3 ? '🍞' : 's'} 
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-default-400">{item.reason}</span>
                </div>
              </div>
              <Button 
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-primary-50 text-primary w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="p-3 pt-1 border-t border-default-100">
          <Button variant="light" className="w-full text-xs text-primary font-medium flex justify-center items-center gap-1">
            Xem tất cả gợi ý (8) <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-default-100 shadow-none overflow-hidden">
        <div className="p-4 border-b border-default-100">
          <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <List className="w-4 h-4 text-primary" />
            Tổng quan
          </h2>
        </div>
        
        <div className="p-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center bg-primary-50 rounded-xl py-3 border border-primary-100">
            <div className="flex flex-col items-center">
              <span className="text-xs text-primary font-medium flex items-center gap-1 mb-1">
                <List className="w-3 h-3" /> {totalItems}
              </span>
              <span className="text-[10px] text-default-500">Tổng mục</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-warning-50 rounded-xl py-3 border border-warning-100">
            <div className="flex flex-col items-center">
              <span className="text-xs text-warning-600 font-medium flex items-center gap-1 mb-1">
                <Circle className="w-3 h-3" /> {pendingItems}
              </span>
              <span className="text-[10px] text-default-500">Chưa mua</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center bg-success-50 rounded-xl py-3 border border-success-100">
            <div className="flex flex-col items-center">
              <span className="text-xs text-success font-medium flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3" /> {completedItems}
              </span>
              <span className="text-[10px] text-default-500">Đã mua</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-xs font-bold text-default-700 mb-2">Gợi ý thông minh</h3>
          <div className="flex flex-col">
            <Button variant="light" className="justify-between px-2 h-9 text-xs text-default-600 hover:text-foreground hover:bg-default-100 rounded-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-default-400" />
                Mua theo khu vực trong siêu thị
              </div>
              <ChevronRight className="w-4 h-4 text-default-300" />
            </Button>
            <Button variant="light" className="justify-between px-2 h-9 text-xs text-default-600 hover:text-foreground hover:bg-default-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-default-400" />
                Chuyển danh sách thành đơn hàng online
              </div>
              <ChevronRight className="w-4 h-4 text-default-300" />
            </Button>
            <Button variant="light" className="justify-between px-2 h-9 text-xs text-default-600 hover:text-foreground hover:bg-default-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-default-400" />
                In danh sách
              </div>
              <ChevronRight className="w-4 h-4 text-default-300" />
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
