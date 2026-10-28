import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, CardBody, Button, Accordion, AccordionItem, Divider,
  Tabs, Tab, Checkbox, Textarea, Tooltip, Progress,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@/ui';
import { BookOpen, ChevronLeft, Clock, PlayCircle, Star, FileText, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp, ChefHat, StickyNote, Edit, Paperclip, Info, Gauge, Link as LinkIcon } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import { sanitizeHtml, getSafeYoutubeEmbedUrl, type Lesson } from '@apron/core';
import { PageHeader } from '../../components/layout/PageHeader';
import { ImageManager } from '../../lib/image-manager';
import { IconRenderer } from '../../components/shared/IconPicker';
import { RecipeForm } from '../../components/recipes/form/RecipeForm';
import { LessonRecipeLinker } from './components/LessonRecipeLinker';

export function CourseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, fetchCourses, updateCourse } = useCourseStore();
  const { recipes, fetchRecipes, addRecipe } = useRecipeStore();
  
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    if (!id) return {};
    try {
      const saved = localStorage.getItem(`course_progress_${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [notes, setNotes] = useState<Array<{id: string, lessonId: string, content: string, createdAt: number, expanded: boolean}>>(() => {
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
  const [isCourseInfoOpen, setIsCourseInfoOpen] = useState(false);
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    try {
      const savedProgress = localStorage.getItem(`course_progress_${id}`);
      setCompletedLessons(savedProgress ? JSON.parse(savedProgress) : {});
      const savedNotes = localStorage.getItem(`course_notes_${id}`);
      setNotes(savedNotes ? JSON.parse(savedNotes) : []);
    } catch {
      // Ignore parse errors
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`course_progress_${id}`, JSON.stringify(completedLessons));
    }
  }, [id, completedLessons]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`course_notes_${id}`, JSON.stringify(notes));
    }
  }, [id, notes]);

  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [fetchCourses, courses.length, fetchRecipes, recipes.length]);

  const course = useMemo(() => courses.find(c => c.id === id), [courses, id]);

  useEffect(() => {
    if (course && !activeLessonId && course.modules?.[0]?.lessons?.[0]) {
      setActiveLessonId(course.modules[0].lessons[0].id);
    }
  }, [course, activeLessonId]);

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  let activeModuleIndex = 0;
  let activeLessonIndex = 0;
  let activeLesson: Lesson | null = null;
  
  if (activeLessonId && course.modules) {
    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const module = course.modules[mIdx];
      const lIdx = module.lessons?.findIndex(l => l.id === activeLessonId) ?? -1;
      if (lIdx !== -1 && module.lessons) {
        activeModuleIndex = mIdx;
        activeLessonIndex = lIdx;
        activeLesson = module.lessons[lIdx];
        break;
      }
    }
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedCount = Object.keys(completedLessons).length;
  
  const toggleComplete = (lessonId: string) => {
    setCompletedLessons(prev => {
      const next = { ...prev };
      if (next[lessonId]) {
        delete next[lessonId];
      } else {
        next[lessonId] = true;
      }
      return next;
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !activeLesson) return;
    setNotes(prev => [{
      id: crypto.randomUUID(),
      lessonId: activeLesson.id,
      content: newNote,
      createdAt: Date.now(),
      expanded: true
    }, ...prev]);
    setNewNote('');
    setIsAddingNote(false);
  };
  
  const toggleNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, expanded: !n.expanded } : n));
  };
  
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleUpdateNote = () => {
    if (!editingNoteContent.trim() || !editingNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === editingNoteId ? { ...n, content: editingNoteContent } : n
    ));
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const activeNotes = notes.filter(n => n.lessonId === activeLessonId);

  const handleUpdateLessonRecipes = async (nextRecipeIds: string[]) => {
    if (!course || !activeLesson) return;
    const nextModules = (course.modules || []).map((mod, mIdx) => {
      if (mIdx !== activeModuleIndex) return mod;
      return {
        ...mod,
        lessons: (mod.lessons || []).map((les, lIdx) =>
          lIdx === activeLessonIndex ? { ...les, attached_recipe_ids: nextRecipeIds } : les
        ),
      };
    });
    await updateCourse({
      ...course,
      modules: nextModules,
    });
  };

  return (
    <div className="flex flex-col min-h-full w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 -mx-8 px-8 border-b border-divider/50 shadow-2xs mb-4">
        <PageHeader 
          className="pt-0 pb-0"
          title={course.title}
          description={t('courses.studyMode')}
          showBackButton
          onBack={() => navigate('/courses')}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="flat"
                onPress={() => setIsCourseInfoOpen(true)}
                startContent={<Info className="w-4 h-4" />}
              >
                Thông tin khoá học
              </Button>
              <Button 
                color="primary"
                variant="flat"
                onPress={() => navigate(`/courses/edit/${course.id}`)}
                startContent={<Edit className="w-4 h-4" />}
              >
                Sửa khoá học
              </Button>
            </div>
          }
        />
      </div>
      
      <div className="flex-1 overflow-hidden pb-6">
        <div className="lg:grid lg:grid-cols-5 gap-6 h-full min-h-[600px]">
          
          {/* Left: Syllabus Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4 min-w-0 app-card p-4 rounded-2xl overflow-y-auto h-full custom-scrollbar">
            <h3 className="font-bold text-base sticky top-0 bg-content1 py-2 z-10 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {t('courses.syllabus')}
              </div>
              <div className="flex flex-col gap-1.5 pb-1">
                <div className="flex justify-between items-center text-[11px] font-medium text-default-500 uppercase tracking-wider">
                  <span>{t('courses.progress')}</span>
                  <span>{t('courses.lessonsProgress', { completed: completedCount, total: totalLessons })}</span>
                </div>
                <Progress 
                  aria-label={t('courses.progress')}
                  value={totalLessons ? (completedCount / totalLessons) * 100 : 0} 
                  size="sm" 
                  color="success" 
                  classNames={{
                    indicator: "bg-success",
                    track: "bg-default-200"
                  }}
                />
              </div>
            </h3>
            
            <Accordion 
              selectionMode="multiple" 
              defaultExpandedKeys={course.modules?.map((_, i) => i.toString())}
              className="px-0"
              itemClasses={{
                base: "py-0 outline-none w-full",
                title: "font-bold text-[15px]",
                trigger: "px-2 py-3 rounded-lg hover:bg-default-100 transition-colors",
                content: "text-sm px-0 pb-3",
              }}
            >
              {(course.modules || []).map((module, mIdx) => (
                <AccordionItem 
                  key={mIdx.toString()} 
                  title={
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {module.icon && <div className="mt-0.5 shrink-0"><IconRenderer value={module.icon} className="w-5 h-5 text-primary" /></div>}
                      <span className="break-words whitespace-normal leading-snug">{mIdx + 1}. {module.title}</span>
                    </div>
                  }
                  aria-label={module.title}
                >
                  <div className="flex flex-col gap-1 mt-1 ml-2">
                    {module.lessons?.map((lesson, lIdx) => {
                      const isActive = activeLessonId === lesson.id;
                      const isCompleted = completedLessons[lesson.id];
                      return (
                        <div 
                          key={lesson.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                            isActive 
                              ? 'bg-primary/10 border-primary/30 text-primary' 
                              : 'border-transparent hover:bg-default-100'
                          }`}
                          onClick={() => setActiveLessonId(lesson.id)}
                        >
                          <div className={`w-5 h-5 rounded-full flex flex-shrink-0 items-center justify-center border transition-colors ${
                              isCompleted 
                                ? 'bg-success border-success text-white' 
                                : isActive 
                                  ? 'border-primary text-primary bg-content1' 
                                  : 'border-default-300 text-default-400'
                            }`}>
                            {isCompleted ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : isActive ? (
                              <PlayCircle className="w-3.5 h-3.5" /> 
                            ) : (
                              <span className="text-[10px] font-medium">{lIdx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className={`font-medium line-clamp-2 leading-tight ${isActive ? 'text-primary' : ''}`}>
                              {lesson.title}
                            </span>
                            {(lesson.duration_minutes || lesson.video_url || lesson.attachments?.length) ? (
                              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-default-400">
                                {lesson.duration_minutes ? (
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration_minutes}m</span>
                                ) : null}
                                {lesson.video_url && (
                                  <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Video</span>
                                )}
                                {lesson.attachments && lesson.attachments.length > 0 && (
                                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {lesson.attachments.length} files</span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Middle: Lesson Content */}
          <div className="lg:col-span-3 flex flex-col h-full min-h-0 app-card overflow-y-auto custom-scrollbar">
            {activeLesson ? (
              <>
                {/* Hero / Video at the top */}
                {activeLesson.video_url ? (
                  <div className="w-full bg-black aspect-video flex items-center justify-center shrink-0 relative overflow-hidden">
                    {(() => {
                      const ytEmbedUrl = getSafeYoutubeEmbedUrl(activeLesson.video_url);
                      return ytEmbedUrl ? (
                        <iframe 
                          src={ytEmbedUrl} 
                          className="absolute inset-0 w-full h-full border-none" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          sandbox="allow-scripts allow-same-origin allow-presentation"
                          allowFullScreen
                          title={activeLesson.title}
                        />
                      ) : (
                        <video 
                          src={ImageManager.getAssetUrl(activeLesson.video_url)} 
                          controls 
                          className="absolute inset-0 w-full h-full object-contain"
                          controlsList="nodownload"
                        />
                      );
                    })()}
                  </div>
                ) : activeLesson.hero_image_url ? (
                  <div className="w-full aspect-video bg-default-100 relative shrink-0 overflow-hidden">
                    <img 
                      src={ImageManager.getAssetUrl(activeLesson.hero_image_url)} 
                      alt={activeLesson.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                ) : null}

                {/* Lesson Header */}
                <div className="p-6 border-b border-divider flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        {course.modules?.[activeModuleIndex]?.icon && (
                          <IconRenderer value={course.modules?.[activeModuleIndex]?.icon} className="w-4 h-4" />
                        )}
                        <span>{course.modules?.[activeModuleIndex]?.title}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                      <span>{t('courses.lessonNum', { num: activeLessonIndex + 1 })}</span>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl md:text-3xl font-bold">{activeLesson.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-default-500">
                    <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-warning fill-warning" /> {activeLesson.rating || 0} {t('recipes.rating')}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {activeLesson.duration_minutes || 0} {t('recipes.mins')}</span>
                    <span className="flex items-center gap-1.5"><Paperclip className="w-4 h-4" /> {t('courses.attachmentsCount', { count: activeLesson.attachments?.length || 0 })}</span>
                    <span className="flex items-center gap-1.5"><StickyNote className="w-4 h-4" /> {t('courses.notesCount', { count: activeLesson.notes ? 1 : 0 })}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1">
                  {activeLesson.content ? (
                    <div 
                      className="prose prose-sm md:prose-base max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeLesson.content) }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-default-400">
                      <FileText className="w-12 h-12 mb-2 opacity-20" />
                      <p>{t('courses.emptyLessonContent')}</p>
                    </div>
                  )}
                </div>
                
                {/* Navigation Footer */}
                <div className="p-6 border-t border-divider flex justify-between items-center bg-content1 sticky bottom-0 z-10 shrink-0">
                  <Button 
                    variant="flat" 
                    startContent={<ChevronLeft className="w-4 h-4" />}
                    isDisabled={activeModuleIndex === 0 && activeLessonIndex === 0}
                    onPress={() => {
                      if (activeLessonIndex > 0) {
                        setActiveLessonId(course.modules![activeModuleIndex].lessons![activeLessonIndex - 1].id);
                      } else if (activeModuleIndex > 0) {
                        const prevModule = course.modules![activeModuleIndex - 1];
                        setActiveLessonId(prevModule.lessons![prevModule.lessons!.length - 1].id);
                      }
                    }}
                  >
                    Bài trước
                  </Button>
                  <Button 
                    color="primary" 
                    endContent={<ChevronRight className="w-4 h-4" />}
                    isDisabled={
                      activeModuleIndex === (course.modules?.length || 0) - 1 && 
                      activeLessonIndex === (course.modules![activeModuleIndex]?.lessons?.length || 0) - 1
                    }
                    onPress={() => {
                      if (activeLessonIndex < (course.modules![activeModuleIndex].lessons?.length || 0) - 1) {
                        setActiveLessonId(course.modules![activeModuleIndex].lessons![activeLessonIndex + 1].id);
                      } else if (activeModuleIndex < (course.modules?.length || 0) - 1) {
                        setActiveLessonId(course.modules![activeModuleIndex + 1].lessons![0].id);
                      }
                    }}
                  >
                    Tiếp theo
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-default-400 p-8">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('courses.selectLessonPrompt')}</p>
              </div>
            )}
          </div>

          {/* Right: Course Meta & Notes Sidebar */}
          <div className="lg:col-span-1 flex flex-col min-w-0 app-card overflow-y-auto h-full custom-scrollbar">
            <Tabs 
              aria-label="Course Sidebar Tabs" 
              color="primary" 
              variant="underlined"
              fullWidth
              classNames={{
                base: "w-full sticky top-0 z-10 bg-content1",
                tabList: "w-full relative rounded-none p-0 border-b border-default-200",
                tab: "px-0 h-12",
                cursor: "w-full bg-primary",
                panel: "flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 h-full pt-4"
              }}
            >
              <Tab key="info" title={t('common.info')}>
                <div className="flex flex-col gap-5 pt-2 pb-4">
                  
                  {activeLesson ? (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-bold text-lg leading-tight">{activeLesson.title}</h3>
                        
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2 text-sm text-default-600">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            <span>{activeLesson.rating || 0} Đánh giá</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-default-600">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{activeLesson.duration_minutes || 0} phút</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-default-600">
                            <Paperclip className="w-4 h-4 text-success" />
                            <span>{activeLesson.attachments?.length || 0} file đính kèm</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-default-600">
                            <StickyNote className="w-4 h-4 text-secondary" />
                            <span>{activeLesson.notes ? 1 : 0} ghi chú</span>
                          </div>
                        </div>
                      </div>

                      {activeLesson.notes && (
                        <>
                          <Divider className="opacity-50" />
                          <div className="flex flex-col gap-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <StickyNote className="w-4 h-4 text-primary" />
                              Ghi chú của giảng viên
                            </h4>
                            <div className="text-default-700 text-sm whitespace-pre-wrap">
                              {activeLesson.notes}
                            </div>
                          </div>
                        </>
                      )}

                      <Divider className="opacity-50" />
                      <div className="flex flex-col gap-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-primary" />
                          Công thức thực hành
                        </h4>
                        <LessonRecipeLinker
                          recipes={recipes}
                          attachedRecipeIds={activeLesson.attached_recipe_ids || []}
                          onChange={handleUpdateLessonRecipes}
                          onCreateNewRecipe={() => setIsNewRecipeModalOpen(true)}
                          onRecipeClick={(recipeId) => navigate(`/recipes/${recipeId}`)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-default-400 text-sm py-4">Chưa chọn bài học</div>
                  )}

                  {activeLesson && (
                    <>
                      <Divider className="opacity-50" />
                      <div className="flex flex-col gap-2 pt-2">
                        <Checkbox 
                          isSelected={!!completedLessons[activeLesson.id]}
                          onValueChange={() => toggleComplete(activeLesson!.id)}
                          color="success"
                          classNames={{ label: "font-medium text-sm text-success-600" }}
                        >
                          Đánh dấu đã hoàn thành
                        </Checkbox>
                        <p className="text-xs text-default-400 pl-7">
                          Lưu lại tiến độ học tập của bạn
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Tab>
              
              <Tab key="notes" title="Ghi chú & Đính kèm">
                <div className="flex flex-col gap-6 pt-2 h-full">
                  
                  {/* Attachments Section */}
                  {activeLesson?.attachments && activeLesson.attachments.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Tài liệu đính kèm
                      </h4>
                      <div className="flex flex-col gap-2">
                        {activeLesson.attachments.map((url: string, i: number) => (
                          <a 
                            key={i} 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors text-sm shadow-none"
                          >
                            <div className="w-8 h-8 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="flex-1 truncate hover:text-primary transition-colors">{url.split('/').pop() || `Tài liệu ${i + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLesson?.attachments && activeLesson.attachments.length > 0 && <Divider />}

                  {/* Notes Section */}
                  <div className="flex flex-col gap-3 pb-8">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">Ghi chú cá nhân</h4>
                      <Tooltip content="Thêm ghi chú mới">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="flat" 
                          color="primary"
                          onPress={() => setIsAddingNote(!isAddingNote)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>

                    {isAddingNote && (
                      <div className="flex flex-col gap-2 p-3 bg-default-50 rounded-lg shadow-none">
                        <Textarea 
                          autoFocus
                          placeholder="Viết ghi chú của bạn..."
                          value={newNote}
                          onValueChange={setNewNote}
                          minRows={2}
                          size="sm"
                          variant="flat"
                        />
                        <div className="flex justify-end gap-2 mt-1">
                          <Button size="sm" variant="light" onPress={() => setIsAddingNote(false)}>Hủy</Button>
                          <Button size="sm" color="primary" onPress={handleAddNote} isDisabled={!newNote.trim()}>Lưu</Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 mt-2">
                      {activeNotes.length === 0 ? (
                        <p className="text-xs text-default-400 italic text-center py-4">Chưa có ghi chú nào cho bài học này</p>
                      ) : (
                        activeNotes.map(note => (
                          <Card key={note.id} shadow="none" className="bg-default-50 overflow-visible">
                            <CardBody className="p-3 gap-2">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] text-default-400">
                                  {new Date(note.createdAt).toLocaleDateString('vi-VN', {
                                    hour: '2-digit', minute:'2-digit'
                                  })}
                                </span>
                                <div className="flex gap-1">
                                  <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-6" onPress={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteContent(note.content);
                                  }}>
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                  <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-6" onPress={() => toggleNote(note.id)}>
                                    {note.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </Button>
                                  <Button isIconOnly size="sm" color="danger" variant="light" className="h-6 w-6 min-w-6" onPress={() => deleteNote(note.id)}>
                                    <Trash2 className="w-3 h-3" />
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
                                    variant="flat"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="light" onPress={() => setEditingNoteId(null)}>Hủy</Button>
                                    <Button size="sm" color="primary" onPress={handleUpdateNote} isDisabled={!editingNoteContent.trim()}>Lưu</Button>
                                  </div>
                                </div>
                              ) : note.expanded ? (
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              ) : (
                                <p className="text-sm line-clamp-1 text-default-500">{note.content}</p>
                              )}
                            </CardBody>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modal Xem thông tin chung của Khoá học */}
      <Modal
        isOpen={isCourseInfoOpen}
        onOpenChange={setIsCourseInfoOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 border-b border-divider">
                <Info className="w-5 h-5 text-primary" />
                <span>Thông tin khoá học</span>
              </ModalHeader>
              <ModalBody className="py-5 flex flex-col gap-5">
                {/* Ảnh đại diện khoá học tỷ lệ 4:3 đặt trên tên khoá học */}
                <div className="w-full aspect-[4/3] rounded-2xl bg-default-100 overflow-hidden shrink-0">
                  {course.thumbnail_url ? (
                    <img
                      src={ImageManager.getAssetUrl(course.thumbnail_url)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-default-300 gap-2">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Tên khoá học & Thông số chung */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-bold text-foreground leading-snug">
                    {course.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-default-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      {course.rating || 0} {t('recipes.rating')}
                    </span>
                    {course.level && (
                      <span className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-primary" />
                        {course.level}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-success" />
                      {course.modules?.length || 0} chương • {totalLessons} bài học
                    </span>
                    {course.source && (
                      <span className="flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-default-400" />
                        {course.source}
                      </span>
                    )}
                  </div>
                </div>

                <Divider className="opacity-60" />

                {/* Mô tả khoá học */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold text-sm text-default-700">
                    {t('courses.form.descLabel')}
                  </h4>
                  {course.description ? (
                    <div
                      className="prose prose-sm max-w-none text-default-700"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }}
                    />
                  ) : (
                    <p className="text-sm text-default-400 italic">
                      {t('courses.noDescription')}
                    </p>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-divider">
                <Button variant="flat" onPress={onClose}>
                  {t('common.actions.close')}
                </Button>
                <Button
                  color="primary"
                  startContent={<Edit className="w-4 h-4" />}
                  onPress={() => {
                    onClose();
                    navigate(`/courses/edit/${course.id}`);
                  }}
                >
                  Sửa khoá học
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Modal Tạo công thức mới và gắn nhanh vào bài học */}
      <Modal
        isOpen={isNewRecipeModalOpen}
        onOpenChange={setIsNewRecipeModalOpen}
        size="5xl"
        classNames={{ base: 'max-w-[1330px]' }}
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              <RecipeForm
                onSubmit={async (data) => {
                  await addRecipe(data);
                  const currentIds = activeLesson?.attached_recipe_ids || [];
                  if (!currentIds.includes(data.id)) {
                    await handleUpdateLessonRecipes([...currentIds, data.id]);
                  }
                  onClose();
                }}
              />
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
