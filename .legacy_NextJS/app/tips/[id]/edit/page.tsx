
"use client";

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TipEditor } from '@/components/tips/TipEditor';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tip } from '@/lib/recipe-types';
import { useTips } from '@/hooks/use-tips';

export default function EditTipPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { updateTip } = useTips();
  const { toast } = useToast();

  const tipRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !id) return null;
    return doc(firestore, 'users', user.uid, 'tips', id);
  }, [firestore, user?.uid, id]);

  const { data: tip, isLoading: tipLoading } = useDoc<Tip>(tipRef);

  const handleSave = async (data: any) => {
    if (!id) return;
    try {
      await updateTip(id, data);
      toast({ title: "Đã cập nhật", description: "Bí quyết của bạn đã được lưu." });
      router.push(`/tips/${id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi cập nhật" });
      throw e;
    }
  };

  if (isUserLoading || tipLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="animate-spin text-orange-500 w-10 h-10 mb-4" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );

  if (!tip) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
        <Lightbulb className="w-10 h-10 text-orange-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white font-headline">Không tìm thấy bí quyết</h2>
      <Button onClick={() => router.push('/tips')} className="mt-6 bg-orange-600 rounded-xl font-bold px-8 text-white h-12 shadow-none border-none">Quay lại danh sách</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TipEditor 
        initialData={tip}
        categoryId={tip.category_id} 
        onSave={handleSave} 
        onCancel={() => router.back()} 
      />
    </div>
  );
}
