import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, AppCard, Input, EmptyState, toast } from '@/ui';
import { Plus, Trash2, Edit2, Check, X, Scale, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useUnitStore } from '../../store/useUnitStore';
import type { Unit } from '@apron/core';

export function UnitsPage() {
  const { t } = useTranslation();
  const { units, addUnit, updateUnit, removeUnit, seedDefaultUnits } = useUnitStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (newUnitName.trim()) {
      addUnit({ name: newUnitName.trim() });
      setNewUnitName('');
      setIsAdding(false);
    }
  };

  const startEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setEditName(unit.name);
  };

  const handleUpdate = () => {
    if (editingId && editName.trim()) {
      updateUnit(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 -mx-8 px-8 border-b border-divider/50 shadow-2xs">
        <PageHeader
          title={t('units.title')}
          className="pt-0 pb-0"
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="flat" 
                color="secondary" 
                startContent={<Sparkles className="w-4 h-4" />}
                onClick={() => {
                  const count = seedDefaultUnits();
                  if (count > 0) {
                    toast.success(t('units.seededSuccess', { count }));
                  } else {
                    toast.info(t('units.alreadySeeded'));
                  }
                }}
              >
                Đơn vị chuẩn
              </Button>
              <Button color="primary" onClick={() => setIsAdding(true)} startContent={<Plus className="w-4 h-4" />}>
                Thêm đơn vị
              </Button>
            </div>
          }
        />
      </div>
      
      <div className="flex-1 overflow-y-auto mt-4 pb-12">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {isAdding && (
            <AppCard className="p-4">
              <div className="flex flex-row items-center gap-2">
                <Input
                  autoFocus
                  placeholder={t('units.newUnitPlaceholder')}
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAdd)}
                  className="flex-1"
                />
                <Button color="success" isIconOnly variant="flat" onClick={handleAdd}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button color="danger" isIconOnly variant="flat" onClick={() => setIsAdding(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AppCard>
          )}

          {units.map((unit) => (
            <AppCard key={unit.id} className="p-4">
              <div className="flex flex-row items-center gap-4">
                {editingId === unit.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleUpdate)}
                      className="flex-1"
                    />
                    <Button color="success" isIconOnly variant="flat" onClick={handleUpdate}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button color="danger" isIconOnly variant="flat" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-base font-medium text-foreground">{unit.name}</span>
                    <div className="flex items-center gap-0">
                      <Button isIconOnly variant="light" onClick={() => startEdit(unit)}>
                        <Edit2 className="w-4 h-4 text-default-500" />
                      </Button>
                      <Button isIconOnly variant="light" color="danger" onClick={() => removeUnit(unit.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </AppCard>
          ))}
          
          {units.length === 0 && !isAdding && (
            <EmptyState
              icon={<Scale className="w-10 h-10 text-default-400" />}
              title={t('units.empty.title')}
              description={t('units.empty.description')}
              actionLabel={t('units.seedButton')}
              onAction={() => {
                const count = seedDefaultUnits();
                toast.success(t('units.seededSuccess', { count }));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
