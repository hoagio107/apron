import { useState } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Card, CardBody, Input, Textarea } from '@apron/ui';
import { Plus, Trash2, GripVertical, ListOrdered, X } from 'lucide-react';
import type { FormValues } from './schema';
import { SectionHeader } from '../../shared/SectionHeader';
import { SortableList, SortableItem } from './SortableList';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageManager } from '../../../lib/image-manager';

export function StepsSection() {
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
    <Card className="w-full" shadow="none">
      <SectionHeader
        title="Các bước thực hiện"
        icon={ListOrdered}
      />
      <CardBody className="gap-0">
        {sections.length === 0 && (
          <div className="text-center text-gray-500 py-4">Chưa có bước thực hiện nào. Hãy thêm giai đoạn đầu tiên.</div>
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

        <div className="pt-4 border-t border-divider">
          <Button 
            color="primary"
            variant="solid"
            className="w-full" 
            onPress={() => appendSection({ name: 'Giai đoạn mới', steps: [{ id: crypto.randomUUID(), instruction: '', images: [] }] })}
            startContent={<Plus className="w-4 h-4" />}
          >
            Thêm giai đoạn
          </Button>
        </div>
      </CardBody>
      <ImagePickerModal 
        isOpen={!!activeStep}
        onOpenChange={(open) => {
          if (!open) setActiveStep(null);
        }}
        onSelectMedia={handleSelectMedia}
      />
    </Card>
  );
}

function StepGroup({ sectionIndex, onRemove, onOpenImageModal }: { sectionIndex: number, onRemove: () => void, onOpenImageModal: (stepIndex: number) => void }) {
  const { control, getValues, setValue } = useFormContext<FormValues>();
  
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
              placeholder="Tên giai đoạn (VD: Sơ chế, Chế biến...)"
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
        <Button isIconOnly color="danger" variant="light" size="sm" onPress={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <SortableList items={steps} onDragEnd={(oldIndex, newIndex) => move(oldIndex, newIndex)}>
          {steps.map((step, index) => (
            <SortableItem key={step.id} id={step.id}>
              {({ attributes, listeners }) => (
                <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-default-50 transition-colors group/step">
                  <div 
                    className="cursor-move pt-2 text-default-300 hover:text-default-500 transition-colors"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
            
            <div className="flex-1 flex flex-col gap-3">
              <Controller
                name={`stepSections.${sectionIndex}.steps.${index}.instruction`}
                control={control}
                render={({ field, fieldState }) => (
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder={`Bước ${index + 1}...`}
                    variant="flat"
                    minRows={2}
                    classNames={{
                      inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                    }}
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
              
              <Controller
                name={`stepSections.${sectionIndex}.steps.${index}.images`}
                control={control}
                render={({ field }) => {
                  const hasImages = field.value && field.value.length > 0;
                  return (
                  <div className={`gap-2 flex-wrap mt-1 ${hasImages ? 'flex' : 'hidden group-focus-within/step:flex'}`}>
                    {field.value?.map((url: string, imgIdx: number) => (
                      <div key={imgIdx} className="relative group w-16 h-16 rounded-md overflow-hidden bg-default-100 border border-divider flex-shrink-0">
                        <img src={ImageManager.getAssetUrl(url)} alt="" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => {
                            const newImages = [...field.value];
                            const removed = newImages.splice(imgIdx, 1)[0];
                            field.onChange(newImages);
                            if (removed) {
                              const deleted = getValues('deleted_images') || [];
                              setValue('deleted_images', [...deleted, removed]);
                            }
                          }}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => onOpenImageModal(index)}
                      className="w-16 h-16 rounded-md border-2 border-dashed border-default-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-default-400 hover:text-primary transition-colors flex-shrink-0"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  );
                }}
              />
            </div>

                  <Button isIconOnly color="default" variant="light" size="sm" className="opacity-0 group-hover/step:opacity-100 transition-opacity" onPress={() => remove(index)}>
                    <X className="w-4 h-4 text-default-400" />
                  </Button>
                </div>
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
