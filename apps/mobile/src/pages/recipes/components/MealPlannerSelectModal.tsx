import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@/ui';
import { CalendarDays } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface MealPlannerSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, slotId: string) => void;
  recipeCount?: number;
}

export function MealPlannerSelectModal({ isOpen, onOpenChange, onConfirm, recipeCount = 1 }: MealPlannerSelectModalProps) {
  const { t } = useTranslation();
  const { defaultSlots } = useSettingsStore();
  const [date, setDate] = useState<string>('');
  const [slotId, setSlotId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      if (defaultSlots.length > 0) {
        setSlotId(defaultSlots[0].id);
      }
    }
  }, [isOpen, defaultSlots]);

  const handleConfirm = () => {
    if (date && slotId) {
      onConfirm(date, slotId);
      onOpenChange(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t('recipes.actions.addToMealPlan')}
              {recipeCount > 1 && (
                <span className="text-sm font-normal text-default-500">
                  {t('recipes.actions.addingRecipeCount', { count: recipeCount })}
                </span>
              )}
            </ModalHeader>
            <ModalBody>
              <Input
                type="date"
                label={t('planner.date')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                isRequired
                startContent={<CalendarDays className="w-4 h-4 text-default-400" />}
              />
              <Select
                label={t('planner.mealSlot')}
                placeholder={t('planner.selectMealSlot')}
                selectedKeys={slotId ? [slotId] : []}
                onChange={(e) => setSlotId(e.target.value)}
                isRequired
              >
                {defaultSlots.map((slot) => (
                  <SelectItem key={slot.id}>
                    {slot.name}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t('common.actions.cancel')}
              </Button>
              <Button color="primary" onPress={handleConfirm} isDisabled={!date || !slotId}>
                {t('common.actions.confirm')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
