'use client';

import { useMemo } from 'react';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { Course } from '@/lib/recipe-types';

export function useCourses() {
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'courses'), 
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [firestore]);

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const addCourse = async (course: Omit<Course, 'id'>) => {
    if (!firestore) return;
    const colRef = collection(firestore, 'courses');
    const data = {
      ...course,
      createdAt: new Date().toISOString(),
    };
    return addDocumentNonBlocking(colRef, data);
  };

  const updateCourse = async (id: string, data: Partial<Course>) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'courses', id);
    return updateDocumentNonBlocking(docRef, data);
  };

  const deleteCourses = async (ids: string[]) => {
    if (!firestore) return;
    const promises = ids.map(id => {
      const docRef = doc(firestore, 'courses', id);
      return deleteDocumentNonBlocking(docRef);
    });
    return Promise.all(promises);
  };

  return { 
    courses: courses || [], 
    loading: isLoading, 
    addCourse, 
    updateCourse, 
    deleteCourses 
  };
}
