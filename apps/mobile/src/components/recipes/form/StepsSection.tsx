import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Input } from '@/ui';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import type { FormValues } from './schema';
import { SortableList, SortableItem } from './SortableList';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageManager } from '../../../lib/image-manager';
import { RichTextEditor } from './RichTextEditor';

export function StepsSection() {
  const { t } = useTranslation();
  const { control, setValue, getValues } = useFormContext<FormValues>();
  
  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "stepSections"
  });

  const [activeStep, setActiveStep] = useState<{sectionIndex: number, stepIndex: number} | null>(null);

  const handleSelectMedia = (images: string[], videos: string[]) => {
    if (!activeStep) return;
    
    const currentImages = getValues(`stepSections.${activeStep.sectionIndex}.steps.${activeStep.stepIndex}.images`) || [];
    setValue(`stepSections.${activeStep.sectionIndex}.steps.${activeStep.stepIndex}.images`, [...currentImages, ...images, ...videos]);
    
    setActiveStep(null);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {sections.length === 0 && (
        <div className="text-center text-default-400 py-8 text-sm">
          {t('recipes.form.noSteps')}
        </div>
      )}
      
      {sections.map((section, sectionIndex) => (
        <div key={section.id} className="flex flex-col w-full">
          <StepGroup 
            sectionIndex={sectionIndex} 
            onRemove={() => removeSection(sectionIndex)} 
            onOpenImageModal={(stepIndex) => setActiveStep({ sectionIndex, stepIndex })}
          />
        </div>
      ))}

      <div className="pt-2">
        <Button 
          color="primary"
          variant="flat"
          className="w-full font-semibold h-11 rounded-xl" 
          onPress={() => appendSection({ name: 'Giai đoạn mới', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] })}
          startContent={<Plus className="w-4 h-4" />}
        >
          Thêm giai đoạn
        </Button>
      </div>

      <ImagePickerModal 
        isOpen={!!activeStep}
        onOpenChange={(open) => {
          if (!open) setActiveStep(null);
        }}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}

function StepGroup({ sectionIndex, onRemove, onOpenImageModal }: { sectionIndex: number, onRemove: () => void, onOpenImageModal: (stepIndex: number) => void }) {
  const { t } = useTranslation();
  const { control } = useFormContext<FormValues>();
  
  const { fields: steps, append, remove, move } = useFieldArray({
    control,
    name: `stepSections.${sectionIndex}.steps`
  });

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Controller
          name={`stepSections.${sectionIndex}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value || ''}
              variant="underlined"
              placeholder={t('recipes.form.stageNamePlaceholder')}
              className="max-w-xs"
              classNames={{
                inputWrapper: "shadow-none border-b-0 data-[hover=true]:border-b-0 after:bg-primary pb-0 min-h-8 h-8",
                input: "!text-primary text-lg font-semibold",
              }}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Button isIconOnly color="danger" variant="light" size="md" onPress={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <SortableList items={steps} onDragEnd={(oldIndex, newIndex) => move(oldIndex, newIndex)}>
          {steps.map((step, index) => (
            <SortableItem key={step.id} id={step.id}>
              {({ attributes, listeners, isDragging }) => (
                <StepRow
                  sectionIndex={sectionIndex}
                  index={index}
                  isDragging={isDragging}
                  attributes={attributes}
                  listeners={listeners}
                  onRemove={() => remove(index)}
                  onOpenImageModal={() => onOpenImageModal(index)}
                />
              )}
            </SortableItem>
          ))}
        </SortableList>
        
        <Button 
          variant="light" 
          className="w-fit mt-2" 
          onPress={() => append({ id: crypto.randomUUID(), instruction: '', images: [] })}
          startContent={<Plus className="w-3 h-3" />}
        >
          Thêm bước
        </Button>
      </div>
    </div>
  );
}

function StepRow({
  sectionIndex,
  index,
  isDragging,
  attributes,
  listeners,
  onRemove,
  onOpenImageModal,
}: {
  sectionIndex: number;
  index: number;
  isDragging: boolean;
  attributes: any;
  listeners: any;
  onRemove: () => void;
  onOpenImageModal: () => void;
}) {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext<FormValues>();
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex items-start gap-2 group/step w-full transition-shadow ${isDragging ? 'bg-default-100/80 rounded-xl p-1 shadow-lg ring-1 ring-primary/30' : ''}`}>
      <div 
        className="touch-none select-none cursor-grab active:cursor-grabbing p-2 -ml-2 text-default-300 hover:text-default-600 active:text-primary transition-colors shrink-0 mt-1"
        title={t('recipes.form.dragToReorder')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5 pointer-events-none" />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <Controller
          name={`stepSections.${sectionIndex}.steps.${index}.instruction`}
          control={control}
          render={({ field, fieldState }) => (
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={t('recipes.form.stepPlaceholder', { number: index + 1 })}
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        
        <Controller
          name={`stepSections.${sectionIndex}.steps.${index}.images`}
          control={control}
          render={({ field }) => {
            const images = field.value || [];
            const hasImages = images.length > 0;

            // Ẩn hoàn toàn khu vực ảnh nếu chưa có ảnh nào và người dùng không focus vào ô input
            if (!hasImages && !isFocused) return <></>;

            return (
              <div className="flex gap-2 flex-wrap mt-1 animate-in fade-in duration-200">
                {images.map((url: string, imgIdx: number) => (
                  <div key={imgIdx} className="relative group w-14 h-14 rounded-lg overflow-hidden bg-default-100 border border-divider flex-shrink-0">
                    <img src={ImageManager.getAssetUrl(url)} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => {
                        const newImages = [...images];
                        const removed = newImages.splice(imgIdx, 1)[0];
                        field.onChange(newImages);
                        if (removed) {
                          const deleted = getValues('deleted_images') || [];
                          setValue('deleted_images', [...deleted, removed]);
                        }
                      }}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Ô thêm ảnh: Chỉ hiện khi đang focus vào ô input */}
                {isFocused && (
                  <button 
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onOpenImageModal}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-default-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-default-400 hover:text-primary transition-colors flex-shrink-0 animate-in zoom-in-95 duration-150"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          }}
        />
      </div>

      <button 
        type="button"
        className="flex items-center justify-center bg-transparent hover:bg-danger/10 text-default-400 hover:text-danger w-8 h-8 min-w-8 rounded-lg cursor-pointer transition-colors mt-1"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
