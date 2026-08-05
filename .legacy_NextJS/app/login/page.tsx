
"use client";

import { useUser, useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { ChefHat, LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const isMobile = useIsMobile();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    );
  }

  const Content = () => (
    <>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 mb-8">
        <ChefHat className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold mb-3 font-headline text-gray-800 dark:text-white">Chào mừng tới My Recipe</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
        Đăng nhập để bắt đầu xây dựng cuốn sổ tay nấu ăn cá nhân của riêng bạn.
      </p>
      
      <Button 
        onClick={handleLogin} 
        className="w-full h-14 bg-gray-900 hover:bg-black dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-2xl font-bold text-lg transition-all active:scale-95"
      >
        <LogIn className="w-5 h-5 mr-3" /> Đăng nhập bằng Google
      </Button>
      
      <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest font-bold">
        Powered by CookPal Engine
      </p>
    </>
  );

  const DesktopView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 text-center shadow-xl shadow-gray-200/50 dark:shadow-none">
        <Content />
      </div>
    </div>
  );

  const MobileView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-6 text-center">
      <Content />
    </div>
  );

  return isMobile ? <MobileView /> : <DesktopView />;
}
