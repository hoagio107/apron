import { useFormContext } from 'react-hook-form';
import { Chip } from '@/ui';
import { Lightbulb, X } from 'lucide-react';
import type { FormValues } from './schema';
import { useTipStore } from '../../../store/useTipStore';
import { useEffect } from 'react';

export function LinkedTipsSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const linkedTips = watch('linked_tips') || [];
  const { tips, fetchTips } = useTipStore();

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const handleRemove = (id: string) => {
    setValue('linked_tips', linkedTips.filter(tipId => tipId !== id));
  };

  if (linkedTips.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-primary/10 dark:bg-primary/15 rounded-xl border border-primary/20">
      <div className="flex items-center gap-2 text-primary">
        <Lightbulb className="w-5 h-5" />
        <h3 className="font-semibold">Mẹo nhà bếp liên kết</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {linkedTips.map(id => {
          const tip = tips.find(t => t.id === id);
          if (!tip) return null;
          return (
            <Chip 
              key={id} 
              variant="flat" 
              color="primary"
              className="pl-1 pr-2"
              startContent={<div className="w-4 h-4 ml-1 rounded-full bg-primary-100 flex items-center justify-center"><Lightbulb className="w-2.5 h-2.5 text-primary-700" /></div>}
              endContent={
                <button type="button" onClick={() => handleRemove(id)} className="p-0.5 active:bg-primary-200 rounded-full text-primary-700 transition-colors ml-1">
                  <X className="w-3 h-3" />
                </button>
              }
            >
              {tip.title}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
