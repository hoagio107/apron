
"use client";

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Nếu đã tải xong thông tin user và user không tồn tại (chưa login)
    // Và không phải đang ở trang login thì redirect về login
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // Đang kiểm tra trạng thái login
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
          <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa login và không phải trang login, không render gì để tránh "giật" UI
  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
