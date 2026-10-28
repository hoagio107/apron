import { useState, useEffect, useRef } from 'react';
import { 
  Button, Input, Textarea, 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, toast 
} from '@/ui';
import { 
  FolderHeart, Image as ImageIcon, ImagePlus, 
  Trash2, Save 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      toast.error(t('collections.invalidImage'));
      return;
    }
    try {
      const tempPath = await ImageManager.saveToTemp(file);
      const committedPath = await ImageManager.commitImage(tempPath);
      setCoverImageUrl(committedPath);
      toast.success(t('collections.uploadImageSuccess'));
    } catch (e) {
      console.error('Lỗi tải ảnh:', e);
      toast.error(t('collections.uploadImageError'));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t('collections.nameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverImageUrl.trim(),
      });
      toast.success(t('collections.saveSuccess'));
      onClose();
    } catch (e: any) {
      console.error('Failed to save collection:', e);
      toast.error(e.message || t('common.status.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = Boolean(collection);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom"
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
                <h3 className="text-base font-bold">
                  {isEditing ? t('collections.modalTitleEdit') : t('collections.modalTitleNew')}
                </h3>
                <p className="text-xs text-default-400 font-normal">
                  {isEditing 
                    ? t('collections.descLabel') 
                    : t('collections.emptyDesc')}
                </p>
              </div>
            </ModalHeader>

            {/* Body */}
            <ModalBody className="gap-4">
              {/* Cover Image Section */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-default-500" />
                  {t('collections.coverImageLabel')}
                </label>

                {coverImageUrl ? (
                  <div className="w-full aspect-[16/9] max-h-48 rounded-xl overflow-hidden relative group border border-divider bg-default-100">
                    <img
                      src={ImageManager.getAssetUrl(coverImageUrl)}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="bg-background/80 backdrop-blur-md"
                        onPress={handlePickImage}
                        startContent={<ImagePlus className="w-4 h-4" />}
                      >
                        {t('collections.changeImage')}
                      </Button>
                      <Button
                        size="sm"
                        isIconOnly
                        color="danger"
                        variant="flat"
                        className="bg-background/80 backdrop-blur-md"
                        onPress={() => setCoverImageUrl('')}
                        title={t('collections.removeImage')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handlePickImage}
                    className="w-full aspect-[16/9] max-h-40 rounded-xl border-2 border-dashed border-default-300 active:border-primary bg-default-50 active:bg-default-100 text-default-500 flex flex-col items-center justify-center p-4 cursor-pointer"
                  >
                    <ImagePlus className="w-6 h-6 mb-1 text-default-400" />
                    <p className="font-semibold text-xs text-foreground">
                      {t('collections.uploadCover')}
                    </p>
                    <p className="text-[11px] text-default-400 text-center">
                      {t('collections.dragDropCover')}
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
                <p className="text-[11px] text-default-400">
                  {t('collections.coverTip')}
                </p>
              </div>

              {/* Title Input */}
              <Input
                label={t('collections.nameLabel')}
                labelPlacement="outside"
                placeholder={t('collections.namePlaceholder')}
                value={title}
                onValueChange={setTitle}
                variant="flat"
                isRequired
                autoFocus
              />

              {/* Description Input */}
              <Textarea
                label={t('collections.descLabel')}
                labelPlacement="outside"
                placeholder={t('collections.descPlaceholder')}
                value={description}
                onValueChange={setDescription}
                variant="flat"
                minRows={3}
              />
            </ModalBody>

            {/* Footer */}
            <ModalFooter className="flex gap-2">
              <Button
                variant="flat"
                className="flex-1"
                onPress={onClose}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                color="primary"
                className="flex-1"
                startContent={!isLoading && <Save className="w-4 h-4" />}
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={!title.trim()}
              >
                {isEditing ? t('common.actions.save') : t('common.actions.create')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
