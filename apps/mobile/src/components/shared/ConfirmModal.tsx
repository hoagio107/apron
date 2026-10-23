import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@/ui';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title of the confirm dialog */
  title?: string;
  /** Description / body message */
  description: string;
  /** Text for the confirm button. Defaults to 'Xác nhận' */
  confirmLabel?: string;
  /** Text for the cancel button. Defaults to 'Hủy' */
  cancelLabel?: string;
  /** Color of the confirm button. Defaults to 'danger' */
  confirmColor?: 'primary' | 'secondary' | 'warning' | 'danger' | 'default' | 'success';
  /** Called when user clicks confirm */
  onConfirm: () => void;
  /** Whether the confirm action is in progress (shows loading state) */
  isLoading?: boolean;
}

/**
 * ConfirmModal — Modal xác nhận thay thế window.confirm() native.
 *
 * Usage:
 *   <ConfirmModal
 *     isOpen={isDeleteOpen}
 *     onOpenChange={setIsDeleteOpen}
 *     title="Xoá công thức"
 *     description={`Bạn có chắc muốn xoá "${recipe.title}"?`}
 *     confirmLabel="Xoá"
 *     confirmColor="danger"
 *     onConfirm={handleDelete}
 *   />
 */
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
              <span>{title}</span>
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
