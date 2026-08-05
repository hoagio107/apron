
"use client";

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Save, ArrowLeft, Loader2, Info, 
  Tag, ChevronDown, X, ImageIcon
} from 'lucide-react';
import { Tip, TIP_CATEGORIES } from '@/lib/recipe-types';
import { RichTextToolbar } from '@/components/recipes/RichTextToolbar';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';
import { ImageUploader } from '@/components/recipes/ImageUploader';

const tipSchema = z.object({
  title: z.string().min(5, "Tiêu đề quá ngắn"),
  content: z.string().min(10, "Nội dung cần chi tiết hơn"),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
  image_url: z.string().optional().or(z.string().length(0))
});

type FormValues = z.infer<typeof tipSchema>;

interface TipEditorProps {
  initialData?: Tip;
  categoryId: string;
  onSave: (data: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function TipEditor({ initialData, categoryId, onSave, onCancel }: TipEditorProps) {
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      content: initialData.content,
      category_id: initialData.category_id,
      image_url: initialData.image_url || ''
    } : {
      title: '',
      content: '',
      category_id: categoryId,
      image_url: ''
    }
  });

  const currentTitle = useWatch({ control: form.control, name: 'title' });

  const handleSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      await onSave(values);
    } catch (e) {
      setIsSaving(false);
    }
  };

  const DesktopNavbar = () => (
    <header className="fixed top-0 left-64 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} type="button" className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold truncate max-w-md font-headline">
          {initialData ? (currentTitle || 'Chỉnh sửa bí quyết') : 'Viết bí quyết mới'}
        </h1>
      </div>
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl h-10 px-5 font-bold shadow-none text-gray-500 border-gray-200 bg-white">
          <X className="w-4 h-4 mr-2" /> Hủy
        </Button>
        <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700 rounded-xl h-10 px-5 font-bold shadow-none text-white border-none">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu bí quyết
        </Button>
      </div>
    </header>
  );

  const MobileNavbar = () => (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-12 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel} type="button" className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="text-sm font-bold truncate max-w-[150px] font-headline">
          {initialData ? (currentTitle || 'Sửa bí quyết') : 'Viết mới'}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={form.handleSubmit(handleSubmit)} disabled={isSaving} className="text-orange-600 rounded-xl h-9 w-9">
        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      </Button>
    </header>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="min-h-screen bg-white md:bg-gray-50 dark:bg-gray-900 pb-32">
        {isMobile ? <MobileNavbar /> : <DesktopNavbar />}

        <main className="max-w-5xl mx-auto p-0 md:p-8 pt-12 md:pt-16 md:mt-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-gray-800 md:rounded-3xl rounded-none shadow-none md:border border-none border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
            <div className="p-6 md:p-10 pb-4 md:pb-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <ImageUploader 
                        value={field.value} 
                        onChange={field.onChange} 
                        label="Ảnh minh họa"
                        className="bg-transparent border-none md:border-none shadow-none md:shadow-none rounded-none md:rounded-none"
                      />
                    )}
                  />
                </div>

                <div className="md:col-span-3 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Tiêu đề bí quyết *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="VD: Cách giữ rau xanh khi luộc..." 
                            {...field} 
                            className="text-xl md:text-3xl font-bold border-0 border-b-2 border-gray-50 dark:border-gray-700 rounded-none px-0 h-auto py-2 focus-visible:ring-0 focus-visible:border-orange-500 placeholder:text-gray-100 shadow-none bg-transparent" 
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Danh mục</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl shadow-none font-bold">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl shadow-2xl">
                            {TIP_CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col relative min-h-[400px]">
              <RichTextToolbar targetId="tip-content" className="bg-white dark:bg-gray-800 sticky top-0 z-10" />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-0 flex-1 flex flex-col">
                    <FormControl>
                      <Textarea 
                        id="tip-content"
                        placeholder="Chia sẻ bí quyết của bạn tại đây. Bạn có thể sử dụng các ký tự Markdown để định dạng..." 
                        {...field} 
                        className="flex-1 border-none rounded-none p-6 md:p-10 text-lg md:text-xl leading-relaxed focus-visible:ring-0 shadow-none bg-transparent resize-y h-full min-h-[500px]" 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold p-4" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-8 px-4 md:px-0">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-blue-100 dark:border-blue-900/50 shadow-none flex items-start gap-6">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-800 shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">Mẹo hay cần chi tiết!</h4>
                <p className="text-sm text-blue-700/70 dark:text-blue-400 leading-relaxed mb-0">Một bí quyết hữu ích thường đi kèm với các bước cụ thể hoặc giải thích lý do tại sao nó hiệu quả. Đừng ngần ngại viết chi tiết nhé!</p>
              </div>
            </div>
          </div>
        </main>
      </form>
    </Form>
  );
}
