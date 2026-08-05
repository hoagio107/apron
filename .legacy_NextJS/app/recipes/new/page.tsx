
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function NewRecipePage() {
  const router = useRouter();
  const { addRecipe } = useRecipes();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      const slug = data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      // Wait for the database response (Pessimistic UI)
      await addRecipe({
        ...data,
        slug,
        author_id: 'user_local',
        tags: data.tags || []
      });
      
      toast({ title: "Thành công!", description: "Đã lưu công thức mới." });
      // Only navigate after success
      router.push('/');
    } catch (e) {
      console.error("Save error:", e);
      toast({ 
        variant: "destructive", 
        title: "Lỗi lưu trữ", 
        description: "Có lỗi xảy ra khi gửi dữ liệu lên server. Vui lòng kiểm tra lại." 
      });
      setIsSaving(false); // Stay on page to allow user to retry
      throw e; // Pass error back to form if needed
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {isSaving && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[60] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
          <p className="text-lg font-bold text-orange-900 uppercase tracking-widest">Đang lưu công thức...</p>
        </div>
      )}
      <RecipeForm onSave={handleSave} onCancel={() => router.back()} />
    </div>
  );
}
