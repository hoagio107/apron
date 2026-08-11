import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Button, Card, CardBody, Input, Autocomplete, AutocompleteItem, Avatar } from '@apron/ui';
import { Plus, Trash2, ShoppingCart, Users, GripVertical, X } from 'lucide-react';
import type { FormValues } from './schema';
import { useUnits } from '../../../hooks/useUnits';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { SectionHeader } from '../../shared/SectionHeader';
import { SortableList, SortableItem } from './SortableList';

export function IngredientsSection() {
  const { control } = useFormContext<FormValues>();
  
  const { fields: sections, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "ingredientSections"
  });

  return (
    <Card className="w-full" shadow="none">
      <SectionHeader 
        title="Nguyên liệu" 
        icon={ShoppingCart}
        action={
          <Controller
            name="servings"
            control={control}
            render={({ field, fieldState }) => (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-default-500 whitespace-nowrap font-medium">
                  <Users className="w-4 h-4" /> Khẩu phần:
                </div>
                <Input
                  {...field}
                  type="number"
                  variant="flat"
                  size="sm"
                  className="w-10"
                  classNames={{
                    input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center font-bold"
                  }}
                  min={0.1}
                  step={0.1}
                  value={field.value?.toString() || ''}
                  onChange={(e: any) => field.onChange(e.target.value)}
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              </div>
            )}
          />
        }
      />
      <CardBody className="gap-0">
        {sections.length === 0 && (
          <div className="text-center text-gray-500 py-4">Chưa có nguyên liệu nào. Hãy thêm nhóm nguyên liệu đầu tiên.</div>
        )}
        
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="flex flex-col w-full">
            <IngredientGroup 
              sectionIndex={sectionIndex} 
              onRemove={() => removeSection(sectionIndex)} 
            />
          </div>
        ))}

        <div className="pt-4 border-t border-divider">
          <Button 
            color="primary"
            variant="solid"
            className="w-full" 
            onPress={() => appendSection({ name: 'Nhóm nguyên liệu mới', ingredients: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: 'g' }] })}
            startContent={<Plus className="w-4 h-4" />}
          >
            Thêm nhóm
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function IngredientGroup({ sectionIndex, onRemove }: { sectionIndex: number, onRemove: () => void }) {
  const { control, setValue } = useFormContext<FormValues>();
  
  const { fields: ingredients, append, remove, move } = useFieldArray({
    control,
    name: `ingredientSections.${sectionIndex}.ingredients`
  });
  
  const { units } = useUnits();
  const { getAllIngredients } = useIngredientCatalogStore();
  const catalog = getAllIngredients();

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
              placeholder="Tên nhóm nguyên liệu (VD: Phần sốt, Phần bánh...)"
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

      <div className="flex flex-col gap-3">
        <SortableList items={ingredients} onDragEnd={(oldIndex, newIndex) => move(oldIndex, newIndex)}>
          {ingredients.map((ingredient, index) => (
            <SortableItem key={ingredient.id} id={ingredient.id}>
              {({ attributes, listeners }) => (
                <div className="flex gap-2 items-start group/ing">
                  <div 
                    className="cursor-move pt-2 text-default-300 hover:text-default-500 transition-colors"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
            <Controller
              name={`ingredientSections.${sectionIndex}.ingredients.${index}.name`}
              control={control}
              render={({ field, fieldState }) => (
                  <Autocomplete
                    {...field}
                    allowsCustomValue
                    placeholder="Tên nguyên liệu"
                    variant="flat"
                    className="flex-1"
                    aria-label="Tên nguyên liệu"
                    defaultFilter={(textValue, inputValue) => {
                      return textValue.toLowerCase().includes(inputValue.toLowerCase());
                    }}
                    onSelectionChange={(val) => {
                      if (val) {
                        const selected = catalog.find(i => i.id === val);
                        if (selected) {
                          field.onChange(selected.name);
                          setValue(`ingredientSections.${sectionIndex}.ingredients.${index}.ingredient_id`, selected.id);
                          if (selected.default_unit) {
                            setValue(`ingredientSections.${sectionIndex}.ingredients.${index}.unit`, selected.default_unit);
                          }
                          return;
                        }
                      }
                      field.onChange(val || '');
                      setValue(`ingredientSections.${sectionIndex}.ingredients.${index}.ingredient_id`, undefined);
                    }}
                    onInputChange={(val) => {
                      field.onChange(val);
                      setValue(`ingredientSections.${sectionIndex}.ingredients.${index}.ingredient_id`, undefined);
                    }}
                    selectedKey={ingredients[index].ingredient_id || null}
                    inputValue={field.value || ''}
                    classNames={{
                      base: "bg-default-100 hover:bg-default-200 border-none shadow-none rounded-medium"
                    }}
                    inputProps={{
                      classNames: {
                        inputWrapper: "bg-transparent shadow-none border-none",
                      }
                    }}
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                  >
                    {catalog.map((i) => (
                      <AutocompleteItem 
                        key={i.id} 
                        textValue={i.name}
                        className="data-[hover=true]:bg-default-100 data-[hover=true]:text-default-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar alt={i.name} className="flex-shrink-0" size="sm" src={i.image_url} name={i.name} />
                          <div className="flex flex-col">
                            <span className="text-small">{i.name}</span>
                            {i.default_category && <span className="text-tiny text-default-400">{i.default_category}</span>}
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
              )}
            />
            <Controller
              name={`ingredientSections.${sectionIndex}.ingredients.${index}.quantity`}
              control={control}
              render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="SL"
                    variant="flat"
                    className="w-24"
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
                    aria-label="Chọn đơn vị"
                    onSelectionChange={(val) => field.onChange(val)}
                    onInputChange={(val) => field.onChange(val)}
                    selectedKey={field.value}
                    inputValue={field.value || ''}
                    placeholder="Đơn vị"
                    variant="flat"
                    isClearable={false}
                    className="w-48 shrink-0"
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

                  <Button isIconOnly color="default" variant="light" size="sm" className="opacity-0 group-hover/ing:opacity-100 transition-opacity mt-1" onPress={() => remove(index)}>
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
          onPress={() => append({ id: crypto.randomUUID(), name: '', quantity: '', unit: '' })}
          startContent={<Plus className="w-3 h-3" />}
        >
          Thêm nguyên liệu
        </Button>
      </div>
    </div>
  );
}
