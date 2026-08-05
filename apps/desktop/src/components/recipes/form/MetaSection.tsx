import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@apron/ui';
import { Link as LinkIcon, Youtube } from 'lucide-react';
import type { FormValues } from './schema';
import { FormField } from '../../shared/form';
import { HierarchicalTagSelect } from './HierarchicalTagSelect';

export function MetaSection() {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="flex flex-col gap-6">
      <Controller
        name="tags"
        control={control}
        render={({ field, fieldState }) => (
          <HierarchicalTagSelect 
            selectedIds={field.value || []}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="flex gap-4">
        {/* Mock for source/video since they were in ExtraInfoBlock */}
        <Controller
          name="video_url"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Video URL (YouTube/Tiktok)" icon={Youtube} error={fieldState.error?.message} className="flex-1">
              <Input
                {...field}
                placeholder="https://..."
                variant="flat"
                classNames={{
                  inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                }}
                isInvalid={!!fieldState.error}
              />
            </FormField>
          )}
        />
      </div>

      {/* Linked Recipes */}
      <FormField label="Công thức liên kết" icon={LinkIcon}>
        <Input
          placeholder="Đang cập nhật tính năng tìm kiếm món..."
          variant="flat"
          isDisabled
          classNames={{
            inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
          }}
        />
        {/* TODO: Implement real related_recipes search UI */}
      </FormField>

    </div>
  );
}
