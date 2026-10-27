import { useNavigate, NavLink } from 'react-router-dom';
import {
  CalendarDays, ShoppingCart, GraduationCap,
  Heart, Lightbulb, Scale, Settings, X, FolderHeart, FileUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavMoreProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BottomNavMore({ isOpen, onClose }: BottomNavMoreProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const moreItems = [
    { name: t('nav.collections', 'Bộ sưu tập'), icon: FolderHeart, path: '/collections' },
    { name: t('nav.mealPlanner'), icon: CalendarDays, path: '/meal-planner' },
    { name: t('nav.shoppingList'), icon: ShoppingCart, path: '/shopping-list' },
    { name: t('nav.courses'), icon: GraduationCap, path: '/courses' },
    { name: t('nav.saved'), icon: Heart, path: '/saved' },
    { name: t('nav.kitchenTips'), icon: Lightbulb, path: '/tips' },
    { name: t('nav.units'), icon: Scale, path: '/units' },
    { name: t('nav.import', 'Nhập dữ liệu JSON'), icon: FileUp, path: '/import' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-content1 text-foreground rounded-t-3xl shadow-2xl border-t border-divider animate-in slide-in-from-bottom-4 duration-300 max-h-[calc(100dvh-var(--sat,0px)-24px)] overflow-y-auto">
        {/* Handle */}
        <div className="sticky top-0 bg-content1 z-10 pt-3 pb-2 px-4 flex flex-col items-center border-b border-divider">
          <div className="w-10 h-1 rounded-full bg-default-300 mb-2" />
          <div className="w-full flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">{t('nav.categories')}</span>
            <button onClick={onClose} className="p-2 rounded-full active:bg-content2 transition-colors">
              <X className="w-5 h-5 text-default-400" />
            </button>
          </div>
        </div>

        {/* List of more items */}
        <div className="px-4 py-2 flex flex-col gap-1">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-content2 text-default-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-default-500'}`} />
                    <span className="text-base">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Settings */}
        <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-divider pt-3 mt-2">
          <button
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl active:bg-content2 text-default-700 transition-colors"
          >
            <Settings className="w-6 h-6 text-default-500" />
            <span className="text-base font-medium">{t('nav.settings')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
