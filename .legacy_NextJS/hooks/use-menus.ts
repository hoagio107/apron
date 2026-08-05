'use client';

import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { MenuGroup, Menu } from '@/lib/recipe-types';

export function useMenus() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Menu Groups Query (Global categories)
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'menu_groups'), orderBy('title', 'asc'), limit(20));
  }, [firestore]);

  // Menus Query (User specific)
  const menusQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'menus'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: groups, isLoading: groupsLoading } = useCollection<MenuGroup>(groupsQuery);
  const { data: menus, isLoading: menusLoading } = useCollection<Menu>(menusQuery);

  const addMenuGroup = async (group: Omit<MenuGroup, 'id'>) => {
    if (!firestore) return;
    const colRef = collection(firestore, 'menu_groups');
    return addDocumentNonBlocking(colRef, group);
  };

  const addMenu = async (menu: Omit<Menu, 'id' | 'userId' | 'createdAt'>) => {
    if (!firestore || !user?.uid) return;
    const colRef = collection(firestore, 'users', user.uid, 'menus');
    const data = {
      ...menu,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    return addDocumentNonBlocking(colRef, data);
  };

  const updateMenu = async (id: string, data: Partial<Menu>) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'menus', id);
    return updateDocumentNonBlocking(docRef, data);
  };

  const deleteMenus = async (ids: string[]) => {
    if (!firestore || !user?.uid) return;
    const promises = ids.map(id => {
      const docRef = doc(firestore, 'users', user.uid, 'menus', id);
      return deleteDocumentNonBlocking(docRef);
    });
    return Promise.all(promises);
  };

  return { 
    groups: groups || [], 
    menus: menus || [], 
    loading: groupsLoading || menusLoading, 
    addMenuGroup,
    addMenu, 
    updateMenu,
    deleteMenus 
  };
}
