import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@/ui';
import { AlertTriangle, BookOpen, Trash2, Unlink } from 'lucide-react';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';

interface CascadeDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: IngredientMeta | null;
  affectedRecipes: Array<{ id?: string; title: string }>;
  onConfirmDeleteDirect: () => Promise<void> | void;
  onDetachFromRecipes: () => Promise<void> | void;
  onRemoveFromRecipes: () => Promise<void> | void;
  isLoading?: boolean;
}

export function CascadeDeleteModal({
  isOpen,
  onOpenChange,
  item,
  affectedRecipes,
  onConfirmDeleteDirect,
  onDetachFromRecipes,
  onRemoveFromRecipes,
  isLoading = false
}: CascadeDeleteModalProps) {
  if (!item) return null;

  const hasAffectedRecipes = affectedRecipes.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size={hasAffectedRecipes ? 'md' : 'sm'}
      classNames={{
        base: 'm-4 rounded-2xl bg-background border border-divider max-w-md w-full overflow-hidden'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3 pb-2 pt-4 px-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-base text-foreground">
                  {hasAffectedRecipes ? 'Cảnh báo liên kết công thức' : 'Xoá nguyên liệu'}
                </h3>
                <span className="text-xs text-default-500 font-normal">
                  {item.name}
                </span>
              </div>
            </ModalHeader>

            <ModalBody className="pt-1 pb-3 px-4 flex flex-col gap-3">
              {!hasAffectedRecipes ? (
                <p className="text-sm text-default-600">
                  Bạn có chắc muốn xoá nguyên liệu <span className="font-semibold text-foreground">&ldquo;{item.name}&rdquo;</span> khỏi từ điển? Thao tác này không thể hoàn tác.
                </p>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-warning/10 dark:bg-warning/20 border border-warning/20 text-xs text-warning leading-relaxed">
                    Nguyên liệu này đang được liên kết trong{' '}
                    <span className="font-bold">{affectedRecipes.length} công thức</span>. Vui lòng chọn cách xử lý để tránh làm hỏng dữ liệu công thức:
                  </div>

                  {/* List of affected recipes */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {affectedRecipes.map((r, idx) => (
                      <div
                        key={r.id || idx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-default-100 text-xs text-default-700"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{r.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* 2 Choices for cascading delete */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-divider">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        await onDetachFromRecipes();
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-divider hover:border-primary/60 bg-content2 dark:bg-default-100/50 hover:bg-primary/10 dark:hover:bg-primary/20 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Unlink className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-foreground group-hover:text-primary">
                          Gỡ liên kết & Giữ tên trong món (Khuyên dùng)
                        </div>
                        <div className="text-[11px] text-default-500 mt-0.5 leading-snug">
                          Tên &ldquo;{item.name}&rdquo; vẫn được giữ nguyên trong các món dưới dạng chữ, công thức không bị mất nguyên liệu.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        await onRemoveFromRecipes();
                        onClose();
                      }}
                      className="w-full text-left p-2.5 rounded-xl border border-danger/30 hover:border-danger bg-content2 dark:bg-default-100/50 hover:bg-danger/10 dark:hover:bg-danger/20 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-danger">
                          Xoá hoàn toàn khỏi các công thức
                        </div>
                        <div className="text-[11px] text-default-500 mt-0.5 leading-snug">
                          Dòng nguyên liệu này sẽ bị xoá vĩnh viễn khỏi tất cả {affectedRecipes.length} công thức ở trên.
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="px-4 py-3 border-t border-divider flex items-center justify-end gap-2">
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={isLoading}
                className="h-10 rounded-xl px-4 text-xs font-medium"
              >
                Hủy bỏ
              </Button>

              {!hasAffectedRecipes && (
                <Button
                  color="danger"
                  onPress={async () => {
                    await onConfirmDeleteDirect();
                    onClose();
                  }}
                  isLoading={isLoading}
                  startContent={!isLoading && <Trash2 className="w-4 h-4" />}
                  className="h-10 rounded-xl px-4 text-xs font-semibold"
                >
                  Xoá nguyên liệu
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
