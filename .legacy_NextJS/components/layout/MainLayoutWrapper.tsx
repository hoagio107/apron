
"use client";

import { usePathname } from 'next/navigation';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ReactNode } from 'react';
import { ImageViewerModal } from '@/components/shared/ImageViewerModal';

export function MainLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <MainSidebar />
      <MobileNav />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        {children}
      </div>
      <ImageViewerModal />
    </div>
  );
}
