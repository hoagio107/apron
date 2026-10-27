import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, Spinner, Input, Textarea, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, toast,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Tabs, Tab, Select, SelectItem
} from '@/ui';
import { 
  Plus, Folder, FolderPlus, Trash2, Edit2, Search, 
  ChevronLeft, ChevronRight, X, Image as ImageIcon, 
  Layers, ImagePlus, Save,
  ChefHat, Check, MoreVertical, Maximize2,
  ArrowUpDown, Square, LayoutGrid
} from 'lucide-react';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { ImageManager } from '../../lib/image-manager';
import { CollectionModal } from './components/CollectionModal';
import type { CollectionItem, CollectionFolder, Recipe } from '@apron/core';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'recipe-first';

const sortLabels: Record<SortOption, string> = {
  'newest': 'Mới nhất',
  'oldest': 'Cũ nhất',
  'name-asc': 'Tên A - Z',
  'name-desc': 'Tên Z - A',
  'recipe-first': 'Có công thức trước',
};

type FolderSortOption = 'default' | 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    collections, 
    fetchCollections, 
    updateCollection,
    addFolder,
    updateFolder,
    deleteFolder,
    addItemToFolder,
    updateItemInFolder,
    deleteItemFromFolder
  } = useCollectionStore();

  const { recipes, fetchRecipes } = useRecipeStore();

  const collection = useMemo(() => collections.find(c => c.id === id), [collections, id]);

  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearch, setFolderSearch] = useState('');
  const [folderSort, setFolderSort] = useState<FolderSortOption>('default');
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (localStorage.getItem('apron_collection_sort') as SortOption) || 'newest';
  });
  const [viewMode, setViewMode] = useState<'portrait' | 'square'>(() => {
    return (localStorage.getItem('apron_collection_view_mode') as 'portrait' | 'square') || 'portrait';
  });

  const [groupByFolder, setGroupByFolder] = useState<boolean>(() => {
    const saved = localStorage.getItem('apron_collection_group_by_folder');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('apron_collection_sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('apron_collection_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('apron_collection_group_by_folder', String(groupByFolder));
  }, [groupByFolder]);

  // Modals
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CollectionFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ folderId: string; item: CollectionItem } | null>(null);
  const [itemTargetFolderId, setItemTargetFolderId] = useState<string>('');
  const [itemMode, setItemMode] = useState<'quick' | 'recipe'>('quick');
  const [itemRecipeId, setItemRecipeId] = useState<string>('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [deleteItemTarget, setDeleteItemTarget] = useState<{ folderId: string; itemId: string } | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (collections.length === 0) {
      fetchCollections();
    }
  }, [collections.length, fetchCollections]);

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  // Fallback to 'all' if the selected folder no longer exists in collection
  useEffect(() => {
    if (activeFolderId !== 'all' && collection?.folders && !collection.folders.some(f => f.id === activeFolderId)) {
      setActiveFolderId('all');
    }
  }, [collection, activeFolderId]);

  const displayedFolders = useMemo(() => {
    if (!collection?.folders) return [];
    let list = [...collection.folders];
    if (folderSearch.trim()) {
      const q = folderSearch.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    switch (folderSort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' }));
      case 'count-desc':
        return list.sort((a, b) => (b.items?.length || 0) - (a.items?.length || 0));
      case 'count-asc':
        return list.sort((a, b) => (a.items?.length || 0) - (b.items?.length || 0));
      default:
        return list;
    }
  }, [collection?.folders, folderSearch, folderSort]);

  const currentItems = useMemo(() => {
    if (!collection) return [];
    if (activeFolderId === 'all') {
      return (collection.folders || []).flatMap(f => 
        (f.items || []).map(i => ({ ...i, folderId: f.id, folderName: f.name }))
      );
    }
    const folder = collection.folders?.find(f => f.id === activeFolderId);
    if (!folder) return [];
    return (folder.items || []).map(i => ({ ...i, folderId: folder.id, folderName: folder.name }));
  }, [collection, activeFolderId]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const q = searchQuery.toLowerCase();
    return currentItems.filter(item => 
      item.title.toLowerCase().includes(q) || 
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [currentItems, searchQuery]);

  const displayedItems = useMemo(() => {
    const items = [...filteredItems];
    switch (sortBy) {
      case 'newest':
        return items.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
      case 'oldest':
        return items.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeA - timeB;
        });
      case 'name-asc':
        return items.sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }));
      case 'name-desc':
        return items.sort((a, b) => b.title.localeCompare(a.title, 'vi', { sensitivity: 'base' }));
      case 'recipe-first':
        return items.sort((a, b) => {
          const hasRecA = a.recipe_id ? 1 : 0;
          const hasRecB = b.recipe_id ? 1 : 0;
          if (hasRecB !== hasRecA) return hasRecB - hasRecA;
          return a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
        });
      default:
        return items;
    }
  }, [filteredItems, sortBy]);

  const [visibleCount, setVisibleCount] = useState(48);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset pagination when activeFolder, search, or sort changes
  useEffect(() => {
    setVisibleCount(48);
  }, [activeFolderId, searchQuery, sortBy]);

  const itemsToRender = useMemo(() => {
    return displayedItems.slice(0, visibleCount);
  }, [displayedItems, visibleCount]);

  useEffect(() => {
    if (!loadMoreRef.current || visibleCount >= displayedItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 48, displayedItems.length));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, displayedItems.length]);

  const handleOpenLightbox = useCallback((itemId: string) => {
    const idx = displayedItems.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  }, [displayedItems]);

  const displayedFoldersWithItems = useMemo(() => {
    if (!collection?.folders) return [];
    return collection.folders
      .map(folder => {
        let items = (folder.items || []).map(i => ({
          ...i,
          folderId: folder.id,
          folderName: folder.name
        }));
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          items = items.filter(i => 
            i.title.toLowerCase().includes(q) || 
            (i.notes && i.notes.toLowerCase().includes(q))
          );
        }
        return {
          ...folder,
          items: items.sort((a, b) => {
            if (sortBy === 'newest') return (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
            if (sortBy === 'oldest') return (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0);
            if (sortBy === 'name-asc') return a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
            if (sortBy === 'name-desc') return b.title.localeCompare(a.title, 'vi', { sensitivity: 'base' });
            if (sortBy === 'recipe-first') {
              const recA = a.recipe_id ? 1 : 0;
              const recB = b.recipe_id ? 1 : 0;
              if (recB !== recA) return recB - recA;
              return a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
            }
            return 0;
          })
        };
      })
      .filter(f => f.items.length > 0);
  }, [collection?.folders, searchQuery, sortBy]);

  const filteredRecipesForPicker = useMemo(() => {
    if (!recipeSearch.trim()) return recipes.slice(0, 40);
    const q = recipeSearch.toLowerCase();
    return recipes.filter(r => 
      r.title.toLowerCase().includes(q) || 
      (r.category && r.category.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [recipes, recipeSearch]);

  const selectedRecipe = useMemo(() => {
    return recipes.find(r => r.id === itemRecipeId);
  }, [recipes, itemRecipeId]);

  // Lightbox navigation
  const handlePrevImage = useCallback(() => {
    if (lightboxIndex === null || displayedItems.length === 0) return;
    setLightboxIndex(prev => (prev === null || prev === 0 ? displayedItems.length - 1 : prev - 1));
  }, [lightboxIndex, displayedItems.length]);

  const handleNextImage = useCallback(() => {
    if (lightboxIndex === null || displayedItems.length === 0) return;
    setLightboxIndex(prev => (prev === null || prev >= displayedItems.length - 1 ? 0 : prev + 1));
  }, [lightboxIndex, displayedItems.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrevImage, handleNextImage]);

  // Folder Actions
  const handleOpenAddFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (f: CollectionFolder) => {
    setEditingFolder(f);
    setFolderName(f.name);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!collection || !folderName.trim()) return;
    try {
      if (editingFolder) {
        await updateFolder(collection.id, {
          ...editingFolder,
          name: folderName.trim(),
        });
        toast.success('Đã cập nhật thư mục');
      } else {
        const newFolder: CollectionFolder = {
          id: `folder-${Date.now()}`,
          name: folderName.trim(),
          items: []
        };
        await addFolder(collection.id, newFolder);
        setActiveFolderId(newFolder.id);
        toast.success('Đã tạo thư mục mới');
      }
      setIsFolderModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save folder', err);
      toast.error('Lỗi khi lưu thư mục: ' + err.message);
    }
  };

  // Item Actions
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemImageUrl('');
    setItemNotes('');
    setItemMode('quick');
    setItemRecipeId('');
    setRecipeSearch('');
    const targetId = activeFolderId !== 'all' ? activeFolderId : (collection?.folders?.[0]?.id || '');
    setItemTargetFolderId(targetId);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (itemWithFolder: { folderId: string; [key: string]: any }) => {
    const item: CollectionItem = {
      id: itemWithFolder.id,
      title: itemWithFolder.title,
      image_url: itemWithFolder.image_url,
      recipe_id: itemWithFolder.recipe_id,
      notes: itemWithFolder.notes,
      created_at: itemWithFolder.created_at
    };
    setEditingItem({ folderId: itemWithFolder.folderId, item });
    setItemTitle(item.title);
    setItemImageUrl(item.image_url || '');
    setItemNotes(item.notes || '');
    setItemTargetFolderId(itemWithFolder.folderId);
    if (item.recipe_id) {
      setItemMode('recipe');
      setItemRecipeId(item.recipe_id);
    } else {
      setItemMode('quick');
      setItemRecipeId('');
    }
    setRecipeSearch('');
    setIsItemModalOpen(true);
  };

  const handleSelectRecipeFromPicker = (rec: Recipe) => {
    setItemRecipeId(rec.id);
    if (!itemTitle.trim() || itemTitle === editingItem?.item.title) {
      setItemTitle(rec.title);
    }
    if (rec.image_url) {
      setItemImageUrl(rec.image_url);
    }
    if (rec.description && !itemNotes.trim()) {
      setItemNotes(rec.description);
    }
  };

  const processItemFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (PNG, JPG, WebP...)');
      return;
    }
    try {
      const tempPath = await ImageManager.saveToTemp(file);
      const committedPath = await ImageManager.commitImage(tempPath);
      setItemImageUrl(committedPath);
      toast.success('Đã tải ảnh món ăn');
    } catch (e) {
      console.error('Lỗi lưu ảnh món:', e);
      toast.error('Không thể lưu ảnh món ăn');
    }
  };

  const handleItemFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processItemFile(file);
    }
    e.target.value = '';
  };

  const handleSaveItem = async () => {
    if (!collection || !itemTargetFolderId || !itemTitle.trim()) return;
    setIsSavingItem(true);
    try {
      const finalRecipeId = itemMode === 'recipe' && itemRecipeId ? itemRecipeId : (editingItem?.item.recipe_id && itemMode === 'recipe' ? editingItem.item.recipe_id : undefined);

      if (editingItem) {
        if (editingItem.folderId !== itemTargetFolderId) {
          await deleteItemFromFolder(collection.id, editingItem.folderId, editingItem.item.id);
          await addItemToFolder(collection.id, itemTargetFolderId, {
            ...editingItem.item,
            title: itemTitle.trim(),
            image_url: itemImageUrl.trim(),
            recipe_id: finalRecipeId,
            notes: itemNotes.trim(),
          });
        } else {
          await updateItemInFolder(collection.id, editingItem.folderId, {
            ...editingItem.item,
            title: itemTitle.trim(),
            image_url: itemImageUrl.trim(),
            recipe_id: finalRecipeId,
            notes: itemNotes.trim(),
          });
        }
        toast.success('Đã cập nhật món ăn');
      } else {
        const newItem: CollectionItem = {
          id: `item-${Date.now()}`,
          title: itemTitle.trim(),
          image_url: itemImageUrl.trim(),
          recipe_id: finalRecipeId,
          notes: itemNotes.trim(),
          created_at: new Date().toISOString()
        };
        await addItemToFolder(collection.id, itemTargetFolderId, newItem);
        toast.success('Đã thêm món ăn');
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save item', err);
      toast.error('Lỗi khi lưu món: ' + err.message);
    } finally {
      setIsSavingItem(false);
    }
  };

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="text-default-400 mt-3 text-sm">Đang tải bộ sưu tập...</p>
      </div>
    );
  }

  const activeFolder = collection.folders?.find(f => f.id === activeFolderId);
  const totalAllItems = (collection.folders || []).reduce((acc, f) => acc + (f.items?.length || 0), 0);

  const renderItemCard = (item: CollectionItem & { folderId: string; folderName?: string }) => {
    const itemDropdown = (
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-black/40 backdrop-blur-md rounded-full w-7 h-7 min-w-7 text-white hover:bg-black/60"
            onClick={(e) => e.stopPropagation()}
            aria-label="Tùy chọn món"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Tùy chọn món ăn"
          onAction={(key) => {
            if (key === 'preview') handleOpenLightbox(item.id);
            if (key === 'recipe' && item.recipe_id) navigate(`/recipes/${item.recipe_id}`);
            if (key === 'create-recipe') navigate(`/recipes/new?title=${encodeURIComponent(item.title)}&image=${encodeURIComponent(item.image_url || '')}`);
            if (key === 'edit') handleOpenEditItem(item);
            if (key === 'delete') setDeleteItemTarget({ folderId: item.folderId, itemId: item.id });
          }}
        >
          <DropdownItem key="preview" startContent={<Maximize2 className="w-4 h-4" />}>
            Xem ảnh lớn
          </DropdownItem>
          {item.recipe_id ? (
            <DropdownItem key="recipe" startContent={<ChefHat className="w-4 h-4 text-primary" />}>
              Xem công thức
            </DropdownItem>
          ) : (
            <DropdownItem key="create-recipe" startContent={<ChefHat className="w-4 h-4 text-primary" />}>
              Tạo bài công thức từ món này
            </DropdownItem>
          )}
          <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4" />}>
            Chỉnh sửa
          </DropdownItem>
          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
            Xoá món
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );

    if (viewMode === 'square') {
      return (
        <div
          key={item.id}
          onClick={() => handleOpenLightbox(item.id)}
          className="group flex flex-col gap-2 cursor-pointer"
        >
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-default-100 border border-divider/40 shadow-sm group-hover:shadow-md transition-all">
            {item.image_url ? (
              <img
                src={ImageManager.getAssetUrl(item.image_url)}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-content2 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-default-400" />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
            <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {item.recipe_id && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recipes/${item.recipe_id}`);
                    }}
                    className="flex items-center gap-1 bg-primary/95 hover:bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md transition-all active:scale-95"
                    title="Bấm để xem bài công thức"
                  >
                    <ChefHat className="w-3 h-3" />
                    <span>Công thức</span>
                  </div>
                )}
                {activeFolderId === 'all' && !groupByFolder && item.folderName && (
                  <span className="bg-black/60 backdrop-blur-md text-[10px] text-white/90 px-2 py-0.5 rounded-full font-medium border border-white/10 shadow-sm">
                    {item.folderName}
                  </span>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {itemDropdown}
              </div>
            </div>
          </div>
          <div className="flex flex-col px-0.5">
            <h4 
              className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
              title={item.title}
            >
              {item.title}
            </h4>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        onClick={() => handleOpenLightbox(item.id)}
        className="group w-full aspect-[3/4] relative overflow-hidden transition-all duration-300 rounded-2xl bg-neutral-900 border border-white/10 shadow-sm hover:shadow-xl hover:scale-[1.02] cursor-pointer"
      >
        {item.image_url ? (
          <img
            src={ImageManager.getAssetUrl(item.image_url)}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-content2 flex items-center justify-center z-0">
            <ImageIcon className="w-12 h-12 text-default-400" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-18 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none z-10" />
        <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {item.recipe_id && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/recipes/${item.recipe_id}`);
                }}
                className="flex items-center gap-1 bg-primary/95 hover:bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md transition-all active:scale-95"
                title="Bấm để xem bài công thức"
              >
                <ChefHat className="w-3 h-3" />
                <span>Công thức</span>
              </div>
            )}
            {activeFolderId === 'all' && !groupByFolder && item.folderName && (
              <span className="bg-black/55 backdrop-blur-md text-[10px] text-white/90 px-2 py-0.5 rounded-full font-medium border border-white/10 shadow-sm">
                {item.folderName}
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {itemDropdown}
          </div>
        </div>
        <div className="relative z-20 flex flex-col justify-end h-full p-3 text-white">
          <h4 
            className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug drop-shadow-md group-hover:text-primary-300 transition-colors"
            title={item.title}
          >
            {item.title}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full pb-8">
      {/* Standard PageHeader */}
      <PageHeader
        title={collection.title}
        description={`${collection.folders?.length || 0} thư mục • ${totalAllItems} món ăn / hình ảnh`}
        showBackButton
        onBack={() => navigate('/collections')}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="flat"
              startContent={<Edit2 className="w-4 h-4 text-default-500" />}
              onPress={() => setIsCollectionModalOpen(true)}
            >
              Sửa bộ sưu tập
            </Button>
            <Button
              variant="flat"
              startContent={<FolderPlus className="w-4 h-4 text-primary" />}
              onPress={handleOpenAddFolder}
            >
              Thêm thư mục
            </Button>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleOpenAddItem}
            >
              Thêm món / ảnh
            </Button>
          </div>
        }
      />

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Sidebar: Folders List */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
              Danh sách thư mục
            </span>
            <Chip size="sm" variant="flat">{collection.folders?.length || 0}</Chip>
          </div>

          {/* Search & Sort for Folders */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <Input
                variant="flat"
                size="sm"
                placeholder="Tìm thư mục..."
                startContent={<Search className="w-3.5 h-3.5 text-default-400" />}
                value={folderSearch}
                onValueChange={setFolderSearch}
                isClearable
                onClear={() => setFolderSearch('')}
              />
            </div>

            <Dropdown>
              <DropdownTrigger>
                <Button 
                  isIconOnly 
                  size="sm" 
                  variant="flat" 
                  className="rounded-xl shrink-0 text-default-600"
                  aria-label="Sắp xếp thư mục"
                  title="Sắp xếp thư mục"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Sắp xếp thư mục"
                selectedKeys={new Set([folderSort])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const sel = Array.from(keys)[0] as FolderSortOption;
                  if (sel) setFolderSort(sel);
                }}
              >
                <DropdownItem key="default">Thứ tự ban đầu</DropdownItem>
                <DropdownItem key="name-asc">Tên thư mục A - Z</DropdownItem>
                <DropdownItem key="name-desc">Tên thư mục Z - A</DropdownItem>
                <DropdownItem key="count-desc">Nhiều món nhất</DropdownItem>
                <DropdownItem key="count-asc">Ít món nhất</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex flex-col gap-1 max-h-[60vh] lg:max-h-[calc(100vh-310px)] overflow-y-auto pr-1">
            {/* "Tất cả" Item - using div to avoid any nested button issue */}
            <div
              onClick={() => setActiveFolderId('all')}
              className={`group flex items-center justify-between px-3.5 h-11 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeFolderId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-content2 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <Layers className={`w-4 h-4 shrink-0 ${activeFolderId === 'all' ? 'text-white' : 'text-primary'}`} />
                <span className="truncate font-semibold">Tất cả các món</span>
              </div>
              <Chip size="sm" variant="flat" color={activeFolderId === 'all' ? 'default' : 'default'}>
                {totalAllItems}
              </Chip>
            </div>

            {/* Folder rows */}
            {displayedFolders.map(folder => {
              const count = folder.items?.length || 0;
              const isActive = activeFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`group flex items-center justify-between px-3.5 h-11 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-content2 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
                    <span className="truncate">{folder.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Chip size="sm" variant="flat" color={isActive ? 'default' : 'default'}>
                      {count}
                    </Chip>

                    {/* Folder actions dropdown popover */}
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className={`rounded-full w-7 h-7 min-w-7 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isActive ? 'text-white hover:bg-black/20' : 'text-default-500'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Thao tác thư mục"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Thao tác"
                        onAction={(key) => {
                          if (key === 'edit') handleOpenEditFolder(folder);
                          if (key === 'delete') setDeleteFolderId(folder.id);
                        }}
                      >
                        <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4" />}>
                          Đổi tên thư mục
                        </DropdownItem>
                        <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
                          Xoá thư mục
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              );
            })}

            {displayedFolders.length === 0 && folderSearch.trim() && (
              <div className="py-6 px-3 text-center text-xs text-default-400 bg-content2/40 rounded-xl">
                Không tìm thấy thư mục nào
              </div>
            )}
          </div>
        </div>

        {/* Right Main Column: Items Gallery Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Subheader */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                {activeFolderId === 'all' ? 'Tất cả các món trong bộ sưu tập' : activeFolder?.name}
                <Chip size="sm" variant="flat">{displayedItems.length} món</Chip>
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="w-full sm:w-60">
                <Input
                  variant="flat"
                  size="sm"
                  placeholder="Tìm món trong thư mục..."
                  startContent={<Search className="w-3.5 h-3.5 text-default-400" />}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  isClearable
                  onClear={() => setSearchQuery('')}
                />
              </div>

              {/* Sort Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    startContent={<ArrowUpDown className="w-3.5 h-3.5 text-default-500" />}
                    className="font-medium shrink-0"
                  >
                    {sortLabels[sortBy] || 'Sắp xếp'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Tùy chọn sắp xếp"
                  selectedKeys={new Set([sortBy])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as SortOption;
                    if (selected) setSortBy(selected);
                  }}
                >
                  <DropdownItem key="newest">Mới nhất</DropdownItem>
                  <DropdownItem key="oldest">Cũ nhất</DropdownItem>
                  <DropdownItem key="name-asc">Tên A - Z</DropdownItem>
                  <DropdownItem key="name-desc">Tên Z - A</DropdownItem>
                  <DropdownItem key="recipe-first">Có công thức trước</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* Group By Folder Toggle for "All" */}
              {activeFolderId === 'all' && (
                <div className="flex items-center bg-content2 p-0.5 rounded-xl border border-divider/40 shrink-0">
                  <Button
                    size="sm"
                    variant={groupByFolder ? 'solid' : 'light'}
                    color={groupByFolder ? 'primary' : 'default'}
                    className="h-8 text-xs font-semibold px-2.5 rounded-lg"
                    startContent={<Folder className="w-3.5 h-3.5" />}
                    onPress={() => setGroupByFolder(true)}
                  >
                    Theo thư mục
                  </Button>
                  <Button
                    size="sm"
                    variant={!groupByFolder ? 'solid' : 'light'}
                    color={!groupByFolder ? 'primary' : 'default'}
                    className="h-8 text-xs font-semibold px-2.5 rounded-lg"
                    startContent={<Layers className="w-3.5 h-3.5" />}
                    onPress={() => setGroupByFolder(false)}
                  >
                    Lưới phẳng
                  </Button>
                </div>
              )}

              {/* View Mode Toggle */}
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="shrink-0"
                aria-label={viewMode === 'portrait' ? 'Chuyển sang dạng thẻ vuông (tên bên ngoài)' : 'Chuyển sang dạng thẻ dọc'}
                title={viewMode === 'portrait' ? 'Chuyển sang dạng thẻ vuông (tên bên ngoài)' : 'Chuyển sang dạng thẻ dọc'}
                onPress={() => setViewMode(prev => prev === 'portrait' ? 'square' : 'portrait')}
              >
                {viewMode === 'portrait' ? (
                  <Square className="w-4 h-4 text-default-600" />
                ) : (
                  <LayoutGrid className="w-4 h-4 text-default-600" />
                )}
              </Button>
            </div>
          </div>

          {/* Gallery Items Grid */}
          {activeFolderId === 'all' && groupByFolder ? (
            /* Grouped by Folder Sections */
            displayedFoldersWithItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 bg-content1/50 rounded-2xl border border-dashed border-divider">
                <EmptyState
                  icon={<ImageIcon className="w-10 h-10 text-default-300" />}
                  title="Không tìm thấy món ăn nào"
                  description="Thử tìm kiếm với từ khoá khác hoặc thêm món mới."
                />
              </div>
            ) : (
              <div className="flex flex-col gap-8 pb-10">
                {displayedFoldersWithItems.map(folder => (
                  <section 
                    key={folder.id} 
                    className="flex flex-col gap-4 p-5 rounded-2xl bg-content1/40 border border-divider/60 shadow-sm"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-divider/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-bold text-base text-foreground truncate">
                            {folder.name}
                          </h3>
                          <Chip size="sm" variant="flat" color="primary" className="text-xs shrink-0 font-semibold">
                            {folder.items.length} món
                          </Chip>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="text-xs font-semibold h-8 rounded-xl shrink-0"
                        endContent={<ChevronRight className="w-3.5 h-3.5" />}
                        onPress={() => setActiveFolderId(folder.id)}
                      >
                        Xem riêng thư mục này
                      </Button>
                    </div>

                    {/* Section Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
                      {folder.items.map(item => renderItemCard(item))}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : displayedItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-content1/50 rounded-2xl border border-dashed border-divider">
              <EmptyState
                icon={<ImageIcon className="w-10 h-10 text-default-300" />}
                title="Chưa có món nào trong thư mục này"
                description="Bấm 'Thêm món / ảnh' để tải ảnh thực đơn hoặc chọn công thức nấu ăn vào đây."
                action={
                  <Button 
                    color="primary" 
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleOpenAddItem}
                  >
                    Thêm món ngay
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5 pb-8">
              {itemsToRender.map(item => renderItemCard(item))}

              {visibleCount < displayedItems.length && (
                <div 
                  ref={loadMoreRef} 
                  className="col-span-full py-8 flex flex-col items-center justify-center gap-2"
                >
                  <Button
                    variant="flat"
                    size="sm"
                    onPress={() => setVisibleCount(prev => Math.min(prev + 48, displayedItems.length))}
                    className="text-default-600 bg-content2 hover:bg-content3 font-medium px-4 h-9"
                  >
                    Xem thêm ({displayedItems.length - visibleCount} món còn lại)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Full-screen Image Viewer */}
      {lightboxIndex !== null && displayedItems[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top header bar */}
          <div 
            className="flex items-center justify-between px-6 py-4 z-10 text-white/90"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Chip size="sm" variant="flat" className="bg-white/10 text-white">
                {lightboxIndex + 1} / {displayedItems.length}
              </Chip>
              <h3 className="font-semibold text-base sm:text-lg text-white line-clamp-1">
                {displayedItems[lightboxIndex].title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {displayedItems[lightboxIndex].recipe_id ? (
                <Button
                  color="primary"
                  size="sm"
                  startContent={<ChefHat className="w-4 h-4" />}
                  onPress={() => navigate(`/recipes/${displayedItems[lightboxIndex].recipe_id}`)}
                >
                  Xem công thức
                </Button>
              ) : (
                <Button
                  variant="flat"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  startContent={<ChefHat className="w-4 h-4 text-primary" />}
                  onPress={() => navigate(`/recipes/new?title=${encodeURIComponent(displayedItems[lightboxIndex].title)}&image=${encodeURIComponent(displayedItems[lightboxIndex].image_url || '')}`)}
                >
                  Tạo công thức
                </Button>
              )}

              <Button
                isIconOnly
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white"
                onPress={() => handleOpenEditItem(displayedItems[lightboxIndex])}
                title="Sửa thông tin"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white"
                onPress={() => setLightboxIndex(null)}
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Center Image */}
          <div 
            className="relative flex-1 flex items-center justify-center px-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <Button
              isIconOnly
              variant="flat"
              radius="full"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white z-20"
              onPress={handlePrevImage}
              title="Món trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <img
              src={ImageManager.getAssetUrl(displayedItems[lightboxIndex].image_url || '')}
              alt={displayedItems[lightboxIndex].title}
              className="max-h-full max-w-full object-contain select-none shadow-2xl rounded-lg"
            />

            <Button
              isIconOnly
              variant="flat"
              radius="full"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white z-20"
              onPress={handleNextImage}
              title="Món sau"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Bottom Caption */}
          <div 
            className="px-6 py-4 bg-gradient-to-t from-black via-black/80 to-transparent text-white z-10 text-center flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold text-base mb-1">
              {displayedItems[lightboxIndex].title}
            </p>
            {displayedItems[lightboxIndex].notes && (
              <p className="text-xs text-white/80 max-w-2xl whitespace-pre-line leading-relaxed">
                {displayedItems[lightboxIndex].notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Standard Edit Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        collection={collection}
        onSave={async (data) => {
          await updateCollection({
            ...collection,
            title: data.title,
            description: data.description,
            cover_image_url: data.cover_image_url,
          });
        }}
      />

      {/* Standard Add / Edit Folder Modal */}
      <Modal 
        isOpen={isFolderModalOpen} 
        onClose={() => setIsFolderModalOpen(false)} 
        placement="center"
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-base font-bold">
                {editingFolder ? 'Đổi tên thư mục' : 'Thêm thư mục mới'}
              </h3>
              <p className="text-xs text-default-400 font-normal">
                Phân nhóm món ăn theo giai đoạn hoặc loại bữa ăn
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <Input
              label="Tên thư mục"
              labelPlacement="outside"
              placeholder="Ví dụ: Thực đơn 7 tháng, Bữa sáng..."
              value={folderName}
              onValueChange={setFolderName}
              variant="flat"
              isRequired
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={() => setIsFolderModalOpen(false)}
            >
              Huỷ
            </Button>
            <Button 
              color="primary" 
              startContent={<Save className="w-4 h-4" />}
              onPress={handleSaveFolder}
              isDisabled={!folderName.trim()}
            >
              Lưu thư mục
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Standard Add / Edit Item Modal */}
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        placement="center"
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {itemMode === 'recipe' ? <ChefHat className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-base font-bold">
                {editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món vào bộ sưu tập'}
              </h3>
              <p className="text-xs text-default-400 font-normal">
                Linh hoạt giữa ảnh chụp nhanh đơn giản hoặc liên kết công thức nấu ăn
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="gap-5">
            {/* Standard Tabs for Mode Selector */}
            <Tabs
              color="primary"
              variant="solid"
              selectedKey={itemMode}
              onSelectionChange={(key) => setItemMode(key as 'quick' | 'recipe')}
              fullWidth
            >
              <Tab 
                key="quick" 
                title={
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Thêm ảnh nhanh</span>
                  </div>
                } 
              />
              <Tab 
                key="recipe" 
                title={
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    <span>Chọn từ Sổ tay công thức</span>
                  </div>
                } 
              />
            </Tabs>

            {/* Target Folder Selector using HeroUI Select */}
            <Select
              label="Thuộc thư mục"
              labelPlacement="outside"
              variant="flat"
              selectedKeys={itemTargetFolderId ? [itemTargetFolderId] : []}
              onChange={(e) => setItemTargetFolderId(e.target.value)}
              disallowEmptySelection
            >
              {(collection.folders || []).map(f => (
                <SelectItem key={f.id} textValue={f.name}>
                  {f.name} ({f.items?.length || 0} món)
                </SelectItem>
              ))}
            </Select>

            {/* Recipe Mode: Recipe Selector */}
            {itemMode === 'recipe' && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                    <ChefHat className="w-4 h-4" />
                    Liên kết với bài công thức
                  </span>
                  {selectedRecipe && (
                    <Chip size="sm" color="success" variant="flat" startContent={<Check className="w-3 h-3" />}>
                      Đã chọn: {selectedRecipe.title}
                    </Chip>
                  )}
                </div>

                <Input
                  placeholder="Gõ tên món để tìm trong Sổ tay công thức..."
                  value={recipeSearch}
                  onValueChange={setRecipeSearch}
                  variant="flat"
                  size="sm"
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  isClearable
                  onClear={() => setRecipeSearch('')}
                />

                <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {filteredRecipesForPicker.length === 0 ? (
                    <p className="text-xs text-default-400 text-center py-4">
                      Không tìm thấy công thức nào phù hợp
                    </p>
                  ) : (
                    filteredRecipesForPicker.map(rec => {
                      const isSelected = itemRecipeId === rec.id;
                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleSelectRecipeFromPicker(rec)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary font-semibold'
                              : 'bg-content1 hover:bg-default-100 border-divider text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                            {rec.image_url ? (
                              <img
                                src={ImageManager.getAssetUrl(rec.image_url)}
                                alt={rec.title}
                                className="w-9 h-9 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-default-100 flex items-center justify-center shrink-0">
                                <ChefHat className="w-4 h-4 text-default-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{rec.title}</p>
                              {rec.category && (
                                <p className="text-[10px] text-default-400 truncate">{rec.category}</p>
                              )}
                            </div>
                          </div>

                          {isSelected ? (
                            <Chip size="sm" color="primary" variant="solid">Đang chọn</Chip>
                          ) : (
                            <Button size="sm" variant="light" className="text-xs h-7 min-w-16">
                              Chọn
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Photo Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-default-500" />
                Ảnh món ăn / thực đơn
              </label>

              {itemImageUrl ? (
                <div className="w-full aspect-[4/3] max-h-56 rounded-xl overflow-hidden relative group border border-divider bg-default-100">
                  <img
                    src={ImageManager.getAssetUrl(itemImageUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-background/80 backdrop-blur-md"
                      onPress={() => itemFileInputRef.current?.click()}
                      startContent={<ImagePlus className="w-4 h-4" />}
                    >
                      Đổi ảnh
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="flat"
                      className="bg-background/80 backdrop-blur-md"
                      onPress={() => setItemImageUrl('')}
                      title="Xoá ảnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => itemFileInputRef.current?.click()}
                  className="w-full aspect-[4/3] max-h-40 rounded-xl border-2 border-dashed border-default-300 hover:border-primary bg-default-50 hover:bg-default-100 text-default-500 flex flex-col items-center justify-center p-4 cursor-pointer transition-colors"
                >
                  <ImagePlus className="w-6 h-6 mb-1 text-default-400" />
                  <p className="font-semibold text-xs text-foreground">
                    Tải ảnh món ăn
                  </p>
                  <p className="text-[11px] text-default-400">
                    Bấm để chọn file ảnh từ thiết bị
                  </p>
                </div>
              )}

              <input
                type="file"
                ref={itemFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleItemFileInputChange}
              />
            </div>

            {/* Title Input */}
            <Input
              label="Tên món ăn"
              labelPlacement="outside"
              placeholder="Ví dụ: Cháo yến mạch tôm bằm, Bữa trưa ngày 01..."
              value={itemTitle}
              onValueChange={setItemTitle}
              variant="flat"
              isRequired
            />

            {/* Notes / Description */}
            <Textarea
              label="Ghi chú / Mô tả"
              labelPlacement="outside"
              placeholder="Ghi chú nguyên liệu, định lượng hoặc cách nấu vắn tắt..."
              value={itemNotes}
              onValueChange={setItemNotes}
              variant="flat"
              minRows={2}
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={() => setIsItemModalOpen(false)}
            >
              Huỷ
            </Button>
            <Button 
              color="primary" 
              startContent={!isSavingItem && <Save className="w-4 h-4" />}
              onPress={handleSaveItem}
              isLoading={isSavingItem}
              isDisabled={!itemTitle.trim() || !itemTargetFolderId}
            >
              Lưu món ăn
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Folder Confirm */}
      <ConfirmModal
        isOpen={deleteFolderId !== null}
        onOpenChange={(open) => !open && setDeleteFolderId(null)}
        title="Xoá thư mục"
        description="Bạn có chắc muốn xoá thư mục này không? Các món ăn trong thư mục cũng sẽ bị xoá."
        confirmLabel="Xoá thư mục"
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteFolderId && collection) {
            await deleteFolder(collection.id, deleteFolderId);
            setActiveFolderId('all');
            setDeleteFolderId(null);
            toast.success('Đã xoá thư mục');
          }
        }}
      />

      {/* Delete Item Confirm */}
      <ConfirmModal
        isOpen={deleteItemTarget !== null}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title="Xoá món ăn"
        description="Bạn có chắc chắn muốn xoá món này khỏi bộ sưu tập?"
        confirmLabel="Xoá món"
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteItemTarget && collection) {
            await deleteItemFromFolder(collection.id, deleteItemTarget.folderId, deleteItemTarget.itemId);
            setDeleteItemTarget(null);
            toast.success('Đã xoá món ăn');
          }
        }}
      />
    </div>
  );
}
