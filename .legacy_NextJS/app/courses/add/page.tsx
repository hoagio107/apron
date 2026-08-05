
"use client";

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/hooks/use-courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, Save, Plus, Trash2, 
  Loader2, Info, X, ListTree, FolderPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Course } from '@/lib/recipe-types';
import { ImageUploader } from '@/components/recipes/ImageUploader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function AddCoursePage(props: { searchParams: Promise<{ edit?: string }> }) {
  const isMobile = useIsMobile();
  const searchParams = use(props.searchParams);
  const editSlug = searchParams.edit;
  const router = useRouter();
  const { courses, addCourse, updateCourse, loading: coursesLoading } = useCourses();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const [formData, setFormData] = useState<Omit<Course, 'id' | 'created_at'>>({
    title: '',
    slug: '',
    description: '',
    thumbnail_url: '',
    level: 'Cơ bản',
    author_id: 'user_local',
    modules: [{
      id: generateId(),
      title: 'Chương 1',
      lessons: [{
        id: generateId(),
        title: 'Bài học 1',
        content: '',
        attached_recipe_ids: []
      }]
    }]
  });

  useEffect(() => {
    if (editSlug && courses.length > 0 && !isInitialized) {
      const course = courses.find(c => c.slug === editSlug);
      if (course) {
        setCourseId(course.id);
        const { id, created_at, ...rest } = course;
        setFormData(rest);
        setIsInitialized(true);
      }
    }
  }, [editSlug, courses, isInitialized]);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    setFormData({ ...formData, title, slug });
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, {
        id: generateId(),
        title: `Chương ${formData.modules.length + 1}`,
        lessons: [{
          id: generateId(),
          title: 'Bài học mới',
          content: '',
          attached_recipe_ids: []
        }]
      }]
    });
  };

  const handleRemoveModule = (mIdx: number) => {
    const newModules = formData.modules.filter((_, i) => i !== mIdx);
    setFormData({ ...formData, modules: newModules });
  };

  const handleAddLesson = (mIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons.push({
      id: generateId(),
      title: 'Bài học mới',
      content: '',
      attached_recipe_ids: []
    });
    setFormData({ ...formData, modules: newModules });
  };

  const handleRemoveLesson = (mIdx: number, lIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons = newModules[mIdx].lessons.filter((_, i) => i !== lIdx);
    setFormData({ ...formData, modules: newModules });
  };

  const handleModuleTitleChange = (mIdx: number, title: string) => {
    const newModules = [...formData.modules];
    newModules[mIdx].title = title;
    setFormData({ ...formData, modules: newModules });
  };

  const handleLessonTitleChange = (mIdx: number, lIdx: number, title: string) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons[lIdx].title = title;
    setFormData({ ...formData, modules: newModules });
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Thiếu thông tin", description: "Vui lòng nhập tên khóa học." });
      return;
    }
    setIsSaving(true);
    try {
      if (courseId) {
        await updateCourse(courseId, formData);
        toast({ title: "Đã cập nhật", description: "Cấu trúc khóa học đã được lưu." });
      } else {
        await addCourse(formData);
        toast({ title: "Thành công!", description: "Đã tạo khóa học mới." });
      }
      router.push(`/courses/${formData.slug}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu khóa học." });
    } finally {
      setIsSaving(false);
    }
  };

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-none">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[150px]" : "text-xl max-w-md")}>
          {courseId ? "Chỉnh sửa cấu trúc" : "Tạo khóa học mới"}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !formData.title} 
          className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold h-10 px-5 text-white border-none shadow-none"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 md:mr-2" />}
          {!isMobile && "Lưu cấu trúc"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 pt-14 md:pt-16">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <ImageUploader value={formData.thumbnail_url} onChange={(url) => setFormData({...formData, thumbnail_url: url})} label="Ảnh bìa khóa học" />
            <Card className="p-6 rounded-3xl shadow-sm border-none bg-white dark:bg-gray-800 space-y-6">
              <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 border-b pb-3">
                <Info className="w-5 h-5 text-blue-500" /> Thông tin chung
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tên khóa học *</label>
                  <Input 
                    placeholder="VD: Nhập môn Bếp Việt..." 
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="h-12 font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-none shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                  <Textarea 
                    placeholder="Giới thiệu về khóa học..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="rounded-xl bg-gray-50 dark:bg-gray-900 border-none shadow-none resize-y"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Trình độ</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value as any})}
                    className="w-full h-12 rounded-xl border-none bg-gray-50 dark:bg-gray-900 px-3 text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Nâng cao">Nâng cao</option>
                    <option value="Chuyên gia">Chuyên gia</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="p-6 md:p-8 rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-gray-800 dark:text-white text-xl flex items-center gap-3 font-headline">
                  <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <ListTree className="w-5 h-5" />
                  </div>
                  Đề cương học tập
                </h2>
              </div>

              <div className="space-y-10">
                {formData.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="relative group/module">
                    <div className="flex items-center gap-4 mb-6">
                      <Input 
                        value={mod.title}
                        onChange={(e) => handleModuleTitleChange(mIdx, e.target.value)}
                        className="text-lg font-bold border-0 border-b-2 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-blue-500 w-full shadow-none"
                        placeholder="Tên chương (VD: Chương 1)..."
                      />
                      <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveModule(mIdx)} disabled={formData.modules.length === 1} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-5 h-5" /></Button>
                    </div>

                    <div className="space-y-6 pl-2 md:pl-4">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="flex items-center gap-2 md:gap-3 group/lesson">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center text-[10px] font-black shrink-0">
                            {lIdx + 1}
                          </div>
                          <Input 
                            placeholder="Tên bài học..." 
                            value={lesson.title}
                            onChange={(e) => handleLessonTitleChange(mIdx, lIdx, e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-10 text-sm font-bold shadow-none flex-grow"
                          />
                          <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveLesson(mIdx, lIdx)} disabled={mod.lessons.length === 1} className="text-gray-300 hover:text-red-500 transition-all shrink-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleAddLesson(mIdx)} className="flex items-center gap-2 text-xs font-bold text-blue-600/60 hover:text-blue-600 transition-colors ml-10 py-2">
                        <Plus className="w-3.5 h-3.5" /> Thêm bài học mới
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="ghost" type="button" onClick={handleAddModule} className="w-full mt-12 h-16 border-2 border-dashed border-blue-100 dark:border-gray-700 bg-blue-50/30 dark:bg-gray-900/30 text-blue-600 rounded-3xl font-bold hover:bg-blue-50 transition-all shadow-none">
                <FolderPlus className="w-6 h-6 mr-2" /> Thêm Chương mới
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
