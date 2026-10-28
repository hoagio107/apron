import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, toast } from '@/ui';
import { ArrowLeft, Edit, Trash2, Calendar, Lightbulb } from 'lucide-react';
import { useTipStore } from '../../store/useTipStore';
import { TIP_CATEGORIES, type Tip, TipRepository, sanitizeHtml } from '@apron/core';
import { ImageManager } from '../../lib/image-manager';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { TipFormModal } from './components/TipFormModal';
import { ConfirmModal } from '../../components/shared/ConfirmModal';

export function TipDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { deleteTip } = useTipStore();
  
  const [tip, setTip] = useState<Tip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      TipRepository.getById(id).then(data => {
        setTip(data);
        setIsLoading(false);
      });
    }
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-default-500">{t('common.loading')}</div>;
  }

  if (!tip) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <Lightbulb className="w-16 h-16 text-default-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('tips.emptySearchTitle')}</h2>
        <p className="text-default-500 mb-6">{t('tips.emptySearchDesc')}</p>
        <Button color="primary" onPress={() => navigate('/tips')}>{t('recipes.backToList')}</Button>
      </div>
    );
  }

  const category = TIP_CATEGORIES.find(c => c.id === tip.category_id);

  const handleDelete = async () => {
    if (!tip?.id) return;
    await deleteTip(tip.id);
    toast.success(t('tips.deletedSuccess', { defaultValue: 'Đã xoá mẹo thành công' }));
    navigate('/tips');
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12 min-h-full">
      {/* Header Actions */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-6 pb-4 mb-6 flex items-center justify-between border-b border-divider/50">
        <Button 
          variant="flat" 
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => navigate('/tips')}
        >
          Quay lại
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="flat" 
            startContent={<Edit className="w-4 h-4" />}
            onPress={() => setIsFormModalOpen(true)}
          >
            Chỉnh sửa
          </Button>
          <Button 
            color="danger" 
            variant="flat" 
            isIconOnly
            onPress={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        title={t('tips.deleteModalTitle', { defaultValue: 'Xoá mẹo nhà bếp' })}
        description={t('tips.confirmDelete')}
        confirmLabel={t('common.actions.delete', { defaultValue: 'Xoá' })}
        confirmColor="danger"
      />

      <TipFormModal 
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        tipId={tip.id}
        onSuccess={() => {
          TipRepository.getById(tip.id!).then(data => {
            setTip(data);
          });
        }}
      />

      <div className="app-card overflow-hidden flex flex-col md:min-h-[70vh]">
        {/* Immersive Cover Image */}
        <div className="w-full relative min-h-[300px] md:min-h-[400px] flex items-end">
          {tip.image_url ? (
            <img 
              src={ImageManager.getAssetUrl(tip.image_url)} 
              alt={tip.title}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-default-800 flex items-center justify-center z-0">
              <Lightbulb className="w-24 h-24 text-default-600" />
            </div>
          )}
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
          
          {/* Title and Meta overlaid on image */}
          <div className="relative z-20 w-full p-8 md:p-12 pb-8 flex flex-col gap-4 text-white">
            <div className="flex items-center gap-3">
              {category && (
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm">
                  {category.name}
                </span>
              )}
              <div className="flex items-center text-sm text-white/80 gap-1.5 font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <span>{tip.created_at ? format(new Date(tip.created_at), 'dd MMMM, yyyy', { locale: i18n.language === 'vi' ? vi : enUS }) : ''}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-md max-w-4xl font-headline">
              {tip.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 flex-1 bg-content1">
          <div 
            className="prose prose-lg prose-primary max-w-4xl mx-auto leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(tip.content) }}
          />
        </div>
      </div>
    </div>
  );
}
