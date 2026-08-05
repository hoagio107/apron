
"use client";

import { use, useMemo, useState } from 'react';
import { useMenus } from '@/hooks/use-menus';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Utensils, ChevronRight, Loader2, Search, X, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MenuCreateModal } from '@/components/menus/MenuCreateModal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MenuGroupPage(props: { params: Promise<{ groupSlug: string }> }) {
  const isMobile = useIsMobile();
  const params = use(props.params);
  const { groupSlug } = params;
  const router = useRouter();
  const { toast } = useToast();
  const { groups, menus, loading, addMenu } = useMenus();
  const { recipes } = useRecipes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const group = useMemo(() => groups.find(g => g.slug === groupSlug), [groups, groupSlug]);
  
  const filteredMenus = useMemo(() => {
    const list = menus.filter(m => m.group_slug === groupSlug);
    if (!searchTerm) return list;
    return list.filter(m => 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menus, groupSlug, searchTerm]);

  const handleCreateMenu = async (data: any) => {
    try {
      await addMenu({
        ...data,
        group_slug: groupSlug
      });
      toast({ title: "Thành công!", description: `Đã tạo thực đơn "${data.title}".` });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo thực đơn lúc này." });
    }
  };

  if (loading && groups.length === 0) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-green-600" /></div>;

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/menus')} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[150px]" : "text-xl max-w-md")}>
          {group?.title || 'Đang tải...'}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Tìm thực đơn..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white border-gray-200 rounded-xl shadow-none"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 rounded-xl font-bold h-10 px-5 text-white border-none shadow-none">
          <Plus className="w-4 h-4 md:mr-2" />
          {!isMobile && "Tạo thực đơn"}
        </Button>
      </div>
    </>
  );

  return (
    <div className={cn("min-h-screen pb-32 pt-14 md:pt-16 transition-colors duration-300", isMobile ? "bg-white" : "bg-gray-50 dark:bg-gray-900")}>
      {/* Fixed Navbar Standard */}
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      {/* Hero Banner for Group */}
      <div className="relative h-[35vh] md:h-[45vh] w-full group overflow-hidden mt-0">
        <img 
          src={group?.image_url || "https://picsum.photos/seed/group-banner/1200/600"} 
          alt={group?.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        
        <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12 z-10">
          <div className="max-w-5xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-headline leading-tight drop-shadow-xl animate-in slide-in-from-left duration-500">
              {group?.title}
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md animate-in slide-in-from-left duration-700">
              {group?.description}
            </p>
          </div>
        </div>
      </div>

      <div className={cn("max-w-[1800px] mx-auto relative z-20", isMobile ? "p-0" : "p-4 md:p-8 -mt-10")}>
        {/* Mobile Search - only visible on mobile */}
        {isMobile && (
          <div className="relative mb-6 px-4 -mt-10">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm thực đơn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white rounded-2xl border-none shadow-sm font-bold"
            />
          </div>
        )}

        <div className={cn(
          "bg-white dark:bg-gray-800 shadow-none border-none md:border md:border-gray-100 md:dark:border-gray-700 md:shadow-xl md:shadow-gray-200/50 md:dark:shadow-none",
          isMobile ? "rounded-none px-6 pb-6 pt-0" : "rounded-[2.5rem] p-10"
        )}>
          <div className="flex items-center gap-5 mb-6 pb-4 md:mb-10 md:pb-8 border-b">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] bg-green-100 text-green-600 shadow-inner shrink-0">
              <LayoutGrid className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white font-headline">Bộ sưu tập thực đơn</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Khám phá {filteredMenus.length} bộ thực đơn trong nhóm này</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
            {filteredMenus.map((menu) => (
              <Link key={menu.id} href={`/menus/${groupSlug}/${menu.slug}`}>
                <Card className="group overflow-hidden transition-all duration-500 border bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl h-full border-gray-100 dark:border-gray-700 shadow-none p-1.5 md:p-2.5 hover:border-green-300 flex flex-col">
                  <div className="relative aspect-square md:aspect-video overflow-hidden rounded-xl md:rounded-2xl bg-gray-100 shrink-0">
                    <img 
                      src={menu.image_url || "https://picsum.photos/seed/menu-item/600/400"} 
                      alt={menu.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center">
                      <Utensils className="w-3 h-3 mr-1 text-orange-400" />
                      {menu.recipe_ids?.length || 0} món
                    </div>
                  </div>
                  
                  <div className="pt-3 md:pt-4 px-1 pb-1 flex flex-col flex-grow min-w-0">
                    <div className="flex-grow">
                      <h3 className="text-[11px] md:text-lg font-bold text-gray-800 dark:text-white mb-1 line-clamp-2 group-hover:text-green-600 transition-colors font-headline leading-tight">
                        {menu.title}
                      </h3>
                      <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1 md:line-clamp-2 leading-relaxed">{menu.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Khám phá ngay</span>
                      <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-none border border-green-100">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            
            {filteredMenus.length === 0 && (
              <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-200 opacity-50" />
                <h3 className="text-xl font-bold text-gray-400">Không tìm thấy thực đơn nào</h3>
                <Button variant="link" onClick={() => { setSearchTerm(''); setIsModalOpen(true); }} className="text-green-600 font-bold mt-2">Hãy tạo thực đơn mới ngay!</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MenuCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreateMenu}
        allRecipes={recipes}
      />
    </div>
  );
}
