import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Spinner, Input, 
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem 
} from '@/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  Plus, FolderHeart, Trash2, Edit2, Search, 
  MoreVertical, Layers 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCollectionStore } from '../../store/useCollectionStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { ImageManager } from '../../lib/image-manager';
import { CollectionModal } from './components/CollectionModal';
import type { Collection } from '@apron/core';

export function CollectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { collections, isLoading, fetchCollections, addCollection, updateCollection, deleteCollection } = useCollectionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteColId, setDeleteColId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [collections, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Collection) => {
    setEditingCollection(col);
    setIsModalOpen(true);
  };

  const handleSaveCollection = async (data: { title: string; description: string; cover_image_url: string }) => {
    if (editingCollection) {
      await updateCollection({
        ...editingCollection,
        title: data.title,
        description: data.description,
        cover_image_url: data.cover_image_url,
      });
    } else {
      const newCol: Collection = {
        id: `col-${Date.now()}`,
        title: data.title,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        cover_image_url: data.cover_image_url,
        folders: [],
        created_at: new Date().toISOString()
      };
      await addCollection(newCol);
    }
  };

  return (
    <div className="flex flex-col min-h-full gap-4 w-full pt-4 pb-28 px-4">
      {/* Header */}
      <PageHeader
        title={t('collections.title')}
        description={t('collections.subtitle', { count: collections.length })}
        actions={
          <div className="flex items-center gap-2 w-full">
            <Input
              variant="flat"
              classNames={{
                base: "flex-1",
                input: "text-small",
                inputWrapper: "h-10 min-h-10",
              }}
              placeholder={t('collections.searchPlaceholder')}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              value={searchQuery}
              onValueChange={setSearchQuery}
              isClearable
              onClear={() => setSearchQuery('')}
            />
            <Button
              isIconOnly
              color="primary"
              className="rounded-xl shadow-sm shrink-0 h-10 w-10 min-w-10"
              onPress={handleOpenAdd}
              aria-label={t('collections.addCollection')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderHeart className="w-10 h-10 text-default-300" />}
          title={t('collections.emptyTitle')}
          description={t('collections.emptyDesc')}
          action={
            <Button
              color="primary"
              variant="flat"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleOpenAdd}
            >
              {t('collections.addCollection')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredCollections.map(col => {
            const totalDishes = (col.folders || []).reduce((acc, f) => acc + (f.items?.length || 0), 0);
            const totalFolders = col.folders?.length || 0;
            const coverUrl = col.cover_image_url || col.folders?.[0]?.items?.[0]?.image_url;

            return (
              <div
                key={col.id}
                onClick={() => navigate(`/collections/${col.id}`)}
                className="group w-full aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden transition-all duration-300 rounded-2xl bg-neutral-900 border border-white/10 shadow-sm active:scale-[0.98] cursor-pointer"
              >
                {/* Background Image */}
                {coverUrl ? (
                  <img
                    src={ImageManager.getAssetUrl(coverUrl)}
                    alt={col.title}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-content2 text-default-400 z-0">
                    <FolderHeart className="w-12 h-12 text-primary/40" />
                  </div>
                )}

                {/* Premium Dual Gradient Overlay */}
                <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/55 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none z-10" />

                {/* Top Bar with Album Stats & Options Dropdown */}
                <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="bg-black/55 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-sm">
                      <Layers className="w-3 h-3 text-primary" />
                      <span>{totalFolders}</span>
                    </div>
                    <div className="bg-black/55 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                      {totalDishes} {t('collections.dishes')}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          className="rounded-full w-7 h-7 min-w-7 bg-black/40 text-white backdrop-blur-md active:bg-black/60"
                          aria-label={t('common.actions.more')}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label={t('common.actions.more')}
                        onAction={(key) => {
                          if (key === 'edit') handleOpenEdit(col);
                          if (key === 'delete') setDeleteColId(col.id);
                        }}
                      >
                        <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4" />}>
                          {t('collections.editCollection')}
                        </DropdownItem>
                        <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
                          {t('collections.deleteCollection')}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="relative z-20 flex flex-col justify-end h-full p-2.5 sm:p-3 text-white">
                  <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight drop-shadow-md mb-1">
                    {col.title}
                  </h3>

                  {col.description && (
                    <p className="text-[10px] sm:text-[11px] text-white/80 line-clamp-1 font-normal drop-shadow-sm mb-2">
                      {col.description}
                    </p>
                  )}

                  {/* Button: "Xem chi tiết" matching TipCard style */}
                  <Button 
                    className="w-full bg-white/95 text-black font-semibold rounded-full hover:bg-white shadow-sm active:scale-98 transition-all text-[11px] sm:text-xs h-7 min-h-7 px-1.5"
                    size="sm"
                    onPress={() => navigate(`/collections/${col.id}`)}
                  >
                    <span className="truncate">{t('common.actions.viewDetails')}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={deleteColId !== null}
        onOpenChange={(open) => !open && setDeleteColId(null)}
        title={t('collections.deleteCollection')}
        description={t('collections.deleteConfirmDesc')}
        confirmLabel={t('common.actions.delete')}
        confirmColor="danger"
        onConfirm={async () => {
          if (deleteColId) {
            await deleteCollection(deleteColId);
            setDeleteColId(null);
          }
        }}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collection={editingCollection}
        onSave={handleSaveCollection}
      />
    </div>
  );
}
