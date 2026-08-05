"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTips } from '@/hooks/use-tips';
import { TipCard } from '@/components/tips/TipCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, Loader2, 
  CheckCircle2, Trash2, X, Lightbulb, Menu as MenuIcon,
  Filter, Check, Sparkles, ImagePlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ActionBar } from '@/components/shared/ActionBar';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { TipAIImportModal } from '@/components/tips/TipAIImportModal';
import { TipBulkImageUploadModal } from '@/components/tips/TipBulkImageUploadModal';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSelectionService, useMobileMenuService } from '@/lib/services';
import { useIsMobile } from '@/hooks/use-mobile';
import { TIP_CATEGORIES } from '@/lib/recipe-types';

function TipsContent() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { tips, loading, deleteTips } = useTips();
  const { toast } = useToast();
  const { toggleMenu } = useMobileMenuService();
  const { isSelectionMode, setSelectionMode } = useSelectionService();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isBulkImageModalOpen, setIsBulkImageModalOpen] = useState(false);

  // Lấy category từ URL query param
  const categoryFilter = searchParams.get('category');
  const activeCategory = useMemo(() => 
    TIP_CATEGORIES.find(c => c.id === categoryFilter), 
    [categoryFilter]
  );

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds(new Set());
    }
  }, [isSelectionMode]);

  const filteredTips = useMemo(() => {
    let list = [...tips];
    
    // Lọc theo danh mục từ URL
    if (categoryFilter) {
      list = list.filter(t => t.category_id === categoryFilter);
    }

    // Lọc theo tìm kiếm
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.content.toLowerCase().includes(term)
      );
    }
    return list;
  }, [tips, searchTerm, categoryFilter]);

  const selectedTipsData = useMemo(() => {
    return tips.filter(t => selectedIds.has(t.id));
  }, [tips, selectedIds]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    try {
      await deleteTips(Array.from(selectedIds));
      toast({ title: "Đã xóa thành công", description: `Đã xóa ${selectedIds.size} mẹo vặt khỏi danh sách.` });
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xóa" });
    }
  };

  const handleCategorySelect = (id: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('category', id);
    } else {
      params.delete('category');
    }
    router.push(`${pathname}?${params.toString()}`);
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
        <div className="flex items-center gap-2">
          {!isMobile && <Lightbulb className="w-6 h-6 text-orange-500" />}
          <h1 className={cn("font-bold font-headline truncate", isMobile ? "text-sm max-w-[150px]" : "text-xl")}>
            Mẹo nhà bếp
          </h1>
        </div>
      </div>

      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-2")}>
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Tìm bí quyết..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white border-gray-200 rounded-xl shadow-none"
          />
        </div>

        <Button 
          onClick={() => setIsAIModalOpen(true)}
          variant={isMobile ? "ghost" : "outline"}
          size={isMobile ? "icon" : "default"}
          className={cn(
            "rounded-xl font-bold transition-all shadow-none",
            isMobile ? "h-9 w-9 text-orange-600" : "h-10 gap-2 px-4 border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {!isMobile && "AI Trích xuất"}
        </Button>

        {/* Category Dropdown Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={isMobile ? "ghost" : "outline"} 
              size={isMobile ? "icon" : "default"}
              className={cn(
                "rounded-xl font-bold transition-all shadow-none",
                isMobile ? "h-9 w-9" : "h-10 gap-2 px-4 border-gray-200 bg-white",
                categoryFilter && (isMobile ? "text-orange-600" : "border-orange-500 text-orange-600 bg-orange-50")
              )}
            >
              <Filter className="w-4 h-4" />
              {!isMobile && (activeCategory ? activeCategory.name : "Tất cả")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
            <DropdownMenuLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">Lọc theo danh mục</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => handleCategorySelect(null)}
              className={cn("rounded-xl cursor-pointer font-bold", !categoryFilter && "text-orange-600 bg-orange-50")}
            >
              <div className="flex items-center justify-between w-full">
                Tất cả mẹo
                {!categoryFilter && <Check className="w-4 h-4" />}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-gray-50" />
            {TIP_CATEGORIES.map(cat => (
              <DropdownMenuItem 
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={cn("rounded-xl cursor-pointer font-bold", categoryFilter === cat.id && "text-orange-600 bg-orange-50")}
              >
                <div className="flex items-center justify-between w-full">
                  {cat.name}
                  {categoryFilter === cat.id && <Check className="w-4 h-4" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant={isSelectionMode ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => setSelectionMode(!isSelectionMode)}
          className={cn(
            "h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-none", 
            !isMobile && "md:bg-white md:border md:border-gray-200",
            isSelectionMode && (isMobile ? "text-orange-600" : "bg-orange-100 text-orange-600 border-orange-200")
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>

        <Link href="/tips/new">
          <Button 
            variant={isMobile ? "ghost" : "default"}
            className={cn(
              "h-9 w-9 md:h-10 md:w-auto md:px-5 rounded-xl font-bold shadow-none",
              isMobile ? "text-orange-600 p-0" : "bg-orange-600 hover:bg-orange-700 text-white border-none"
            )}
          >
            <Plus className="w-5 h-5 md:mr-2" />
            {!isMobile && "Viết mẹo"}
          </Button>
        </Link>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12 md:pt-16 pb-32">
      <StandardToolbar />

      <div className="max-w-[1800px] mx-auto px-4 py-4 md:px-8 md:py-6">
        {isMobile && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm mẹo vặt, bí quyết..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white rounded-2xl border-none shadow-sm font-bold"
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-3xl p-3 animate-pulse h-72 border border-gray-100">
                <div className="aspect-square bg-gray-100 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredTips.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
            {filteredTips.map((tip, i) => (
              <div key={tip.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                <TipCard 
                  tip={tip} 
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(tip.id)}
                  onToggleSelection={toggleSelection}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] md:rounded-[3rem] border border-gray-200 border-dashed shadow-none">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Không tìm thấy bí quyết nào</h3>
            <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">Thử thay đổi từ khóa hoặc chọn danh mục khác.</p>
            {!categoryFilter && !searchTerm && (
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setIsAIModalOpen(true)} variant="outline" className="rounded-xl font-bold px-6 border-orange-200 text-orange-600 gap-2">
                  <Sparkles className="w-4 h-4" /> Dùng AI trích xuất
                </Button>
                <Link href="/tips/new">
                  <Button className="bg-orange-600 rounded-xl font-bold px-8">Viết mẹo thủ công</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <ActionBar 
          selectedCount={selectedIds.size} 
          onCancel={() => setSelectionMode(false)}
        >
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              onClick={() => setIsBulkImageModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-2 md:px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
            >
              <ImagePlus className="w-4 h-4" /> {isMobile ? "Ảnh" : "Thêm ảnh hàng loạt"}
            </Button>
            <Button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-2 md:px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none"
            >
              <Trash2 className="w-4 h-4" /> {isMobile ? "Xóa" : "Xóa đã chọn"}
            </Button>
          </div>
        </ActionBar>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleBatchDelete}
        title="Xóa bí quyết đã chọn?"
        message={`Bạn đang chọn xóa ${selectedIds.size} mẹo vặt. Hành động này không thể hoàn tác.`}
        confirmText="Xóa ngay"
      />

      <TipAIImportModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      <TipBulkImageUploadModal 
        isOpen={isBulkImageModalOpen}
        onClose={() => { setIsBulkImageModalOpen(false); setSelectionMode(false); }}
        selectedTips={selectedTipsData}
      />
    </div>
  );
}

export default function KitchenTipsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>}>
      <TipsContent />
    </Suspense>
  );
}
