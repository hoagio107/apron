
"use client";

import { use, useState, useMemo, useEffect } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { useRecipes } from '@/hooks/use-recipes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, CheckCircle2, BookOpen, 
  Loader2, Menu as MenuIcon,
  Circle, PlayCircle, Settings, Edit3,
  X, Utensils, Settings2, Sparkles, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { Lesson, Course } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';
import { RecipeCard } from '@/components/recipes/RecipeCard';
// @ts-ignore
import { marked } from 'marked';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourseRecipeManagerModal } from '@/components/courses/CourseRecipeManagerModal';
import { useToast } from '@/hooks/use-toast';

export default function CourseViewPage(props: { params: Promise<{ slug: string }> }) {
  const isMobile = useIsMobile();
  const params = use(props.params);
  const slug = params.slug;
  const router = useRouter();
  const { toast } = useToast();
  const { courses, updateCourse, loading: coursesLoading } = useCourses();
  const { recipes, loading: recipesLoading } = useRecipes();
  
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecipeManagerOpen, setIsRecipeManagerOpen] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [htmlContent, setHtmlContent] = useState<string>('');

  const course = useMemo(() => courses.find(c => c.slug === slug), [courses, slug]);

  // Load progress from localStorage
  useEffect(() => {
    if (course) {
      const saved = localStorage.getItem(`course_progress_${course.id}`);
      if (saved) {
        try {
          setCompletedLessonIds(new Set(JSON.parse(saved)));
        } catch (e) {
          console.error("Failed to parse progress", e);
        }
      }
    }
  }, [course]);

  // Save progress to localStorage
  useEffect(() => {
    if (course && completedLessonIds.size > 0) {
      localStorage.setItem(`course_progress_${course.id}`, JSON.stringify(Array.from(completedLessonIds)));
    }
  }, [completedLessonIds, course]);

  useEffect(() => {
    if (course && course.modules?.[0]?.lessons?.[0] && !activeLesson) {
      setActiveLesson(course.modules[0].lessons[0]);
    }
  }, [course, activeLesson]);

  // Handle Markdown rendering asynchronously
  useEffect(() => {
    if (activeLesson?.content) {
      const renderContent = async () => {
        try {
          const html = await marked.parse(activeLesson.content, { breaks: true, gfm: true });
          setHtmlContent(html);
        } catch (e) {
          console.error("Markdown parse error", e);
          setHtmlContent('<p class="text-red-500">Lỗi hiển thị nội dung bài học.</p>');
        }
      };
      renderContent();
    } else {
      setHtmlContent('');
    }
  }, [activeLesson?.content]);

  const attachedRecipes = useMemo(() => {
    if (!activeLesson?.attached_recipe_ids?.length || !recipes.length) return [];
    const recipeMap = new Map(recipes.map(r => [r.id, r]));
    return activeLesson.attached_recipe_ids
      .map(id => recipeMap.get(id))
      .filter(Boolean) as any[];
  }, [activeLesson, recipes]);

  const handleUpdateLessonRecipes = async (newRecipeIds: string[]) => {
    if (!course || !activeLesson) return;

    try {
      const updatedModules = course.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(l => 
          l.id === activeLesson.id ? { ...l, attached_recipe_ids: newRecipeIds } : l
        )
      }));

      await updateCourse(course.id, { modules: updatedModules });
      
      // Update local state for immediate feedback
      setActiveLesson(prev => prev ? { ...prev, attached_recipe_ids: newRecipeIds } : null);
      
      toast({ title: "Đã cập nhật công thức thực hành" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi cập nhật" });
    }
  };

  const handleComplete = () => {
    if (!activeLesson) return;
    
    setCompletedLessonIds(prev => new Set(prev).add(activeLesson.id));
    
    toast({
      title: "Tuyệt vời! 🎉",
      description: `Bạn đã hoàn thành bài học: ${activeLesson.title}. Tiếp tục cố gắng nhé!`,
    });
  };

  const getSafeVideoUrl = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?"'\s]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length >= 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  if (coursesLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!course) return <div className="p-20 text-center">Khóa học không tồn tại.</div>;

  const SyllabusList = () => (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {course.modules.map((mod) => (
        <div key={mod.id} className="bg-gray-50/30 dark:bg-gray-900/30">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50">
            {mod.title}
          </h3>
          <div className="space-y-0">
            {mod.lessons.map((lesson) => {
              const isActive = activeLesson?.id === lesson.id;
              const isCompleted = completedLessonIds.has(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); if (isMobile) setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full text-left px-6 py-4 transition-all flex items-start gap-4 border-l-4",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600" 
                      : "hover:bg-white dark:hover:bg-gray-700 border-transparent text-gray-600 dark:text-gray-400"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    {isActive ? (
                      <PlayCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className={cn("w-5 h-5", isCompleted ? "text-green-500/50" : "text-gray-300")} />
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className={cn(
                      "text-sm font-bold leading-snug", 
                      isActive ? "text-blue-700" : isCompleted ? "text-gray-400" : "text-gray-700"
                    )}>
                      {lesson.title}
                    </p>
                  </div>
                  {isCompleted && (
                    <div className="mt-1 shrink-0 ml-auto">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const AttachedRecipesSection = () => (
    <div className="mt-2 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center text-orange-600",
            isMobile ? "bg-transparent" : "w-12 h-12 rounded-2xl bg-orange-100"
          )}>
            <Utensils className={isMobile ? "w-6 h-6" : "w-6 h-6"} />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-headline">Công thức thực hành</h2>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1 hidden md:block">Các món ăn được học trong bài này</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsRecipeManagerOpen(true)}
          className="rounded-xl font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-none border-none h-10 px-5"
        >
          <Settings2 className="w-4 h-4" /> Quản lý
        </Button>
      </div>

      {attachedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {attachedRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chưa có công thức nào được gắn</p>
        </div>
      )}
    </div>
  );

  const DesktopView = () => (
    <div className="flex h-screen overflow-hidden pt-16">
      <header className="fixed top-0 left-64 right-0 h-16 border-b z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/courses')} className="rounded-full shadow-none"><ArrowLeft className="w-6 h-6" /></Button>
          <h2 className="font-bold text-lg text-gray-800 dark:text-white truncate max-w-md font-headline">{activeLesson?.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/courses/add?edit=${course.slug}`}>
            <Button className="rounded-xl font-bold h-10 px-5 bg-orange-600 hover:bg-orange-700 text-white shadow-none border-none">
              <Settings className="w-4 h-4 mr-2" /> Cấu trúc
            </Button>
          </Link>
          {activeLesson && (
            <Link href={`/courses/${slug}/lessons/${activeLesson.id}/edit`}>
              <Button className="rounded-xl font-bold h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-none border-none">
                <Edit3 className="w-4 h-4 mr-2" /> Sửa bài
              </Button>
            </Link>
          )}
          <Button 
            onClick={handleComplete} 
            className="rounded-xl font-bold h-10 px-5 bg-green-600 hover:bg-green-700 text-white shadow-none border-none"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Hoàn thành
          </Button>
        </div>
      </header>

      <aside className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col shrink-0",
        isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        <div className="p-6 border-b flex flex-col shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight font-headline">{course.title}</h2>
          <div className="mt-3 flex gap-2">
            <Badge variant="secondary" className="text-[9px] font-black rounded-lg px-2 py-0.5 uppercase">{course.level}</Badge>
            <Badge variant="secondary" className="text-[9px] font-black rounded-lg px-2 py-0.5 uppercase">{course.modules.length} CHƯƠNG</Badge>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <SyllabusList />
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-gray-900">
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-12 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {getSafeVideoUrl(activeLesson?.video_url) && (
              <div className="aspect-video bg-black rounded-[2.5rem] mb-12 overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
                <iframe src={getSafeVideoUrl(activeLesson?.video_url)!} className="w-full h-full" allowFullScreen />
              </div>
            )}
            
            <h1 className="text-5xl font-headline font-bold mb-8 text-gray-900 dark:text-white leading-tight">{activeLesson?.title}</h1>
            
            {htmlContent ? (
              <div className="markdown-content prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] bg-gray-50/50">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Chưa có nội dung bài học</p>
                <Link href={`/courses/${slug}/lessons/${activeLesson?.id}/edit`} className="mt-4 inline-block"><Button className="bg-blue-600 rounded-xl font-bold">Biên soạn ngay</Button></Link>
              </div>
            )}

            <AttachedRecipesSection />
          </div>
        </ScrollArea>
      </main>
    </div>
  );

  const MobileView = () => (
    <div className="flex flex-col h-screen bg-white pt-14 overflow-hidden w-full max-w-full">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/courses')} className="rounded-full shadow-none"><ArrowLeft className="w-6 h-6" /></Button>
          <span className="font-bold text-sm truncate max-w-[150px] font-headline">{course.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("rounded-xl transition-colors", isSidebarOpen && "bg-blue-50 text-blue-600")}>
            {isSidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
              <DropdownMenuItem asChild className="rounded-xl p-3 font-bold cursor-pointer">
                <Link href={`/courses/add?edit=${course.slug}`} className="flex items-center gap-3 text-orange-600">
                  <Settings className="w-4 h-4" />
                  Sửa cấu trúc khóa học
                </Link>
              </DropdownMenuItem>
              {activeLesson && (
                <DropdownMenuItem asChild className="rounded-xl p-3 font-bold cursor-pointer">
                  <Link href={`/courses/${slug}/lessons/${activeLesson.id}/edit`} className="flex items-center gap-3 text-blue-600">
                    <Edit3 className="w-4 h-4" />
                    Sửa nội dung bài học
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleComplete} 
                className="rounded-xl p-3 font-bold flex items-center gap-3 text-green-600 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Đánh dấu hoàn thành
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full overflow-hidden relative min-w-0">
        <ScrollArea className="flex-1 w-full h-full">
          {activeLesson ? (
            <div className="p-4 pb-24 w-full min-w-0">
              {getSafeVideoUrl(activeLesson.video_url) && (
                <div className="aspect-video bg-black rounded-2xl mb-6 overflow-hidden shadow-lg">
                  <iframe src={getSafeVideoUrl(activeLesson.video_url)!} className="w-full h-full" allowFullScreen />
                </div>
              )}
              
              <h1 className="text-2xl font-bold font-headline mb-6 leading-tight break-words">{activeLesson.title}</h1>
              
              <div className="w-full min-w-0 max-w-full overflow-hidden">
                {htmlContent ? (
                  <div 
                    className="markdown-content text-gray-700 dark:text-gray-300 leading-relaxed text-sm w-full break-words" 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
                ) : (
                  <div className="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Nội dung đang chờ soạn thảo</p>
                  </div>
                )}
              </div>

              <AttachedRecipesSection />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 h-full"><Loader2 className="w-10 h-10 animate-spin" /></div>
          )}
        </ScrollArea>

        {isSidebarOpen && (
          <div className="absolute inset-0 z-40 bg-white animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Danh mục bài học</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="h-7 text-xs font-bold">Đóng</Button>
            </div>
            <ScrollArea className="h-full pb-20">
              <SyllabusList />
            </ScrollArea>
          </div>
        )}
      </div>

      {!isSidebarOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t z-30">
          <Button 
            onClick={handleComplete} 
            className="w-full bg-green-600 h-12 rounded-xl font-bold text-white shadow-none border-none"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" /> Đánh dấu hoàn thành
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isMobile ? <MobileView /> : <DesktopView />}

      {activeLesson && (
        <CourseRecipeManagerModal 
          isOpen={isRecipeManagerOpen}
          onClose={() => setIsRecipeManagerOpen(false)}
          currentRecipeIds={activeLesson.attached_recipe_ids || []}
          onSave={handleUpdateLessonRecipes}
          allRecipes={recipes}
        />
      )}
    </div>
  );
}
