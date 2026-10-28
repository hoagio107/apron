import { create } from 'zustand';
import { CourseRepository } from '../db/course-repository';
import type { Course } from '../types/recipe';

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  fetchCourses: (force?: boolean) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  deleteBulkCourses: (ids: string[]) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchCourses: async (force = false) => {
    if (!force && get().hasFetched && get().courses.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await CourseRepository.getAll();
      set({ courses: data, isLoading: false, hasFetched: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch courses';
      set({ error: msg, isLoading: false });
    }
  },

  addCourse: async (course: Course) => {
    try {
      await CourseRepository.save(course);
      const newCourse = { ...course, id: course.id || crypto.randomUUID() };
      set((state) => ({ courses: [newCourse, ...state.courses] }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add course';
      set({ error: msg });
      throw e;
    }
  },

  updateCourse: async (course: Course) => {
    try {
      await CourseRepository.save(course);
      set((state) => ({
        courses: state.courses.map((c) => (c.id === course.id ? course : c)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update course';
      set({ error: msg });
      throw e;
    }
  },

  deleteCourse: async (id: string) => {
    try {
      await CourseRepository.delete(id);
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete course';
      set({ error: msg });
      throw e;
    }
  },

  deleteBulkCourses: async (ids: string[]) => {
    try {
      await CourseRepository.deleteBulk(ids);
      const idSet = new Set(ids);
      set((state) => ({
        courses: state.courses.filter((c) => !idSet.has(c.id)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to bulk delete courses';
      set({ error: msg });
      throw e;
    }
  },
}));

