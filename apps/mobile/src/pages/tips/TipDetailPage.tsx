import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, 
  Modal, 
  ModalContent, 
  ModalBody, 
  useDisclosure, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem, 
  Spinner, 
  toast 
} from '@/ui';
import { FEEDBACK_RESET_DELAY_MS } from '../../constants';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share, 
  Copy, 
  MoreVertical, 
  Maximize2, 
  X, 
  Lightbulb,
  Check
} from 'lucide-react';
import { useTipStore } from '../../store/useTipStore';
import { TIP_CATEGORIES, type Tip, TipRepository } from '@apron/core';
import { ImageManager } from '../../lib/image-manager';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TipFormModal } from './components/TipFormModal';
import { ConfirmModal } from '../../components/shared/ConfirmModal';

export function TipDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { tips, fetchTips, deleteTip } = useTipStore();
  
  const [tip, setTip] = useState<Tip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Lightbox for cover image
  const { isOpen: isLightboxOpen, onOpen: openLightbox, onClose: closeLightbox } = useDisclosure();

  // Load tips in store if empty
  useEffect(() => {
    if (tips.length === 0) {
      fetchTips();
    }
  }, [tips.length, fetchTips]);

  // Fetch or resolve active tip
  useEffect(() => {
    if (!id) return;

    const existing = tips.find(t => t.id === id);
    if (existing) {
      setTip(existing);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      TipRepository.getById(id)
        .then(data => {
          setTip(data);
        })
        .catch(err => {
          console.error('Failed to load tip:', err);
          setTip(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, tips]);

  // Category resolution with smart fallback
  const category = useMemo(() => {
    if (!tip) return null;
    const cat = TIP_CATEGORIES.find(c => 
      c.id === tip.category_id || 
      (tip as any).tags?.some((t: string) => t.includes(c.id) || c.name.toLowerCase().includes(t.replace(/mẹo-?/g, '').toLowerCase()))
    );
    if (cat) return cat;
    const firstTag = (tip as any).tags?.[0];
    if (firstTag) {
      const formatted = firstTag.replace(/-/g, ' ').replace(/^mẹo\s*/i, '');
      return {
        id: firstTag,
        name: `Mẹo ${formatted}`,
        icon: 'Lightbulb',
        color: 'bg-primary/20 text-primary',
        description: 'Bí quyết hữu ích được chọn lọc cho không gian nấu nướng của bạn.'
      };
    }
    return {
      id: 'general',
      name: 'Mẹo nhà bếp',
      icon: 'Lightbulb',
      color: 'bg-primary/20 text-primary',
      description: 'Tổng hợp các bí quyết, kinh nghiệm giúp việc nấu nướng trở nên dễ dàng và thú vị hơn.'
    };
  }, [tip]);

  // Reading time calculation (~300 characters / minute)
  const readingTime = useMemo(() => {
    if (!tip?.content) return 1;
    const cleanText = tip.content.replace(/<[^>]*>?/gm, '').trim();
    return Math.max(1, Math.ceil(cleanText.length / 300));
  }, [tip?.content]);

  // Copy full content
  const handleCopyContent = async () => {
    if (!tip) return;
    const cleanText = tip.content ? tip.content.replace(/<[^>]*>?/gm, '').trim() : '';
    const shareText = `💡 ${tip.title}\n\n${cleanText}\n\n— Chia sẻ từ Apron Kitchen`;
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      toast.success('Đã sao chép nội dung mẹo vào bộ nhớ tạm!');
      setTimeout(() => setIsCopied(false), FEEDBACK_RESET_DELAY_MS);
    } catch {
      toast.error('Không thể sao chép văn bản.');
    }
  };

  // Share tip
  const handleShare = async () => {
    if (!tip) return;
    const cleanText = tip.content ? tip.content.replace(/<[^>]*>?/gm, '').trim() : '';
    const shareData = {
      title: tip.title,
      text: `💡 ${tip.title}\n\n${cleanText}\n\n— Chia sẻ từ Apron Kitchen`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    handleCopyContent();
  };

  // Delete tip
  const handleDeleteConfirm = async () => {
    if (!tip?.id) return;
    setIsDeleting(true);
    try {
      await deleteTip(tip.id);
      toast.success('Đã xóa mẹo thành công');
      navigate('/tips');
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xóa mẹo');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-default-500 bg-background">
        <Spinner size="lg" color="primary" />
        <p className="text-sm">Đang tải nội dung mẹo...</p>
      </div>
    );
  }

  if (!tip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-background text-foreground">
        <div className="w-16 h-16 rounded-3xl bg-default-100 flex items-center justify-center text-default-400 mb-4">
          <Lightbulb className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy mẹo</h2>
        <p className="text-default-500 mb-6 max-w-sm">Mẹo này có thể đã bị xóa hoặc liên kết không còn chính xác.</p>
        <Button color="primary" variant="flat" onPress={() => navigate('/tips')} startContent={<ArrowLeft className="w-4 h-4" />}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="app-page animate-in fade-in duration-300 pb-28 xl:pb-16" id="tip-detail-root">
      
      {/* ========================================================= */}
      {/* MOBILE VIEW (Dưới xl)                                     */}
      {/* ========================================================= */}
      <div className="flex xl:hidden flex-col w-full relative">
        
        {/* Full-width Hero Cover Image with Floating Action Buttons */}
        <div 
          className="relative w-full aspect-square sm:aspect-4/3 max-h-[400px] bg-default-100 overflow-hidden cursor-pointer group"
          onClick={() => tip.image_url && openLightbox()}
        >
          {tip.image_url ? (
            <img 
              src={ImageManager.getAssetUrl(tip.image_url)} 
              alt={tip.title}
              className="w-full h-full object-cover transition-transform duration-300 group-active:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-primary/10 to-default-200 flex flex-col items-center justify-center text-primary/60 gap-3">
              <Lightbulb className="w-16 h-16 stroke-[1.5]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-default-500">Mẹo nhà bếp</span>
            </div>
          )}

          {/* Floating Back Button (Top Left) */}
          <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
            <Button 
              isIconOnly 
              className="bg-background/80 backdrop-blur-md text-foreground rounded-full w-10 h-10 min-w-0 p-0 flex items-center justify-center border border-divider hover:bg-content1 active:scale-95 transition-all shadow-none"
              onPress={() => navigate('/tips')}
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </div>

          {/* Floating 3-Dots Dropdown Menu (Top Right) */}
          <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button 
                  isIconOnly 
                  className="bg-background/80 backdrop-blur-md text-foreground rounded-full w-10 h-10 min-w-0 p-0 flex items-center justify-center border border-divider hover:bg-content1 active:scale-95 transition-all shadow-none"
                  aria-label="Tùy chọn mẹo"
                >
                  <MoreVertical className="w-5 h-5 text-foreground" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Tùy chọn mẹo">
                <DropdownItem key="copy" startContent={<Copy className="w-4 h-4 text-primary" />} onPress={handleCopyContent}>
                  Sao chép nội dung
                </DropdownItem>
                <DropdownItem key="share" startContent={<Share className="w-4 h-4" />} onPress={handleShare}>
                  Chia sẻ mẹo
                </DropdownItem>
                <DropdownItem key="edit" startContent={<Edit className="w-4 h-4 text-default-500" />} onPress={() => setIsFormModalOpen(true)}>
                  Chỉnh sửa
                </DropdownItem>
                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />} onPress={() => setIsDeleteConfirmOpen(true)}>
                  Xóa mẹo
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Tap-to-view hint badge */}
          {tip.image_url && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white/90 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none border border-white/15">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Xem ảnh</span>
            </div>
          )}
        </div>

        {/* Title first, then clean metadata line below (No background, No border, Separated by dots) */}
        <div className="p-4 sm:p-6 pb-2 flex flex-col gap-2">
          {/* Prominent Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug text-foreground">
            {tip.title}
          </h1>

          {/* Metadata line below title: Category • Date • Reading time */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-default-500 font-medium">
            {category && (
              <span className="text-primary font-semibold">
                {category.name}
              </span>
            )}
            {category && <span className="text-default-400 font-bold">•</span>}
            <span>{tip.created_at ? format(new Date(tip.created_at), 'dd/MM/yyyy', { locale: vi }) : 'Gần đây'}</span>
            <span className="text-default-400 font-bold">•</span>
            <span>~{readingTime} phút đọc</span>
          </div>

          {/* Đường kẻ ngăn cách giữa các badge và nội dung chính của mẹo */}
          <div className="w-full border-b border-divider/60 pt-3" />
        </div>

        {/* Main Content Area (Clean article layout without enclosing card border or labels) */}
        <div className="px-4 sm:px-6 pt-2 pb-6">
          <div 
            className="prose prose-neutral prose-base sm:prose-lg max-w-none leading-relaxed text-foreground/90 
              prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight 
              prose-p:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1.5
              prose-strong:text-foreground prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: tip.content }}
          />
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="flex xl:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-divider/60 z-40 safe-area-inset-bottom items-center gap-3 animate-appearance-in pb-6">
          <Button 
            variant="flat"
            className="flex-1 rounded-xl font-semibold h-12 border border-divider/60 text-foreground bg-default-100 hover:bg-default-200 shadow-none"
            onPress={handleShare}
            startContent={<Share className="w-4 h-4 text-default-600" />}
          >
            Chia sẻ mẹo
          </Button>
          <Button 
            color="primary"
            className="flex-1 rounded-xl font-bold h-12 shadow-none"
            onPress={() => setIsFormModalOpen(true)}
            startContent={<Edit className="w-4 h-4" />}
          >
            Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP / TABLET VIEW (xl trở lên)                         */}
      {/* Clean, Focused Editorial Article Layout                   */}
      {/* ========================================================= */}
      <div className="hidden xl:flex flex-col max-w-4xl mx-auto w-full px-8 pt-6 gap-6">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center">
          <Button
            variant="light"
            size="sm"
            onPress={() => navigate('/tips')}
            startContent={<ArrowLeft className="w-4 h-4" />}
            className="text-default-600 hover:text-foreground font-medium -ml-2"
          >
            Quay lại danh sách mẹo
          </Button>
        </div>

        {/* Cover Image */}
        <div 
          className="w-full aspect-16/9 max-h-[460px] rounded-3xl overflow-hidden bg-default-100 relative cursor-pointer group border border-divider/40"
          onClick={() => tip.image_url && openLightbox()}
        >
          {tip.image_url ? (
            <img 
              src={ImageManager.getAssetUrl(tip.image_url)} 
              alt={tip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/20 via-primary/10 to-default-200 text-primary/60 gap-3">
              <Lightbulb className="w-20 h-20 stroke-[1.5]" />
              <span className="text-sm font-semibold uppercase tracking-wider text-default-500">Mẹo nhà bếp</span>
            </div>
          )}

          {tip.image_url && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-sm">
              <Maximize2 className="w-5 h-5" />
              <span>Bấm để phóng to ảnh</span>
            </div>
          )}
        </div>

        {/* Header Section: Title first, then clean metadata line below (No background, No border, Separated by dots) */}
        <div className="flex flex-col gap-3 pb-4 border-b border-divider/40">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-foreground font-headline">
            {tip.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Metadata line: Category • Date • Reading time */}
            <div className="flex flex-wrap items-center gap-2.5 text-base text-default-500 font-medium">
              {category && (
                <span className="text-primary font-semibold">
                  {category.name}
                </span>
              )}
              {category && <span className="text-default-400 font-bold">•</span>}
              <span>{tip.created_at ? format(new Date(tip.created_at), 'dd MMMM, yyyy', { locale: vi }) : 'Gần đây'}</span>
              <span className="text-default-400 font-bold">•</span>
              <span>~{readingTime} phút đọc</span>
            </div>

            {/* Desktop Quick Actions Toolbar */}
            <div className="flex items-center gap-2">
              <Button 
                variant="flat" 
                size="sm"
                className="font-medium text-foreground bg-default-100 hover:bg-default-200"
                startContent={isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                onPress={handleCopyContent}
              >
                {isCopied ? 'Đã sao chép' : 'Sao chép'}
              </Button>
              <Button 
                variant="flat" 
                size="sm"
                className="font-medium text-foreground bg-default-100 hover:bg-default-200"
                startContent={<Share className="w-4 h-4" />}
                onPress={handleShare}
              >
                Chia sẻ
              </Button>
              <Button 
                variant="flat" 
                size="sm"
                className="font-medium text-primary bg-primary/10 hover:bg-primary/20"
                startContent={<Edit className="w-4 h-4" />}
                onPress={() => setIsFormModalOpen(true)}
              >
                Chỉnh sửa
              </Button>
              <Button 
                isIconOnly 
                size="sm"
                variant="flat" 
                color="danger"
                className="bg-danger/10 text-danger hover:bg-danger/20"
                onPress={() => setIsDeleteConfirmOpen(true)}
                aria-label="Xóa mẹo"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Prose Rich Text Content (Clean, beautiful article view without card box) */}
        <div className="pt-2 pb-8">
          <div 
            className="prose prose-neutral prose-lg max-w-none leading-relaxed text-foreground/90 
              prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight 
              prose-p:my-4 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5
              prose-strong:text-foreground prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: tip.content }}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS & OVERLAYS                                         */}
      {/* ========================================================= */}

      {/* Fullscreen Image Lightbox Modal */}
      <Modal 
        size="4xl" 
        isOpen={isLightboxOpen} 
        onClose={closeLightbox} 
        placement="center" 
        classNames={{ base: "bg-transparent shadow-none" }} 
        backdrop="blur"
        hideCloseButton
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="p-0 overflow-hidden rounded-3xl flex items-center justify-center relative">
              <Button 
                isIconOnly 
                className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full active:scale-95 transition-transform" 
                onPress={onClose}
                aria-label="Đóng ảnh"
              >
                <X className="w-5 h-5"/>
              </Button>
              {tip.image_url && (
                <img 
                  src={ImageManager.getAssetUrl(tip.image_url)} 
                  alt={tip.title}
                  className="w-full max-h-[85vh] object-contain rounded-2xl bg-black/40 shadow-2xl" 
                />
              )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      {/* Tip Form Modal (Edit Tip) */}
      <TipFormModal 
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        tipId={tip.id}
        onSuccess={() => {
          if (tip.id) {
            TipRepository.getById(tip.id).then(data => {
              if (data) setTip(data);
            });
            fetchTips();
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Xóa mẹo nhà bếp"
        description={`Bạn có chắc chắn muốn xóa mẹo "${tip.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa mẹo"
        confirmColor="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
