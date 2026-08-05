
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChefHat, PlusCircle, LogIn, 
  LogOut, Home as HomeIcon, Heart as HeartIcon, 
  BookOpen as BookOpenIcon, GraduationCap as GraduationCapIcon, 
  Lightbulb as LightbulbIcon, ShoppingCart, Archive, Scale, Database, Refrigerator,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { useUser, useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMobileMenuService } from '@/lib/services';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  
  const { isMenuOpen, closeMenu } = useMobileMenuService();

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { name: 'Trang chủ', icon: HomeIcon, path: '/' },
    { name: 'Đã lưu', icon: HeartIcon, path: '/saved' },
    { name: 'Đi chợ', icon: ShoppingCart, path: '/shopping-list' },
    { name: 'Thực đơn', icon: BookOpenIcon, path: '/menus' },
    { name: 'Khóa học', icon: GraduationCapIcon, path: '/courses' },
    { name: 'Dọn tủ lạnh', icon: Refrigerator, path: '/smart-fridge' },
    { name: 'Lên kế hoạch', icon: CalendarDays, path: '/meal-planner' },
    { name: 'Mẹo nhà bếp', icon: LightbulbIcon, path: '/tips' },
  ];

  return (
    <Sheet open={isMenuOpen} onOpenChange={(open) => !open && closeMenu()}>
      <SheetContent side="right" className="w-full p-0 flex flex-col border-none shadow-none animate-in fade-in duration-300">
        <SheetHeader className="p-4 border-b text-left bg-gray-50/50">
          <SheetTitle className="text-lg font-bold flex items-center font-headline">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" /> Menu Hệ Thống
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-grow p-6 space-y-8 overflow-y-auto">
          <div className="px-2">
            <Link href="/recipes/new">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 font-bold py-6 rounded-2xl text-base shadow-none transition-transform active:scale-95">
                <PlusCircle className="w-5 h-5 mr-3" />
                Thêm Công Thức
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.path}
                className={cn(
                  "flex items-center px-5 py-3.5 rounded-2xl transition-all",
                  pathname === item.path 
                    ? "bg-orange-50 text-orange-600 font-bold" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("h-5 w-5 mr-4", pathname === item.path ? "text-orange-600" : "text-gray-400")} />
                <span className="text-base">{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t">
            <Link href="/units" className={cn(
              "flex items-center px-5 py-3.5 rounded-2xl transition-all mb-1",
              pathname === '/units' ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
            )}>
              <Scale className={cn("h-5 w-5 mr-4", pathname === '/units' ? "text-orange-600" : "text-gray-400")} />
              <span className="text-base">Đơn vị tính</span>
            </Link>
            <Link href="/import" className={cn(
              "flex items-center px-5 py-3.5 rounded-2xl transition-all mb-1",
              pathname === '/import' ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
            )}>
              <Database className={cn("h-5 w-5 mr-4", pathname === '/import' ? "text-orange-600" : "text-gray-400")} />
              <span className="text-base">Nhập dữ liệu (JSON)</span>
            </Link>
            <Link href="/export" className={cn(
              "flex items-center px-5 py-3.5 rounded-2xl transition-all mb-1",
              pathname === '/export' ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-500 hover:text-orange-600 hover:bg-gray-50"
            )}>
              <Archive className={cn("h-5 w-5 mr-4", pathname === '/export' ? "text-orange-600" : "text-gray-400")} />
              <span className="text-base">Sao lưu dữ liệu</span>
            </Link>
          </div>

          <div className="mt-auto pt-8 border-t">
            {user ? (
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-none">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">{user.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate text-gray-800">{user.displayName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-50 rounded-full h-9 w-9">
                  <LogOut className="h-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleLogin} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-6 rounded-2xl text-base shadow-none transition-transform active:scale-95">
                <LogIn className="w-5 h-5 mr-3" />
                Đăng nhập Google
              </Button>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
