import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Select, SelectItem, useDisclosure, Modal, ModalContent, PageHeader, toast } from '@/ui';
import { 
  Save, 
  Loader2, 
  ImagePlus, 
  Type, 
  Layers, 
  FileText, 
  Trash2, 
  Image as ImageIcon,
  Sparkles,
  ChefHat,
  Snowflake,
  ShoppingCart,
  UtensilsCrossed,
  LifeBuoy,
  Wrench,
  Recycle,
  Lightbulb
} from 'lucide-react';
import { useTipStore } from '../../../store/useTipStore';
import { TIP_CATEGORIES, type Tip, TipRepository } from '@apron/core';
import { ImageManager } from '../../../lib/image-manager';
import { ImagePickerModal } from '../../../components/recipes/form/ImagePickerModal';
import { RichTextEditor } from '../../../components/recipes/form/RichTextEditor';
import { FormField } from '../../../components/shared/form/FormField';
import { TipAiModal } from './TipAiModal';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ChefHat,
  Sparkles,
  Snowflake,
  ShoppingCart,
  UtensilsCrossed,
  LifeBuoy,
  Layers,
  Wrench,
  Recycle
};

const tipSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề mẹo"),
  content: z.string().min(1, "Vui lòng nhập nội dung hướng dẫn"),
  category_id: z.string().min(1, "Vui lòng chọn chuyên mục"),
  image_url: z.string().optional().or(z.string().length(0))
});

type FormValues = z.infer<typeof tipSchema>;

interface TipFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tipId?: string | null;
  onSuccess?: () => void;
}

export function TipFormModal({
  isOpen,
  onOpenChange,
  tipId,
  onSuccess
}: TipFormModalProps) {
  const { t } = useTranslation();
  const { addTip, updateTip } = useTipStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
      } else {
        reset({
          title: '',
          content: '',
          category_id: '',
          image_url: ''
        });
        setSelectedImage(null);
      }
    }
  }, [isOpen, tipId, reset]);

  const { isOpen: isImagePickerOpen, onOpen: openImagePicker, onOpenChange: onImagePickerOpenChange } = useDisclosure();

  const handleSelectMedia = (images: string[], _videos: string[]) => {
    if (images.length > 0) {
      const url = images[0];
      setSelectedImage(ImageManager.getAssetUrl(url));
      setValue('image_url', url, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setValue('image_url', '', { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      let finalImageUrl = values.image_url;
      if (finalImageUrl) {
        finalImageUrl = await ImageManager.commitImage(finalImageUrl);
      }

      const tipData: Tip = {
        id: tipId || '',
        ...values,
        image_url: finalImageUrl || undefined
      };
      
      if (tipId) {
        await updateTip(tipData);
        toast.success('Đã cập nhật mẹo nấu ăn!');
      } else {
        await addTip(tipData);
        toast.success('Đã tạo mẹo nấu ăn mới!');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi lưu mẹo: ' + (e?.message || 'Vui lòng thử lại'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        size="full" 
        scrollBehavior="inside"
        hideCloseButton
        classNames={{
          wrapper: "w-full h-full inset-0 !max-w-full overflow-hidden justify-start sm:justify-start",
          base: "!w-full !h-full !max-w-full !max-h-full !m-0 !p-0 !rounded-none bg-background text-foreground flex flex-col overflow-hidden",
          body: "p-0 overflow-y-auto flex-1 bg-background"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex flex-col h-full w-full bg-background text-foreground overflow-hidden">
              
              {/* Sticky Top Header Bar */}
              <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-divider/60 shrink-0 px-4 sm:px-6 py-3.5">
                <div className="max-w-3xl mx-auto w-full">
                  <PageHeader
                    title={tipId ? t('tips.form.editTitle') : t('tips.form.createTitle')}
                    showBackButton
                    onBack={onClose}
                    className="p-0"
                  />
                </div>
              </div>

              {/* Main Scrollable Form Body (Style chuẩn RecipeForm) */}
              <div className="flex-1 overflow-y-auto">
                {initialLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-default-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm">Đang tải dữ liệu mẹo...</span>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 pb-28 flex flex-col gap-6">
                    
                    {/* 1. Cover Image Section (Chuẩn ImageSection của RecipeForm) */}
                    <FormField
                      label={t('tips.form.imageLabel')}
                      icon={ImageIcon}
                      error={errors.image_url?.message}
                    >
                      {selectedImage ? (
                        <div className="w-full aspect-16/9 sm:aspect-21/9 max-h-[280px] rounded-2xl overflow-hidden relative group border border-divider/60 bg-default-100 shadow-none">
                          <img 
                            src={selectedImage} 
                            alt="Ảnh bìa mẹo" 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                            <Button 
                              size="sm" 
                              variant="flat" 
                              className="bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold h-8 px-3 rounded-lg shadow-none"
                              onPress={openImagePicker}
                              startContent={<ImagePlus className="w-3.5 h-3.5" />}
                            >
                              Đổi ảnh
                            </Button>
                            <Button 
                              size="sm" 
                              isIconOnly 
                              color="danger" 
                              variant="flat" 
                              className="bg-background/90 backdrop-blur-md text-danger h-8 w-8 rounded-lg shadow-none"
                              onPress={handleRemoveImage}
                              aria-label="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={openImagePicker}
                          className="w-full aspect-16/9 sm:aspect-21/9 max-h-[260px] border-2 border-dashed border-default-300 dark:border-default-200/40 hover:border-primary rounded-2xl flex flex-col items-center justify-center bg-default-100/40 dark:bg-default-100/10 hover:bg-default-100/70 dark:hover:bg-default-100/20 text-default-500 hover:text-primary transition-all cursor-pointer p-6 group shadow-none"
                        >
                          <div className="w-12 h-12 bg-default-200/60 dark:bg-default-100/20 rounded-2xl flex items-center justify-center mb-2.5 text-default-400 group-hover:text-primary group-hover:scale-110 transition-all shadow-none">
                            <ImagePlus className="w-6 h-6" />
                          </div>
                          <p className="font-semibold text-sm mb-1 text-center text-foreground group-hover:text-primary transition-colors">
                            Tải ảnh đại diện mẹo
                          </p>
                          <p className="text-xs text-default-400 text-center">
                            Bấm để chọn từ thư viện ảnh hoặc tải lên từ thiết bị
                          </p>
                        </div>
                      )}
                    </FormField>

                    {/* 2. Title Field (Chuẩn InfoSection của RecipeForm) */}
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Tiêu đề mẹo" icon={Type} error={errors.title?.message}>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Ví dụ: Cách giữ bơ sáp không bị thâm đen..."
                            variant="flat"
                            size="md"
                            classNames={{ 
                              inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl",
                              input: "font-bold text-base sm:text-lg" 
                            }}
                            isRequired
                            isInvalid={!!errors.title}
                          />
                        </FormField>
                      )}
                    />

                    {/* 3. Category Field (Chuẩn MetaSection của RecipeForm) */}
                    <Controller
                      name="category_id"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Chuyên mục mẹo" icon={Layers} error={errors.category_id?.message}>
                          <Select
                            placeholder="Chọn một chuyên mục phù hợp"
                            variant="flat"
                            size="md"
                            classNames={{
                              trigger: "bg-default-100 hover:bg-default-200 border-none shadow-none min-h-12 rounded-xl",
                              value: "font-medium text-sm"
                            }}
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const key = Array.from(keys)[0] as string;
                              field.onChange(key);
                            }}
                            renderValue={(items) => {
                              return items.map((item) => {
                                const cat = TIP_CATEGORIES.find(c => c.id === item.key);
                                if (!cat) return <span key={item.key}>{item.textValue}</span>;
                                const Icon = CATEGORY_ICON_MAP[cat.icon] || Lightbulb;
                                const [bgClass, textClass] = cat.color.split(' ');
                                return (
                                  <div key={item.key} className="flex items-center gap-2.5">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${bgClass || 'bg-default-100'}`}>
                                      <Icon className={`w-3.5 h-3.5 ${textClass || 'text-default-600'}`} />
                                    </div>
                                    <span className="font-semibold text-sm text-foreground">{cat.name}</span>
                                  </div>
                                );
                              });
                            }}
                            isRequired
                            isInvalid={!!errors.category_id}
                          >
                            {TIP_CATEGORIES.map((cat) => {
                              const Icon = CATEGORY_ICON_MAP[cat.icon] || Lightbulb;
                              const [bgClass, textClass] = cat.color.split(' ');
                              return (
                                <SelectItem key={cat.id} textValue={cat.name}>
                                  <div className="flex items-center gap-3 py-1">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bgClass || 'bg-default-100'}`}>
                                      <Icon className={`w-4 h-4 ${textClass || 'text-default-600'}`} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-semibold text-sm text-foreground">{cat.name}</span>
                                      <span className="text-xs text-default-400 truncate">{cat.description}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </Select>
                        </FormField>
                      )}
                    />

                    {/* 4. Content Field (Chuẩn RichTextEditor của RecipeForm) */}
                    <Controller
                      name="content"
                      control={control}
                      render={({ field }) => (
                        <FormField label="Nội dung hướng dẫn chi tiết" icon={FileText} error={errors.content?.message}>
                          <div className="rounded-2xl overflow-hidden border border-divider/60 bg-content1 shadow-none">
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Viết nội dung hướng dẫn mẹo vặt của bạn tại đây..."
                              isInvalid={!!errors.content}
                              errorMessage={errors.content?.message}
                            />
                          </div>
                        </FormField>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Sticky Bottom Action Bar (Chuẩn BottomActionStepper của RecipeForm) */}
              <div className="sticky bottom-0 z-30 w-full p-4 bg-background/95 backdrop-blur-md border-t border-divider/60 safe-area-inset-bottom shrink-0 shadow-none">
                <div className="max-w-3xl mx-auto w-full flex items-center gap-3">
                  {/* Nút AI Trợ lý mẹo vặt (chỉ có icon, cạnh nút Hủy bỏ) */}
                  <Button
                    type="button"
                    variant="flat"
                    color="secondary"
                    isIconOnly
                    onPress={() => setIsAiModalOpen(true)}
                    className="shrink-0 h-12 w-12 rounded-xl shadow-none"
                    aria-label="AI Trợ lý mẹo vặt"
                    title="AI Trợ lý mẹo vặt (Gemini)"
                  >
                    <Sparkles className="w-5 h-5 text-secondary" />
                  </Button>

                  <Button 
                    variant="flat" 
                    className="flex-1 rounded-xl font-semibold h-12 border border-divider/60 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
                    onPress={onClose}
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    color="primary" 
                    className="flex-1 rounded-xl font-bold h-12 shadow-none"
                    startContent={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    onPress={() => handleSubmit(onSubmit)()}
                    isLoading={isLoading}
                  >
                    {tipId ? t('common.saveChanges') : t('tips.form.saveTip')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
      
      {/* Integrated ImagePickerModal for local upload / media browser */}
      <ImagePickerModal 
        isOpen={isImagePickerOpen} 
        onOpenChange={onImagePickerOpenChange} 
        onSelectMedia={handleSelectMedia} 
      />

      {/* AI Assistant Modal for Tips */}
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
