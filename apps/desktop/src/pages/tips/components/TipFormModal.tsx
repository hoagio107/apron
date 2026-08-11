import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Select, SelectItem, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@apron/ui';
import { Save, Loader2, ImagePlus } from 'lucide-react';
import { useTipStore } from '../../../store/useTipStore';
import { TIP_CATEGORIES, type Tip } from '@apron/core';
import { TipRepository } from '@apron/core';
import { ImageManager } from '../../../lib/image-manager';
import { ImagePickerModal } from '../../../components/recipes/form/ImagePickerModal';
import { RichTextEditor } from '../../../components/recipes/form/RichTextEditor';

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
  onSuccess?: () => void;
}

export function TipFormModal({ isOpen, onOpenChange, tipId, onSuccess }: TipFormModalProps) {
  const { addTip, updateTip } = useTipStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
  }, [isOpen, tipId, reset]);

  const { isOpen: isImagePickerOpen, onOpen: openImagePicker, onOpenChange: onImagePickerOpenChange } = useDisclosure();

  const handleSelectMedia = (images: string[], _videos: string[]) => {
    if (images.length > 0) {
      const url = images[0];
      setSelectedImage(ImageManager.getAssetUrl(url));
      setValue('image_url', url);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const tipData: Tip = {
        id: tipId || '',
        ...values
      };
      
      if (tipId) {
        await updateTip(tipData);
      } else {
        await addTip(tipData);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert('Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {tipId ? 'Chỉnh sửa mẹo vặt' : 'Thêm mẹo vặt mới'}
              </ModalHeader>
              <ModalBody>
                {initialLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                    {/* Left Col - Image */}
                    <div className="md:col-span-1">
                      <div 
                        onClick={openImagePicker}
                        className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group
                          ${selectedImage ? 'border-primary' : 'border-default-300 hover:border-primary hover:bg-primary-50'}
                        `}
                      >
                        {selectedImage ? (
                          <img src={selectedImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImagePlus className="w-10 h-10 text-default-400 mb-2 group-hover:text-primary" />
                            <span className="text-sm font-medium text-default-500 group-hover:text-primary">Thêm ảnh bìa</span>
                          </>
                        )}
                      </div>
                      {errors.image_url && <p className="text-tiny text-danger mt-1">{errors.image_url.message}</p>}
                    </div>

                    {/* Right Col - Form */}
                    <div className="md:col-span-2 space-y-6">
                      <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            label="Tiêu đề"
                            placeholder="VD: Cách bảo quản rau củ tươi lâu..."
                            labelPlacement="outside"
                            isInvalid={!!errors.title}
                            errorMessage={errors.title?.message}
                            size="lg"
                            classNames={{ input: "font-bold text-lg" }}
                          />
                        )}
                      />

                      <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            label="Danh mục"
                            placeholder="Chọn một danh mục"
                            labelPlacement="outside"
                            selectedKeys={field.value ? [field.value] : []}
                            onSelectionChange={(keys) => {
                              const key = Array.from(keys)[0] as string;
                              field.onChange(key);
                            }}
                            isInvalid={!!errors.category_id}
                            errorMessage={errors.category_id?.message}
                          >
                            {TIP_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      />

                      <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Nội dung chi tiết</label>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Viết nội dung mẹo vặt của bạn tại đây..."
                              isInvalid={!!errors.content}
                              errorMessage={errors.content?.message}
                            />
                            {errors.content && (
                              <p className="text-tiny text-danger">{errors.content.message}</p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Hủy
                </Button>
                <Button 
                  color="primary" 
                  startContent={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  onPress={() => handleSubmit(onSubmit)()}
                  isLoading={isLoading}
                >
                  Lưu mẹo vặt
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      <ImagePickerModal 
        isOpen={isImagePickerOpen} 
        onOpenChange={onImagePickerOpenChange} 
        onSelectMedia={handleSelectMedia} 
      />
    </>
  );
}
