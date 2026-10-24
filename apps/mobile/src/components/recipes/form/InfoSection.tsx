import { Controller, useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Input, Select, SelectItem } from '@/ui';
import { Type, Gauge, Flame, Clock, Timer, Info, AlertTriangle } from 'lucide-react';
import type { FormValues } from './schema';
import { FormField } from '../../shared/form';
import { RichTextEditor } from './RichTextEditor';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { findDuplicateRecipe } from '../../../lib/duplicateUtils';


function EditableMetric({ 
  value, 
  onChange, 
  unit, 
  placeholder, 
  isInvalid, 
  errorMessage 
}: { 
  value?: number; 
  onChange: (val?: number) => void; 
  unit: string; 
  placeholder: string;
  isInvalid?: boolean;
  errorMessage?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  if (!isFocused && value !== undefined && value !== null) {
    return (
      <div 
        className="min-h-7 h-7 px-0.5 flex items-center justify-center cursor-text w-full hover:bg-default-100 rounded-lg transition-colors"
        onClick={() => setIsFocused(true)}
      >
        <span className="font-semibold text-xs sm:text-sm text-default-700">{value}</span>
        <span className="text-default-400 text-xs ml-0.5">{unit}</span>
      </div>
    );
  }

  return (
    <Input
      autoFocus={isFocused}
      onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
      type="number"
      variant="flat"
      classNames={{ 
        base: "w-full",
        inputWrapper: "bg-transparent shadow-none border-none min-h-7 h-7 px-0",
        input: "text-center font-semibold text-xs sm:text-sm text-default-700"
      }}
      min={0}
      value={value !== undefined && value !== null ? value.toString() : ''}
      onChange={(e: any) => {
        const val = e.target.value;
        onChange(val === '' ? undefined : parseInt(val));
      }}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
    />
  );
}

export function InfoSection({ currentRecipeId }: { currentRecipeId?: string }) {
  const { control } = useFormContext<FormValues>();
  const { recipes } = useRecipeStore();

  return (
    <div className="flex flex-col gap-6">
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => {
          const duplicateRecipe = findDuplicateRecipe(field.value || '', recipes, currentRecipeId);

          return (
            <div>
              <FormField label="Tên món ăn" icon={Type} error={fieldState.error?.message}>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Ví dụ: Phở bò Hà Nội"
                  variant="flat"
                  size="md"
                  color={duplicateRecipe ? 'warning' : 'default'}
                  classNames={{ 
                    inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none",
                    input: "font-bold text-lg" 
                  }}
                  isRequired
                  isInvalid={!!fieldState.error}
                />
              </FormField>

              {duplicateRecipe && (
                <div className="mt-2.5 flex items-start gap-2.5 p-3 rounded-xl bg-warning-500/10 border border-warning-500/30 text-warning-800 dark:text-warning-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-warning-600 dark:text-warning-400 mt-0.5" />
                  <div className="leading-relaxed text-left">
                    <span className="font-bold text-warning-700 dark:text-warning-400">Cảnh báo trùng tên:</span> Trong sổ tay đã có công thức &ldquo;
                    <span className="font-semibold underline">{duplicateRecipe.title}</span>
                    &rdquo;. Vui lòng chọn tên khác hoặc phân biệt phiên bản để tránh lưu trùng món ăn.
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />



      <div className="grid grid-cols-4 gap-2">
        <Controller
          name="difficulty"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-2xl bg-default-50">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary mb-0.5">
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-default-500 text-xs font-medium">Độ khó</span>
              <Select
                aria-label="Độ khó"
                placeholder="Chọn..."
                variant="flat"
                classNames={{ 
                  trigger: "bg-transparent shadow-none border-none min-h-7 h-7 px-0 data-[hover=true]:bg-default-100 transition-colors",
                  value: "text-center font-semibold text-xs sm:text-sm text-default-700 !text-default-700",
                  innerWrapper: "w-full flex justify-center",
                  selectorIcon: "hidden"
                }}
                selectorIcon={<span className="hidden" />}
                selectedKeys={field.value ? [field.value] : []}
                onChange={field.onChange}
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              >
                {(['Dễ', 'Vừa', 'Khó'] as const).map(level => (
                  <SelectItem key={level} textValue={level}>
                    {level}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}
        />

        <Controller
          name="calories"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-2xl bg-default-50">
              <div className="p-1.5 rounded-full bg-warning/10 text-warning mb-0.5">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-default-500 text-xs font-medium">Calories</span>
              <EditableMetric 
                value={field.value}
                onChange={field.onChange}
                unit="kcal"
                placeholder="VD: 350"
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="prep_time"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-2xl bg-default-50">
              <div className="p-1.5 rounded-full bg-secondary/10 text-secondary mb-0.5">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-default-500 text-xs font-medium">Sơ chế</span>
              <EditableMetric 
                value={field.value}
                onChange={field.onChange}
                unit="phút"
                placeholder="Phút..."
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="cook_time"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-2xl bg-default-50">
              <div className="p-1.5 rounded-full bg-success/10 text-success mb-0.5">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-default-500 text-xs font-medium">Nấu</span>
              <EditableMetric 
                value={field.value}
                onChange={field.onChange}
                unit="phút"
                placeholder="Phút..."
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />
      </div>

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <FormField label="Ghi chú & Mẹo" icon={Info} error={fieldState.error?.message}>
            <RichTextEditor
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Ghi chú thêm về công thức, mẹo nấu nướng, hoặc lưu ý..."
              isInvalid={!!fieldState.error}
            />
          </FormField>
        )}
      />
    </div>
  );
}
