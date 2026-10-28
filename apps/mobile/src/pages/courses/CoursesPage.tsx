import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Spinner, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { Plus, BookOpen, Search, Filter, CheckSquare, Trash2 } from 'lucide-react';
import { BulkActionBar } from '../../components/shared/BulkActionBar';
import { useCourseStore } from '../../store/useCourseStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { CourseCard } from '../../components/courses/CourseCard';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { CourseFormModal } from './components/CourseFormModal';

export function CoursesPage() {
  const { t } = useTranslation();
  const { courses, isLoading, fetchCourses, deleteCourse, deleteBulkCourses } = useCourseStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Selection and filter state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteCourse(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size > 0) {
      await deleteBulkCourses(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setIsBulkDeleteOpen(false);
    }
  };

  const handleSelectCourse = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      <PageHeader
        title={t('courses.title')}
        description={t('courses.subtitle', { count: courses.length })}
        actions={
          <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
            <Input
              variant="flat"
              classNames={{
                base: "w-full md:max-w-[300px]",
                input: "text-small",
              }}
              placeholder={t('courses.searchPlaceholder')}
              size="md"
              startContent={<Search className="w-4 h-4 text-default-400" />}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">
              {/* Filter */}
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly variant="flat" color={selectedLevel !== 'all' ? "primary" : "default"}>
                    <Filter className="w-5 h-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t('courses.level.all')}
                  selectionMode="single"
                  selectedKeys={new Set([selectedLevel])}
                  onSelectionChange={(keys) => setSelectedLevel(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key="all">{t('courses.level.all')}</DropdownItem>
                  <DropdownItem key="Cơ bản">{t('courses.level.beginner')}</DropdownItem>
                  <DropdownItem key="Nâng cao">{t('courses.level.intermediate')}</DropdownItem>
                  <DropdownItem key="Chuyên gia">{t('courses.level.advanced')}</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

              {/* Multi Select Toggle */}
              <Button 
                isIconOnly
                variant="flat" 
                color={isSelectMode ? "primary" : "default"}
                onPress={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds(new Set());
                }}
              >
                <CheckSquare className="w-5 h-5 text-default-500" />
              </Button>
              
              <div className="w-px h-6 bg-default-200 mx-1 shrink-0" />

              <Button 
                color="primary"
                onPress={() => {
                  setEditingCourseId(null);
                  setIsFormModalOpen(true);
                }}
                startContent={<Plus className="w-5 h-5" />}
                className="shrink-0"
              >
                Thêm mới
              </Button>
            </div>
          </div>
        }
      />

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
                onPress={() => {
                  setEditingCourseId(null);
                  setIsFormModalOpen(true);
                }}
              >
                Tạo khoá học đầu tiên
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                showActions={!isSelectMode}
                onDelete={handleDeleteRequest}
                selectable={isSelectMode}
                isSelected={selectedIds.has(course.id)}
                onSelect={() => handleSelectCourse(course.id)}
              />
            ))}
          </div>
        )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('courses.deleteModalTitle')}
        description={t('courses.deleteModalDesc')}
        confirmLabel={t('common.delete')}
        confirmColor="danger"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={t('courses.bulkDeleteModalTitle')}
        description={t('courses.bulkDeleteModalDesc', { count: selectedIds.size })}
        confirmLabel={t('common.delete')}
        confirmColor="danger"
        onConfirm={handleBulkDeleteConfirm}
      />

      {isSelectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredCourses.length}
          onSelectAll={() => {
            if (selectedIds.size === filteredCourses.length && filteredCourses.length > 0) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filteredCourses.map(c => c.id)));
            }
          }}
          onCancel={() => {
            setIsSelectMode(false);
            setSelectedIds(new Set());
          }}
          actions={[
            {
              key: 'delete',
              label: t('common.delete'),
              icon: <Trash2 className="w-4 h-4" />,
              color: 'danger',
              onPress: () => setIsBulkDeleteOpen(true)
            }
          ]}
        />
      )}

      <CourseFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        courseId={editingCourseId}
        onSuccess={() => fetchCourses()}
      />
    </div>
  );
}
