
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBackupService } from '@/lib/services';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Database, Download, CloudUpload, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveBackupToDrive } from '@/lib/google-drive';

export function BackupDialog() {
  const { isBackupOpen, closeBackup } = useBackupService();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [method, setMethod] = useState<'device' | 'drive' | null>(null);

  const gatherAllData = async () => {
    if (!firestore || !user) return null;
    
    try {
      // Lấy toàn bộ dữ liệu từ các sub-collections của user
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
        // Sử dụng slice/substring thay vì split để lấy ngày an toàn
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
        closeBackup();
      }, 2000);

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

  return (
    <Dialog open={isBackupOpen} onOpenChange={closeBackup}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-[2.5rem] p-6 md:p-10 border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
            <Database className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold font-headline">Sao lưu dữ liệu</DialogTitle>
          <DialogDescription className="text-gray-500 leading-relaxed">
            Chọn nơi bạn muốn lưu trữ bản sao lưu toàn bộ công thức và dữ liệu cá nhân của mình.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <Button 
            variant="outline" 
            onClick={() => handleBackup('device')}
            disabled={status === 'loading'}
            className="h-auto py-4 md:h-20 rounded-2xl border-2 hover:border-orange-500 hover:bg-orange-50/50 flex items-center justify-start px-4 md:px-6 gap-4 group transition-all whitespace-normal text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center text-gray-500 group-hover:text-orange-600 transition-colors shrink-0">
              {status === 'loading' && method === 'device' ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800">Lưu vào thiết bị</p>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Tải về tệp .json để lưu trữ ngoại tuyến</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleBackup('drive')}
            disabled={status === 'loading'}
            className="h-auto py-4 md:h-20 rounded-2xl border-2 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-start px-4 md:px-6 gap-4 group transition-all whitespace-normal text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition-colors shrink-0">
              {status === 'loading' && method === 'drive' ? <Loader2 className="animate-spin w-5 h-5" /> : <CloudUpload className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800">Đồng bộ Google Drive</p>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Tự động ghi đè bản sao cũ trên Drive</p>
            </div>
          </Button>
        </div>

        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold animate-in zoom-in-95 mb-4">
            <CheckCircle2 className="w-5 h-5" /> Hoàn tất sao lưu!
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-2xl flex gap-3 mt-2">
          <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
            Dữ liệu của bạn được mã hóa an toàn và chỉ có bạn mới có quyền truy cập vào các bản sao lưu này.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={closeBackup} className="w-full rounded-xl font-bold text-gray-400 shadow-none">Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
