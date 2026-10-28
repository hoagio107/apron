import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from '@/ui';
import { Plus, BookOpen, Trash2, User, Link as LinkIcon, Star } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { ImageManager } from '../../lib/image-manager';

export function CoursesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { courses, isLoading, fetchCourses, deleteCourse } = useCourseStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('courses.confirmDelete'))) {
      await deleteCourse(id);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 -mx-8 px-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-divider/50 shadow-2xs mb-2">
        <div className="flex items-center gap-4 shrink-0">
          <Button 
            isIconOnly
            color="primary" 
            className="w-14 h-14 rounded-2xl shadow-sm shrink-0 text-white"
            onPress={() => navigate('/courses/add')}
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
          <div>
            <h1 className="app-page-title leading-tight">{t('courses.title')}</h1>
            <p className="app-page-subtitle">{t('courses.subtitle', { count: courses.length })}</p>
          </div>
        </div>
      </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-default-300" />}
            title={t('courses.empty.title')}
            description={t('courses.empty.description')}
            action={
              <Button 
                color="primary" 
                variant="flat"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => navigate('/courses/add')}
              >
                Tạo khoá học đầu tiên
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map(course => (
              <div 
                key={course.id} 
                onClick={() => navigate(`/courses/${course.id}`)}
                className="group w-full aspect-[4/3] relative overflow-hidden transition-all duration-300 rounded-xl bg-black border-none shadow-none hover:scale-[1.02] cursor-pointer card-media-root"
              >
                {/* Background Image: dừng lại trước 2 góc dưới và fade mask để triệt tiêu hoàn toàn viền trắng subpixel */}
                {course.thumbnail_url ? (
                  <img 
                    src={ImageManager.getAssetUrl(course.thumbnail_url)} 
                    alt={course.title} 
                    className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] object-cover z-0" 
                  />
                ) : (
                  <div className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] flex items-center justify-center bg-content2 text-default-400 z-0">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
                
                {/* Additional dark gradient for text readability */}
                <div 
                  className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 via-50% to-transparent pointer-events-none"
                ></div>

                {/* Edit and Delete Buttons */}
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button 
                    as="div"
                    isIconOnly 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    className="bg-background/80 backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigate(`/courses/edit/${course.id}`);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Button>
                  <Button 
                    as="div"
                    isIconOnly 
                    size="sm" 
                    color="danger" 
                    variant="flat"
                    className="bg-background/80 backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(e as any, course.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col justify-end h-full p-5 text-white text-left w-full">
                  <h3 className="font-bold text-xl line-clamp-2 leading-tight mb-2 drop-shadow-md">
                    {course.title}
                  </h3>
                  
                  {course.description ? (
                    <div 
                      className="text-sm text-white/80 line-clamp-2 text-left mb-4 [&>p]:m-0 [&>ul]:m-0"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  ) : (
                    <p className="text-sm text-white/80 mb-4">{t('courses.noDescription')}</p>
                  )}
                  
                  {/* Source and Teacher */}
                  {(course.source || course.teacher || course.author_id) && (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white drop-shadow-md mb-3">
                      {course.source && (
                        <span className="flex items-center gap-1.5 max-w-[150px]">
                          <LinkIcon className="w-4 h-4 shrink-0 text-white/80" />
                          <span className="truncate">{course.source}</span>
                        </span>
                      )}
                      {(course.teacher || course.author_id) && (
                        <span className="flex items-center gap-1.5 max-w-[150px]">
                          <User className="w-4 h-4 shrink-0 text-white/80" />
                          <span className="truncate">{course.teacher || course.author_id}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata Row — Bỏ viền, bỏ nền, ngăn cách nhau bằng dấu chấm giữa dòng (•) */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-white/90 drop-shadow-sm">
                    {course.level && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                        <span>{course.level}</span>
                      </span>
                    )}

                    {course.rating ? (
                      <span className="inline-flex items-center gap-2">
                        {course.level && <span className="text-white/40 select-none">•</span>}
                        <span className="inline-flex items-center gap-0.5 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-white/90">{course.rating}</span>
                        </span>
                      </span>
                    ) : null}

                    {course.modules && course.modules.length > 0 && (
                      <span className="inline-flex items-center gap-2">
                        {(course.level || course.rating) && <span className="text-white/40 select-none">•</span>}
                        <span>{course.modules.length} {t('courses.modules')}</span>
                      </span>
                    )}

                    {course.modules?.some((m: any) => m.lessons?.length) && (
                      <span className="inline-flex items-center gap-2">
                        {(course.level || course.rating || (course.modules && course.modules.length > 0)) && (
                          <span className="text-white/40 select-none">•</span>
                        )}
                        <span>{course.modules.reduce((acc: any, m: any) => acc + (m.lessons?.length || 0), 0)} {t('courses.lessons')}</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 w-full">
                    <Button 
                      as="div"
                      className="w-full font-medium text-white shadow-sm" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigate(`/courses/${course.id}`);
                      }}
                    >
                      Xem nội dung khoá học
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
