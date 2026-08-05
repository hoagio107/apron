
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChefHat, Home, Heart, BookOpen, GraduationCap, 
  Lightbulb, Database, PlusCircle, LogOut, ChevronDown, 
  ShoppingCart, Archive, Scale, Refrigerator, CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function MainSidebar() {
  const [dataMenuOpen, setDataMenuOpen] = useState(true);
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { name: 'Trang chủ', icon: Home, path: '/' },
    { name: 'Đã lưu', icon: Heart, path: '/saved' },
    { name: 'Đi chợ', icon: ShoppingCart, path: '/shopping-list' },
    { name: 'Thực đơn', icon: BookOpen, path: '/menus' },
    { name: 'Khóa học', icon: GraduationCap, path: '/courses' },
    { name: 'Dọn tủ lạnh', icon: Refrigerator, path: '/smart-fridge' },
    { name: 'Lên kế hoạch', icon: CalendarDays, path: '/meal-planner' },
    { name: 'Mẹo nhà bếp', icon: Lightbulb, path: '/tips' },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 w-64 shadow-none">
      <div className="flex items-center h-20 border-b px-6">
        <ChefHat className="h-8 w-8 text-orange-500 flex-shrink-0" />
        <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white whitespace-nowrap overflow-hidden font-headline">My Recipe</h1>
      </div>

      <nav className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
        <Link href="/recipes/new">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl font-bold shadow-none px-4 h-12">
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            <span className="ml-2">Thêm Công Thức</span>
          </Button>
        </Link>

        <div className="pt-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.path} className={cn(
                  "flex items-center py-3 px-4 rounded-xl transition-all group",
                  pathname === item.path ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-600 hover:bg-gray-50"
                )}>
                  <item.icon className={cn("h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform", pathname === item.path ? "text-orange-600" : "text-gray-400")} />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t mt-4">
          <button 
            onClick={() => setDataMenuOpen(!dataMenuOpen)}
            className="w-full flex items-center py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors group shadow-none justify-between"
          >
            <div className="flex items-center">
              <Database className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-orange-500 transition-colors" />
              <span className="ml-3 font-medium text-gray-600">Hệ thống</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", dataMenuOpen && "rotate-180")} />
          </button>
          
          {dataMenuOpen && (
            <div className="mt-1 ml-5 pl-3 border-l-2 border-orange-100 space-y-1 animate-in slide-in-from-top-2 duration-200">
              <Link href="/units" className={cn(
                "flex items-center py-2.5 px-3 text-sm rounded-lg transition-colors",
                pathname === '/units' ? "text-orange-600 font-bold bg-orange-50" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
              )}>
                <Scale className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Đơn vị tính</span>
              </Link>
              <Link href="/import" className={cn(
                "flex items-center py-2.5 px-3 text-sm rounded-lg transition-colors",
                pathname === '/import' ? "text-orange-600 font-bold bg-orange-50" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
              )}>
                <Database className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Nhập dữ liệu (JSON)</span>
              </Link>
              <Link href="/export" className={cn(
                "flex items-center py-2.5 px-3 text-sm rounded-lg transition-colors",
                pathname === '/export' ? "text-orange-600 font-bold bg-orange-50" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
              )}>
                <Archive className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Sao lưu dữ liệu</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="border-t p-4 bg-gray-50/50">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-none">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-sm truncate text-gray-800">{user.displayName}</p>
              <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-tighter">Đăng xuất</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
