import { Modal, ModalContent } from '@/ui';
import { CourseForm } from '../../../components/courses/form';
import { useCourseStore } from '../../../store/useCourseStore';
import type { Course } from '@apron/core';

export interface CourseFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
  onSuccess?: (savedCourse?: Course) => void;
}

export function CourseFormModal({
  isOpen,
  onOpenChange,
  courseId,
  onSuccess
}: CourseFormModalProps) {
  const { courses, addCourse, updateCourse } = useCourseStore();
  const initialCourse = courseId ? courses.find(c => c.id === courseId) : undefined;

  const handleSubmit = async (data: Course) => {
    if (courseId) {
      await updateCourse({ ...data, id: courseId });
    } else {
      await addCourse(data);
    }
    onSuccess?.(data);
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
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
        {() => (
          <div className="flex flex-col h-full w-full bg-background text-foreground overflow-y-auto">
            <CourseForm
              initialData={initialCourse}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              isModal={true}
            />
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
