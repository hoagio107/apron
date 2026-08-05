
"use client";

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/hooks/use-courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Save, Youtube, Loader2, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Course, Lesson } from '@/lib/recipe-types';
import { RichTextToolbar } from '@/components/recipes/RichTextToolbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function LessonEditorPage(props: { params: Promise<{ slug: string, lessonId: string }> }) {
  const isMobile = useIsMobile();
  const params = use(props.params);
  const { slug, lessonId } = params;
  const router = useRouter();
  const { courses, updateCourse, loading: coursesLoading } = useCourses();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  
  const [lessonData, setLessonData] = useState({
    title: '',
    content: '',
    video_url: ''
  });

  useEffect(() => {
    // Only initialize once to prevent data loss when real-time updates happen
    if (isInitialized || coursesLoading || courses.length === 0) return;

    const foundCourse = courses.find(c => c.slug === slug);
    if (foundCourse) {
      setCourse(foundCourse);
      let foundLesson: Lesson | null = null;
      for (const mod of foundCourse.modules) {
        const l = mod.lessons.find(less => less.id === lessonId);
        if (l) {
          foundLesson = l;
          break;
        }
      }
      if (foundLesson) {
        setLessonData({
          title: foundLesson.title,
          content: foundLesson.content || '',
          video_url: foundLesson.video_url || ''
        });
        setIsInitialized(true);
      }
    }
  }, [courses, slug, lessonId, coursesLoading, isInitialized]);

  const handleSave = async () => {
    if (!course || !lessonData.title) return;
    setIsSaving(true);
    try {
      const updatedModules = course.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(l => 
          l.id === lessonId ? { ...l, ...lessonData } : l
        )
      }));

      await updateCourse(course.id, { modules: updatedModules });
      toast({ title: "Đã lưu bài học", description: "Nội dung bài học đã được cập nhật thành công." });
      
      setTimeout(() => router.push(`/courses/${slug}`), 500);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi lưu bài học" });
    } finally {
      setIsSaving(false);
    }
  };

  const getSafeVideoUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?"'\s]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length >= 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  if (coursesLoading && !isInitialized) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="min-w-0">
          <h1 className={cn("font-bold font-headline truncate", isMobile ? "text-sm max-w-[150px]" : "text-xl max-w-md")}>
            {lessonData.title || 'Soạn thảo bài học'}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl font-bold h-10 px-5 border-gray-200 bg-white text-gray-500 shadow-none">
          <X className="w-4 h-4 mr-2" /> Hủy
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !lessonData.title} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-5 shadow-none border-none">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu bài
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 dark:bg-gray-900 pt-14 md:pt-16 pb-32">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      <main className="max-w-5xl mx-auto p-0 md:p-8 md:mt-4 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-gray-800 md:rounded-3xl rounded-none shadow-none md:border border-none border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-6 md:p-10 border-b space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Tiêu đề bài học</label>
              <Input 
                value={lessonData.title}
                onChange={(e) => setLessonData({...lessonData, title: e.target.value})}
                placeholder="Nhập tên bài học..."
                className="text-2xl md:text-4xl font-bold border-0 border-b-2 border-gray-50 rounded-none px-0 h-auto py-2 focus-visible:ring-0 focus-visible:border-blue-500 placeholder:text-gray-100 shadow-none bg-transparent"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Video YouTube</label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <Input 
                  value={lessonData.video_url}
                  onChange={(e) => setLessonData({...lessonData, video_url: e.target.value})}
                  placeholder="Dán link bài học..."
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl shadow-none font-bold"
                />
              </div>
            </div>

            {getSafeVideoUrl(lessonData.video_url) && (
              <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700">
                <iframe src={getSafeVideoUrl(lessonData.video_url)!} className="w-full h-full" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col relative min-h-[400px]">
            <RichTextToolbar targetId="lesson-content" className="bg-white dark:bg-gray-800 sticky top-0 z-10" />
            <Textarea 
              id="lesson-content"
              value={lessonData.content}
              onChange={(e) => setLessonData({...lessonData, content: e.target.value})}
              placeholder="Viết nội dung bài học chuyên sâu tại đây..."
              className="flex-1 border-none rounded-none p-6 md:p-10 text-lg md:text-xl leading-relaxed focus-visible:ring-0 shadow-none bg-white dark:bg-gray-800 resize-none h-full min-h-[500px]"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
