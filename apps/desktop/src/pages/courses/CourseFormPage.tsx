import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, CardBody, CardHeader, Input, Button, Select, SelectItem,
  Accordion, AccordionItem, Divider, Autocomplete, AutocompleteItem, Avatar,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@/ui';
import { Save, Plus, Trash2, BookOpen, ListOrdered, ImagePlus, Type, Info, Gauge, Link as LinkIcon, User, Star, ChevronRight, Video, FileText, Link2, X, Search, Utensils, Flame, Settings, Clock, Paperclip, StickyNote, BarChart } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import type { Course, Lesson } from '@apron/core';
import { BlockEditor } from '../../components/shared/BlockEditor';
import { PageHeader } from '../../components/layout/PageHeader';
import { FormField } from '../../components/shared/form';
import { FileUploader } from '../../components/shared/FileUploader';
import { ImagePickerModal } from '../../components/recipes/form/ImagePickerModal';
import { StarRatingInput } from '../../components/shared/StarRatingInput';
import { IconPicker } from '../../components/shared/IconPicker';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';
import { RecipeForm } from '../../components/recipes/form/RecipeForm';
import { useRecipeStore } from '../../store/useRecipeStore';
import { ImageManager } from '../../lib/image-manager';

const generateId = () => crypto.randomUUID();

export function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, addCourse, updateCourse } = useCourseStore();
  const { recipes, addRecipe, fetchRecipes } = useRecipeStore();
  
  const isEditing = Boolean(id);
  const [imageUploadTarget, setImageUploadTarget] = useState<string | null>(null);
  const [isRecipeSelectionOpen, setIsRecipeSelectionOpen] = useState(false);
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState('');

  const [formData, setFormData] = useState<Omit<Course, 'id' | 'created_at'>>({
    title: '',
    slug: '',
    description: '',
    thumbnail_url: '',
    level: 'Cơ bản',
    author_id: 'local_user',
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

  const [activeLessonId, setActiveLessonId] = useState<string | null>(formData.modules[0]?.lessons[0]?.id || null);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (isEditing && courses.length > 0) {
      const course = courses.find(c => c.id === id);
      if (course) {
        const { id: _id, created_at: _created, ...rest } = course;
        setFormData(rest);
        if (rest.modules.length > 0 && rest.modules[0].lessons.length > 0) {
          setActiveLessonId(rest.modules[0].lessons[0].id);
        }
      }
    }
  }, [id, courses, isEditing]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('course_form_draft', JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Vui lòng nhập tên khoá học');
      return;
    }
    
    try {
      if (isEditing && id) {
        await updateCourse({ ...formData, id } as Course);
      } else {
        await addCourse(formData as Course);
        localStorage.removeItem('course_form_draft');
      }
      navigate('/courses');
    } catch (e) {
      console.error('Save failed', e);
      alert('Đã xảy ra lỗi khi lưu khoá học');
    }
  };

  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, {
        id: generateId(),
        title: `Chương ${prev.modules.length + 1}`,
        lessons: [{
          id: generateId(),
          title: 'Bài học mới',
          content: '',
          attached_recipe_ids: []
        }]
      }]
    }));
  };

  const removeModule = (mIdx: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mIdx)
    }));
  };

  const updateModuleTitle = (mIdx: number, title: string) => {
    const newModules = [...formData.modules];
    newModules[mIdx].title = title;
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const updateModuleIcon = (mIdx: number, icon: string) => {
    const newModules = [...formData.modules];
    newModules[mIdx].icon = icon;
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const addLesson = (mIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons.push({
      id: generateId(),
      title: 'Bài học mới',
      content: '',
      attached_recipe_ids: []
    });
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    const newModules = [...formData.modules];
    newModules[mIdx].lessons = newModules[mIdx].lessons.filter((_, i) => i !== lIdx);
    setFormData(prev => ({ ...prev, modules: newModules }));
  };

  const updateLesson = (mIdx: number, lIdx: number, field: keyof Lesson, value: any) => {
    setFormData(prev => {
      const newModules = [...prev.modules];
      newModules[mIdx] = { ...newModules[mIdx] };
      newModules[mIdx].lessons = [...newModules[mIdx].lessons];
      newModules[mIdx].lessons[lIdx] = {
        ...newModules[mIdx].lessons[lIdx],
        [field]: value
      };
      return { ...prev, modules: newModules };
    });
  };

  const handleSelectMedia = (images: string[], videos: string[]) => {
    if (images.length === 0 && videos.length === 0) return;
    const mediaUrl = images.length > 0 ? images[0] : videos[0];

    if (imageUploadTarget === 'course-cover') {
      setFormData(prev => ({ ...prev, thumbnail_url: mediaUrl }));
    } else if (imageUploadTarget?.startsWith('lesson-cover-')) {
      const parts = imageUploadTarget.split('-');
      const mIdx = parseInt(parts[2]);
      const lIdx = parseInt(parts[3]);
      updateLesson(mIdx, lIdx, 'hero_image_url', mediaUrl);
    }
    setImageUploadTarget(null);
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full pt-6">
        <div className="sticky top-0 z-50 bg-default-50/80 backdrop-blur-md py-4 -my-4">
        <PageHeader 
          title={isEditing ? 'Sửa khoá học' : 'Thêm khoá học mới'}
          showBackButton
          onBack={() => navigate('/courses')}
          actions={
            <Button 
              color="primary" 
              startContent={<Save className="w-4 h-4" />}
              onPress={handleSave}
            >
              Lưu khoá học
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Row 1 */}
          <div className="rounded-xl p-6 bg-content1 shadow-none grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col w-full">
                {!formData.thumbnail_url ? (
                  <div className="w-full aspect-[4/3] flex items-center justify-center">
                    <div 
                      onClick={() => setImageUploadTarget('course-cover')}
                      className="w-full h-full border-2 border-dashed border-primary/50 rounded-2xl flex flex-col items-center justify-center bg-primary-50/50 text-primary-600 hover:bg-primary-50 hover:border-primary transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImagePlus className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-bold text-xl mb-1">Tải lên hoặc chọn ảnh/video</p>
                      <p className="text-sm text-primary-500/80 text-center px-4">Kéo thả file hoặc nhập URL</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-default-100 rounded-2xl relative group overflow-hidden flex items-center justify-center shadow-inner border border-default-200 cursor-pointer" onClick={() => setImageUploadTarget('course-cover')}>
                    <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImagePlus className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button 
                        size="sm" 
                        isIconOnly 
                        color="danger" 
                        variant="flat" 
                        className="bg-white/90 backdrop-blur-md shadow-sm" 
                        onPress={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, thumbnail_url: '' }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <FormField label="Tên khoá học" icon={Type}>
                <Input
                  placeholder="VD: Nhập môn làm bánh"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  isRequired
                  variant="flat"
                  size="lg"
                  classNames={{ 
                    inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none",
                    input: "font-bold text-lg" 
                  }}
                />
              </FormField>
              
              <div className="flex flex-col gap-2">
                <span className="text-default-700 text-sm font-medium flex items-center gap-1">
                  <Gauge className="w-4 h-4 text-default-500" />
                  Cấp độ khoá học
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(['Cơ bản', 'Nâng cao', 'Chuyên gia'] as const).map(level => {
                    const isSelected = formData.level === level;
                    return (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setFormData(prev => ({ ...prev, level }))}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary-50 text-primary' 
                            : 'border-default-200 hover:border-primary/50 text-default-500'
                        }`}
                      >
                        <span className="text-sm font-medium">{level}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField label="Mô tả khoá học" icon={Info}>
                <div className="bg-default-100 rounded-xl overflow-auto border-none shadow-none p-3 resize-y min-h-[150px] max-h-[500px]">
                  <BlockEditor 
                    value={formData.description}
                    onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                    placeholder="Mô tả ngắn gọn về những gì học viên sẽ đạt được..."
                  />
                </div>
              </FormField>
            </div>

            <div className="flex flex-col gap-4">
              <FormField label="Nguồn khoá học" icon={LinkIcon}>
                <Input
                  placeholder="VD: YouTube, Udemy..."
                  value={formData.source || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  variant="flat"
                  classNames={{ inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none" }}
                />
              </FormField>
              
              <FormField label="Giáo viên / Hướng dẫn" icon={User}>
                <Input
                  placeholder="Tên giáo viên..."
                  value={formData.teacher || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                  variant="flat"
                  classNames={{ inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none" }}
                />
              </FormField>

              <FormField label="Đánh giá nội dung" icon={Star}>
                <div className="h-10 flex items-center px-1 rounded-xl">
                  <StarRatingInput
                    value={formData.rating || 0}
                    onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
                    size="md"
                  />
                </div>
              </FormField>
            </div>
          </div>

          {/* Modules & Lessons */}
          <div className="rounded-xl p-6 bg-content1 shadow-none flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-primary" />
                Nội dung khoá học
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Sidebar: Module & Lesson List */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {formData.modules.map((module, mIdx) => (
                  <div key={module.id} className="flex flex-col gap-2">
                    <div className="group flex items-center justify-between gap-2 mb-1">
                      <div className="flex-1 flex items-center gap-1 min-w-0">
                        <IconPicker 
                          value={module.icon} 
                          onChange={(val) => updateModuleIcon(mIdx, val)} 
                        />
                        <Input
                          value={module.title}
                          onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                          variant="underlined"
                          placeholder="Tên chương..."
                          classNames={{ 
                            input: "font-semibold text-primary pb-0", 
                            inputWrapper: "after:bg-primary min-h-unit-8 h-8 pb-1"
                          }}
                        />
                      </div>
                      <Button 
                        isIconOnly 
                        color="danger" 
                        variant="light" 
                        size="sm" 
                        onPress={() => removeModule(mIdx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-1 ml-6 border-l-2 border-default-100 pl-2">
                      {module.lessons.map((lesson, lIdx) => {
                        const isActive = activeLessonId === lesson.id;
                        return (
                          <div 
                            key={lesson.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-default-100 text-default-700'
                            }`}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <span className="text-sm truncate">{lesson.title || 'Bài học mới'}</span>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                          </div>
                        );
                      })}
                      <Button
                        variant="light"
                        color="primary"
                        startContent={<Plus className="w-4 h-4" />}
                        className="mt-2 justify-start"
                        onPress={() => addLesson(mIdx)}
                      >
                        Thêm bài học
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="flat" 
                  color="primary"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={addModule}
                  className="w-full border-dashed border-2 bg-transparent hover:bg-primary-50"
                >
                  Thêm Chương Mới
                </Button>
              </div>

              {(() => {
                const activeModuleIndex = formData.modules.findIndex(m => m.lessons.some(l => l.id === activeLessonId));
                const activeLessonIndex = activeModuleIndex >= 0 ? formData.modules[activeModuleIndex].lessons.findIndex(l => l.id === activeLessonId) : -1;
                const activeLesson = activeModuleIndex >= 0 && activeLessonIndex >= 0 ? formData.modules[activeModuleIndex].lessons[activeLessonIndex] : null;

                if (!activeLesson) return <div className="lg:col-span-4" />;

                return (
                  <>
                    {/* Middle: Block Editor Area */}
                    <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-default-100 shadow-none overflow-hidden">
                      <div className="px-10 py-8 flex flex-col flex-1 min-h-[400px]">
                        {/* Title Sync */}
                        <h1 className="text-4xl font-bold text-foreground mb-6">
                          {activeLesson.title || 'Tiêu đề bài học...'}
                        </h1>
                        
                        {/* Hero Image Section */}
                        <div 
                          className="aspect-video w-full bg-default-100 rounded-xl overflow-hidden relative group cursor-pointer flex items-center justify-center mb-6"
                          onClick={() => {
                            setImageUploadTarget(`lesson-cover-${activeModuleIndex}-${activeLessonIndex}`);
                          }}
                        >
                          {activeLesson.hero_image_url ? (
                            <img src={activeLesson.hero_image_url} alt="Lesson Hero" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-default-400">
                              <ImagePlus className="w-8 h-8" />
                              <span className="text-sm font-medium">Thêm Ảnh Bìa (Hero)</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium">Thay đổi ảnh bìa</span>
                          </div>
                        </div>
                        
                        {/* Meta Bar */}
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-default-500 mb-8 pb-4 border-b border-default-100">
                          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-warning fill-warning" /> {activeLesson.rating || 0} Đánh giá</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {activeLesson.duration_minutes || 0} phút</span>
                          <span className="flex items-center gap-1.5"><Paperclip className="w-4 h-4" /> {activeLesson.attachments?.length || 0} file đính kèm</span>
                          <span className="flex items-center gap-1.5"><StickyNote className="w-4 h-4" /> {activeLesson.notes ? 1 : 0} ghi chú</span>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1">
                          <BlockEditor 
                            value={activeLesson.content}
                            onChange={(html) => updateLesson(activeModuleIndex, activeLessonIndex, 'content', html)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Meta & Settings Sidebar */}
                    <div className="lg:col-span-1 flex flex-col gap-5 min-w-0 bg-default-50/50 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-base flex items-center gap-2 truncate">
                            <Settings className="w-4 h-4 text-primary shrink-0" />
                            <span className="truncate">Cài đặt</span>
                          </h3>
                          <Button 
                            variant="light" 
                            color="danger" 
                            size="sm" 
                            isIconOnly
                            onPress={() => {
                              removeLesson(activeModuleIndex, activeLessonIndex);
                              setActiveLessonId(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <FormField label="Tên bài học">
                          <Input
                            value={activeLesson.title}
                            onChange={(e) => updateLesson(activeModuleIndex, activeLessonIndex, 'title', e.target.value)}
                            placeholder="Nhập tên bài học..."
                            size="md"
                            variant="flat"
                            classNames={{ input: "font-semibold" }}
                          />
                        </FormField>

                        <FormField label="Thời gian (phút)">
                          <Input
                            type="number"
                            value={activeLesson.duration_minutes?.toString() || ''}
                            onChange={(e) => updateLesson(activeModuleIndex, activeLessonIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            variant="flat"
                          />
                        </FormField>

                        <FormField label="Đánh giá">
                          <div className="h-10 flex items-center px-1 rounded-xl">
                            <StarRatingInput
                              value={activeLesson.rating || 0}
                              onChange={(val) => updateLesson(activeModuleIndex, activeLessonIndex, 'rating', val)}
                              size="md"
                            />
                          </div>
                        </FormField>

                        <FormField label="Video bài giảng">
                          <Input
                            placeholder="Link Youtube/Vimeo..."
                            value={activeLesson.video_url || ''}
                            onChange={(e) => updateLesson(activeModuleIndex, activeLessonIndex, 'video_url', e.target.value)}
                            variant="flat"
                            startContent={<Video className="w-4 h-4 text-default-400" />}
                          />
                        </FormField>

                        <FormField label="Ghi chú tác giả">
                          <textarea
                            className="w-full rounded-xl bg-default-100 hover:bg-default-200 focus:bg-default-100 transition-colors px-3 py-2 text-sm outline-none resize-y min-h-[80px]"
                            placeholder="Ghi chú nội bộ..."
                            value={activeLesson.notes || ''}
                            onChange={(e) => updateLesson(activeModuleIndex, activeLessonIndex, 'notes', e.target.value)}
                          />
                        </FormField>

                        <FormField label="File đính kèm">
                          <FileUploader 
                            value={activeLesson.attachments || []}
                            onChange={(urls) => updateLesson(activeModuleIndex, activeLessonIndex, 'attachments', urls)}
                            label="Kéo thả file đính kèm"
                          />
                        </FormField>

                        <FormField label="Công thức thực hành">
                          <Autocomplete
                            placeholder="Tìm kiếm..."
                            variant="flat"
                            inputValue={recipeSearch}
                            onInputChange={setRecipeSearch}
                            onSelectionChange={(id) => {
                              setRecipeSearch('');
                              if (!id) return;
                              if (id === 'NEW_RECIPE') {
                                setIsNewRecipeModalOpen(true);
                              } else {
                                const currentIds = activeLesson.attached_recipe_ids || [];
                                if (!currentIds.includes(id.toString())) {
                                  updateLesson(activeModuleIndex, activeLessonIndex, 'attached_recipe_ids', [...currentIds, id.toString()]);
                                }
                              }
                            }}
                            startContent={<Search className="w-4 h-4 text-default-400" />}
                          >
                            {[
                              ...recipes.map(recipe => (
                                <AutocompleteItem key={recipe.id} textValue={recipe.title}>
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="w-10 h-10 shrink-0 rounded bg-default-100 overflow-hidden">
                                      {recipe.image_url ? (
                                        <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Utensils className="w-4 h-4 text-default-300" /></div>
                                      )}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 pr-2 text-left justify-center">
                                      <span className="text-sm font-medium line-clamp-1">{recipe.title}</span>
                                      <div className="flex items-center flex-wrap gap-2 mt-1 text-[10px] text-default-400 font-medium uppercase tracking-wide">
                                        {recipe.total_time_minutes ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-warning" /> {recipe.total_time_minutes}p</span> : null}
                                        {recipe.difficulty ? <span className="flex items-center gap-1"><BarChart className="w-3 h-3 text-primary" /> {recipe.difficulty}</span> : null}
                                        {recipe.calories ? <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" /> {recipe.calories} kcal</span> : null}
                                      </div>
                                    </div>
                                  </div>
                                </AutocompleteItem>
                              )),
                              <AutocompleteItem key="NEW_RECIPE" textValue="Tạo mới" className="text-primary">
                                <div className="flex items-center gap-2 text-primary">
                                  <Plus className="w-4 h-4" />
                                  <span className="text-small">Tạo công thức mới</span>
                                </div>
                              </AutocompleteItem>
                            ]}
                          </Autocomplete>
                          
                          {/* Selected recipes list */}
                          {activeLesson.attached_recipe_ids && activeLesson.attached_recipe_ids.length > 0 && (
                            <div className="flex flex-col gap-2 mt-3">
                              {activeLesson.attached_recipe_ids.map(rId => {
                                const recipe = recipes.find(r => r.id === rId);
                                if (!recipe) return null;
                                return (
                                  <div key={rId} className="flex items-center justify-between p-2 rounded-xl border border-default-200 bg-white shadow-none">
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                      <div className="w-12 h-12 shrink-0 rounded bg-default-100 overflow-hidden">
                                        {recipe.image_url ? (
                                          <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center"><Utensils className="w-5 h-5 text-default-300" /></div>
                                        )}
                                      </div>
                                      <div className="flex flex-col flex-1 min-w-0 pr-2 text-left justify-center">
                                        <span className="font-semibold text-sm line-clamp-1">{recipe.title}</span>
                                        <div className="flex items-center flex-wrap gap-2 mt-1.5 text-[10px] text-default-400 font-medium uppercase tracking-wide">
                                          {recipe.total_time_minutes ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-warning" /> {recipe.total_time_minutes}p</span> : null}
                                          {recipe.difficulty ? <span className="flex items-center gap-1"><BarChart className="w-3 h-3 text-primary" /> {recipe.difficulty}</span> : null}
                                          {recipe.calories ? <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" /> {recipe.calories} kcal</span> : null}
                                        </div>
                                      </div>
                                    </div>
                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => {
                                      const newIds = activeLesson.attached_recipe_ids?.filter(id => id !== rId) || [];
                                      updateLesson(activeModuleIndex, activeLessonIndex, 'attached_recipe_ids', newIds);
                                    }}>
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </FormField>

                      </div>
                    </>
                  );
                })()}
            </div>
          </div>
        </div>
      </div>
      
      <ImagePickerModal 
        isOpen={imageUploadTarget !== null} 
        onOpenChange={(open) => !open && setImageUploadTarget(null)} 
        onSelectMedia={handleSelectMedia} 
      />

      {(() => {
        const activeModuleIndex = formData.modules.findIndex(m => m.lessons.some(l => l.id === activeLessonId));
        const activeLessonIndex = activeModuleIndex >= 0 ? formData.modules[activeModuleIndex].lessons.findIndex(l => l.id === activeLessonId) : -1;
        const activeLesson = activeModuleIndex >= 0 && activeLessonIndex >= 0 ? formData.modules[activeModuleIndex].lessons[activeLessonIndex] : null;

        return (
          <>

            <Modal 
              isOpen={isNewRecipeModalOpen} 
              onOpenChange={setIsNewRecipeModalOpen}
              size="5xl"
              classNames={{ base: "max-w-[1330px]" }}
              scrollBehavior="inside"
            >
              <ModalContent>
                {(onClose) => (
                  <div className="p-4 overflow-y-auto max-h-[80vh]">
                    <RecipeForm 
                      onSubmit={async (data) => {
                        await addRecipe(data);
                        if (activeModuleIndex >= 0 && activeLessonIndex >= 0) {
                          const currentIds = activeLesson?.attached_recipe_ids || [];
                          updateLesson(activeModuleIndex, activeLessonIndex, 'attached_recipe_ids', [...currentIds, data.id]);
                        }
                        onClose();
                      }}
                    />
                  </div>
                )}
              </ModalContent>
            </Modal>
          </>
        );
      })()}
    </>
  );
}
