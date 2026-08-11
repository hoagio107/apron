import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from '@apron/ui';
import { CalendarDays } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface MealPlannerSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, slotId: string) => void;
  recipeCount?: number;
}

export function MealPlannerSelectModal({ isOpen, onOpenChange, onConfirm, recipeCount = 1 }: MealPlannerSelectModalProps) {
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
              Thêm vào thực đơn
              {recipeCount > 1 && (
                <span className="text-sm font-normal text-default-500">
                  Đang thêm {recipeCount} công thức
                </span>
              )}
            </ModalHeader>
            <ModalBody>
              <Input
                type="date"
                label="Ngày"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                isRequired
                startContent={<CalendarDays className="w-4 h-4 text-default-400" />}
              />
              <Select
                label="Bữa ăn"
                placeholder="Chọn bữa ăn"
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
                Hủy
              </Button>
              <Button color="primary" onPress={handleConfirm} isDisabled={!date || !slotId}>
                Xác nhận
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
