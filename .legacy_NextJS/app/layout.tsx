
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MainLayoutWrapper } from '@/components/layout/MainLayoutWrapper';
import { TouchNavigationManager } from '@/components/layout/TouchNavigationManager';

export const metadata: Metadata = {
  title: 'My Recipe - Sổ tay nấu ăn cá nhân',
  description: 'Quản lý, khám phá và nâng tầm công thức nấu ăn của bạn.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <FirebaseClientProvider>
          <AuthGuard>
            <TouchNavigationManager>
              <MainLayoutWrapper>
                {children}
              </MainLayoutWrapper>
            </TouchNavigationManager>
          </AuthGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
