import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge } from '@/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { BulkActionBar } from '../../components/shared/BulkActionBar';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { Plus, Trash2, Search, Filter, CheckCircle2, LayoutGrid, RectangleHorizontal } from 'lucide-react';
import { useTipStore } from '../../store/useTipStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { TipCard } from '../../components/tips/TipCard';
import { TipFormModal } from './components/TipFormModal';
import { TipDetailPanel } from './components/TipDetailPanel';
import { TIP_CATEGORIES } from '@apron/core';

export function TipListPage() {
  const navigate = useNavigate();
  const { tips, fetchTips, deleteBulkTips, deleteTip } = useTipStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Chế độ hiển thị: 'grid' (lưới 2 cột) hoặc 'single' (1 cột tỷ lệ 4:3)
  const [viewMode, setViewMode] = useState<'grid' | 'single'>(() => {
    return (localStorage.getItem('tip_view_mode') as 'grid' | 'single') || 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'single') => {
    setViewMode(mode);
    localStorage.setItem('tip_view_mode', mode);
  };
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTipId, setEditingTipId] = useState<string | undefined>(undefined);
  
  const [viewingTipId, setViewingTipId] = useState<string | undefined>(undefined);
  const viewingTip = useMemo(() => tips.find(t => t.id === viewingTipId) || null, [tips, viewingTipId]);

  // Confirm modals
  const [deleteTipId, setDeleteTipId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  useEffect(() => {
    if (isSelectMode) {
      document.body.classList.add('multi-select-open');
    } else {
      document.body.classList.remove('multi-select-open');
    }
    return () => document.body.classList.remove('multi-select-open');
  }, [isSelectMode]);

  const filteredTips = useMemo(() => {
    let result = [...tips];
    
    if (selectedCategoryId) {
      result = result.filter(t => t.category_id === selectedCategoryId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.content.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [tips, searchQuery, selectedCategoryId]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTips.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTips.map(t => t.id!)));
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    await deleteBulkTips(Array.from(selectedIds));
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = (id: string) => {
    setDeleteTipId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTipId) {
      await deleteTip(deleteTipId);
      setDeleteTipId(null);
    }
  };



  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* Header & Toolbar */}
      <PageHeader
        title="Mẹo nhà bếp"
        description={`${tips.length} mẹo đã lưu`}
        actions={
          <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
            <Input
              variant="flat"
              classNames={{
                base: "w-full md:max-w-[300px]",
                input: "text-small",
              }}
              placeholder="Tìm kiếm mẹo..."
              size="md"
              startContent={<Search className="w-4 h-4" />}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">
              <Button 
                isIconOnly
                color="primary"
                onPress={() => setIsFormModalOpen(true)}
                aria-label="Thêm mẹo mới"
              >
                <Plus className="w-5 h-5" />
              </Button>

              <Dropdown>
                <DropdownTrigger>
                  <Badge content={selectedCategoryId ? 1 : 0} isInvisible={!selectedCategoryId} color="danger" shape="circle">
                    <Button 
                      isIconOnly
                      variant="flat" 
                      color={selectedCategoryId ? "primary" : "default"}
                    >
                      <Filter className="w-5 h-5" />
                    </Button>
                  </Badge>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Filter Categories" 
                  selectionMode="single"
                  selectedKeys={selectedCategoryId ? new Set([selectedCategoryId]) : new Set(['all'])}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string;
                    setSelectedCategoryId(key === 'all' ? null : key);
                  }}
                  items={[
                    { id: 'all', name: 'Tất cả danh mục' },
                    ...TIP_CATEGORIES
                  ]}
                >
                  {(item) => (
                    <DropdownItem key={item.id}>{item.name}</DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>

              <Button 
                isIconOnly
                variant="flat" 
                color={isSelectMode ? "primary" : "default"}
                onPress={toggleSelectMode}
                aria-label="Chọn nhiều"
              >
                <CheckCircle2 className="w-5 h-5" />
              </Button>

              <div className="w-px h-6 bg-default-200 dark:bg-default-100 mx-0.5 shrink-0" />

              {/* View Mode Toggle: Lưới 2 cột vs 1 cột tỷ lệ 4:3 */}
              <Button
                isIconOnly
                variant="flat"
                aria-label={viewMode === 'grid' ? 'Chuyển sang dạng 1 cột' : 'Chuyển sang dạng lưới 2 cột'}
                onPress={() => handleViewModeChange(viewMode === 'grid' ? 'single' : 'grid')}
              >
                {viewMode === 'grid' ? (
                  <RectangleHorizontal className="w-5 h-5 text-default-600" />
                ) : (
                  <LayoutGrid className="w-5 h-5 text-default-600" />
                )}
              </Button>
            </div>
          </div>
        }
      />

      {/* Floating Selection Action Bar */}
      {isSelectMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredTips.length}
          onSelectAll={selectAll}
          onCancel={toggleSelectMode}
          actions={[
            { key: 'delete', label: 'Xóa', icon: <Trash2 className="w-4 h-4" />, color: 'danger', onPress: handleBulkDelete },
          ]}
        />
      )}

      {/* Grid */}
      {filteredTips.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-default-300" />}
          title="Không tìm thấy mẹo nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem kết quả khác."
        />
      ) : (
        <div className={
          viewMode === 'single'
            ? "grid grid-cols-1 gap-4 max-w-xl mx-auto w-full"
            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
        }>
          {filteredTips.map(t => (
            <TipCard 
              key={t.id!} 
              tip={t} 
              viewMode={viewMode}
              selectable={isSelectMode}
              isSelected={selectedIds.has(t.id!)}
              onSelect={() => toggleSelect(t.id!)}
              onClick={() => navigate('/tips/' + t.id)}
              onEdit={() => {
                setEditingTipId(t.id!);
                setIsFormModalOpen(true);
              }}
              onDelete={() => handleDelete(t.id!)}
            />
          ))}
        </div>
      )}

      <TipFormModal 
        isOpen={isFormModalOpen}
        onOpenChange={(open) => {
          setIsFormModalOpen(open);
          if (!open) setEditingTipId(undefined);
        }}
        tipId={editingTipId}
        onSuccess={() => {
          fetchTips();
          setEditingTipId(undefined);
        }}
      />
      
      <TipDetailPanel
        tip={viewingTip}
        isOpen={!!viewingTipId}
        onOpenChange={(open) => {
          if (!open) setViewingTipId(undefined);
        }}
        onEdit={(id) => {
          setEditingTipId(id);
          setIsFormModalOpen(true);
        }}
        onDelete={(id) => {
          handleDelete(id);
          setViewingTipId(undefined);
        }}
      />

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteTipId}
        onOpenChange={(open) => { if (!open) setDeleteTipId(null); }}
        title="Xoá mẹo"
        description="Bạn có chắc muốn xóa mẹo này không? Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        confirmColor="danger"
        onConfirm={handleDeleteConfirm}
      />
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title="Xoá nhiều mẹo"
        description={`Bạn có chắc muốn xóa ${selectedIds.size} mẹo đã chọn? Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá tất cả"
        confirmColor="danger"
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
