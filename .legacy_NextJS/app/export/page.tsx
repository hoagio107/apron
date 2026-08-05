
"use client";

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Loader2, Download, CloudUpload, 
  CheckCircle2, ShieldCheck, Database, AlertCircle, 
  Archive
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { saveBackupToDrive } from '@/lib/google-drive';

export default function ExportPage() {
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [method, setMethod] = useState<'device' | 'drive' | null>(null);

  const gatherAllData = async () => {
    if (!firestore || !user) return null;
    
    try {
      const recipesSnap = await getDocs(collection(firestore, 'users', user.uid, 'recipes'));
      const menusSnap = await getDocs(collection(firestore, 'users', user.uid, 'menus'));
      const tipsSnap = await getDocs(collection(firestore, 'users', user.uid, 'tips'));
      const shoppingListSnap = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'shopping_list'));

      return {
        version: "1.1",
        backupDate: new Date().toISOString(),
        userId: user.uid,
        recipes: recipesSnap.docs.reduce((acc, d) => ({ ...acc, [d.id]: d.data() }), {}),
        menus: menusSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        tips: tipsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        shoppingList: shoppingListSnap.exists() ? shoppingListSnap.data() : null
      };
    } catch (error) {
      console.error("Gather data error:", error);
      return null;
    }
  };

  const handleBackup = async (target: 'device' | 'drive') => {
    setMethod(target);
    setStatus('loading');
    
    try {
      const fullData = await gatherAllData();
      if (!fullData) throw new Error("Không thể thu thập dữ liệu từ hệ thống.");
      
      const jsonString = JSON.stringify({ recipes: fullData.recipes }, null, 2);

      if (target === 'device') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().substring(0, 10);
        a.download = `my-recipe-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await saveBackupToDrive(jsonString);
      }

      setStatus('success');
      toast({ title: "Sao lưu thành công!", description: target === 'device' ? "File đã được tải xuống thiết bị." : "Dữ liệu đã được đồng bộ lên Google Drive." });
      
      setTimeout(() => {
        setStatus('idle');
        setMethod(null);
      }, 3000);

    } catch (e: any) {
      console.error("Backup process error:", e);
      setStatus('idle');
      setMethod(null);
      toast({ 
        variant: "destructive", 
        title: "Lỗi sao lưu", 
        description: e.message || "Đã có lỗi xảy ra trong quá trình xử lý." 
      });
    }
  };

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-orange-600" />
          <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[180px]" : "text-xl")}>
            Sao lưu dữ liệu
          </h1>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      <main className={cn("max-w-3xl mx-auto px-4 md:px-8", isMobile ? "pt-16" : "pt-24")}>
        <div className="flex flex-col items-center text-center space-y-8 pt-4 pb-8 md:py-12">
          
          <div className="w-full bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl md:rounded-3xl text-left border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-blue-900 dark:text-blue-300">Bảo mật dữ liệu</h4>
            </div>
            <p className="text-sm text-blue-700/70 dark:text-blue-400 leading-relaxed mb-0 font-medium">
              Dữ liệu của bạn được mã hóa an toàn và chỉ có bạn mới có quyền truy cập vào các bản sao lưu này thông qua tài khoản Google cá nhân.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6 w-full">
            <Button 
              variant="ghost" 
              onClick={() => handleBackup('device')}
              disabled={status === 'loading'}
              className="h-auto py-6 md:py-10 rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-3 md:gap-4 transition-all group shadow-sm border-none"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-100 dark:bg-gray-900 group-hover:bg-orange-100 flex items-center justify-center text-gray-500 group-hover:text-orange-600 transition-colors">
                {status === 'loading' && method === 'device' ? <Loader2 className="animate-spin w-5 h-5 md:w-7 md:h-7" /> : <Download className="w-5 h-5 md:w-7 md:h-7" />}
              </div>
              <div className="text-center">
                <p className="font-bold text-xs md:text-lg text-gray-800 dark:text-white leading-tight">Lưu vào<br/>thiết bị</p>
                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 opacity-60">Tệp .JSON</p>
              </div>
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => handleBackup('drive')}
              disabled={status === 'loading'}
              className="h-auto py-6 md:py-10 rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-3 md:gap-4 transition-all group shadow-sm border-none"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-100 dark:bg-gray-900 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors">
                {status === 'loading' && method === 'drive' ? <Loader2 className="animate-spin w-5 h-5 md:w-7 md:h-7" /> : <CloudUpload className="w-5 h-5 md:w-7 md:h-7" />}
              </div>
              <div className="text-center">
                <p className="font-bold text-xs md:text-lg text-gray-800 dark:text-white leading-tight">Sao lưu<br/>GG Drive</p>
                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 opacity-60">Đám mây</p>
              </div>
            </Button>
          </div>

          {status === 'success' && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold animate-in zoom-in-95 bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
              <CheckCircle2 className="w-5 h-5" /> Hoàn tất sao lưu!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
