import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem
} from '@/ui';
import { Trash2, Tag, Layers, ArrowRightLeft, UtensilsCrossed } from 'lucide-react';
import type { Unit } from '@apron/core';
import { FormField } from '../../../components/shared/form/FormField';
import { getUnitTheme } from './UnitCard';
import { UNIT_CATEGORIES, detectUnitCategory } from '@apron/core';

interface UnitModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit | null;
  usageCount?: number;
  onSave: (unitData: Omit<Unit, 'id'>, id?: string) => Promise<void> | void;
  onDeleteRequest?: (unit: Unit) => void;
}

export function UnitModal({
  isOpen,
  onOpenChange,
  unit,
  usageCount = 0,
  onSave,
  onDeleteRequest
}: UnitModalProps) {
  const isEditing = Boolean(unit);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Khối lượng');
  const [conversionRate, setConversionRate] = useState<string>('');
  const [baseUnit, setBaseUnit] = useState('');
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (unit) {
        setName(unit.name);
        setCategory(detectUnitCategory(unit.name));
        setConversionRate(unit.conversion_rate ? String(unit.conversion_rate) : '');
        setBaseUnit(unit.base_unit || '');
        setHasManuallySelectedCategory(true);
      } else {
        setName('');
        setCategory('Khối lượng');
        setConversionRate('');
        setBaseUnit('');
        setHasManuallySelectedCategory(false);
      }
    }
  }, [isOpen, unit]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasManuallySelectedCategory && !isEditing) {
      const autoCat = detectUnitCategory(val);
      setCategory(autoCat);
    }
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setIsSubmitting(true);
      const rateNum = conversionRate ? parseFloat(conversionRate) : undefined;
      await onSave(
        {
          name: trimmed,
          conversion_rate: rateNum && !isNaN(rateNum) ? rateNum : undefined,
          base_unit: baseUnit.trim() || undefined
        },
        unit?.id
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = getUnitTheme(category);
  const Icon = theme.icon;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom"
      classNames={{
        wrapper: 'items-end sm:items-center',
        base: 'm-0 sm:m-4 max-h-[92vh] rounded-t-3xl sm:rounded-2xl bg-background border-t sm:border border-divider flex flex-col overflow-hidden max-w-lg w-full shadow-2xl',
        body: 'p-4 overflow-y-auto',
        header: 'p-4 pb-2 border-b border-divider flex justify-between items-center',
        footer: 'p-4 pt-3 border-t border-divider bg-background/95 backdrop-blur-md'
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-base sm:text-lg">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.bg}`}>
                  <Icon className={`w-4 h-4 ${theme.text}`} />
                </div>
                <span>{isEditing ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}</span>
              </div>

              {isEditing && usageCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <UtensilsCrossed className="w-3 h-3" />
                  {usageCount} món đang dùng
                </span>
              )}
            </ModalHeader>

            <ModalBody className="flex flex-col gap-4">
              {/* Tên đơn vị */}
              <FormField label="Tên đơn vị" icon={Tag}>
                <Input
                  placeholder="VD: gam, kg, muỗng cà phê, quả..."
                  value={name}
                  onValueChange={handleNameChange}
                  isRequired
                  size="lg"
                  variant="flat"
                  classNames={{
                    inputWrapper: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                    input: 'font-semibold text-sm sm:text-base'
                  }}
                />
              </FormField>

              {/* Nhóm đơn vị */}
              <FormField label="Nhóm đơn vị" icon={Layers}>
                <Select
                  aria-label="Chọn nhóm đơn vị"
                  selectedKeys={[category]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    if (val) {
                      setCategory(val);
                      setHasManuallySelectedCategory(true);
                    }
                  }}
                  size="lg"
                  variant="flat"
                  classNames={{
                    trigger: 'bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl',
                    value: 'font-semibold text-sm'
                  }}
                >
                  {UNIT_CATEGORIES.map((cat) => {
                    const catTheme = getUnitTheme(cat);
                    const CatIcon = catTheme.icon;
                    return (
                      <SelectItem
                        key={cat}
                        textValue={cat}
                        startContent={
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${catTheme.bg}`}>
                            <CatIcon className={`w-3.5 h-3.5 ${catTheme.text}`} />
                          </div>
                        }
                      >
                        {cat}
                      </SelectItem>
                    );
                  })}
                </Select>
              </FormField>

              {/* Tỷ lệ quy đổi (Tùy chọn) */}
              <div className="p-3 rounded-2xl bg-default-50 dark:bg-default-50/10 border border-divider/60 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-default-700 dark:text-default-300">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  <span>Quy đổi tỷ lệ (Tùy chọn)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Tỷ lệ"
                    placeholder="VD: 1000"
                    type="number"
                    value={conversionRate}
                    onValueChange={setConversionRate}
                    size="sm"
                    variant="flat"
                    classNames={{
                      inputWrapper: 'bg-default-100 border-none shadow-none rounded-xl'
                    }}
                  />
                  <Input
                    label="Đơn vị cơ sở"
                    placeholder="VD: g hoặc ml"
                    value={baseUnit}
                    onValueChange={setBaseUnit}
                    size="sm"
                    variant="flat"
                    classNames={{
                      inputWrapper: 'bg-default-100 border-none shadow-none rounded-xl'
                    }}
                  />
                </div>

                {conversionRate && baseUnit && name && (
                  <p className="text-[11px] text-default-500 bg-background/80 p-2 rounded-xl border border-divider/40">
                    💡 Quy đổi: <strong>1 {name}</strong> = <strong>{conversionRate} {baseUnit}</strong>
                  </p>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="flex items-center justify-between gap-2">
              {isEditing && onDeleteRequest && unit ? (
                <Button
                  isIconOnly
                  color="danger"
                  variant="flat"
                  className="h-12 w-12 rounded-xl shrink-0"
                  onPress={() => onDeleteRequest(unit)}
                  aria-label="Xoá đơn vị"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 flex-1 justify-end">
                <Button
                  variant="flat"
                  onPress={() => onOpenChange(false)}
                  isDisabled={isSubmitting}
                  className="h-12 rounded-xl px-4 text-sm font-medium"
                >
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!name.trim()}
                  className="h-12 rounded-xl px-6 text-sm font-semibold shadow-xs"
                >
                  {isEditing ? 'Lưu thay đổi' : 'Thêm đơn vị'}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
