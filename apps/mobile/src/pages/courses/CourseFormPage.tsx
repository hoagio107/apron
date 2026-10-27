import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/ui';
import { CourseForm } from '../../components/courses/form';
import { useCourseStore } from '../../store/useCourseStore';
import type { Course } from '@apron/core';

export function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, addCourse, updateCourse, fetchCourses } = useCourseStore();

  const isEditing = Boolean(id);
  const [initialCourse, setInitialCourse] = useState<Course | undefined>();

  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [fetchCourses, courses.length]);

  useEffect(() => {
    if (isEditing && courses.length > 0) {
      const found = courses.find(c => c.id === id);
      if (found) {
        setInitialCourse(found);
      }
    }
  }, [id, courses, isEditing]);

  const handleSubmit = async (data: Course) => {
    if (isEditing && id) {
      await updateCourse({ ...data, id });
      navigate(`/courses/${id}`);
    } else {
      const created = await addCourse(data);
      const newId = (created as any)?.id || data.id;
      if (newId) {
        navigate(`/courses/${newId}`);
      } else {
        navigate('/courses');
      }
    }
  };

  if (isEditing && !initialCourse) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full w-full bg-background text-foreground">
      <CourseForm
        initialData={initialCourse}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/courses')}
      />
    </div>
  );
}
