import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Button, 
  Input, 
  Select, 
  SelectItem, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  toast
} from '@/ui';
import { 
  Save, 
  Loader2, 
  ImagePlus, 
  Type, 
  FolderTree, 
  FileText, 
  Lightbulb, 
  Trash2, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { useTipStore } from '../../../store/useTipStore';
import { TIP_CATEGORIES, type Tip } from '@apron/core';
import { TipRepository } from '@apron/core';
import { ImageManager } from '../../../lib/image-manager';
import { RichTextEditor } from '../../../components/recipes/form/RichTextEditor';
import { FormField } from '../../../components/shared/form';
import { TipAiModal } from './TipAiModal';

const tipSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  content: z.string().min(1, "Vui lòng nhập nội dung"),
  category_id: z.string().min(1, "Vui lòng chọn danh mục"),
  image_url: z.string().optional().or(z.string().length(0))
});

type FormValues = z.infer<typeof tipSchema>;

interface TipFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tipId?: string | null;
  initialData?: { title?: string; category_id?: string; content?: string } | null;
  onSuccess?: () => void;
}

export function TipFormModal({
  isOpen,
  onOpenChange,
  tipId,
  initialData,
  onSuccess
}: TipFormModalProps) {
  const { t } = useTranslation();
  const { addTip, updateTip } = useTipStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      title: '',
      content: '',
      category_id: '',
      image_url: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (tipId) {
        setInitialLoading(true);
        TipRepository.getById(tipId).then(tip => {
          if (tip) {
            reset({
              title: tip.title,
              content: tip.content,
              category_id: tip.category_id,
              image_url: tip.image_url || ''
            });
            if (tip.image_url) setSelectedImage(ImageManager.getAssetUrl(tip.image_url));
          }
          setInitialLoading(false);
        });
      } else if (initialData) {
        reset({
          title: initialData.title || '',
          content: initialData.content || '',
          category_id: initialData.category_id || '',
          image_url: ''
        });
        setSelectedImage(null);
      } else {
        // Reset form for new tip
        reset({
          title: '',
          content: '',
          category_id: '',
          image_url: ''
        });
        setSelectedImage(null);
      }
    }
  }, [isOpen, tipId, initialData, reset]);

  const handlePickImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: 'Chọn ảnh đại diện cho mẹo vặt',
        filters: [{
          name: 'Hình ảnh',
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg']
        }]
      });

      if (selected && typeof selected === 'string') {
        await ImageManager.initDirs();
        const ext = selected.split('.').pop() || 'png';
        const baseDir = await ImageManager.getBaseDir();
        const tempFilename = `${crypto.randomUUID()}.${ext}`;
        const tempPath = await join(baseDir, 'temp', tempFilename);
        
        const fileBytes = await readFile(selected);
        await writeFile(tempPath, fileBytes);
        
        setSelectedImage(ImageManager.getAssetUrl(tempPath));
        setValue('image_url', tempPath, { shouldValidate: true, shouldDirty: true });
      }
    } catch (error: any) {
      console.error('Lỗi khi mở hộp thoại chọn file:', error);
      // Fallback: kích hoạt thẻ input file ẩn
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const tempPath = await ImageManager.saveToTemp(file);
      setSelectedImage(ImageManager.getAssetUrl(tempPath));
      setValue('image_url', tempPath, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      toast.error('Không thể lưu ảnh tạm: ' + (err?.message || ''));
    } finally {
      e.target.value = '';
    }
  };

  const handleDropImage = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const tempPath = await ImageManager.saveToTemp(file);
        setSelectedImage(ImageManager.getAssetUrl(tempPath));
        setValue('image_url', tempPath, { shouldValidate: true, shouldDirty: true });
      } catch (err: any) {
        toast.error('Không thể lưu ảnh: ' + (err?.message || ''));
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Lưu ảnh vĩnh viễn vào thư mục images (nén webp) nếu có
      const finalImageUrl = values.image_url 
        ? await ImageManager.commitImage(values.image_url) 
        : '';

      const tipData: Tip = {
        id: tipId || '',
        ...values,
        image_url: finalImageUrl
      };
      
      if (tipId) {
        await updateTip(tipData);
        toast.success('Đã cập nhật mẹo vặt!');
      } else {
        await addTip(tipData);
        toast.success('Đã thêm mẹo vặt mới!');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Đã có lỗi xảy ra: ' + (e?.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="3xl" 
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[200]",
          base: "bg-content1 rounded-2xl max-h-[90vh] shadow-2xl overflow-hidden",
          header: "border-b border-divider/40 px-6 py-4 shrink-0",
          body: "p-6 overflow-y-auto space-y-6",
          footer: "border-t border-divider/40 px-6 py-3.5 shrink-0 flex items-center justify-end gap-3 bg-content1"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-divider/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {tipId ? t('tips.form.editTitle') : t('tips.form.createTitle')}
                    </h3>
                    <p className="text-xs text-default-400 font-normal">
                      {tipId ? 'Cập nhật nội dung và hình ảnh cho mẹo nhà bếp' : 'Chia sẻ mẹo hay, kinh nghiệm nấu nướng hữu ích'}
                    </p>
                  </div>
                </div>

                {!tipId && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<Sparkles className="w-4 h-4 text-secondary" />}
                    onPress={() => setIsAiModalOpen(true)}
                    className="font-bold text-xs rounded-xl bg-secondary/15 text-secondary hover:bg-secondary/25 shadow-none h-9 px-3.5"
                  >
                    AI hỗ trợ
                  </Button>
                )}
              </ModalHeader>

              <ModalBody className="p-6">
                {initialLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-default-500">Đang tải thông tin mẹo vặt...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Hàng 1: Ảnh đại diện + Tên mẹo & Danh mục */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                      {/* Cột trái: Ảnh đại diện (1:1) */}
                      <div className="md:col-span-1 flex flex-col gap-1.5">
                        <FormField label={t('tips.form.imageLabel')} icon={ImageIcon} error={errors.image_url?.message}>
                          {selectedImage ? (
                            <div className="w-full aspect-square bg-default-100 dark:bg-default-50/40 rounded-2xl relative group overflow-hidden flex items-center justify-center shadow-inner">
                              <img src={selectedImage} alt="Cover preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="flat" 
                                  className="bg-background/80 backdrop-blur-md text-foreground text-xs font-semibold"
                                  onPress={handlePickImage}
                                  startContent={<ImagePlus className="w-4 h-4" />}
                                >
                                  Đổi ảnh
                                </Button>
                                <Button 
                                  size="sm" 
                                  isIconOnly
                                  color="danger" 
                                  variant="flat" 
                                  className="bg-background/80 backdrop-blur-md text-danger"
                                  onPress={() => {
                                    setSelectedImage(null);
                                    setValue('image_url', '', { shouldValidate: true, shouldDirty: true });
                                  }}
                                  title="Xoá ảnh"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={handlePickImage}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={handleDropImage}
                              className="w-full aspect-square rounded-2xl border-2 border-dashed border-default-300 dark:border-default-200/40 hover:border-primary flex flex-col items-center justify-center bg-default-100/40 dark:bg-default-100/10 hover:bg-default-100/70 dark:hover:bg-default-100/20 text-default-500 hover:text-primary transition-all cursor-pointer p-4 group"
                            >
                              <div className="w-12 h-12 bg-default-200/60 dark:bg-default-100/20 rounded-2xl flex items-center justify-center mb-2 text-default-400 group-hover:text-primary group-hover:scale-110 transition-all">
                                <ImagePlus className="w-6 h-6" />
                              </div>
                              <p className="font-semibold text-sm mb-0.5 text-center text-foreground group-hover:text-primary transition-colors">Tải ảnh đại diện</p>
                              <p className="text-xs text-default-400 text-center">Bấm để mở Explorer chọn ảnh</p>
                            </div>
                          )}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileInputChange} 
                          />
                        </FormField>
                      </div>

                      {/* Cột phải: Tên mẹo & Danh mục */}
                      <div className="md:col-span-2 flex flex-col gap-5 justify-between">
                        <Controller
                          name="title"
                          control={control}
                          render={({ field, fieldState }) => (
                            <FormField label={t('tips.form.titleLabel')} icon={Type} error={fieldState.error?.message}>
                              <Input
                                {...field}
                                placeholder={t('tips.form.titlePlaceholder')}
                                variant="flat"
                                size="lg"
                                classNames={{ 
                                  inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none",
                                  input: "font-bold text-base" 
                                }}
                                isRequired
                                isInvalid={!!fieldState.error}
                              />
                            </FormField>
                          )}
                        />

                        <Controller
                          name="category_id"
                          control={control}
                          render={({ field, fieldState }) => (
                            <FormField label={t('tips.form.categoryLabel')} icon={FolderTree} error={fieldState.error?.message}>
                              <Select
                                aria-label="Danh mục mẹo"
                                placeholder={t('tips.form.selectCategory')}
                                variant="flat"
                                classNames={{ 
                                  trigger: "bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 h-12 px-3",
                                  value: "font-medium text-foreground !text-foreground" 
                                }}
                                selectedKeys={field.value ? [field.value] : []}
                                onSelectionChange={(keys) => {
                                  const key = Array.from(keys)[0] as string;
                                  field.onChange(key);
                                }}
                                isInvalid={!!fieldState.error}
                              >
                                {TIP_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.id} textValue={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </Select>
                            </FormField>
                          )}
                        />
                      </div>
                    </div>

                    {/* Hàng 2: Ô nhập nội dung mẹo (chiều rộng = ảnh đại diện + tên mẹo) */}
                    <div className="w-full">
                      <Controller
                        name="content"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormField label={t('tips.form.contentLabel')} icon={FileText} error={fieldState.error?.message}>
                            <div className="w-full">
                              <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={t('tips.form.contentPlaceholder')}
                                isInvalid={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            </div>
                          </FormField>
                        )}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>

              <ModalFooter className="px-6 py-3.5 border-t border-divider/40 flex items-center justify-end gap-3 bg-content1 shrink-0">
                <Button 
                  variant="flat" 
                  onPress={onClose}
                  className="rounded-xl px-5 font-semibold text-foreground bg-default-100 hover:bg-default-200 shadow-none h-10"
                >
                  Hủy
                </Button>
                <Button 
                  color="primary" 
                  variant="solid"
                  startContent={!isLoading && <Save className="w-4 h-4" />}
                  onPress={() => handleSubmit(onSubmit)()}
                  isLoading={isLoading}
                  className="rounded-xl px-5 font-bold shadow-none text-white h-10"
                >
                  {tipId ? t('common.saveChanges') : t('tips.form.saveTip')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <TipAiModal 
        isOpen={isAiModalOpen} 
        onOpenChange={setIsAiModalOpen} 
        initialTopic={control._formValues?.title || ''} 
        onApply={(data) => {
          setValue('title', data.title, { shouldValidate: true, shouldDirty: true });
          setValue('category_id', data.category_id, { shouldValidate: true, shouldDirty: true });
          setValue('content', data.content, { shouldValidate: true, shouldDirty: true });
        }} 
      />
    </>
  );
}
