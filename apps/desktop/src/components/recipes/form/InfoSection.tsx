import { Controller, useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { Input, Select, SelectItem } from '@/ui';
import { Type, Gauge, Flame, Clock, Timer, Info } from 'lucide-react';
import type { FormValues } from './schema';
import { FormField } from '../../shared/form';
import { RichTextEditor } from './RichTextEditor';


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
        className="min-h-8 h-8 px-1 flex items-center justify-center cursor-text w-full hover:bg-default-100 rounded-lg transition-colors"
        onClick={() => setIsFocused(true)}
      >
        <span className="font-semibold text-foreground">{value}</span>
        <span className="text-default-400 text-xs ml-1">{unit}</span>
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
        inputWrapper: "bg-transparent shadow-none border-none min-h-8 h-8 px-0",
        input: "text-center font-semibold text-foreground"
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

export function InfoSection({ currentRecipeId: _currentRecipeId }: { currentRecipeId?: string }) {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="flex flex-col gap-6">
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <FormField label="Tên món ăn" icon={Type} error={fieldState.error?.message}>
            <Input
              {...field}
              placeholder="Ví dụ: Phở bò Hà Nội"
              variant="flat"
              size="lg"
              classNames={{ 
                inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none",
                input: "font-bold text-lg" 
              }}
              isRequired
              isInvalid={!!fieldState.error}
            />
          </FormField>
        )}
      />



      <div className="grid grid-cols-4 gap-3">
        <Controller
          name="difficulty"
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-content2">
              <div className="p-2 rounded-full bg-primary/10 text-primary mb-1">
                <Gauge className="w-5 h-5" />
              </div>
              <span className="text-default-500 text-xs font-medium">Độ khó</span>
              <Select
                aria-label="Độ khó"
                placeholder="Chọn..."
                variant="flat"
                classNames={{ 
                  trigger: "bg-transparent shadow-none border-none min-h-8 h-8 px-0 data-[hover=true]:bg-default-100 transition-colors",
                  value: "text-center font-semibold text-foreground !text-foreground",
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
            <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-content2">
              <div className="p-2 rounded-full bg-warning/10 text-warning mb-1">
                <Flame className="w-5 h-5" />
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
            <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-content2">
              <div className="p-2 rounded-full bg-secondary/10 text-secondary mb-1">
                <Clock className="w-5 h-5" />
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
            <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-content2">
              <div className="p-2 rounded-full bg-success/10 text-success mb-1">
                <Timer className="w-5 h-5" />
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
