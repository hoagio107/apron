
"use client";

import { useState } from 'react';
import { useMenus } from '@/hooks/use-menus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, ChevronRight, Loader2, Plus, Search, X, ArrowLeft, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/recipes/ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMobileMenuService } from '@/lib/services';

export default function MenusPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { groups, loading, addMenuGroup } = useMenus();
  const { toggleMenu } = useMobileMenuService();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: 'https://picsum.photos/seed/menu-group/800/500'
  });

  const filteredGroups = groups.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveGroup = async () => {
    if (!formData.title) return;
    setIsSaving(true);
    try {
      const slug = formData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      await addMenuGroup({ ...formData, slug });
      toast({ title: "Thành công", description: "Đã tạo nhóm thực đơn mới." });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', image_url: 'https://picsum.photos/seed/menu-group/800/500' });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo nhóm lúc này." });
    } finally {
      setIsSaving(false);
    }
  };

  const StandardToolbar = () => (
    <header className={cn(
      "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
      isMobile ? "left-0 right-0 h-12 px-4" : "left-64 right-0 h-16 px-8"
    )}>
      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-4")}>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="rounded-full shadow-none text-gray-600">
            <MenuIcon className="w-6 h-6" />
          </Button>
        )}
        <h1 className={cn("font-bold font-headline truncate", isMobile ? "text-sm max-w-[150px]" : "text-xl")}>
          Nhóm thực đơn
        </h1>
      </div>

      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-2")}>
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Tìm nhóm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white border-gray-200 rounded-xl shadow-none"
          />
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          variant={isMobile ? "ghost" : "default"}
          className={cn(
            "h-9 md:h-10 rounded-xl font-bold px-4 md:px-5 shadow-none",
            isMobile ? "text-green-600 p-0" : "bg-green-600 hover:bg-green-700 text-white border-none"
          )}
        >
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Tạo nhóm</span>
        </Button>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 md:pt-16 pb-32">
      <StandardToolbar />
      <div className="max-w-[1800px] mx-auto p-4 md:p-8">
        {isMobile && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm nhóm thực đơn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white rounded-2xl border-none shadow-sm font-bold"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
            {filteredGroups.map((group) => (
              <Link key={group.id} href={`/menus/${group.slug}`}>
                <Card className="group overflow-hidden rounded-xl md:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-none hover:shadow-xl transition-all duration-500 cursor-pointer bg-white dark:bg-gray-800 hover:border-green-300 p-1.5 md:p-2.5 h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl md:rounded-2xl bg-gray-100">
                    <img 
                      src={group.image_url || "https://picsum.photos/seed/menu/800/500"} 
                      alt={group.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold text-white mb-1 font-headline drop-shadow-sm">{group.title}</h2>
                      <p className="text-white/80 text-xs line-clamp-1 leading-relaxed">{group.description}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between mt-auto border-t border-gray-50 dark:border-gray-700 mt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khám phá bộ sưu tập</span>
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-none border border-green-100">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            
            {filteredGroups.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="text-xl font-bold text-gray-400">Chưa có nhóm thực đơn nào</h3>
                <Button variant="link" onClick={() => setIsModalOpen(true)} className="text-green-600 font-bold mt-2">Tạo nhóm đầu tiên của bạn</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-6 bg-gray-50/50 border-b">
            <DialogTitle className="text-xl font-bold font-headline">Thêm Nhóm Thực Đơn</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <ImageUploader 
              value={formData.image_url} 
              onChange={(url) => setFormData({...formData, image_url: url})}
              label="Ảnh bìa nhóm"
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tên nhóm *</label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="VD: Eat Clean, Món Tết..."
                  className="h-12 rounded-xl bg-gray-50 border-none shadow-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Một vài lời giới thiệu..."
                  className="rounded-xl bg-gray-50 border-none shadow-none resize-y font-medium"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 bg-white">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold h-12 flex-1">Hủy</Button>
            <Button 
              onClick={handleSaveGroup} 
              disabled={isSaving || !formData.title} 
              className="bg-green-600 hover:bg-green-700 rounded-xl font-bold px-8 shadow-none text-white h-12 flex-[2]"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : 'Lưu lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
