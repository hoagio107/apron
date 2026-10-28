import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  PageHeader, 
  ListToolbar, 
  toast 
} from '@/ui';
import type { ToolbarFilterItem } from '@/ui';
import { Plus, Search, Scale, Sparkles } from 'lucide-react';
import { useUnitStore } from '../../store/useUnitStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import type { Unit } from '@apron/core';
import { UNIT_CATEGORIES, detectUnitCategory } from '@apron/core';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { UnitCard } from './components/UnitCard';
import { UnitModal } from './components/UnitModal';

export function UnitsPage() {
  const { t } = useTranslation();
  const { units, addUnit, updateUnit, removeUnit, seedDefaultUnits } = useUnitStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'most-used'>('name-asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Calculate usage count in recipes for each unit
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of units) {
      const norm = u.name.toLowerCase().trim();
      const count = recipes.filter(r =>
        r.ingredients?.some(i => i.unit?.toLowerCase().trim() === norm)
      ).length;
      map.set(u.id, count);
    }
    return map;
  }, [units, recipes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of units) {
      const cat = detectUnitCategory(u.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [units]);

  // Usage stats
  const usedCount = useMemo(() => {
    let count = 0;
    for (const u of units) {
      if ((usageMap.get(u.id) || 0) > 0) count++;
    }
    return count;
  }, [units, usageMap]);

  const unusedCount = units.length - usedCount;

  // Filtered units
  const filteredUnits = useMemo(() => {
    let result = [...units];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const cat = detectUnitCategory(u.name);
        return (
          u.name.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q) ||
          (u.base_unit && u.base_unit.toLowerCase().includes(q))
        );
      });
    }

    // 2. Category
    if (selectedCategory) {
      result = result.filter(u => detectUnitCategory(u.name) === selectedCategory);
    }

    // 3. Usage
    if (usageFilter === 'used') {
      result = result.filter(u => (usageMap.get(u.id) || 0) > 0);
    } else if (usageFilter === 'unused') {
      result = result.filter(u => (usageMap.get(u.id) || 0) === 0);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, 'vi');
      }
      if (sortBy === 'most-used') {
        const countA = usageMap.get(a.id) || 0;
        const countB = usageMap.get(b.id) || 0;
        if (countB !== countA) return countB - countA;
        return a.name.localeCompare(b.name, 'vi');
      }
      return 0;
    });

    return result;
  }, [units, searchQuery, selectedCategory, usageFilter, usageMap, sortBy]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  const handleSaveUnit = (unitData: Omit<Unit, 'id'>, id?: string) => {
    if (id) {
      updateUnit(id, unitData);
      toast.success(t('units.updatedSuccess', { name: unitData.name }));
    } else {
      addUnit(unitData);
      toast.success(t('units.addedSuccess', { name: unitData.name }));
    }
  };

  const handleDeleteRequest = (unit: Unit) => {
    setDeletingUnit(unit);
    setIsDeleteOpen(true);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingUnit) return;
    removeUnit(deletingUnit.id);
    toast.success(t('units.deletedSuccess', { name: deletingUnit.name }));
    setDeletingUnit(null);
  };

  // Filter options for standard ListToolbar
  const filterItems = useMemo(() => {
    const list: ToolbarFilterItem[] = [
      { key: 'all', label: t('units.filterAll'), count: units.length },
      { key: 'used', label: t('units.filterUsed'), count: usedCount },
      { key: 'unused', label: t('units.filterUnused'), count: unusedCount },
    ];
    for (const cat of UNIT_CATEGORIES) {
      list.push({
        key: cat,
        label: cat,
        count: categoryCounts[cat] || 0,
      });
    }
    return list;
  }, [units.length, usedCount, unusedCount, categoryCounts]);

  const selectedFilterKey = usageFilter !== 'all' ? usageFilter : (selectedCategory || 'all');

  const handleFilterChange = (key: string) => {
    if (key === 'all') {
      setSelectedCategory(null);
      setUsageFilter('all');
    } else if (key === 'used' || key === 'unused') {
      setUsageFilter(key);
      setSelectedCategory(null);
    } else {
      setSelectedCategory(key);
      setUsageFilter('all');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setUsageFilter('all');
  };

  const sortItems = [
    { key: 'name-asc', label: t('units.sortNameAsc') },
    { key: 'name-desc', label: t('units.sortNameDesc') },
    { key: 'most-used', label: t('units.sortMostUsed') },
  ];

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* 1. Header & Toolbar chuẩn hệ thống */}
      <PageHeader
        title={t('units.title')}
        description={
          filteredUnits.length === units.length
            ? t('units.subtitle', { count: units.length })
            : t('units.showingSubtitle', { filtered: filteredUnits.length, total: units.length })
        }
        actions={
          <ListToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('units.searchPlaceholder')}
            filterItems={filterItems}
            selectedFilter={selectedFilterKey}
            onFilterChange={handleFilterChange}
            sortItems={sortItems}
            selectedSort={sortBy}
            onSortChange={(key) => setSortBy(key as any)}
            onAdd={handleOpenAdd}
            addLabel={t('units.addUnit')}
          />
        }
      />

      {/* 2. List Content */}
      <div className="flex-1 w-full">
        {units.length === 0 ? (
          <EmptyState
            icon={<Scale className="w-12 h-12 text-default-300" />}
            title={t('units.empty.title')}
            description={t('units.empty.description')}
            action={
              <div className="flex flex-col gap-2 w-full max-w-xs items-center">
                <Button
                  color="primary"
                  onPress={() => {
                    const count = seedDefaultUnits();
                    toast.success(t('units.seededSuccess', { count }));
                  }}
                  startContent={<Sparkles className="w-4 h-4" />}
                  className="h-11 rounded-xl px-5 font-semibold text-sm shadow-xs w-full"
                >
                  Nạp đơn vị chuẩn
                </Button>
                <Button
                  variant="flat"
                  onPress={handleOpenAdd}
                  startContent={<Plus className="w-4 h-4" />}
                  className="h-11 rounded-xl px-5 font-semibold text-sm w-full"
                >
                  Tự thêm đơn vị mới
                </Button>
              </div>
            }
          />
        ) : filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-default-100 flex items-center justify-center text-default-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-foreground">{t('units.emptySearchTitle')}</h3>
            <p className="text-xs text-default-500 max-w-xs mt-1 mb-4">
              {t('units.emptySearchDesc')}
            </p>
            <Button
              variant="flat"
              size="sm"
              onPress={resetFilters}
              className="rounded-xl h-9 text-xs"
            >
              Xoá bộ lọc tìm kiếm
            </Button>
          </div>
        ) : (
          <div className="bg-content1/60 dark:bg-default-50/15 rounded-2xl overflow-hidden divide-y divide-divider/25 border-none shadow-none max-w-3xl">
            {filteredUnits.map(unit => (
              <UnitCard
                key={unit.id}
                unit={unit}
                category={detectUnitCategory(unit.name)}
                usageCount={usageMap.get(unit.id) || 0}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Add / Edit Modal Drawer */}
      <UnitModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        unit={editingUnit}
        usageCount={editingUnit ? usageMap.get(editingUnit.id) || 0 : 0}
        onSave={handleSaveUnit}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* 5. Safe Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('units.deleteModalTitle')}
        description={
          deletingUnit && (usageMap.get(deletingUnit.id) || 0) > 0
            ? t('units.deleteInUseDesc', { name: deletingUnit.name, count: usageMap.get(deletingUnit.id) })
            : t('units.deleteModalDesc', { name: deletingUnit?.name || '' })
        }
        confirmLabel={t('common.delete')}
        confirmColor="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
