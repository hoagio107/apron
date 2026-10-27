import { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button
} from '@/ui';
import { X, Trash2, Plus, Sunrise, Sun, Moon, Coffee, GripVertical } from 'lucide-react';
import type { MealSlotConfig } from '@apron/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MealSlotSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSlots: MealSlotConfig[];
  onAddSlot: (name: string) => void;
  onRemoveSlot: (id: string) => void;
  onReorderSlots: (slots: MealSlotConfig[]) => void;
}

function getSlotIcon(slotId: string) {
  switch (slotId.toLowerCase()) {
    case 'breakfast':
    case 'sang':
      return <Sunrise className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'lunch':
    case 'trua':
      return <Sun className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'dinner':
    case 'toi':
      return <Moon className="w-4 h-4 text-indigo-500 shrink-0" />;
    default:
      return <Coffee className="w-4 h-4 text-rose-500 shrink-0" />;
  }
}

interface SortableSlotItemProps {
  slot: MealSlotConfig;
  canRemove: boolean;
  onRemove: (id: string) => void;
}

function SortableSlotItem({ slot, canRemove, onRemove }: SortableSlotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (itemRef.current) {
      itemRef.current.style.transform = CSS.Translate.toString(transform) || '';
      itemRef.current.style.transition = transition || '';
    }
  }, [transform, transition]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        itemRef.current = node;
      }}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-default-100 dark:bg-default-50/20 border border-transparent transition-colors ${
        isDragging ? 'z-50 relative opacity-60 shadow-md border-primary/50 bg-content2' : 'relative opacity-100'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 text-default-400 hover:text-foreground active:text-primary cursor-grab active:cursor-grabbing touch-none select-none rounded-lg"
          aria-label="Kéo để sắp xếp vị trí"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {getSlotIcon(slot.id)}
        <span className="text-sm font-semibold text-foreground truncate">
          {slot.name}
        </span>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(slot.id)}
          className="p-1.5 rounded-lg text-default-400 hover:text-danger hover:bg-danger/10 dark:hover:bg-danger/20 transition-colors shrink-0"
          title="Xóa bữa này"
          aria-label={`Xóa ${slot.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function MealSlotSettingsDrawer({
  isOpen,
  onClose,
  defaultSlots,
  onAddSlot,
  onRemoveSlot,
  onReorderSlots
}: MealSlotSettingsDrawerProps) {
  const [newSlotNameInput, setNewSlotNameInput] = useState('');

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 3,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = defaultSlots.findIndex((s) => s.id === active.id);
      const newIndex = defaultSlots.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSlots = arrayMove(defaultSlots, oldIndex, newIndex);
        onReorderSlots(newSlots);
      }
    }
  };

  const handleAdd = () => {
    if (newSlotNameInput.trim()) {
      onAddSlot(newSlotNameInput.trim());
      setNewSlotNameInput('');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="bottom"
      size="md"
      radius="lg"
      hideCloseButton
      classNames={{
        base: 'max-h-[calc(100dvh-var(--sat,0px)-20px)] rounded-t-3xl bg-content1 text-foreground flex flex-col mt-auto overflow-hidden shadow-2xl',
        backdrop: 'bg-black/60 backdrop-blur-sm',
        body: 'p-4 flex flex-col gap-4',
      }}
    >
      <DrawerContent className="rounded-t-3xl overflow-hidden">
        <DrawerHeader className="flex flex-col gap-1 border-b border-divider/40 px-4 pt-3 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-default-300 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Cài đặt cấu trúc bữa ăn
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-default-400 hover:text-foreground"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <p className="text-xs text-default-500">
            Kéo thả biểu tượng để đổi thứ tự các bữa ăn hoặc thêm bữa mới:
          </p>

          {/* List slots with DND */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={defaultSlots.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {defaultSlots.map((slot) => (
                  <SortableSlotItem
                    key={slot.id}
                    slot={slot}
                    canRemove={defaultSlots.length > 1}
                    onRemove={onRemoveSlot}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add custom slot */}
          <div className="flex items-center gap-2 pt-2 border-t border-divider/40">
            <input
              type="text"
              placeholder="Tên bữa mới (vd: Bữa khuya, Ăn xế)..."
              value={newSlotNameInput}
              onChange={(e) => setNewSlotNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              className="flex-1 px-3 py-2 bg-default-100 dark:bg-default-50/20 text-foreground placeholder:text-default-400 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/40 font-medium"
            />
            <Button
              size="sm"
              color="primary"
              className="rounded-xl font-bold h-9 px-3 shrink-0"
              startContent={<Plus className="w-4 h-4" />}
              disabled={!newSlotNameInput.trim()}
              onClick={handleAdd}
            >
              Thêm
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
