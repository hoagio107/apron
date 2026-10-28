import { useTranslation } from 'react-i18next';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Input, Autocomplete, AutocompleteItem } from '@/ui';
import { Plus, Trash2, Users, GripVertical, X } from 'lucide-react';
import type { FormValues } from './schema';
import { useUnits } from '../../../hooks/useUnits';
import { SortableList, SortableItem } from './SortableList';

export function IngredientsSection() {
  const { t } = useTranslation();
  const { control } = useFormContext<FormValues>();
  
  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "ingredientSections"
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top action row: Servings */}
      <div className="flex items-center justify-between pb-3 border-b border-divider/40">
        <Controller
          name="servings"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-default-600 font-medium">
                <Users className="w-4 h-4 text-primary" />
                <span>{t('recipes.form.servings')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  {...field}
                  type="number"
                  variant="flat"
                  size="sm"
                  className="w-16"
                  classNames={{
                    inputWrapper: "h-8 min-h-8 bg-default-100 hover:bg-default-200 border-none shadow-none px-2 rounded-xl",
                    input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center font-bold text-sm"
                  }}
                  min={0.1}
                  step={0.1}
                  value={field.value?.toString() || ''}
                  onChange={(e: any) => field.onChange(e.target.value)}
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
                <span className="text-xs text-default-400 font-medium">người</span>
              </div>
            </div>
          )}
        />
      </div>

      {sections.length === 0 && (
        <div className="text-center text-default-400 py-8 text-sm">
          {t('recipes.form.noIngredients')}
        </div>
      )}
      
      {sections.map((section, sectionIndex) => (
        <div key={section.id} className="flex flex-col w-full">
          <IngredientGroup 
            sectionIndex={sectionIndex} 
            onRemove={() => removeSection(sectionIndex)} 
          />
        </div>
      ))}

      <div className="pt-2">
        <Button 
          color="primary"
          variant="flat"
          className="w-full font-semibold h-11 rounded-xl" 
          onPress={() => appendSection({ name: 'Nhóm nguyên liệu mới', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] })}
          startContent={<Plus className="w-4 h-4" />}
        >
          Thêm nhóm nguyên liệu
        </Button>
      </div>
    </div>
  );
}

function IngredientGroup({ sectionIndex, onRemove }: { sectionIndex: number, onRemove: () => void }) {
  const { t } = useTranslation();
  const { control } = useFormContext<FormValues>();
  
  const { fields: ingredients, append, remove, move } = useFieldArray({
    control,
    name: `ingredientSections.${sectionIndex}.ingredients`
  });
  
  const { units } = useUnits();

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Controller
          name={`ingredientSections.${sectionIndex}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value || ''}
              variant="underlined"
              placeholder={t('recipes.form.groupNamePlaceholder')}
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
        <SortableList items={ingredients} onDragEnd={(oldIndex, newIndex) => move(oldIndex, newIndex)}>
          {ingredients.map((ingredient, index) => (
            <SortableItem key={ingredient.id} id={ingredient.id}>
              {({ attributes, listeners, isDragging }) => (
                <div className={`flex gap-2 items-start group/ing w-full transition-shadow ${isDragging ? 'bg-default-100/80 rounded-xl p-1 shadow-lg ring-1 ring-primary/30' : ''}`}>
                  <div 
                    className="touch-none select-none cursor-grab active:cursor-grabbing p-2 -ml-2 text-default-300 hover:text-default-600 active:text-primary transition-colors shrink-0 mt-1"
                    title={t('recipes.form.dragToReorder')}
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="w-5 h-5 pointer-events-none" />
                  </div>
                  <div className="flex flex-col flex-1 gap-2">
                    <div className="flex gap-2 items-start w-full">
                      <Controller
                        name={`ingredientSections.${sectionIndex}.ingredients.${index}.name`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Tên nguyên liệu (VD: Thịt ba chỉ heo)"
                            variant="flat"
                            className="flex-1"
                            classNames={{
                              inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                            }}
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                      <button 
                        type="button"
                        className="flex items-center justify-center bg-transparent hover:bg-danger/10 text-default-400 hover:text-danger w-8 h-8 min-w-8 rounded-lg cursor-pointer transition-colors mt-1"
                        onClick={() => remove(index)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2 w-full pr-10">
                      <Controller
                        name={`ingredientSections.${sectionIndex}.ingredients.${index}.quantity`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Input
                            {...field}
                            id={`quantity-${sectionIndex}-${index}`}
                            placeholder="Số lượng"
                            variant="flat"
                            className="w-1/3 min-w-[100px]"
                            classNames={{
                              inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                            }}
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            value={field.value?.toString() || ''}
                          />
                        )}
                      />
                      <Controller
                        name={`ingredientSections.${sectionIndex}.ingredients.${index}.unit`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            {...field}
                            allowsCustomValue
                            aria-label={t('recipes.form.unitPlaceholder')}
                            onSelectionChange={(val) => field.onChange(val)}
                            onInputChange={(val) => field.onChange(val)}
                            selectedKey={field.value}
                            inputValue={field.value || ''}
                            placeholder={t('recipes.form.unitPlaceholder')}
                            variant="flat"
                            isClearable={false}
                            className="flex-1"
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            classNames={{
                              base: "bg-default-100 hover:bg-default-200 border-none shadow-none rounded-medium"
                            }}
                            inputProps={{
                              classNames: {
                                inputWrapper: "bg-transparent shadow-none border-none",
                              }
                            }}
                          >
                            {units.map((u: any) => (
                              <AutocompleteItem 
                                key={u.name}
                                className="data-[hover=true]:bg-default-100 data-[hover=true]:text-default-foreground transition-colors"
                              >
                                {u.name}
                              </AutocompleteItem>
                            ))}
                          </Autocomplete>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableList>
        
        <Button 
          variant="light" 
          className="w-fit mt-2" 
          onPress={() => append({ id: crypto.randomUUID(), name: '', quantity: '', unit: '' })}
          startContent={<Plus className="w-3 h-3" />}
        >
          Thêm nguyên liệu
        </Button>
      </div>
    </div>
  );
}
