
"use client";

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditRecipePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;
  const router = useRouter();
  const { recipes, updateRecipe, loading } = useRecipes();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const recipe = useMemo(() => recipes.find(r => r.id === id), [recipes, id]);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      await updateRecipe(id, data);
      toast({ title: "Thành công!", description: "Đã cập nhật công thức." });
      router.push(`/recipes/${id}`);
    } catch (e) {
      console.error("Update error:", e);
      toast({ 
        variant: "destructive", 
        title: "Lỗi cập nhật", 
        description: "Không thể gửi dữ liệu lên server. Vui lòng kiểm tra lại." 
      });
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 w-10 h-10" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <ArrowLeft className="w-10 h-10 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Không tìm thấy công thức</h2>
        <p className="text-gray-500 mb-8">Công thức này có thể đã bị xóa hoặc không tồn tại.</p>
        <Button onClick={() => router.push('/')} className="bg-orange-600 hover:bg-orange-700 rounded-2xl px-8 font-bold h-12 shadow-none">
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-2 md:pt-4">
      {isSaving && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
          <p className="text-lg font-bold text-orange-900 uppercase tracking-widest">Đang lưu thay đổi...</p>
        </div>
      )}

      <RecipeForm 
        initialData={recipe} 
        onSave={handleSave} 
        onCancel={() => router.back()} 
      />
    </div>
  );
}
