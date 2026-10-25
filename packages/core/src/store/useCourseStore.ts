import { create } from 'zustand';
import { CourseRepository } from '../db/course-repository';
import type { Course } from '../types/recipe';

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: () => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  deleteBulkCourses: (ids: string[]) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, _get) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await CourseRepository.getAll();
      set({ courses: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch courses', isLoading: false });
    }
  },

  addCourse: async (course: Course) => {
    try {
      await CourseRepository.save(course);
      const newCourse = { ...course, id: course.id || crypto.randomUUID() };
      set((state) => ({ courses: [newCourse, ...state.courses] }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to add course' });
      throw e;
    }
  },

  updateCourse: async (course: Course) => {
    try {
      await CourseRepository.save(course);
      set((state) => ({
        courses: state.courses.map(c => c.id === course.id ? course : c)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to update course' });
      throw e;
    }
  },

  deleteCourse: async (id: string) => {
    try {
      await CourseRepository.delete(id);
      set((state) => ({
        courses: state.courses.filter(c => c.id !== id)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete course' });
      throw e;
    }
  },

  deleteBulkCourses: async (ids: string[]) => {
    try {
      await CourseRepository.deleteBulk(ids);
      set((state) => ({
        courses: state.courses.filter(c => !ids.includes(c.id))
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk delete courses' });
      throw e;
    }
  }
}));
