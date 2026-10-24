import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, 
  Progress, 
  Tabs, 
  Tab, 
  Textarea, 
  Accordion, 
  AccordionItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  toast
} from '@/ui';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  PlayCircle, 
  Star, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  ChefHat, 
  StickyNote, 
  Flame, 
  Edit, 
  Paperclip, 
  Check, 
  Share2, 
  MoreVertical,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import type { Lesson } from '@apron/core';
import { PageLoader } from '../../components/shared/PageLoader';
import { ImageManager } from '../../lib/image-manager';
import { IconRenderer } from '../../components/shared/IconPicker';

interface NoteItem {
  id: string;
  lessonId: string;
  content: string;
  createdAt: number;
  expanded: boolean;
}

export function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, fetchCourses } = useCourseStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('content');

  // Persist course progress to localStorage
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    if (!id) return {};
    try {
      const saved = localStorage.getItem(`course_progress_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist personal notes to localStorage
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    if (!id) return [];
    try {
      const saved = localStorage.getItem(`course_notes_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Fetch initial store data if empty
  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [fetchCourses, courses.length, fetchRecipes, recipes.length]);

  // Sync completion state to localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`course_progress_${id}`, JSON.stringify(completedLessons));
    }
  }, [id, completedLessons]);

  // Sync notes to localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`course_notes_${id}`, JSON.stringify(notes));
    }
  }, [id, notes]);

  const course = useMemo(() => courses.find(c => c.id === id), [courses, id]);

  // Flatten all lessons across all modules for simple sequential navigation
  const allLessons = useMemo(() => {
    if (!course?.modules) return [];
    const list: {
      lesson: Lesson;
      moduleIndex: number;
      moduleTitle: string;
      moduleIcon?: string;
      lessonIndex: number;
      globalIndex: number;
    }[] = [];
    let gIdx = 0;
    course.modules.forEach((mod, mIdx) => {
      (mod.lessons || []).forEach((les, lIdx) => {
        list.push({
          lesson: les,
          moduleIndex: mIdx,
          moduleTitle: mod.title,
          moduleIcon: mod.icon,
          lessonIndex: lIdx,
          globalIndex: gIdx++,
        });
      });
    });
    return list;
  }, [course]);

  // Initialize active lesson if not set
  useEffect(() => {
    if (allLessons.length > 0 && !activeLessonId) {
      setActiveLessonId(allLessons[0].lesson.id);
    }
  }, [allLessons, activeLessonId]);

  if (!course) {
    return <PageLoader />;
  }

  // Current lesson position
  const currentGlobalIndex = allLessons.findIndex(item => item.lesson.id === activeLessonId);
  const currentItem = currentGlobalIndex >= 0 ? allLessons[currentGlobalIndex] : allLessons[0] || null;
  const activeLesson = currentItem?.lesson || null;

  const hasPrev = currentGlobalIndex > 0;
  const hasNext = currentGlobalIndex >= 0 && currentGlobalIndex < allLessons.length - 1;

  const goToPrevLesson = () => {
    if (hasPrev) {
      const prevId = allLessons[currentGlobalIndex - 1].lesson.id;
      setActiveLessonId(prevId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextLesson = () => {
    if (hasNext) {
      const nextId = allLessons[currentGlobalIndex + 1].lesson.id;
      setActiveLessonId(nextId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Progress metrics
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(item => completedLessons[item.lesson.id]).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCurrentCompleted = activeLesson ? !!completedLessons[activeLesson.id] : false;

  const toggleComplete = (lessonId: string) => {
    const isCurrentlyDone = !!completedLessons[lessonId];
    if (isCurrentlyDone) {
      setCompletedLessons(prev => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      toast.info('Đã bỏ đánh dấu hoàn thành');
    } else {
      setCompletedLessons(prev => ({ ...prev, [lessonId]: true }));
      toast.success('Đã hoàn thành bài học! 🎉');
    }
  };

  // Note actions
  const handleAddNote = () => {
    if (!newNote.trim() || !activeLesson) return;
    setNotes(prev => [
      {
        id: crypto.randomUUID(),
        lessonId: activeLesson.id,
        content: newNote.trim(),
        createdAt: Date.now(),
        expanded: true
      },
      ...prev
    ]);
    setNewNote('');
    setIsAddingNote(false);
    toast.success('Đã lưu ghi chú mới!');
  };

  const handleUpdateNote = () => {
    if (!editingNoteContent.trim() || !editingNoteId) return;
    setNotes(prev =>
      prev.map(n => (n.id === editingNoteId ? { ...n, content: editingNoteContent.trim() } : n))
    );
    setEditingNoteId(null);
    setEditingNoteContent('');
    toast.success('Đã cập nhật ghi chú!');
  };

  const toggleNote = (noteId: string) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, expanded: !n.expanded } : n)));
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Đã xoá ghi chú');
  };

  const activeNotes = activeLesson ? notes.filter(n => n.lessonId === activeLesson.id) : [];

  const handleShare = async () => {
    const shareText = `📚 Khoá học: ${course.title}\n👨‍🍳 Giảng viên: ${course.teacher || 'Apron Academy'}\n${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: course.title,
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết khoá học!');
      }
    } catch {
      // User cancelled share
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setSelectedTab('content');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-28">
      {/* 1. TOP APP BAR (Flat & Clean) */}
      <header className="sticky top-0 z-40 bg-background/95 dark:bg-black/90 backdrop-blur-md border-b border-divider/50 px-4 py-3 h-14 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            isIconOnly
            variant="light"
            radius="full"
            onPress={() => navigate('/courses')}
            aria-label="Quay lại danh sách khoá học"
            className="w-10 h-10 min-w-10 text-foreground shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-bold text-foreground truncate leading-tight">
              {course.title}
            </h1>
            <span className="text-xs text-default-500 font-medium truncate">
              {course.teacher || 'Khoá học'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            isIconOnly
            variant="light"
            radius="full"
            onPress={() => navigate(`/courses/edit/${course.id}`)}
            aria-label="Chỉnh sửa khoá học"
            className="w-9 h-9 min-w-9 text-foreground"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                aria-label="Tùy chọn khác"
                className="w-9 h-9 min-w-9 text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Tùy chọn khoá học" className="min-w-[200px]">
              <DropdownItem
                key="share"
                startContent={<Share2 className="w-4 h-4 text-primary" />}
                onPress={handleShare}
                className="py-2.5 text-sm"
              >
                Chia sẻ khoá học
              </DropdownItem>
              <DropdownItem
                key="copy"
                startContent={<Copy className="w-4 h-4 text-default-500" />}
                onPress={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Đã sao chép liên kết!');
                }}
                className="py-2.5 text-sm"
              >
                Sao chép liên kết
              </DropdownItem>
              <DropdownItem
                key="edit"
                startContent={<Edit className="w-4 h-4 text-default-500" />}
                onPress={() => navigate(`/courses/edit/${course.id}`)}
                className="py-2.5 text-sm"
              >
                Chỉnh sửa bài giảng
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      {/* Sleek Top Progress Bar */}
      <div className="w-full bg-default-100 dark:bg-default-50/20 h-0.5 shrink-0 overflow-hidden">
        <div 
          className="bg-primary h-0.5 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. MEDIA / VIDEO PLAYER AREA (Flat, thuần túy hình ảnh/video, không đè card nổi) */}
      <div className="w-full bg-black relative shrink-0">
        {activeLesson?.video_url ? (
          <div className="w-full aspect-video relative overflow-hidden flex items-center justify-center">
            {activeLesson.video_url.includes('youtube.com') || activeLesson.video_url.includes('youtu.be') ? (
              <iframe
                src={
                  activeLesson.video_url.includes('watch?v=')
                    ? activeLesson.video_url.replace('watch?v=', 'embed/').split('&')[0]
                    : activeLesson.video_url
                }
                className="absolute inset-0 w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <video
                src={ImageManager.getAssetUrl(activeLesson.video_url)}
                controls
                className="absolute inset-0 w-full h-full object-contain"
                controlsList="nodownload"
                poster={activeLesson.hero_image_url ? ImageManager.getAssetUrl(activeLesson.hero_image_url) : undefined}
              />
            )}
          </div>
        ) : (
          <div className="w-full aspect-16/10 sm:aspect-video bg-default-100 relative shrink-0 overflow-hidden">
            {activeLesson?.hero_image_url || course.thumbnail_url ? (
              <img
                src={ImageManager.getAssetUrl(activeLesson?.hero_image_url || course.thumbnail_url)}
                alt={activeLesson?.title || course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-default-100 text-default-400 gap-2">
                <BookOpen className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs font-semibold uppercase tracking-wider">{course.title}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. LESSON HEADER (Gọn gàng, tinh tế, không nhồi nhét) */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-1 border-b border-divider/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <span>{currentItem?.moduleTitle || `Chương ${(currentItem?.moduleIndex ?? 0) + 1}`}</span>
          <span>•</span>
          <span>Bài {(currentItem?.lessonIndex ?? 0) + 1}</span>
          {activeLesson?.duration_minutes ? (
            <>
              <span className="text-default-300">•</span>
              <span className="text-default-500 font-normal">{activeLesson.duration_minutes} phút</span>
            </>
          ) : null}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
          {activeLesson?.title || 'Đang tải bài học...'}
        </h2>
      </div>

      {/* 4. FLAT TABS (Thanh tab phẳng sát nền, không bọc card dày) */}
      <div className="w-full flex-1 flex flex-col">
        <Tabs
          aria-label="Các phần nội dung bài học"
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          color="primary"
          variant="underlined"
          fullWidth
          classNames={{
            base: 'w-full sticky top-[56px] z-30 bg-background/95 backdrop-blur-md border-b border-divider/40',
            tabList: 'px-4 gap-6 p-0 h-11 border-none',
            tab: 'h-11 px-0 font-bold text-sm text-default-500 data-[selected=true]:text-primary',
            cursor: 'w-full bg-primary h-0.5',
            panel: 'flex-1 p-0'
          }}
        >
          {/* TAB 1: NỘI DUNG BÀI HỌC (Flat Reading View) */}
          <Tab key="content" title="Nội dung">
            <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
              {activeLesson?.content ? (
                <div
                  className="prose prose-neutral prose-base sm:prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed 
                    prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight 
                    prose-p:my-3.5 prose-ul:my-2.5 prose-ol:my-2.5 prose-li:my-1.5
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-default-400 gap-3">
                  <FileText className="w-14 h-14 stroke-[1.2] opacity-30" />
                  <p className="text-base font-medium">Chưa có nội dung bài đọc cho phần này</p>
                </div>
              )}

              {/* Ghi chú của giảng viên (Dạng trích dẫn phẳng, không dùng hộp card) */}
              {activeLesson?.notes && (
                <div className="border-l-3 border-amber-500 pl-4 py-1.5 my-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                    Ghi chú của giảng viên
                  </span>
                  <p className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {activeLesson.notes}
                  </p>
                </div>
              )}

              {/* Công thức thực hành liên kết (Danh sách phẳng với đường kẻ hairline, không dùng card rời) */}
              {activeLesson?.attached_recipe_ids && activeLesson.attached_recipe_ids.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-xs font-bold text-default-500 uppercase tracking-wider">
                    Công thức thực hành liên kết ({activeLesson.attached_recipe_ids.length})
                  </span>
                  <div className="flex flex-col divide-y divide-divider/40">
                    {activeLesson.attached_recipe_ids.map(recipeId => {
                      const recipe = recipes.find(r => r.id === recipeId);
                      if (!recipe) return null;

                      return (
                        <div
                          key={recipe.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/recipes/${recipe.id}`)}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${recipe.id}`)}
                          className="flex items-center gap-3.5 py-3 cursor-pointer hover:bg-default-100/40 active:bg-default-200/40 transition-colors"
                        >
                          <div className="w-14 h-14 rounded-xl bg-default-100 overflow-hidden shrink-0">
                            {recipe.thumbnail_url ? (
                              <img
                                src={ImageManager.getAssetUrl(recipe.thumbnail_url)}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-default-400">
                                <ChefHat className="w-6 h-6 stroke-[1.5]" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 justify-center">
                            <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                              {recipe.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-default-400">
                              {recipe.total_time_minutes ? <span>{recipe.total_time_minutes}p</span> : null}
                              {recipe.calories ? <span>• {recipe.calories} kcal</span> : null}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-default-300 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Tab>

          {/* TAB 2: GIÁO TRÌNH (SYLLABUS - Kích thước bài học touch-friendly, chữ rõ ràng) */}
          <Tab
            key="syllabus"
            title={
              <div className="flex items-center justify-center gap-1.5">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">Giáo trình ({totalLessons})</span>
              </div>
            }
          >
            <div className="flex flex-col w-full max-w-3xl mx-auto">
              {/* Dòng tóm tắt tiến độ phẳng */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-divider/40 bg-default-50/50 dark:bg-default-50/10 text-xs font-semibold text-default-500">
                <span>{course.modules?.length || 0} chương • {totalLessons} bài học</span>
                <span className="text-primary font-bold">{progressPercent}% hoàn thành</span>
              </div>

              {/* Flat Module Accordion */}
              <Accordion
                selectionMode="multiple"
                defaultExpandedKeys={course.modules?.map((_, i) => i.toString())}
                className="px-0 gap-0"
                itemClasses={{
                  base: 'py-0 px-0 outline-none w-full border-b border-divider/40 rounded-none bg-transparent shadow-none',
                  title: 'font-bold text-sm text-foreground',
                  trigger: 'px-4 py-3 bg-default-100/50 dark:bg-default-50/10 hover:bg-default-100/80 transition-colors',
                  content: 'p-0'
                }}
              >
                {(course.modules || []).map((module, mIdx) => {
                  const moduleLessons = module.lessons || [];
                  const moduleCompletedCount = moduleLessons.filter(l => completedLessons[l.id]).length;

                  return (
                    <AccordionItem
                      key={mIdx.toString()}
                      title={
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {module.icon && (
                              <IconRenderer value={module.icon} className="w-4 h-4 text-primary shrink-0" />
                            )}
                            <span className="font-bold truncate text-sm">
                              {mIdx + 1}. {module.title}
                            </span>
                          </div>
                          <span className="text-xs text-default-400 font-semibold shrink-0 ml-2">
                            {moduleCompletedCount}/{moduleLessons.length}
                          </span>
                        </div>
                      }
                      aria-label={module.title}
                    >
                      <div className="flex flex-col divide-y divide-divider/30">
                        {moduleLessons.map((lesson, lIdx) => {
                          const isActive = activeLessonId === lesson.id;
                          const isDone = !!completedLessons[lesson.id];

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson.id)}
                              className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-primary-50/70 dark:bg-primary-950/30 border-l-3 border-primary'
                                  : 'hover:bg-default-50/80'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {/* Status Circle (Chuẩn 32px touch-friendly) */}
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs sm:text-sm font-bold transition-all ${
                                    isDone
                                      ? 'bg-success border-success text-white'
                                      : isActive
                                      ? 'bg-primary border-primary text-white shadow-xs'
                                      : 'border-default-300 text-default-400 bg-background'
                                  }`}
                                >
                                  {isDone ? (
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  ) : isActive ? (
                                    <PlayCircle className="w-4 h-4 fill-white text-primary" />
                                  ) : (
                                    <span>{lIdx + 1}</span>
                                  )}
                                </div>

                                {/* Lesson Info (Text rõ ràng) */}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span
                                    className={`font-semibold text-sm sm:text-base line-clamp-2 leading-snug ${
                                      isActive ? 'text-primary font-bold' : 'text-foreground'
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>

                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-default-400 font-medium">
                                    {lesson.duration_minutes ? (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {lesson.duration_minutes}m
                                      </span>
                                    ) : null}
                                    {lesson.video_url && (
                                      <span className="flex items-center gap-1 text-primary font-semibold">
                                        <PlayCircle className="w-3.5 h-3.5" /> Video
                                      </span>
                                    )}
                                    {lesson.attachments && lesson.attachments.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Paperclip className="w-3.5 h-3.5" /> {lesson.attachments.length} files
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Toggle Completion directly in list (Touch target 40px) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleComplete(lesson.id);
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isDone
                                    ? 'text-success bg-success-50 dark:bg-success-950/40 hover:bg-success-100'
                                    : 'text-default-300 hover:text-default-500 hover:bg-default-100'
                                }`}
                                aria-label="Đánh dấu hoàn thành bài học"
                              >
                                <Check className={`w-5 h-5 ${isDone ? 'stroke-[2.5]' : ''}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </Tab>

          {/* TAB 3: GHI CHÚ & TÀI LIỆU */}
          <Tab
            key="notes"
            title={
              <div className="flex items-center justify-center gap-1.5">
                <StickyNote className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">Ghi chú ({activeNotes.length})</span>
              </div>
            }
          >
            <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
              {/* Attachments Section */}
              {activeLesson?.attachments && activeLesson.attachments.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span>Tài liệu đính kèm ({activeLesson.attachments.length})</span>
                  </h3>
                  <div className="flex flex-col divide-y divide-divider/40 border-y border-divider/40">
                    {activeLesson.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 py-3 px-1 hover:bg-default-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 truncate font-medium text-foreground text-sm">
                          {url.split('/').pop() || `Tài liệu bài học ${i + 1}`}
                        </span>
                        <ExternalLink className="w-4 h-4 text-default-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Notes Section */}
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2 min-w-0">
                    <StickyNote className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">Ghi chú của bạn</span>
                  </h3>
                  {!isAddingNote && (
                    <Button
                      color="primary"
                      variant="light"
                      size="sm"
                      startContent={<Plus className="w-4 h-4 shrink-0" />}
                      onPress={() => setIsAddingNote(true)}
                      className="font-semibold text-xs h-8 px-2.5 rounded-xl shrink-0"
                    >
                      Thêm ghi chú
                    </Button>
                  )}
                </div>

                {/* Add Note Form */}
                {isAddingNote && (
                  <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-divider/60 bg-default-50/50 dark:bg-default-50/10">
                    <Textarea
                      autoFocus
                      placeholder="Ghi lại kinh nghiệm, thắc mắc hoặc bí quyết của bạn..."
                      value={newNote}
                      onValueChange={setNewNote}
                      minRows={3}
                      size="md"
                      variant="bordered"
                      classNames={{
                        input: 'text-sm sm:text-base leading-relaxed'
                      }}
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <Button size="sm" variant="light" className="h-9 px-3 rounded-xl font-medium" onPress={() => setIsAddingNote(false)}>
                        Huỷ
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        onPress={handleAddNote}
                        isDisabled={!newNote.trim()}
                        className="h-9 px-4 rounded-xl font-bold"
                      >
                        Lưu ghi chú
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes List - Flat list with hairline dividers */}
                {activeNotes.length === 0 && !isAddingNote ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-default-400 gap-2.5">
                    <StickyNote className="w-8 h-8 stroke-[1.5] opacity-30" />
                    <p className="text-xs sm:text-sm font-medium">Chưa có ghi chú cá nhân nào cho bài học này</p>
                    <Button
                      variant="flat"
                      color="primary"
                      size="sm"
                      onPress={() => setIsAddingNote(true)}
                      className="mt-1 text-xs h-8 px-4 rounded-xl font-bold"
                    >
                      Tạo ghi chú đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-divider/40 border-t border-divider/40">
                    {activeNotes.map(note => (
                      <div key={note.id} className="py-3 px-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs font-medium text-default-400">
                          <span>
                            {new Date(note.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="w-7 h-7 min-w-7 rounded-lg text-default-500"
                              onPress={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                              }}
                              aria-label="Sửa ghi chú"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="w-7 h-7 min-w-7 rounded-lg text-default-500"
                              onPress={() => toggleNote(note.id)}
                              aria-label="Thu gọn ghi chú"
                            >
                              {note.expanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              className="w-7 h-7 min-w-7 rounded-lg text-danger"
                              onPress={() => deleteNote(note.id)}
                              aria-label="Xoá ghi chú"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {editingNoteId === note.id ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <Textarea
                              autoFocus
                              value={editingNoteContent}
                              onValueChange={setEditingNoteContent}
                              minRows={2}
                              size="sm"
                              variant="bordered"
                              classNames={{ input: 'text-sm' }}
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="light" className="h-8 px-3 rounded-xl" onPress={() => setEditingNoteId(null)}>
                                Huỷ
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                className="h-8 px-4 rounded-xl font-bold"
                                onPress={handleUpdateNote}
                                isDisabled={!editingNoteContent.trim()}
                              >
                                Lưu
                              </Button>
                            </div>
                          </div>
                        ) : note.expanded ? (
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        ) : (
                          <p className="text-sm line-clamp-1 text-default-600">{note.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* 5. STICKY BOTTOM NAVIGATION BAR (Nút to bản h-12 font-bold, không bị co ép) */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-background/95 dark:bg-black/95 backdrop-blur-lg border-t border-divider px-4 py-3 sm:px-6 flex items-center justify-between gap-2.5 shadow-lg safe-area-inset-bottom">
        <Button
          isIconOnly
          variant="flat"
          isDisabled={!hasPrev}
          onPress={goToPrevLesson}
          aria-label="Bài trước"
          className="w-12 h-12 min-w-12 rounded-xl shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {/* Center: Mark complete button (To rõ, tương phản cao, tự co dãn vừa vặn không truncate) */}
        <Button
          variant={isCurrentCompleted ? 'solid' : 'flat'}
          color={isCurrentCompleted ? 'success' : 'default'}
          onPress={() => activeLesson && toggleComplete(activeLesson.id)}
          startContent={<Check className={`w-5 h-5 shrink-0 ${isCurrentCompleted ? 'stroke-[2.5]' : 'opacity-60'}`} />}
          className="font-bold text-sm sm:text-base h-12 px-3 rounded-xl flex-1 truncate"
        >
          <span className="truncate">{isCurrentCompleted ? 'Đã hoàn thành' : 'Đánh dấu đã học'}</span>
        </Button>

        <Button
          color="primary"
          isDisabled={!hasNext}
          onPress={goToNextLesson}
          endContent={<ChevronRight className="w-5 h-5 shrink-0" />}
          className="font-bold text-sm sm:text-base h-12 px-4 rounded-xl shrink-0 shadow-none gap-1.5"
        >
          <span>Tiếp theo</span>
        </Button>
      </footer>
    </div>
  );
}
