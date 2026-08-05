
"use client";

import { use, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Edit3, Trash2, Calendar, 
  Lightbulb, Tag, Loader2, AlertTriangle,
  MoreVertical, ZoomIn
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { TIP_CATEGORIES } from '@/lib/recipe-types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useTips } from '@/hooks/use-tips';
import Link from 'next/link';
import { useImageViewer } from '@/lib/services';

export default function TipDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { open: openLightbox } = useImageViewer();
  const { tips, loading: tipsLoading, deleteTips } = useTips();
  const { user, isUserLoading } = useUser();

  const tip = useMemo(() => tips.find(t => t.id === id), [tips, id]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const category = useMemo(() => 
    TIP_CATEGORIES.find(c => c.id === tip?.category_id) || TIP_CATEGORIES[0], 
    [tip]
  );

  useEffect(() => {
    if (tip?.content) {
      const renderContent = async () => {
        const html = await marked.parse(tip.content, { breaks: true });
        setHtmlContent(html);
      };
      renderContent();
    }
  }, [tip?.content]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteTips([id]);
      toast({ title: "Đã xóa bí quyết" });
      router.push('/tips');
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xóa" });
      setIsDeleting(false);
    }
  };

  if (isUserLoading || tipsLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <Loader2 className="animate-spin text-orange-500 w-10 h-10 mb-4" />
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Đang tải nội dung...</p>
    </div>
  );
  
  if (!tip) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
        <Lightbulb className="w-10 h-10 text-orange-300" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white font-headline">Không tìm thấy bí quyết</h2>
      <p className="text-gray-500 mt-2 mb-8 max-w-xs">Nội dung này có thể đã bị xóa hoặc không còn tồn tại.</p>
      <Button onClick={() => router.push('/tips')} className="bg-orange-600 rounded-xl font-bold px-8 shadow-none border-none text-white h-12">Quay lại danh sách</Button>
    </div>
  );

  const formattedDate = tip.createdAt ? format(new Date(tip.createdAt), 'dd MMMM, yyyy', { locale: vi }) : 'Gần đây';
  const tipImageUrl = tip.image_url || `https://picsum.photos/seed/${tip.category_id}/800/800`;

  const Navbar = () => (
    <header className={cn(
      "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-none",
      isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
    )}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/tips')} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[150px]" : "text-xl max-w-md")}>
          {tip.title}
        </span>
      </div>
      
      {isMobile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-2xl p-2 shadow-2xl border-gray-100">
            <DropdownMenuItem asChild className="rounded-xl p-3 font-bold cursor-pointer">
              <Link href={`/tips/${tip.id}/edit`} className="flex items-center gap-3">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsDeleteModalOpen(true)} 
              className="rounded-xl p-3 font-bold flex items-center gap-3 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex gap-3">
          <Link href={`/tips/${tip.id}/edit`}>
            <Button className="rounded-xl font-bold h-10 px-5 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-none border-none">
              <Edit3 className="w-4 h-4" /> Sửa
            </Button>
          </Link>
          <Button 
            className="rounded-xl font-bold h-10 px-5 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-none border-none" 
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4" /> Xóa
          </Button>
        </div>
      )}
    </header>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      <main className={cn(
        "max-w-7xl mx-auto px-4 md:px-8 pb-32",
        isMobile ? "pt-20" : "pt-24"
      )}>
        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="col-span-12 md:col-span-4 space-y-8 md:sticky md:top-24">
            <div 
              className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shadow-sm cursor-zoom-in group"
              onClick={() => openLightbox(tipImageUrl)}
            >
              <img src={tipImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[2rem] space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin bí quyết</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", category.color)}><Tag className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Danh mục</p>
                      <p className="font-bold text-sm dark:text-white">{category.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Ngày đăng</p>
                      <p className="font-bold text-sm dark:text-white">{formattedDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 space-y-8 md:space-y-10">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white font-headline leading-tight">{tip.title}</h1>
              <div className="h-1.5 w-24 bg-orange-500 rounded-full" />
            </div>

            <div className="pt-2">
              <div 
                className="markdown-content prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      </main>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 border-none overflow-hidden">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-headline text-gray-800 dark:text-white">Xóa bí quyết này?</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-2xl h-12 font-bold text-gray-600 bg-gray-100 shadow-none border-none">Hủy</Button>
              <Button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-2xl h-12 font-bold bg-red-600 hover:bg-red-700 text-white shadow-none border-none transition-transform active:scale-95"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
