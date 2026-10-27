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

export function ConfirmModal({
  isOpen,
  onOpenChange,
  title = 'Xác nhận',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  confirmColor = 'danger',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="sm">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3 pb-2">
              <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <span className="font-bold text-base">{title}</span>
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
                {cancelLabel}
              </Button>
              <Button
                color={confirmColor}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                isLoading={isLoading}
              >
                {confirmLabel}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
