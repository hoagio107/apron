
"use client";

import { useState, useMemo } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Search, Plus, BookOpen, ArrowRight, Loader2, X, CheckCircle2, Trash2, ArrowLeft, Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { useMobileMenuService } from '@/lib/services';
import { ActionBar } from '@/components/shared/ActionBar';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';

export default function CoursesPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { courses, loading, deleteCourses } = useCourses();
  const { toggleMenu } = useMobileMenuService();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return courses;
    return courses.filter(c => c.title.toLowerCase().includes(term));
  }, [courses, searchTerm]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async () => {
    if (!selectedIds.size) return;
    try {
      await deleteCourses(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast({ title: "Đã xóa thành công" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa dữ liệu." });
    } finally {
      setIsDeleteModalOpen(false);
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
          Khóa học
        </h1>
      </div>

      <div className={cn("flex items-center", isMobile ? "gap-0" : "gap-2")}>
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Tìm khóa học..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white border-gray-200 rounded-xl shadow-none"
          />
        </div>
        <Button 
          variant={isSelectionMode ? "secondary" : "ghost"} 
          size="icon" 
          onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds(new Set()); }}
          className={cn(
            "h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-none", 
            !isMobile && "md:bg-white md:border md:border-gray-200",
            isSelectionMode && (isMobile ? "text-blue-600" : "bg-blue-100 text-blue-600 border-blue-200")
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>
        <Link href="/courses/add">
          <Button 
            variant={isMobile ? "ghost" : "default"}
            className={cn(
              "h-9 md:h-10 rounded-xl font-bold px-4 md:px-5 shadow-none",
              isMobile ? "text-blue-600 p-0" : "bg-blue-600 hover:bg-blue-700 text-white border-none"
            )}
          >
            <Plus className="w-4 h-4 md:mr-2" />
            {!isMobile && "Tạo khóa học"}
          </Button>
        </Link>
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
              placeholder="Tìm khóa học..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white rounded-2xl border-none shadow-sm font-bold"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
            {filteredCourses.map((course) => (
              <CourseItem key={course.id} course={course} isSelectionMode={isSelectionMode} isSelected={selectedIds.has(course.id)} onToggleSelection={toggleSelection} />
            ))}
          </div>
        )}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <ActionBar 
          selectedCount={selectedIds.size} 
          onCancel={() => setIsSelectionMode(false)}
        >
          <Button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 px-6 font-bold gap-2 shadow-none border-none flex-1 md:flex-none">
            <Trash2 className="w-4 h-4" /> {isMobile ? "Xóa" : "Xóa vĩnh viễn"}
          </Button>
          <Button variant="ghost" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="rounded-2xl h-12 px-6 font-bold text-gray-400 hover:text-white flex-1 md:flex-none">
            Hủy
          </Button>
        </ActionBar>
      )}

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa khóa học đã chọn?"
        message={`Bạn đang chọn xóa ${selectedIds.size} khóa học. Dữ liệu này không thể khôi phục sau khi xóa.`}
        confirmText="Xóa ngay"
      />
    </div>
  );
}

function CourseItem({ course, isSelectionMode, isSelected, onToggleSelection }: any) {
  return (
    <div 
      onClick={() => isSelectionMode && onToggleSelection(course.id)}
      className={cn(
        "group relative rounded-xl md:rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden bg-white dark:bg-gray-800 flex flex-col h-full shadow-none p-1.5 md:p-2.5",
        isSelectionMode && isSelected ? "border-blue-500 ring-4 ring-blue-50 shadow-xl" : "border-gray-100 dark:border-gray-700 hover:border-blue-300 hover:shadow-xl",
        !isSelectionMode && "hover:-translate-y-1"
      )}
    >
      {isSelectionMode && (
        <div className={cn(
          "absolute top-4 right-4 w-8 h-8 rounded-full border-2 z-20 flex items-center justify-center transition-all",
          isSelected ? "bg-blue-500 border-blue-500 scale-110" : "bg-white/80 border-gray-200"
        )}>
          {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
        </div>
      )}

      <Link href={isSelectionMode ? "#" : `/courses/${course.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl md:rounded-2xl bg-gray-100">
          <img 
            src={course.thumbnail_url || "https://picsum.photos/seed/course/800/500"} 
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/60 text-white hover:bg-black/70 border-none font-bold backdrop-blur-md shadow-none px-2 py-0.5 text-[10px] uppercase">
              {course.level}
            </Badge>
          </div>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 font-headline leading-tight">{course.title}</h2>
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">{course.description}</p>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700 mt-auto">
            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-500" />{course.modules?.length || 0} PHẦN</span>
            </div>
            {!isSelectionMode && (
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-none border border-blue-100">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
