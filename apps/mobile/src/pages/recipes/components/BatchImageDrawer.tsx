import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, 
  Button, Input, Badge, Spinner, Popover, PopoverTrigger, PopoverContent,
  toast
} from '@/ui';
import { 
  Images, Camera, Upload, Link as LinkIcon, Sparkles, 
  Trash2, RotateCcw, Check, AlertCircle, X, Search,
  Clock, Flame 
} from 'lucide-react';
import type { Recipe } from '@apron/core';
import { convertToWebP } from '../../../lib/image-utils';

interface BatchImageDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRecipes: Recipe[];
  onSave: (updates: { recipeId: string; imageUrl: string }[]) => Promise<void>;
}

// Curated high quality food presets for Vietnamese / international cooking
const FOOD_IMAGE_SUGGESTIONS = [
  { keyword: 'phở', label: 'Phở Bò / Gà', url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80' },
  { keyword: 'bún', label: 'Bún / Mì', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80' },
  { keyword: 'cơm', label: 'Cơm chiên / Món xào', url: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=800&q=80' },
  { keyword: 'gà', label: 'Gà rán / Gà sốt', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80' },
  { keyword: 'bò', label: 'Bò bít tết / Bò lúc lắc', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80' },
  { keyword: 'cá', label: 'Cá hồi áp chảo', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80' },
  { keyword: 'canh', label: 'Canh rau củ / Súp', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80' },
  { keyword: 'chua', label: 'Canh chua Nam Bộ', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80' },
  { keyword: 'salad', label: 'Salad bơ rau củ', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' },
  { keyword: 'sườn', label: 'Sườn xào chua ngọt / BBQ', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80' },
  { keyword: 'bánh', label: 'Bánh ngọt / Tráng miệng', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80' },
  { keyword: 'nướng', label: 'Món nướng BBQ', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80' },
];

export function BatchImageDrawer({
  isOpen,
  onOpenChange,
  selectedRecipes,
  onSave
}: BatchImageDrawerProps) {
  const { t } = useTranslation();
  // Map of recipeId -> current working image URL
  const [assignedImages, setAssignedImages] = useState<Record<string, string>>({});
  // Track loading state for each recipe (e.g. during file conversion)
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // URL Input modal state
  const [urlModalRecipeId, setUrlModalRecipeId] = useState<string | null>(null);
  const [urlInputValue, setUrlInputValue] = useState('');

  // File input refs map
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset or initialize state when opening drawer
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string> = {};
      selectedRecipes.forEach(r => {
        initial[r.id!] = r.image_url || r.images?.[0] || '';
      });
      setAssignedImages(initial);
      setSearchFilter('');
      setUrlModalRecipeId(null);
      setUrlInputValue('');
    }
  }, [isOpen, selectedRecipes]);

  // Handle local file selection
  const handleFileChange = async (recipeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProcessingIds(prev => ({ ...prev, [recipeId]: true }));
      const webpUrl = await convertToWebP(file);
      setAssignedImages(prev => ({ ...prev, [recipeId]: webpUrl }));
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error(t('recipes.form.imageUploadFailed') || 'Failed to process image.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [recipeId]: false }));
      // Reset input value so same file can be re-selected if needed
      event.target.value = '';
    }
  };

  // Handle URL input confirm
  const handleConfirmUrl = (recipeId: string) => {
    const trimmed = urlInputValue.trim();
    if (trimmed) {
      setAssignedImages(prev => ({ ...prev, [recipeId]: trimmed }));
    }
    setUrlModalRecipeId(null);
    setUrlInputValue('');
  };

  // Revert to original recipe image
  const handleRevert = (recipe: Recipe) => {
    setAssignedImages(prev => ({
      ...prev,
      [recipe.id!]: recipe.image_url || recipe.images?.[0] || ''
    }));
  };

  // Remove image
  const handleRemoveImage = (recipeId: string) => {
    setAssignedImages(prev => ({ ...prev, [recipeId]: '' }));
  };

  // Auto-suggest images for recipes that currently don't have an image
  const handleAutoSuggestMissing = () => {
    setAssignedImages(prev => {
      const next = { ...prev };
      selectedRecipes.forEach(r => {
        if (!next[r.id!]) {
          const title = (r.title || '').toLowerCase();
          const match = FOOD_IMAGE_SUGGESTIONS.find(s => title.includes(s.keyword));
          if (match) {
            next[r.id!] = match.url;
          } else {
            // Default attractive food image
            next[r.id!] = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
          }
        }
      });
      return next;
    });
  };

  // Check changed count
  const changedUpdates = selectedRecipes
    .filter(r => {
      const current = assignedImages[r.id!] ?? '';
      const original = r.image_url || r.images?.[0] || '';
      return current !== original;
    })
    .map(r => ({
      recipeId: r.id!,
      imageUrl: assignedImages[r.id!] || ''
    }));

  const changedCount = changedUpdates.length;
  const withImagesCount = selectedRecipes.filter(r => !!assignedImages[r.id!]).length;

  // Handle Save
  const handleSaveAll = async () => {
    if (changedCount === 0) {
      onOpenChange(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(changedUpdates);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error(t('recipes.form.imageUploadFailed') || 'Failed to save image.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRecipes = selectedRecipes.filter(r => 
    !searchFilter.trim() || (r.title || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <Drawer 
      isOpen={isOpen} 
      onOpenChange={onOpenChange} 
      size="2xl" 
      placement="bottom" 
      radius="none"
      hideCloseButton
      classNames={{
        base: "max-h-[calc(100dvh-var(--sat,0px)-20px)] rounded-t-3xl bg-content1 shadow-2xl flex flex-col mt-auto overflow-hidden",
        backdrop: "bg-black/60 backdrop-blur-sm",
        header: "border-b border-divider px-5 pt-3 pb-4 rounded-t-3xl bg-content1",
        body: "p-0 overflow-y-auto",
        footer: "border-t border-divider px-5 py-3 bg-content1/80 backdrop-blur-md pb-safe"
      }}
    >
      <DrawerContent className="rounded-t-3xl overflow-hidden">
        {(onClose) => (
          <>
            {/* Header */}
            <DrawerHeader className="flex flex-col gap-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-default-300 dark:bg-default-600 mx-auto -mt-0.5 mb-1" />
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-warning/15 text-warning">
                    <Images className="w-5 h-5" />
                  </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-foreground">
                    {t('recipes.actions.addImages')}
                  </h2>
                </div>
              </div>
              <Button 
                isIconOnly 
                variant="light" 
                size="sm" 
                className="rounded-full text-default-400 hover:text-default-600"
                onPress={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
              </div>
            </DrawerHeader>

            {/* Quick Actions & Statistics Bar */}
            <div className="px-5 py-3 bg-default-50/70 border-b border-divider flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-default-600">
                  <strong className="text-foreground">{withImagesCount} / {selectedRecipes.length}</strong>
                </span>
                {changedCount > 0 && (
                  <Badge color="success" variant="flat" size="sm" className="text-[11px] font-semibold">
                    {changedCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedRecipes.length > withImagesCount && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    className="h-8 text-xs font-medium rounded-full"
                    startContent={<Sparkles className="w-3.5 h-3.5" />}
                    onPress={handleAutoSuggestMissing}
                  >
                    AI Auto Suggest
                  </Button>
                )}
                {selectedRecipes.length > 4 && (
                  <Input
                    size="sm"
                    placeholder={t('common.actions.filter')}
                    value={searchFilter}
                    onValueChange={setSearchFilter}
                    startContent={<Search className="w-3.5 h-3.5 text-default-400" />}
                    className="max-w-[180px] h-8"
                    isClearable
                  />
                )}
              </div>
            </div>

            {/* Recipe List with individual photo pickers */}
            <DrawerBody className="p-4 md:p-6 space-y-4">
              {filteredRecipes.map((recipe) => {
                const recipeId = recipe.id!;
                const currentImg = assignedImages[recipeId] || '';
                const originalImg = recipe.image_url || recipe.images?.[0] || '';
                const isChanged = currentImg !== originalImg;
                const isProcessing = !!processingIds[recipeId];

                return (
                  <div 
                    key={recipeId}
                    className={`
                      flex items-start gap-3.5 p-3.5 md:p-4 rounded-2xl border transition-all
                      ${isChanged 
                        ? 'border-primary/50 dark:border-primary/40 bg-content1 dark:bg-default-50/20 shadow-xs ring-1 ring-primary/20' 
                        : 'border-divider/50 dark:border-default-100/20 bg-content1/60 dark:bg-default-50/10 hover:border-divider'}
                    `}
                  >
                    {/* Left: Image Box / Preview (No badges) */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-default-100 dark:bg-default-50/20 border border-divider/40 shrink-0 group shadow-2xs">
                      {isProcessing ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-default-100 dark:bg-default-50/20">
                          <Spinner size="sm" color="primary" />
                          <span className="text-[10px] text-default-500">{t('recipes.compressingImage') || 'Compressing WebP'}</span>
                        </div>
                      ) : currentImg ? (
                        <img 
                          src={currentImg} 
                          alt={recipe.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[recipeId]?.click()}
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-divider hover:border-primary hover:bg-primary/5 transition-all text-default-400 hover:text-primary p-2 text-center"
                        >
                          <Camera className="w-5 h-5 text-default-400" />
                          <span className="text-[10px] font-medium leading-tight">{t('common.status.empty')}</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Recipe Information + Action Buttons in the SAME column */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5 gap-2">
                      {/* Row 1: Title + Ready Status */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                          {recipe.title}
                        </h3>
                        {isChanged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-success/15 text-success border border-success/20 shrink-0">
                            <Check className="w-3 h-3 stroke-[2.5]" /> OK
                          </span>
                        )}
                      </div>

                      {/* Row 2: Stats */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-default-500">
                        {recipe.prep_time || recipe.cook_time ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-default-400 shrink-0" />
                            <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} {t('common.time.minutes')}</span>
                          </span>
                        ) : null}
                        {recipe.calories ? (
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-warning shrink-0" />
                            <span>{recipe.calories} kcal</span>
                          </span>
                        ) : null}
                        {recipe.difficulty && (
                          <span className="px-2 py-0.5 bg-default-100 dark:bg-default-50/30 rounded-md font-medium text-[11px] text-default-600">
                            {recipe.difficulty}
                          </span>
                        )}
                        {!currentImg && (
                          <span className="text-warning font-medium flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Photo needed
                          </span>
                        )}
                      </div>

                      {/* Row 3: Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {/* 1. Upload File Button */}
                        <Button
                          size="sm"
                          variant="flat"
                          className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl bg-default-100 dark:bg-default-50/30 hover:bg-default-200 text-foreground border border-divider/40 transition-colors shadow-2xs"
                          startContent={<Upload className="w-3.5 h-3.5 text-primary shrink-0" />}
                          onPress={() => fileInputRefs.current[recipeId]?.click()}
                          isLoading={isProcessing}
                        >
                          {t('common.actions.upload') || 'Upload'}
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { fileInputRefs.current[recipeId] = el; }}
                          onChange={(e) => handleFileChange(recipeId, e)}
                        />

                        {/* 2. Paste URL Button */}
                        <Popover 
                          isOpen={urlModalRecipeId === recipeId}
                          onOpenChange={(open) => {
                            if (open) {
                              setUrlModalRecipeId(recipeId);
                              setUrlInputValue(currentImg);
                            } else {
                              setUrlModalRecipeId(null);
                            }
                          }}
                          placement="top"
                          offset={8}
                        >
                          <PopoverTrigger>
                            <Button
                              size="sm"
                              variant="flat"
                              className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl bg-default-100 dark:bg-default-50/30 hover:bg-default-200 data-[state=open]:bg-default-200 text-foreground border border-divider/40 transition-colors shadow-2xs"
                              startContent={<LinkIcon className="w-3.5 h-3.5 text-default-500 shrink-0" />}
                            >
                              URL
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-3 w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-divider shadow-xl">
                            <div className="flex flex-col gap-2 w-full">
                              <span className="text-xs font-semibold text-foreground">
                                URL &ldquo;{recipe.title}&rdquo;
                              </span>
                              <Input
                                size="sm"
                                placeholder="https://example.com/photo.jpg"
                                value={urlInputValue}
                                onValueChange={setUrlInputValue}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-1">
                                <Button size="sm" variant="light" onPress={() => setUrlModalRecipeId(null)}>
                                  {t('common.actions.cancel')}
                                </Button>
                                <Button 
                                  size="sm" 
                                  color="primary" 
                                  isDisabled={!urlInputValue.trim()}
                                  onPress={() => handleConfirmUrl(recipeId)}
                                >
                                  {t('common.actions.apply')}
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* 3. Revert Button */}
                        {isChanged && (
                          <Button
                            size="sm"
                            variant="light"
                            className="h-7 sm:h-8 px-2 text-xs text-default-500 hover:text-foreground rounded-xl"
                            startContent={<RotateCcw className="w-3 h-3" />}
                            onPress={() => handleRevert(recipe)}
                          >
                            {t('common.actions.reset')}
                          </Button>
                        )}

                        {/* 4. Clear Image Button */}
                        {currentImg && (
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            className="h-7 sm:h-8 px-2 text-xs rounded-xl"
                            isIconOnly
                            onPress={() => handleRemoveImage(recipeId)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </DrawerBody>

            {/* Footer */}
            <DrawerFooter className="flex items-center justify-between shrink-0">
              <div className="text-xs text-default-500 font-medium">
                {changedCount > 0 ? (
                  <span><strong className="text-primary">{changedCount}</strong></span>
                ) : (
                  <span>{t('common.status.empty')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="light" 
                  size="md"
                  onPress={onClose}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button 
                  color="primary" 
                  size="md"
                  className="font-semibold shadow-md px-5"
                  onPress={handleSaveAll}
                  isLoading={isSaving}
                  isDisabled={changedCount === 0}
                >
                  {t('common.actions.save')} ({changedCount})
                </Button>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
