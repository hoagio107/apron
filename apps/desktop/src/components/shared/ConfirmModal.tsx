import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@/ui';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'warning' | 'danger' | 'default' | 'success';
  onConfirm: () => void;
  isLoading?: boolean;
}

import { useTranslation } from 'react-i18next';

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmColor = 'danger',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const displayTitle = title || t('common.actions.confirm');
  const displayConfirm = confirmLabel || t('common.actions.confirm');
  const displayCancel = cancelLabel || t('common.actions.cancel');
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="sm">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3 pb-2">
              <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <span className="font-bold text-base">{displayTitle}</span>
            </ModalHeader>
            <ModalBody className="pt-0 pb-2">
              <p className="text-sm text-default-600">{description}</p>
            </ModalBody>
            <ModalFooter className="gap-2">
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={isLoading}
              >
                {displayCancel}
              </Button>
              <Button
                color={confirmColor}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                isLoading={isLoading}
              >
                {displayConfirm}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
