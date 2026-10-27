import { useState, useMemo, useEffect } from 'react';

import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Plus, Trash2, Search, Filter, CheckCircle2, Sparkles } from 'lucide-react';
import { useTipStore } from '../../store/useTipStore';
import { EmptyState } from '../../components/shared/EmptyState';
import { TipCard } from '../../components/tips/TipCard';
import { TipFormModal } from './components/TipFormModal';
import { TipDetailPanel } from './components/TipDetailPanel';
import { TipAiModal } from './components/TipAiModal';
import { TIP_CATEGORIES } from '@apron/core';
import type { ParseTipResult } from '../../lib/gemini';

export function TipListPage() {
  const { tips, fetchTips, deleteBulkTips, deleteTip } = useTipStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [initialAiData, setInitialAiData] = useState<ParseTipResult | null>(null);
  const [editingTipId, setEditingTipId] = useState<string | undefined>(undefined);
  
  const [viewingTipId, setViewingTipId] = useState<string | undefined>(undefined);
  const viewingTip = useMemo(() => tips.find(t => t.id === viewingTipId) || null, [tips, viewingTipId]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.size} mẹo này không?`)) {
      await deleteBulkTips(Array.from(selectedIds));
      setIsSelectMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mẹo này không?')) {
      await deleteTip(id);
    }
  };

  const activeCategory = TIP_CATEGORIES.find(c => c.id === selectedCategoryId);

  return (
    <div className="flex flex-col h-full gap-6 w-full pt-6 pb-8">
      {/* Header & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button 
              isIconOnly
              color="primary" 
              className="w-14 h-14 rounded-2xl shrink-0"
              onPress={() => {
                setInitialAiData(null);
                setEditingTipId(undefined);
                setIsFormModalOpen(true);
              }}
              title="Thêm mẹo vặt mới"
            >
              <Plus className="w-6 h-6" />
            </Button>
            <Button 
              isIconOnly
              variant="flat"
              color="secondary" 
              className="w-14 h-14 rounded-2xl shrink-0 bg-secondary/15 text-secondary hover:bg-secondary/25 shadow-none"
              onPress={() => setIsAiModalOpen(true)}
              title="AI Trợ lý tạo mẹo (Gemini)"
            >
              <Sparkles className="w-6 h-6" />
            </Button>
          </div>
          <div>
            <h1 className="app-page-title leading-tight">Mẹo nhà bếp</h1>
            <p className="app-page-subtitle">{tips.length} mẹo đã lưu</p>
          </div>
        </div>

        <div className="flex-1 w-full xl:w-auto flex justify-end gap-2">
          <Input
            variant="flat"
            classNames={{
              base: "max-w-[300px]",
              input: "text-small",
            }}
            placeholder="Tìm kiếm mẹo..."
            startContent={<Search className="w-4 h-4" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                color={selectedCategoryId ? "primary" : "default"}
                startContent={<Filter className="w-4 h-4" />}
              >
                {activeCategory ? activeCategory.name : 'Tất cả danh mục'}
              </Button>
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
            variant="flat" 
            color={isSelectMode ? "primary" : "default"}
            startContent={<CheckCircle2 className="w-4 h-4" />}
            onPress={toggleSelectMode}
          >
            Chọn
          </Button>
        </div>
      </div>

      {/* Floating Selection Action Bar */}
      {isSelectMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-content1 shadow-2xl border border-divider rounded-full animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-3">
            <Button variant="flat" onPress={selectAll}>
              {selectedIds.size === filteredTips.length && filteredTips.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <span className="font-medium text-primary min-w-[100px] text-center">
              Đã chọn {selectedIds.size}
            </span>
          </div>
          
          <div className="w-px h-8 bg-divider mx-1 shrink-0" />
          
          <div className="flex items-center gap-2">
            <Button color="danger" variant="flat" startContent={<Trash2 className="w-4 h-4" />} onPress={handleBulkDelete}>
              Xóa
            </Button>
            
            <div className="w-px h-8 bg-divider mx-1 shrink-0" />
            
            <Button variant="light" onPress={toggleSelectMode}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filteredTips.length === 0 ? (
        <EmptyState
          icon={<Search className="w-10 h-10 text-default-300" />}
          title="Không tìm thấy mẹo nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt bộ lọc để xem kết quả khác."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTips.map(t => (
            <TipCard 
              key={t.id!} 
              tip={t} 
              selectable={isSelectMode}
              isSelected={selectedIds.has(t.id!)}
              onSelect={() => toggleSelect(t.id!)}
              onClick={() => setViewingTipId(t.id!)}
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
          if (!open) {
            setEditingTipId(undefined);
            setInitialAiData(null);
          }
        }}
        tipId={editingTipId}
        initialData={initialAiData}
        onSuccess={() => {
          fetchTips();
          setEditingTipId(undefined);
          setInitialAiData(null);
        }}
      />

      <TipAiModal 
        isOpen={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onApply={(data) => {
          setInitialAiData(data);
          setEditingTipId(undefined);
          setIsFormModalOpen(true);
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
          handleDelete(id).then(() => setViewingTipId(undefined));
        }}
      />
    </div>
  );
}
