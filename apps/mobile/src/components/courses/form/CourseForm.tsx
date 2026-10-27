import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Input, 
  Tabs, 
  Tab, 
  PageHeader, 
  Autocomplete, 
  AutocompleteItem, 
  Modal, 
  ModalContent, 
  toast 
} from '@/ui';
import { 
  BookOpen, 
  FileText, 
  ImagePlus, 
  Image as ImageIcon, 
  Type, 
  Info, 
  Gauge, 
  Link as LinkIcon, 
  User, 
  Star, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Video, 
  Clock, 
  Paperclip, 
  StickyNote, 
  Utensils, 
  X,
  Layers
} from 'lucide-react';
import type { Course, Lesson, CourseModule } from '@apron/core';
import { FormField } from '../../shared/form';
import { BlockEditor } from '../../shared/BlockEditor';
import { StarRatingInput } from '../../shared/StarRatingInput';
import { IconPicker } from '../../shared/IconPicker';
import { FileUploader } from '../../shared/FileUploader';
import { BottomActionStepper } from '../../shared/BottomActionStepper';
import { ImagePickerModal } from '../../recipes/form/ImagePickerModal';
import { RecipeForm } from '../../recipes/form/RecipeForm';
import { ImageManager } from '../../../lib/image-manager';
import { useRecipeStore } from '../../../store/useRecipeStore';

const generateId = () => crypto.randomUUID();

export interface CourseFormProps {
  initialData?: Course;
  onSubmit: (data: Course) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  isModal?: boolean;
}

export function CourseForm({
  initialData,
  onSubmit,
  onCancel,
  submitText,
  isModal: _isModal = false
}: CourseFormProps) {
  const navigate = useNavigate();
  const { recipes, addRecipe, fetchRecipes } = useRecipeStore();

  const [activeStep, setActiveStep] = useState<'info' | 'content'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState<string | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);

  // Position of lesson currently being edited: { mIdx, lIdx } or null (viewing syllabus)
  const [editingLessonPos, setEditingLessonPos] = useState<{ mIdx: number; lIdx: number } | null>(null);

  const [formData, setFormData] = useState<Omit<Course, 'id' | 'created_at'>>(() => {
    if (initialData) {
      const { id: _id, created_at: _created, ...rest } = initialData;
      return rest;
    }
    const draft = localStorage.getItem('course_form_draft');
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch (e) {
        console.error('Failed to parse course draft', e);
      }
    }
    return {
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
      level: 'Cơ bản',
      author_id: 'local_user',
      teacher: '',
      source: '',
      rating: 5,
      modules: [{
        id: generateId(),
        title: 'Chương 1: Giới thiệu chung',
        icon: 'BookOpen',
        lessons: [{
          id: generateId(),
          title: 'Bài học 1',
          content: '',
          hero_image_url: '',
          duration_minutes: 15,
          rating: 5,
          video_url: '',
          notes: '',
          attachments: [],
          attached_recipe_ids: []
        }]
      }]
    };
  });

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Sync with initialData when provided or updated
  useEffect(() => {
    if (initialData) {
      const { id: _id, created_at: _created, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  // Sync draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('course_form_draft', JSON.stringify(formData));
    }
  }, [formData, initialData]);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  // Module helpers
  const addModule = () => {
    const newModule: CourseModule = {
      id: generateId(),
      title: `Chương ${formData.modules.length + 1}`,
      icon: 'BookOpen',
      lessons: [{
        id: generateId(),
        title: 'Bài học mới',
        content: '',
        hero_image_url: '',
        duration_minutes: 15,
        rating: 5,
        video_url: '',
        notes: '',
        attachments: [],
        attached_recipe_ids: []
      }]
    };
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
  };

  const removeModule = (mIdx: number) => {
    if (formData.modules.length <= 1) {
      toast.warning('Khoá học cần có ít nhất một chương');
      return;
    }
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mIdx)
    }));
    if (editingLessonPos && editingLessonPos.mIdx === mIdx) {
      setEditingLessonPos(null);
    } else if (editingLessonPos && editingLessonPos.mIdx > mIdx) {
      setEditingLessonPos({ ...editingLessonPos, mIdx: editingLessonPos.mIdx - 1 });
    }
  };

  const updateModuleTitle = (mIdx: number, title: string) => {
    setFormData(prev => {
      const nextModules = [...prev.modules];
      nextModules[mIdx] = { ...nextModules[mIdx], title };
      return { ...prev, modules: nextModules };
    });
  };

  const updateModuleIcon = (mIdx: number, icon: string) => {
    setFormData(prev => {
      const nextModules = [...prev.modules];
      nextModules[mIdx] = { ...nextModules[mIdx], icon };
      return { ...prev, modules: nextModules };
    });
  };

  // Lesson helpers
  const addLesson = (mIdx: number) => {
    const newLesson: Lesson = {
      id: generateId(),
      title: `Bài học ${formData.modules[mIdx].lessons.length + 1}`,
      content: '',
      hero_image_url: '',
      duration_minutes: 15,
      rating: 5,
      video_url: '',
      notes: '',
      attachments: [],
      attached_recipe_ids: []
    };
    setFormData(prev => {
      const nextModules = [...prev.modules];
      nextModules[mIdx] = {
        ...nextModules[mIdx],
        lessons: [...nextModules[mIdx].lessons, newLesson]
      };
      return { ...prev, modules: nextModules };
    });
    // Open editor for new lesson right away
    setEditingLessonPos({ mIdx, lIdx: formData.modules[mIdx].lessons.length });
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    if (formData.modules[mIdx].lessons.length <= 1) {
      toast.warning('Mỗi chương cần có ít nhất một bài học');
      return;
    }
    setFormData(prev => {
      const nextModules = [...prev.modules];
      nextModules[mIdx] = {
        ...nextModules[mIdx],
        lessons: nextModules[mIdx].lessons.filter((_, i) => i !== lIdx)
      };
      return { ...prev, modules: nextModules };
    });
    if (editingLessonPos && editingLessonPos.mIdx === mIdx && editingLessonPos.lIdx === lIdx) {
      setEditingLessonPos(null);
    }
  };

  const updateLessonField = (mIdx: number, lIdx: number, field: keyof Lesson, value: any) => {
    setFormData(prev => {
      const nextModules = [...prev.modules];
      const nextLessons = [...nextModules[mIdx].lessons];
      nextLessons[lIdx] = {
        ...nextLessons[lIdx],
        [field]: value
      };
      nextModules[mIdx] = {
        ...nextModules[mIdx],
        lessons: nextLessons
      };
      return { ...prev, modules: nextModules };
    });
  };

  const handleSelectMedia = (images: string[], videos: string[]) => {
    if (images.length === 0 && videos.length === 0) return;
    const mediaUrl = images.length > 0 ? images[0] : videos[0];

    if (imageUploadTarget === 'course-cover') {
      setFormData(prev => ({ ...prev, thumbnail_url: mediaUrl }));
    } else if (imageUploadTarget?.startsWith('lesson-cover-')) {
      const parts = imageUploadTarget.split('-');
      const mIdx = parseInt(parts[2], 10);
      const lIdx = parseInt(parts[3], 10);
      updateLessonField(mIdx, lIdx, 'hero_image_url', mediaUrl);
    }
    setImageUploadTarget(null);
  };

  const totalLessons = useMemo(() => {
    return formData.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  }, [formData.modules]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.warning('Vui lòng nhập tên khoá học');
      setActiveStep('info');
      return;
    }

    try {
      setIsSaving(true);

      // Commit course thumbnail
      const finalThumbnail = formData.thumbnail_url
        ? await ImageManager.commitImage(formData.thumbnail_url)
        : undefined;

      // Commit lesson hero images
      const committedModules = await Promise.all(
        formData.modules.map(async (mod) => ({
          ...mod,
          lessons: await Promise.all(
            mod.lessons.map(async (lesson) => ({
              ...lesson,
              hero_image_url: lesson.hero_image_url
                ? await ImageManager.commitImage(lesson.hero_image_url)
                : undefined
            }))
          )
        }))
      );

      const finalCourseData: Course = {
        ...(initialData || {}),
        id: initialData?.id || generateId(),
        created_at: initialData?.created_at || new Date().toISOString(),
        title: formData.title.trim(),
        slug: formData.slug || formData.title.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        thumbnail_url: finalThumbnail || '',
        level: formData.level,
        author_id: formData.author_id || 'local_user',
        teacher: formData.teacher,
        source: formData.source,
        rating: formData.rating,
        modules: committedModules
      };

      await onSubmit(finalCourseData);
      if (!initialData) {
        localStorage.removeItem('course_form_draft');
      }
    } catch (e: any) {
      console.error('Error saving course', e);
      toast.error('Có lỗi xảy ra khi lưu khoá học: ' + (e?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSaving(false);
    }
  };

  // Currently active lesson data (if editing one)
  const activeEditingLesson = editingLessonPos && formData.modules[editingLessonPos.mIdx]?.lessons[editingLessonPos.lIdx];
  const activeEditingModule = editingLessonPos && formData.modules[editingLessonPos.mIdx];

  return (
    <div className="flex flex-col w-full bg-background text-foreground min-h-full">
      {/* 1. Header (Chuẩn PageHeader đồng nhất RecipeForm & TipFormModal) */}
      <PageHeader
        title={initialData ? 'Chỉnh sửa khoá học' : 'Tạo khoá học mới'}
        showBackButton
        onBack={onCancel || (() => navigate(-1))}
        className="px-4 pt-4 pb-2"
      />

      {/* 2. Flat Sticky Tabs */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 border-b border-divider/40 mb-3">
        <Tabs
          aria-label="Các phần của khoá học"
          selectedKey={activeStep}
          onSelectionChange={(key) => setActiveStep(key.toString() as 'info' | 'content')}
          color="primary"
          variant="underlined"
          fullWidth
          classNames={{
            base: 'w-full',
            tabList: 'gap-6 w-full p-0 relative rounded-none justify-start',
            tab: 'max-w-fit px-0 h-11 text-default-500 data-[selected=true]:text-foreground font-semibold text-sm',
            cursor: 'w-full bg-primary h-0.5'
          }}
        >
          <Tab
            key="info"
            title={
              <div className="flex items-center justify-center gap-1.5 relative">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">Thông tin</span>
                {!formData.title.trim() && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-danger shrink-0 ring-2 ring-background animate-pulse"
                    title="Cần nhập tên khoá học"
                  />
                )}
              </div>
            }
          />
          <Tab
            key="content"
            title={
              <div className="flex items-center justify-center gap-1.5 relative">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-sm">
                  Nội dung ({formData.modules.length} chương)
                </span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* 3. Main Body Container (Chuẩn max-w-3xl px-4 pb-32 đồng nhất RecipeForm) */}
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-0 pb-36 flex flex-col gap-6">
        {/* TAB 1: THÔNG TIN CHUNG */}
        {activeStep === 'info' && (
          <div className="flex flex-col gap-6">
            {/* Ảnh bìa khoá học (Cover Image) */}
            <FormField label="Ảnh bìa khoá học" icon={ImageIcon}>
              {formData.thumbnail_url ? (
                <div className="w-full aspect-16/9 sm:aspect-21/9 max-h-[280px] rounded-2xl overflow-hidden relative group border border-divider/60 bg-default-100 shadow-none">
                  <img
                    src={ImageManager.getAssetUrl(formData.thumbnail_url)}
                    alt="Ảnh bìa khoá học"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Floating Action Buttons: Always visible on mobile */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold h-8 px-3 rounded-lg shadow-none"
                      onPress={() => setImageUploadTarget('course-cover')}
                      startContent={<ImagePlus className="w-3.5 h-3.5" />}
                    >
                      Đổi ảnh
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="flat"
                      className="bg-background/90 backdrop-blur-md text-danger h-8 w-8 rounded-lg shadow-none"
                      onPress={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                      aria-label="Xoá ảnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setImageUploadTarget('course-cover')}
                  className="w-full aspect-16/9 sm:aspect-21/9 max-h-[220px] border-2 border-dashed border-default-300 dark:border-default-200/40 hover:border-primary rounded-2xl flex flex-col items-center justify-center bg-default-100/40 dark:bg-default-100/10 hover:bg-default-100/70 text-default-500 hover:text-primary transition-all cursor-pointer p-6 group"
                >
                  <div className="w-12 h-12 bg-default-200/60 dark:bg-default-100/20 rounded-2xl flex items-center justify-center mb-3 text-default-400 group-hover:text-primary group-hover:scale-110 transition-all">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm mb-1 text-center text-foreground group-hover:text-primary transition-colors">
                    Tải ảnh bìa khoá học
                  </p>
                  <p className="text-xs text-default-400 text-center">Bấm để tải lên ảnh hoặc nhập URL</p>
                </div>
              )}
            </FormField>

            {/* Tên khoá học */}
            <FormField label="Tên khoá học" icon={Type} isRequired>
              <Input
                placeholder="VD: Nhập môn làm bánh Âu căn bản"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                variant="flat"
                size="lg"
                classNames={{
                  inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                  input: 'font-bold text-base'
                }}
              />
            </FormField>

            {/* Cấp độ khoá học */}
            <FormField label="Cấp độ khoá học" icon={Gauge}>
              <div className="grid grid-cols-3 gap-3">
                {(['Cơ bản', 'Nâng cao', 'Chuyên gia'] as const).map(level => {
                  const isSelected = formData.level === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setFormData(prev => ({ ...prev, level }))}
                      className={`flex items-center justify-center h-12 rounded-xl border-2 transition-all font-medium text-sm ${
                        isSelected
                          ? 'border-primary bg-primary-50 dark:bg-primary-50/20 text-primary font-semibold'
                          : 'border-default-200 dark:border-default-100 hover:border-default-300 text-default-600 bg-default-50/50'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Mô tả khoá học */}
            <FormField label="Mô tả khoá học" icon={Info}>
              <div className="bg-default-100 rounded-xl overflow-hidden p-3 min-h-[140px]">
                <BlockEditor
                  value={formData.description || ''}
                  onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                  placeholder="Mô tả ngắn gọn về những gì học viên sẽ đạt được sau khoá học..."
                />
              </div>
            </FormField>

            {/* Nguồn & Giảng viên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nguồn khoá học" icon={LinkIcon}>
                <Input
                  placeholder="VD: YouTube, Udemy, Coursera..."
                  value={formData.source || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  variant="flat"
                  classNames={{
                    inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                  }}
                />
              </FormField>

              <FormField label="Giảng viên / Hướng dẫn" icon={User}>
                <Input
                  placeholder="Tên giảng viên..."
                  value={formData.teacher || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                  variant="flat"
                  classNames={{
                    inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                  }}
                />
              </FormField>
            </div>

            {/* Đánh giá */}
            <FormField label="Đánh giá chất lượng khoá học" icon={Star}>
              <div className="h-12 flex items-center px-3 bg-default-100 rounded-xl">
                <StarRatingInput
                  value={formData.rating || 0}
                  onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
                  size="md"
                />
              </div>
            </FormField>
          </div>
        )}

        {/* TAB 2: NỘI DUNG KHOÁ HỌC (CHƯƠNG & BÀI HỌC) */}
        {activeStep === 'content' && (
          <div className="flex flex-col gap-6">
            {/* View A: Focused Lesson Editor (Khi bấm vào sửa một bài học cụ thể) */}
            {editingLessonPos && activeEditingLesson && activeEditingModule ? (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Top mini-bar for Lesson Editor */}
                <div className="flex items-center justify-between gap-2 py-2 px-1 border-b border-divider/40">
                  <Button
                    variant="light"
                    color="primary"
                    size="sm"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => setEditingLessonPos(null)}
                    className="h-8 px-2 rounded-lg font-semibold text-xs"
                  >
                    Danh sách bài học
                  </Button>

                  <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center px-2">
                    <span className="text-xs font-semibold text-foreground truncate">
                      Chương {editingLessonPos.mIdx + 1} • Bài {editingLessonPos.lIdx + 1}
                    </span>
                  </div>

                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    className="h-8 w-8 rounded-lg shrink-0 text-default-400 hover:text-danger"
                    onPress={() => removeLesson(editingLessonPos.mIdx, editingLessonPos.lIdx)}
                    aria-label="Xoá bài học"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lesson Form Fields */}
                <div className="flex flex-col gap-5">
                  {/* Tên bài học */}
                  <FormField label="Tên bài học" icon={Type} isRequired>
                    <Input
                      value={activeEditingLesson.title}
                      onChange={(e) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'title', e.target.value)}
                      placeholder="Nhập tên bài học..."
                      size="lg"
                      variant="flat"
                      classNames={{
                        inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                        input: 'font-semibold text-base'
                      }}
                    />
                  </FormField>

                  {/* Ảnh bìa bài học (Hero) */}
                  <FormField label="Ảnh bìa bài giảng (Hero)" icon={ImageIcon}>
                    {activeEditingLesson.hero_image_url ? (
                      <div className="w-full aspect-16/9 max-h-[220px] rounded-2xl overflow-hidden relative group border border-divider/60 bg-default-100 shadow-none">
                        <img
                          src={ImageManager.getAssetUrl(activeEditingLesson.hero_image_url)}
                          alt="Ảnh bài giảng"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold h-8 px-3 rounded-lg shadow-none"
                            onPress={() => setImageUploadTarget(`lesson-cover-${editingLessonPos.mIdx}-${editingLessonPos.lIdx}`)}
                            startContent={<ImagePlus className="w-3.5 h-3.5" />}
                          >
                            Đổi ảnh
                          </Button>
                          <Button
                            size="sm"
                            isIconOnly
                            color="danger"
                            variant="flat"
                            className="bg-background/90 backdrop-blur-md text-danger h-8 w-8 rounded-lg shadow-none"
                            onPress={() => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'hero_image_url', '')}
                            aria-label="Xoá ảnh bìa bài giảng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setImageUploadTarget(`lesson-cover-${editingLessonPos.mIdx}-${editingLessonPos.lIdx}`)}
                        className="w-full aspect-16/9 max-h-[160px] border-2 border-dashed border-default-300 dark:border-default-200/40 hover:border-primary rounded-2xl flex flex-col items-center justify-center bg-default-100/40 dark:bg-default-100/10 hover:bg-default-100/70 text-default-500 hover:text-primary transition-all cursor-pointer p-4 group"
                      >
                        <ImagePlus className="w-6 h-6 mb-2 text-default-400 group-hover:text-primary transition-colors" />
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                          Thêm ảnh bìa bài học
                        </p>
                      </div>
                    )}
                  </FormField>

                  {/* Thời lượng & Đánh giá */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Thời lượng (phút)" icon={Clock}>
                      <Input
                        type="number"
                        placeholder="VD: 15"
                        value={activeEditingLesson.duration_minutes?.toString() || ''}
                        onChange={(e) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'duration_minutes', parseInt(e.target.value, 10) || 0)}
                        variant="flat"
                        classNames={{
                          inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                        }}
                      />
                    </FormField>

                    <FormField label="Đánh giá bài học" icon={Star}>
                      <div className="h-12 flex items-center px-3 bg-default-100 rounded-xl">
                        <StarRatingInput
                          value={activeEditingLesson.rating || 0}
                          onChange={(val) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'rating', val)}
                          size="md"
                        />
                      </div>
                    </FormField>
                  </div>

                  {/* Video URL */}
                  <FormField label="Video bài giảng" icon={Video}>
                    <Input
                      placeholder="Link YouTube hoặc Vimeo..."
                      value={activeEditingLesson.video_url || ''}
                      onChange={(e) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'video_url', e.target.value)}
                      variant="flat"
                      classNames={{
                        inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                      }}
                    />
                  </FormField>

                  {/* Nội dung bài học */}
                  <FormField label="Nội dung bài học" icon={FileText}>
                    <div className="bg-default-100 rounded-xl overflow-hidden p-3 min-h-[200px]">
                      <BlockEditor
                        value={activeEditingLesson.content || ''}
                        onChange={(html) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'content', html)}
                        placeholder="Nội dung chi tiết, công thức và hướng dẫn bài học..."
                      />
                    </div>
                  </FormField>

                  {/* Công thức thực hành đính kèm */}
                  <FormField label="Công thức thực hành đính kèm" icon={Utensils}>
                    <div className="flex flex-col gap-3">
                      <Autocomplete
                        placeholder="Tìm kiếm công thức để gắn vào bài học..."
                        variant="flat"
                        inputValue={recipeSearch}
                        onInputChange={setRecipeSearch}
                        onSelectionChange={(id) => {
                          setRecipeSearch('');
                          if (!id) return;
                          if (id === 'NEW_RECIPE') {
                            setIsNewRecipeModalOpen(true);
                          } else {
                            const currentIds = activeEditingLesson.attached_recipe_ids || [];
                            if (!currentIds.includes(id.toString())) {
                              updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'attached_recipe_ids', [...currentIds, id.toString()]);
                            }
                          }
                        }}
                        startContent={<Utensils className="w-4 h-4 text-default-400" />}
                        inputProps={{
                          classNames: {
                            inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl'
                          }
                        }}
                      >
                        {[
                          ...recipes.map(recipe => (
                            <AutocompleteItem key={recipe.id} textValue={recipe.title}>
                              <div className="flex items-center gap-3 py-1">
                                <div className="w-9 h-9 shrink-0 rounded-lg bg-default-200 overflow-hidden">
                                  {recipe.image_url ? (
                                    <img
                                      src={ImageManager.getAssetUrl(recipe.image_url)}
                                      alt={recipe.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Utensils className="w-4 h-4 text-default-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 pr-2">
                                  <span className="text-sm font-semibold truncate">{recipe.title}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-default-400">
                                    {recipe.total_time_minutes ? <span>{recipe.total_time_minutes}p</span> : null}
                                    {recipe.difficulty ? <span>{recipe.difficulty}</span> : null}
                                  </div>
                                </div>
                              </div>
                            </AutocompleteItem>
                          )),
                          <AutocompleteItem key="NEW_RECIPE" textValue="Tạo công thức mới" className="text-primary font-semibold">
                            <div className="flex items-center gap-2 text-primary py-1">
                              <Plus className="w-4 h-4" />
                              <span>Tạo công thức mới</span>
                            </div>
                          </AutocompleteItem>
                        ]}
                      </Autocomplete>

                      {/* Danh sách công thức đã gắn */}
                      {activeEditingLesson.attached_recipe_ids && activeEditingLesson.attached_recipe_ids.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {activeEditingLesson.attached_recipe_ids.map(rId => {
                            const recipe = recipes.find(r => r.id === rId);
                            if (!recipe) return null;
                            return (
                              <div
                                key={rId}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-divider/60 bg-default-50 dark:bg-default-100/40 shadow-none gap-3"
                              >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <div className="w-11 h-11 shrink-0 rounded-lg bg-default-200 overflow-hidden">
                                    {recipe.image_url ? (
                                      <img
                                        src={ImageManager.getAssetUrl(recipe.image_url)}
                                        alt={recipe.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Utensils className="w-5 h-5 text-default-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-sm truncate">{recipe.title}</span>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-default-400 font-medium">
                                      {recipe.total_time_minutes ? <span>{recipe.total_time_minutes} phút</span> : null}
                                      {recipe.difficulty ? <span>{recipe.difficulty}</span> : null}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  className="h-8 w-8 rounded-lg"
                                  onPress={() => {
                                    const nextIds = activeEditingLesson.attached_recipe_ids?.filter(id => id !== rId) || [];
                                    updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'attached_recipe_ids', nextIds);
                                  }}
                                  aria-label="Gỡ công thức"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormField>

                  {/* File đính kèm */}
                  <FormField label="File đính kèm" icon={Paperclip}>
                    <FileUploader
                      value={activeEditingLesson.attachments || []}
                      onChange={(urls) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'attachments', urls)}
                      label="Bấm hoặc kéo thả file đính kèm (PDF, DOCX...)"
                    />
                  </FormField>

                  {/* Ghi chú tác giả */}
                  <FormField label="Ghi chú tác giả" icon={StickyNote}>
                    <textarea
                      className="w-full rounded-xl bg-default-100 hover:bg-default-200 focus:bg-default-100 transition-colors p-3 text-sm outline-none resize-y min-h-[90px] border-none shadow-none text-foreground placeholder:text-default-400"
                      placeholder="Ghi chú nội bộ dành cho người hướng dẫn..."
                      value={activeEditingLesson.notes || ''}
                      onChange={(e) => updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'notes', e.target.value)}
                    />
                  </FormField>
                </div>

                {/* Nút hoàn tất bài học */}
                <Button
                  color="primary"
                  variant="flat"
                  size="lg"
                  className="w-full h-12 rounded-xl font-semibold text-sm mt-2"
                  onPress={() => setEditingLessonPos(null)}
                >
                  Xong bài học & Quay lại chương trình
                </Button>
              </div>
            ) : (
              /* View B: Curriculum Syllabus Overview (Mục lục giáo trình phẳng, liền mạch, không đóng khung hộp) */
              <div className="flex flex-col gap-6">
                {/* Flat Summary Bar */}
                <div className="flex items-center justify-between px-1 py-1 text-xs font-semibold text-default-500 border-b border-divider/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      Mục lục giáo trình
                    </span>
                  </div>
                  <span className="text-default-400 font-medium">
                    {formData.modules.length} chương • {totalLessons} bài học
                  </span>
                </div>

                {/* Modules list - Hoàn toàn Flat */}
                <div className="flex flex-col gap-6">
                  {formData.modules.map((module, mIdx) => (
                    <div
                      key={module.id}
                      className="flex flex-col border-b border-divider/40 pb-3"
                    >
                      {/* Module Header - Dải phẳng thanh lịch */}
                      <div className="flex items-center justify-between gap-2 px-2 py-2 bg-default-100/60 dark:bg-default-50/10 border-y border-divider/40">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <IconPicker
                            value={module.icon}
                            onChange={(val) => updateModuleIcon(mIdx, val)}
                          />
                          <Input
                            value={module.title}
                            onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                            variant="flat"
                            size="sm"
                            placeholder="Tên chương..."
                            classNames={{
                              inputWrapper: 'bg-transparent hover:bg-default-200/50 border-none shadow-none h-8 px-1.5 rounded-lg',
                              input: 'font-bold text-foreground text-sm'
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-default-400 font-medium">
                            {module.lessons.length} bài
                          </span>
                          <Button
                            isIconOnly
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => removeModule(mIdx)}
                            className="h-8 w-8 rounded-lg shrink-0 text-default-400 hover:text-danger"
                            aria-label="Xoá chương"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Lessons inside module - Danh sách phẳng hairline divider */}
                      <div className="flex flex-col divide-y divide-divider/30">
                        {module.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            onClick={() => setEditingLessonPos({ mIdx, lIdx })}
                            className="px-2 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-default-50/80 transition-colors group"
                          >
                            {/* Left: Lesson Index */}
                            <div className="w-7 h-7 shrink-0 rounded-lg bg-default-100 dark:bg-default-50/20 text-default-600 dark:text-default-400 flex items-center justify-center font-bold text-xs">
                              {lIdx + 1}
                            </div>

                            {/* Center: Info */}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {lesson.title || 'Bài học mới'}
                              </span>
                              <div className="flex items-center gap-2.5 mt-0.5 text-xs text-default-400 font-medium">
                                {lesson.duration_minutes ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-warning" />
                                    {lesson.duration_minutes}p
                                  </span>
                                ) : null}
                                {lesson.video_url ? (
                                  <span className="flex items-center gap-1 text-primary">
                                    <Video className="w-3.5 h-3.5" /> Video
                                  </span>
                                ) : null}
                                {lesson.attached_recipe_ids && lesson.attached_recipe_ids.length > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Utensils className="w-3.5 h-3.5" /> {lesson.attached_recipe_ids.length} công thức
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="h-8 w-8 rounded-lg text-default-400 group-hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLessonPos({ mIdx, lIdx });
                                }}
                                aria-label="Sửa bài học"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                className="h-8 w-8 rounded-lg text-default-400 hover:text-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLesson(mIdx, lIdx);
                                }}
                                aria-label="Xoá bài học"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Flat button: Thêm bài học */}
                        <button
                          type="button"
                          onClick={() => addLesson(mIdx)}
                          className="flex items-center gap-2 px-2 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors w-full text-left"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Thêm bài học vào Chương {mIdx + 1}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flat Button: Thêm chương mới */}
                <Button
                  variant="flat"
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={addModule}
                  className="w-full h-11 rounded-xl font-semibold text-sm bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 hover:bg-primary/20"
                >
                  Thêm chương mới
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Action Stepper (Đồng nhất RecipeForm) */}
      <BottomActionStepper
        canGoBack={activeStep !== 'info' || Boolean(editingLessonPos)}
        onBack={() => {
          if (editingLessonPos) {
            setEditingLessonPos(null);
          } else if (activeStep === 'content') {
            setActiveStep('info');
          }
        }}
        isLastStep={activeStep === 'content' || Boolean(initialData)}
        onNext={() => {
          if (!formData.title.trim()) {
            toast.warning('Vui lòng nhập tên khoá học');
            return;
          }
          setActiveStep('content');
        }}
        onSubmit={handleSave}
        isSaving={isSaving}
        submitText={submitText || (initialData ? 'Lưu thay đổi' : 'Lưu khoá học')}
      />

      {/* Media Picker Modal */}
      <ImagePickerModal
        isOpen={imageUploadTarget !== null}
        onOpenChange={(open) => !open && setImageUploadTarget(null)}
        onSelectMedia={handleSelectMedia}
      />

      {/* Create Recipe Modal for Lesson Practice */}
      <Modal
        isOpen={isNewRecipeModalOpen}
        onOpenChange={setIsNewRecipeModalOpen}
        size="full"
        scrollBehavior="inside"
        hideCloseButton
        classNames={{
          wrapper: 'w-full h-full inset-0 !max-w-full overflow-hidden justify-start sm:justify-start',
          base: '!w-full !h-full !max-w-full !max-h-full !m-0 !p-0 !rounded-none bg-background text-foreground flex flex-col overflow-hidden',
          body: 'p-0 overflow-y-auto flex-1 bg-background'
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex flex-col h-full w-full bg-background text-foreground overflow-y-auto">
              <RecipeForm
                onSubmit={async (data) => {
                  const created = await addRecipe(data);
                  const newRecipeId = created?.id || data.id;
                  if (editingLessonPos && newRecipeId) {
                    const currentIds = activeEditingLesson?.attached_recipe_ids || [];
                    updateLessonField(editingLessonPos.mIdx, editingLessonPos.lIdx, 'attached_recipe_ids', [...currentIds, newRecipeId]);
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
