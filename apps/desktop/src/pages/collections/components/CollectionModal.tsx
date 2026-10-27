import { useState, useEffect, useRef } from 'react';
import { 
  Button, Input, Textarea, 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, toast 
} from '@/ui';
import { 
  FolderHeart, Image as ImageIcon, ImagePlus, 
  Trash2, Save
} from 'lucide-react';
import { ImageManager } from '../../../lib/image-manager';
import type { Collection } from '@apron/core';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection | null;
  onSave: (collectionData: { title: string; description: string; cover_image_url: string }) => Promise<void>;
}

export function CollectionModal({
  isOpen,
  onClose,
  collection,
  onSave
}: CollectionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setTitle(collection.title || '');
        setDescription(collection.description || '');
        setCoverImageUrl(collection.cover_image_url || '');
      } else {
        setTitle('');
        setDescription('');
        setCoverImageUrl('');
      }
    }
  }, [isOpen, collection]);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP...)');
      return;
    }
    try {
      const tempPath = await ImageManager.saveToTemp(file);
      const committedPath = await ImageManager.commitImage(tempPath);
      setCoverImageUrl(committedPath);
      toast.success('Đã tải ảnh bìa');
    } catch (e) {
      console.error('Lỗi tải ảnh:', e);
      toast.error('Không thể lưu ảnh bìa. Vui lòng thử lại.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bộ sưu tập');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverImageUrl.trim(),
      });
      toast.success(collection ? 'Cập nhật bộ sưu tập thành công' : 'Tạo bộ sưu tập mới thành công');
      onClose();
    } catch (e: any) {
      console.error('Failed to save collection:', e);
      toast.error(e.message || 'Có lỗi xảy ra khi lưu bộ sưu tập');
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = Boolean(collection);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {() => (
          <>
            {/* Header */}
            <ModalHeader className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FolderHeart className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-lg font-bold">
                  {isEditing ? 'Chỉnh sửa bộ sưu tập' : 'Tạo bộ sưu tập mới'}
                </h3>
                <p className="text-xs text-default-400 font-normal">
                  {isEditing 
                    ? 'Cập nhật tiêu đề, mô tả và ảnh bìa cho bộ sưu tập' 
                    : 'Tập hợp thực đơn, công thức hoặc hình ảnh món ăn theo chủ đề'}
                </p>
              </div>
            </ModalHeader>

            {/* Body */}
            <ModalBody className="gap-5">
              {/* Cover Image */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-default-500" />
                  Ảnh bìa bộ sưu tập
                </label>

                {coverImageUrl ? (
                  <div className="w-full aspect-[16/9] max-h-56 rounded-xl overflow-hidden relative group border border-divider bg-default-100">
                    <img
                      src={ImageManager.getAssetUrl(coverImageUrl)}
                      alt="Cover preview"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="bg-background/80 backdrop-blur-md"
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
                        className="bg-background/80 backdrop-blur-md"
                        onPress={() => setCoverImageUrl('')}
                        title="Xoá ảnh bìa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handlePickImage}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDropImage}
                    className={`w-full aspect-[16/9] max-h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 flex flex-col items-center justify-center group ${
                      isDragging 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-default-300 hover:border-primary bg-default-50 hover:bg-default-100 text-default-500 hover:text-primary'
                    }`}
                  >
                    <div className="w-12 h-12 bg-default-200/60 rounded-xl flex items-center justify-center mb-2 text-default-400 group-hover:text-primary transition-colors">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm mb-1 text-center text-foreground group-hover:text-primary transition-colors">
                      Tải ảnh bìa bộ sưu tập
                    </p>
                    <p className="text-xs text-default-400 text-center">
                      Kéo thả file vào đây hoặc bấm để chọn ảnh từ máy (JPG, PNG, WebP)
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
                <p className="text-xs text-default-400">
                  * Mẹo: Nếu để trống, ảnh của món đầu tiên sẽ tự động được hiển thị làm ảnh bìa.
                </p>
              </div>

              {/* Title */}
              <Input
                label="Tên bộ sưu tập"
                labelPlacement="outside"
                placeholder="Ví dụ: Thực đơn Ăn dặm cho bé, Món ngon cuối tuần..."
                value={title}
                onValueChange={setTitle}
                variant="flat"
                isRequired
                autoFocus
              />

              {/* Description */}
              <Textarea
                label="Mô tả bộ sưu tập"
                labelPlacement="outside"
                placeholder="Giới thiệu nội dung, nguồn thực đơn hoặc mục đích của bộ sưu tập này..."
                value={description}
                onValueChange={setDescription}
                variant="flat"
                minRows={3}
              />
            </ModalBody>

            {/* Footer */}
            <ModalFooter>
              <Button
                variant="flat"
                onPress={onClose}
              >
                Hủy
              </Button>
              <Button
                color="primary"
                startContent={!isLoading && <Save className="w-4 h-4" />}
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={!title.trim()}
              >
                {isEditing ? 'Lưu thay đổi' : 'Tạo bộ sưu tập'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
