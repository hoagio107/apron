
"use client";

import { useRouter } from 'next/navigation';
import { useTips } from '@/hooks/use-tips';
import { TipEditor } from '@/components/tips/TipEditor';
import { useToast } from '@/hooks/use-toast';

export default function NewTipPage() {
  const router = useRouter();
  const { addTip } = useTips();
  const { toast } = useToast();

  const handleSave = async (data: any) => {
    try {
      const slug = data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      await addTip({
        ...data,
        slug
      });
      toast({ title: "Thành công!", description: "Đã lưu bí quyết mới." });
      router.push('/tips');
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi lưu trữ" });
      throw e;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TipEditor 
        categoryId="cooking" 
        onSave={handleSave} 
        onCancel={() => router.push('/tips')} 
      />
    </div>
  );
}
