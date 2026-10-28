import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, Spinner, Input, Textarea, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, toast,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Tabs, Tab, Select, SelectItem
} from '@/ui';
import { 
  ArrowLeft, Plus, Folder, FolderPlus, Trash2, Edit2, Search, 
  ChevronLeft, ChevronRight, X, Image as ImageIcon, 
  Layers, ImagePlus, Save,
  ChefHat, Check, MoreVertical, Maximize2,
  ArrowUpDown, Square, LayoutGrid
} from 'lucide-react';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { ImageManager } from '../../lib/image-manager';
import { CollectionModal } from './components/CollectionModal';
import type { CollectionItem, CollectionFolder, Recipe } from '@apron/core';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'recipe-first';

export function CollectionDetailPage() {
  const { t } = useTranslation();
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

  // Modals state
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

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

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

  const currentItems = useMemo(() => {
    if (!collection) return [];
    if (activeFolderId === 'all') {
      return (collection.folders || []).flatMap(f => (f.items || []).map(i => ({ ...i, folderId: f.id, folderName: f.name })));
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

  const [visibleCount, setVisibleCount] = useState(36);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset pagination when activeFolder, search, or sort changes
  useEffect(() => {
    setVisibleCount(36);
  }, [activeFolderId, searchQuery, sortBy]);

  const itemsToRender = useMemo(() => {
    return displayedItems.slice(0, visibleCount);
  }, [displayedItems, visibleCount]);

  useEffect(() => {
    if (!loadMoreRef.current || visibleCount >= displayedItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 36, displayedItems.length));
        }
      },
      { rootMargin: '300px' }
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
    if (!recipeSearch.trim()) return recipes.slice(0, 30);
    const q = recipeSearch.toLowerCase();
    return recipes.filter(r => 
      r.title.toLowerCase().includes(q) || 
      (r.category && r.category.toLowerCase().includes(q))
    ).slice(0, 30);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handlePrevImage();
      } else {
        handleNextImage();
      }
    }
    touchStartXRef.current = null;
  };

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
        toast.success(t('collections.folderUpdated'));
      } else {
        const newFolder: CollectionFolder = {
          id: `folder-${Date.now()}`,
          name: folderName.trim(),
          items: []
        };
        await addFolder(collection.id, newFolder);
        setActiveFolderId(newFolder.id);
        toast.success(t('collections.folderCreated'));
      }
      setIsFolderModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save folder', err);
      toast.error(err.message || t('common.status.errorOccurred'));
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
      toast.error(t('collections.invalidImage'));
      return;
    }
    try {
      const tempPath = await ImageManager.saveToTemp(file);
      const committedPath = await ImageManager.commitImage(tempPath);
      setItemImageUrl(committedPath);
      toast.success(t('collections.uploadImageSuccess'));
    } catch (e) {
      console.error('Lỗi lưu ảnh món:', e);
      toast.error(t('collections.uploadImageError'));
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
        toast.success(t('collections.dishUpdated'));
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
        toast.success(t('collections.dishCreated'));
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save item', err);
      toast.error(err.message || t('common.status.errorOccurred'));
    } finally {
      setIsSavingItem(false);
    }
  };

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-default-400 mt-3 text-xs">{t('common.status.loading')}</p>
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
            className="bg-black/40 backdrop-blur-md text-white rounded-full w-7 h-7 min-w-7"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('common.actions.more')}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={t('common.actions.more')}
          onAction={(key) => {
            if (key === 'preview') handleOpenLightbox(item.id);
            if (key === 'recipe' && item.recipe_id) navigate(`/recipes/${item.recipe_id}`);
            if (key === 'create-recipe') navigate(`/recipes/new?title=${encodeURIComponent(item.title)}&image=${encodeURIComponent(item.image_url || '')}`);
            if (key === 'edit') handleOpenEditItem(item);
            if (key === 'delete') setDeleteItemTarget({ folderId: item.folderId, itemId: item.id });
          }}
        >
          <DropdownItem key="preview" startContent={<Maximize2 className="w-4 h-4" />}>
            {t('collections.viewLargeImage')}
          </DropdownItem>
          {item.recipe_id ? (
            <DropdownItem key="recipe" startContent={<ChefHat className="w-4 h-4 text-primary" />}>
              {t('collections.viewRecipe')}
            </DropdownItem>
          ) : (
            <DropdownItem key="create-recipe" startContent={<ChefHat className="w-4 h-4 text-primary" />}>
              {t('collections.createRecipeFromItem')}
            </DropdownItem>
          )}
          <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4" />}>
            {t('common.actions.edit')}
          </DropdownItem>
          <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
            {t('collections.deleteItem')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );

    if (viewMode === 'square') {
      return (
        <div
          key={item.id}
          onClick={() => handleOpenLightbox(item.id)}
          className="group flex flex-col gap-1.5 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-default-100 border border-divider/40 shadow-sm">
            {item.image_url ? (
              <img
                src={ImageManager.getAssetUrl(item.image_url)}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-content2 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-default-400" />
              </div>
            )}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
            <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {item.recipe_id && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/recipes/${item.recipe_id}`);
                    }}
                    className="flex items-center gap-1 bg-primary/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md"
                  >
                    <ChefHat className="w-3 h-3" />
                    <span>{t('nav.recipes')}</span>
                  </div>
                )}
                {activeFolderId === 'all' && !groupByFolder && item.folderName && (
                  <span className="bg-black/55 backdrop-blur-md text-[9px] text-white/90 px-1.5 py-0.5 rounded-full font-medium border border-white/10 shadow-sm">
                    {item.folderName}
                  </span>
                )}
              </div>
              {itemDropdown}
            </div>
          </div>
          <div className="flex flex-col px-0.5">
            <h4 
              className="font-semibold text-xs text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors"
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
        className="group w-full aspect-[3/4] relative overflow-hidden transition-all duration-300 rounded-2xl bg-neutral-900 border border-white/10 shadow-sm active:scale-[0.98] cursor-pointer"
      >
        {item.image_url ? (
          <img
            src={ImageManager.getAssetUrl(item.image_url)}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover z-0"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-content2 flex items-center justify-center z-0">
            <ImageIcon className="w-8 h-8 text-default-400" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-18 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none z-10" />
        <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {item.recipe_id && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/recipes/${item.recipe_id}`);
                }}
                className="flex items-center gap-1 bg-primary/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-md"
              >
                <ChefHat className="w-3 h-3" />
                <span>{t('nav.recipes')}</span>
              </div>
            )}
            {activeFolderId === 'all' && !groupByFolder && item.folderName && (
              <span className="bg-black/55 backdrop-blur-md text-[9px] text-white/90 px-1.5 py-0.5 rounded-full font-medium border border-white/10 shadow-sm">
                {item.folderName}
              </span>
            )}
          </div>
          {itemDropdown}
        </div>
        <div className="relative z-20 flex flex-col justify-end h-full p-2.5 text-white">
          <h4 
            className="font-bold text-xs text-white line-clamp-2 leading-snug drop-shadow-md"
            title={item.title}
          >
            {item.title}
          </h4>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full w-full pb-8">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-divider px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="w-8 h-8 rounded-full shrink-0"
            onPress={() => navigate('/collections')}
            aria-label={t('common.actions.back')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-foreground truncate">
              {collection.title}
            </h1>
            <p className="text-[11px] text-default-400">
              {t('collections.itemCount', { folders: collection.folders?.length || 0, items: totalAllItems })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="w-8 h-8 rounded-full text-default-500"
            onPress={() => setIsCollectionModalOpen(true)}
            title={t('collections.editCollection')}
            aria-label={t('collections.editCollection')}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="w-8 h-8 rounded-full text-primary"
            onPress={handleOpenAddFolder}
            title={t('collections.addFolder')}
            aria-label={t('collections.addFolder')}
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            color="primary"
            size="sm"
            className="w-8 h-8 rounded-full shadow-sm"
            onPress={handleOpenAddItem}
            title={t('collections.addItem')}
            aria-label={t('collections.addItem')}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Folders Bar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* "Tất cả" Button */}
        <Button
          size="sm"
          variant={activeFolderId === 'all' ? 'solid' : 'flat'}
          color={activeFolderId === 'all' ? 'primary' : 'default'}
          className="rounded-full shrink-0 h-8 font-medium"
          onPress={() => setActiveFolderId('all')}
          startContent={<Layers className="w-3.5 h-3.5" />}
        >
          {t('common.actions.all')} ({totalAllItems})
        </Button>

        {/* Individual Folder Buttons */}
        {collection.folders?.map(folder => {
          const count = folder.items?.length || 0;
          const isActive = activeFolderId === folder.id;

          return (
            <Button
              key={folder.id}
              size="sm"
              variant={isActive ? 'solid' : 'flat'}
              color={isActive ? 'primary' : 'default'}
              className="rounded-full shrink-0 h-8 font-medium"
              onPress={() => setActiveFolderId(folder.id)}
              startContent={<Folder className="w-3.5 h-3.5" />}
            >
              {folder.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search Bar, Sort, View Mode & Active Folder Info */}
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            variant="flat"
            size="sm"
            placeholder={t('collections.searchItems')}
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
              isIconOnly
              size="sm" 
              variant="flat" 
              className="w-8 h-8 rounded-xl shrink-0"
              aria-label={t('common.actions.sort')}
              title={t('common.actions.sort')}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-default-600" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label={t('common.actions.sort')}
            selectedKeys={new Set([sortBy])}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as SortOption;
              if (selected) setSortBy(selected);
            }}
          >
            <DropdownItem key="newest">{t('collections.sortNewest')}</DropdownItem>
            <DropdownItem key="oldest">{t('collections.sortOldest')}</DropdownItem>
            <DropdownItem key="name-asc">{t('collections.sortNameAsc')}</DropdownItem>
            <DropdownItem key="name-desc">{t('collections.sortNameDesc')}</DropdownItem>
            <DropdownItem key="recipe-first">{t('collections.recipeFirstOption')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* Group By Folder Toggle for "All" */}
        {activeFolderId === 'all' && (
          <Button
            size="sm"
            variant="flat"
            className="h-8 px-2.5 text-xs font-semibold rounded-xl shrink-0"
            startContent={groupByFolder ? <Folder className="w-3.5 h-3.5 text-primary" /> : <Layers className="w-3.5 h-3.5" />}
            onPress={() => setGroupByFolder(prev => !prev)}
            title={groupByFolder ? t('collections.flatGrid') : t('collections.groupByFolder')}
          >
            {groupByFolder ? t('collections.groupByFolder') : t('collections.flatGrid')}
          </Button>
        )}

        {/* View Mode Toggle */}
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          className="w-8 h-8 rounded-xl shrink-0"
          aria-label={viewMode === 'portrait' ? t('collections.cardSquare') : t('collections.cardPortrait')}
          title={viewMode === 'portrait' ? t('collections.switchToSquare') : t('collections.switchToPortrait')}
          onPress={() => setViewMode(prev => prev === 'portrait' ? 'square' : 'portrait')}
        >
          {viewMode === 'portrait' ? (
            <Square className="w-3.5 h-3.5 text-default-600" />
          ) : (
            <LayoutGrid className="w-3.5 h-3.5 text-default-600" />
          )}
        </Button>

        {activeFolder && (
          <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-divider">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="w-8 h-8 rounded-full text-default-500"
              onPress={() => handleOpenEditFolder(activeFolder)}
              title={t('collections.renameFolder')}
              aria-label={t('collections.renameFolder')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              className="w-8 h-8 rounded-full"
              onPress={() => setDeleteFolderId(activeFolder.id)}
              title={t('collections.deleteFolder')}
              aria-label={t('collections.deleteFolder')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Items Gallery Grid */}
      <div className="px-4 flex-1">
        {activeFolderId === 'all' && groupByFolder ? (
          /* Grouped by Folder Sections on Mobile */
          displayedFoldersWithItems.length === 0 ? (
            <div className="py-12 flex items-center justify-center">
              <EmptyState
                icon={<ImageIcon className="w-8 h-8 text-default-300" />}
                title={t('collections.noMatchingDishes')}
                description={t('collections.noMatchingDishesDesc')}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-6">
              {displayedFoldersWithItems.map(folder => (
                <div key={folder.id} className="flex flex-col gap-3 p-3.5 rounded-2xl bg-content1 border border-divider/60 shadow-sm">
                  {/* Folder Section Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-divider/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-bold text-sm text-foreground truncate">{folder.name}</span>
                      <Chip size="sm" variant="flat" color="primary" className="text-[10px] h-5 px-1.5 font-semibold">
                        {folder.items.length}
                      </Chip>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="text-xs h-7 px-2 font-medium shrink-0"
                      endContent={<ChevronRight className="w-3.5 h-3.5" />}
                      onPress={() => setActiveFolderId(folder.id)}
                    >
                      {t('collections.viewSingleFolder')}
                    </Button>
                  </div>

                  {/* Folder Items Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {folder.items.map(item => renderItemCard(item))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : displayedItems.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <EmptyState
              icon={<ImageIcon className="w-8 h-8 text-default-300" />}
              title={t('collections.emptyFolder')}
              description={t('collections.emptyFolderDesc')}
              action={
                <Button
                  color="primary"
                  size="sm"
                  variant="flat"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={handleOpenAddItem}
                >
                  {t('collections.addItem')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {itemsToRender.map(item => renderItemCard(item))}

            {visibleCount < displayedItems.length && (
              <div 
                ref={loadMoreRef} 
                className="col-span-full py-6 flex flex-col items-center justify-center gap-2"
              >
                <Button
                  variant="flat"
                  size="sm"
                  onPress={() => setVisibleCount(prev => Math.min(prev + 36, displayedItems.length))}
                  className="text-default-600 bg-content2 hover:bg-content3 font-medium px-4 h-8 text-xs"
                >
                  {t('collections.loadMoreDishes', { count: displayedItems.length - visibleCount })}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox / Full-screen Image Viewer */}
      {lightboxIndex !== null && displayedItems[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top header bar */}
          <div 
            className="flex items-center justify-between px-4 py-3 z-10 text-white/90 bg-gradient-to-b from-black/80 to-transparent"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <Chip size="sm" variant="flat" className="bg-white/10 text-white shrink-0 text-[10px]">
                {lightboxIndex + 1}/{displayedItems.length}
              </Chip>
              <h3 className="font-semibold text-sm text-white truncate">
                {displayedItems[lightboxIndex].title}
              </h3>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {displayedItems[lightboxIndex].recipe_id ? (
                <Button
                  color="primary"
                  size="sm"
                  startContent={<ChefHat className="w-3.5 h-3.5" />}
                  onPress={() => navigate(`/recipes/${displayedItems[lightboxIndex].recipe_id}`)}
                >
                  {t('collections.viewRecipe')}
                </Button>
              ) : (
                <Button
                  variant="flat"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                  startContent={<ChefHat className="w-3.5 h-3.5 text-primary" />}
                  onPress={() => navigate(`/recipes/new?title=${encodeURIComponent(displayedItems[lightboxIndex].title)}&image=${encodeURIComponent(displayedItems[lightboxIndex].image_url || '')}`)}
                >
                  {t('collections.createRecipeFromItem')}
                </Button>
              )}

              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white rounded-full"
                onPress={() => handleOpenEditItem(displayedItems[lightboxIndex])}
                aria-label={t('common.actions.edit')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                className="bg-white/10 hover:bg-white/20 text-white rounded-full"
                onPress={() => setLightboxIndex(null)}
                aria-label={t('common.actions.close')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Center Image */}
          <div 
            className="relative flex-1 flex items-center justify-center px-2 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <Button
              isIconOnly
              variant="flat"
              radius="full"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white z-20"
              onPress={handlePrevImage}
              aria-label={t('collections.previousDish')}
            >
              <ChevronLeft className="w-5 h-5" />
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
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white z-20"
              onPress={handleNextImage}
              aria-label={t('collections.nextDish')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Bottom Caption */}
          <div 
            className="px-4 py-3 bg-gradient-to-t from-black via-black/80 to-transparent text-white z-10 text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-semibold text-sm mb-0.5">
              {displayedItems[lightboxIndex].title}
            </p>
            {displayedItems[lightboxIndex].notes && (
              <p className="text-[11px] text-white/80 line-clamp-3 whitespace-pre-line">
                {displayedItems[lightboxIndex].notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
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
        placement="bottom"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-base font-bold">
                {editingFolder ? t('collections.editFolderTitle') : t('collections.newFolderTitle')}
              </h3>
              <p className="text-xs text-default-400 font-normal">
                {t('collections.folderSubtitle')}
              </p>
            </div>
          </ModalHeader>
          <ModalBody>
            <Input
              label={t('collections.folderName')}
              labelPlacement="outside"
              placeholder={t('collections.folderNamePlaceholder')}
              value={folderName}
              onValueChange={setFolderName}
              variant="flat"
              isRequired
              autoFocus
            />
          </ModalBody>
          <ModalFooter className="flex gap-2">
            <Button 
              variant="flat" 
              className="flex-1"
              onPress={() => setIsFolderModalOpen(false)}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button 
              color="primary" 
              className="flex-1"
              startContent={<Save className="w-4 h-4" />}
              onPress={handleSaveFolder}
              isDisabled={!folderName.trim()}
            >
              {t('collections.saveFolder')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Standard Add / Edit Item Modal */}
      <Modal 
        isOpen={isItemModalOpen} 
        onClose={() => setIsItemModalOpen(false)} 
        placement="bottom"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {itemMode === 'recipe' ? <ChefHat className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="flex flex-col text-left">
              <h3 className="text-base font-bold">
                {editingItem ? t('collections.editItem') : t('collections.addItem')}
              </h3>
              <p className="text-xs text-default-400 font-normal">
                {t('collections.itemSubtitle')}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            {/* Tabs for Mode Selector */}
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
                  <div className="flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{t('collections.quickPhoto')}</span>
                  </div>
                } 
              />
              <Tab 
                key="recipe" 
                title={
                  <div className="flex items-center gap-1.5 text-xs">
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>{t('collections.fromRecipeBook')}</span>
                  </div>
                } 
              />
            </Tabs>

            {/* Folder Selector using HeroUI Select */}
            <Select
              label={t('collections.inFolder')}
              labelPlacement="outside"
              variant="flat"
              selectedKeys={itemTargetFolderId ? [itemTargetFolderId] : []}
              onChange={(e) => setItemTargetFolderId(e.target.value)}
              disallowEmptySelection
            >
              {(collection.folders || []).map(f => (
                <SelectItem key={f.id} textValue={f.name}>
                  {f.name} ({f.items?.length || 0} {t('collections.dishes')})
                </SelectItem>
              ))}
            </Select>

            {/* Recipe Picker */}
            {itemMode === 'recipe' && (
              <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary flex items-center gap-1 uppercase">
                    <ChefHat className="w-3.5 h-3.5" />
                    {t('collections.linkRecipe')}
                  </span>
                  {selectedRecipe && (
                    <Chip size="sm" color="success" variant="flat" startContent={<Check className="w-3 h-3" />}>
                      {selectedRecipe.title}
                    </Chip>
                  )}
                </div>

                <Input
                  placeholder={t('recipes.searchPlaceholder')}
                  value={recipeSearch}
                  onValueChange={setRecipeSearch}
                  variant="flat"
                  size="sm"
                  startContent={<Search className="w-3.5 h-3.5 text-default-400" />}
                  isClearable
                  onClear={() => setRecipeSearch('')}
                />

                <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1">
                  {filteredRecipesForPicker.length === 0 ? (
                    <p className="text-xs text-default-400 text-center py-3">
                      {t('recipes.empty.title')}
                    </p>
                  ) : (
                    filteredRecipesForPicker.map(rec => {
                      const isSelected = itemRecipeId === rec.id;
                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleSelectRecipeFromPicker(rec)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary font-semibold'
                              : 'bg-content1 hover:bg-default-100 border-divider text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                            {rec.image_url ? (
                              <img
                                src={ImageManager.getAssetUrl(rec.image_url)}
                                alt={rec.title}
                                className="w-8 h-8 rounded-md object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-md bg-default-100 flex items-center justify-center shrink-0">
                                <ChefHat className="w-3.5 h-3.5 text-default-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs truncate">{rec.title}</p>
                            </div>
                          </div>

                          {isSelected ? (
                            <Chip size="sm" color="primary" variant="solid">{t('common.actions.selected', { defaultValue: 'Đang chọn' })}</Chip>
                          ) : (
                            <Button size="sm" variant="light" className="text-xs h-6 min-w-12">
                              {t('common.actions.select')}
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-default-500" />
                {t('collections.coverImageLabel')}
              </label>

              {itemImageUrl ? (
                <div className="w-full aspect-[4/3] max-h-48 rounded-xl overflow-hidden relative group border border-divider bg-default-100">
                  <img
                    src={ImageManager.getAssetUrl(itemImageUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-background/80 backdrop-blur-md"
                      onPress={() => itemFileInputRef.current?.click()}
                      startContent={<ImagePlus className="w-4 h-4" />}
                    >
                      {t('collections.changeImage')}
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="flat"
                      className="bg-background/80 backdrop-blur-md"
                      onPress={() => setItemImageUrl('')}
                      aria-label={t('collections.removeImage')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => itemFileInputRef.current?.click()}
                  className="w-full aspect-[4/3] max-h-36 rounded-xl border-2 border-dashed border-default-300 active:border-primary bg-default-50 active:bg-default-100 text-default-500 flex flex-col items-center justify-center p-3 cursor-pointer"
                >
                  <ImagePlus className="w-5 h-5 mb-1 text-default-400" />
                  <p className="font-semibold text-xs text-foreground">
                    {t('collections.uploadCover')}
                  </p>
                  <p className="text-[11px] text-default-400">
                    {t('collections.dragDropCover')}
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

            {/* Title */}
            <Input
              label={t('collections.itemTitle')}
              labelPlacement="outside"
              placeholder={t('collections.dishTitlePlaceholder')}
              value={itemTitle}
              onValueChange={setItemTitle}
              variant="flat"
              isRequired
            />

            {/* Notes */}
            <Textarea
              label={t('collections.notesLabel')}
              labelPlacement="outside"
              placeholder={t('collections.notesPlaceholder')}
              value={itemNotes}
              onValueChange={setItemNotes}
              variant="flat"
              minRows={2}
            />
          </ModalBody>
          <ModalFooter className="flex gap-2">
            <Button 
              variant="flat" 
              className="flex-1"
              onPress={() => setIsItemModalOpen(false)}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button 
              color="primary" 
              className="flex-1"
              startContent={!isSavingItem && <Save className="w-4 h-4" />}
              onPress={handleSaveItem}
              isLoading={isSavingItem}
              isDisabled={!itemTitle.trim() || !itemTargetFolderId}
            >
              {t('common.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Folder Confirm */}
      <ConfirmModal
        isOpen={deleteFolderId !== null}
        onOpenChange={(open) => !open && setDeleteFolderId(null)}
        title={t('collections.deleteFolder')}
        description={t('collections.deleteFolderConfirm')}
        confirmLabel={t('collections.deleteFolder')}
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteFolderId && collection) {
            await deleteFolder(collection.id, deleteFolderId);
            setActiveFolderId('all');
            setDeleteFolderId(null);
            toast.success(t('collections.folderDeleted'));
          }
        }}
      />

      {/* Delete Item Confirm */}
      <ConfirmModal
        isOpen={deleteItemTarget !== null}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title={t('collections.deleteItem')}
        description={t('collections.deleteItemConfirm')}
        confirmLabel={t('collections.deleteItem')}
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteItemTarget && collection) {
            await deleteItemFromFolder(collection.id, deleteItemTarget.folderId, deleteItemTarget.itemId);
            setDeleteItemTarget(null);
            toast.success(t('collections.dishDeleted'));
          }
        }}
      />
    </div>
  );
}
