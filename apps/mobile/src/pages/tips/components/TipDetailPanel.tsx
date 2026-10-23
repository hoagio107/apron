import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button } from '@/ui';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import type { Tip } from '@apron/core';
import { TIP_CATEGORIES } from '@apron/core';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageManager } from '../../../lib/image-manager';

interface TipDetailPanelProps {
  tip: Tip | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (tipId: string) => void;
  onDelete?: (tipId: string) => void;
}

export function TipDetailPanel({ tip, isOpen, onOpenChange, onEdit, onDelete }: TipDetailPanelProps) {
  if (!tip) return null;

  const category = TIP_CATEGORIES.find(c => c.id === tip.category_id);

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="md" placement="right" radius="none" className="max-w-2xl">
      <DrawerContent>
        {() => (
          <div className="flex flex-col h-full bg-content1 text-foreground">
            {/* Header / Actions */}
            <DrawerHeader className="flex justify-between items-center border-b border-divider px-6 py-4 bg-content1/80 backdrop-blur-md z-50 sticky top-0">
              <div className="flex items-center gap-2">
                <Button 
                  variant="flat" 
                  size="md"
                  startContent={<Edit className="w-4 h-4" />}
                  onPress={() => onEdit?.(tip.id!)}
                >
                  Sửa
                </Button>
                <Button 
                  color="danger" 
                  variant="flat" 
                  size="md"
                  isIconOnly
                  onPress={() => onDelete?.(tip.id!)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            <DrawerBody className="p-0 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col min-h-full">
                {/* Immersive Cover Image */}
                <div className="w-full relative min-h-[300px] flex items-end">
                  {tip.image_url ? (
                    <img 
                      src={ImageManager.getAssetUrl(tip.image_url)} 
                      alt={tip.title}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-default-800 flex items-center justify-center z-0">
                      <div className="w-24 h-24 text-default-600 opacity-50 flex items-center justify-center rounded-full bg-white/5">
                        <span className="text-4xl font-bold">T</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                  
                  {/* Title and Meta overlaid on image */}
                  <div className="relative z-20 w-full p-8 pb-8 flex flex-col gap-4 text-white">
                    <div className="flex items-center gap-3">
                      {category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm">
                          {category.name}
                        </span>
                      )}
                      <div className="flex items-center text-xs text-white/80 gap-1.5 font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{tip.created_at ? format(new Date(tip.created_at), 'dd MMMM, yyyy', { locale: vi }) : ''}</span>
                      </div>
                    </div>

                    <h1 className="text-3xl font-bold leading-tight drop-shadow-md font-headline">
                      {tip.title}
                    </h1>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 bg-content1 text-foreground">
                  <div 
                    className="prose prose-primary dark:prose-invert max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: tip.content }}
                  />
                </div>
              </div>
            </DrawerBody>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
