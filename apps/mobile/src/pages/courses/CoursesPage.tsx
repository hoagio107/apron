import { useEffect, useState } from 'react';
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
        title="Sổ tay Khoá học"
        description={`${courses.length} khoá học đã lưu`}
        actions={
          <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
            <Input
              variant="flat"
              classNames={{
                base: "w-full md:max-w-[300px]",
                input: "text-small",
              }}
              placeholder="Tìm kiếm khoá học..."
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
                  aria-label="Lọc theo trình độ"
                  selectionMode="single"
                  selectedKeys={new Set([selectedLevel])}
                  onSelectionChange={(keys) => setSelectedLevel(Array.from(keys)[0] as string)}
                >
                  <DropdownItem key="all">Tất cả trình độ</DropdownItem>
                  <DropdownItem key="Cơ bản">Cơ bản</DropdownItem>
                  <DropdownItem key="Nâng cao">Nâng cao</DropdownItem>
                  <DropdownItem key="Chuyên gia">Chuyên gia</DropdownItem>
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
            title="Chưa có khoá học nào"
            description="Bắt đầu tạo khoá học đầu tiên của bạn để lưu lại các bài giảng."
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
        title="Xoá khoá học"
        description="Bạn có chắc chắn muốn xoá khoá học này không? Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        confirmColor="danger"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={`Xoá ${selectedIds.size} khoá học`}
        description="Bạn có chắc chắn muốn xoá các khoá học đã chọn? Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
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
              label: 'Xoá',
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
