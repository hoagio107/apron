import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Heart, BookOpen, GraduationCap, 
  Lightbulb, PlusCircle, ShoppingCart, Scale, 
  Refrigerator, CalendarDays, FolderTree, Palette, ChefHat
} from 'lucide-react';
import { Button } from '@apron/ui';
import { useTranslation } from 'react-i18next';
import { SettingsModal } from '../settings/SettingsModal';
import { SidebarNav, type NavItem } from './sidebar/SidebarNav';
import { SidebarProfile } from './sidebar/SidebarProfile';

export function MainSidebar() {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Lắng nghe custom event từ AiAssistModal để mở Settings
  useEffect(() => {
    const handler = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handler);
    return () => window.removeEventListener('open-settings', handler);
  }, []);

  const navItems: NavItem[] = [
    { name: t('Home'), icon: Home, path: '/' },
    { name: 'Tất cả công thức', icon: ChefHat, path: '/recipes' },
    { name: t('Saved'), icon: Heart, path: '/saved' },
    { name: t('Shopping List'), icon: ShoppingCart, path: '/shopping-list' },
    { name: t('Courses'), icon: GraduationCap, path: '/courses' },
    { name: t('Smart Fridge'), icon: Refrigerator, path: '/smart-fridge' },
    { name: t('Meal Planner'), icon: CalendarDays, path: '/meal-planner' },
    { name: t('Tips'), icon: Lightbulb, path: '/tips' },
    { name: t('Units'), icon: Scale, path: '/units' },
    { name: 'Design System', icon: Palette, path: '/design-system' },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col absolute inset-y-0 left-0 bg-white dark:bg-gray-800 z-30 w-20 hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden shadow-none group/sidebar">
        <nav className="flex-grow p-4 pt-6 space-y-4 overflow-y-auto custom-scrollbar">
          <Button 
            as={Link} 
            to="/recipes/new"
            color="primary" 
            variant="solid"
            className="w-full font-bold px-0 group-hover/sidebar:px-4 h-12 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            <span className="ml-2 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto transition-all duration-300">{t('Add Recipe')}</span>
          </Button>

          <div className="pt-2">
            <SidebarNav items={navItems} />
          </div>
        </nav>

        <div className="mx-4 border-t border-gray-200 dark:border-gray-700 py-4">
          <SidebarProfile onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>
      </aside>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </>
  );
}
