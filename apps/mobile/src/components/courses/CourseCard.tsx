import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui';
import { BookOpen, Star, Link as LinkIcon, Trash2, Edit2 } from 'lucide-react';
import type { Course } from '@apron/core';
import { ImageManager } from '../../lib/image-manager';

interface CourseCardProps {
  course: Course;
  /** Show edit/delete hover buttons (for management pages) */
  showActions?: boolean;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

/**
 * CourseCard — Card hiển thị thông tin khoá học với thiết kế đồng nhất RecipeCard.
 */
export function CourseCard({
  // props 
  course, 
  showActions = false, 
  onDelete,
  selectable,
  isSelected,
  onSelect,
  className
}: CourseCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = (_e?: React.MouseEvent | React.KeyboardEvent) => {
    if (selectable && onSelect) {
      onSelect();
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const totalLessons = course.modules?.reduce((acc: number, m: { lessons?: unknown[] }) => acc + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div
      className={`group w-full ${className || 'aspect-4/3'} relative overflow-hidden rounded-xl bg-black border-none transition-transform duration-200 shadow-none cursor-pointer active:scale-95 card-media-root
        ${isSelected ? 'ring-4 ring-primary' : ''}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
    >
      {/* Background Image: dừng lại trước 2 góc dưới và fade mask để triệt tiêu hoàn toàn viền trắng subpixel */}
      {course.thumbnail_url ? (
        <img
          src={ImageManager.getAssetUrl(course.thumbnail_url)}
          alt={course.title}
          className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] object-cover z-0"
        />
      ) : (
        <div className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] flex items-center justify-center bg-default-100 text-default-400 z-0">
          <BookOpen className="w-10 h-10" />
        </div>
      )}

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

      {/* Edit and Delete Buttons */}
      {showActions && (
        <div className="absolute top-2.5 right-2.5 z-20 flex gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            as="div"
            isIconOnly
            size="sm"
            color="primary"
            variant="flat"
            className="w-7 h-7 min-w-0 bg-background/80 backdrop-blur-md rounded-full shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/courses/edit/${course.id}`);
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            as="div"
            isIconOnly
            size="sm"
            color="danger"
            variant="flat"
            className="w-7 h-7 min-w-0 bg-background/80 backdrop-blur-md rounded-full shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete?.(e, course.id ?? '');
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Selectable Checkbox */}
      {selectable && (
        <div className="absolute top-2.5 right-2.5 z-20 flex gap-2">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-sm">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-white/60 bg-transparent'}`}>
              {isSelected && <span className="w-2 h-2 bg-primary-foreground rounded-full" />}
            </div>
          </div>
        </div>
      )}

      {/* Content Area — Typography đồng nhất với RecipeCard */}
      <div className="relative z-10 flex flex-col justify-end h-full p-3 sm:p-3.5 text-white text-left w-full">
        <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1 drop-shadow-md">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-xs text-white/80 line-clamp-1 sm:line-clamp-2 text-left mb-1.5 leading-relaxed">
            {course.description.replace(/<[^>]*>?/gm, '').trim()}
          </p>
        )}

        {/* Source */}
        {course.source && (
          <div className="flex items-center gap-2 text-xs text-white/90 drop-shadow-sm mb-1.5 font-medium whitespace-nowrap overflow-hidden">
            <span className="flex items-center gap-1 shrink-0 max-w-28">
              <LinkIcon className="w-3 h-3 shrink-0 text-white/70" />
              <span className="truncate">{course.source}</span>
            </span>
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

          {totalLessons > 0 && (
            <span className="inline-flex items-center gap-2">
              {(course.level || course.rating || (course.modules && course.modules.length > 0)) && (
                <span className="text-white/40 select-none">•</span>
              )}
              <span>{totalLessons} {t('courses.lessons')}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
