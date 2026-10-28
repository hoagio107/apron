import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Spinner, 
  Progress,
  Tabs, 
  Tab, 
  Textarea, 
  Chip, 
  toast 
} from '@/ui';
import { 
  FileUp, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChefHat, 
  Lightbulb, 
  Scale, 
  Search, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  ChevronRight, 
  ClipboardPaste,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  parseAndValidateJson, 
  executeImport, 
  type ParseResult, 
  type DuplicateConflictStrategy,
  useRecipeStore,
  useTipStore,
  useUnitStore
} from '@apron/core';
import { useTranslation } from 'react-i18next';

export interface JsonImportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function JsonImportModal({ isOpen, onOpenChange, onSuccess }: JsonImportModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { recipes } = useRecipeStore();
  const { tips } = useTipStore();
  const { units } = useUnitStore();

  const [inputTab, setInputTab] = useState<'file' | 'paste'>('file');
  const [pastedJson, setPastedJson] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Parsing & Analysis state
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<DuplicateConflictStrategy>('skip');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'duplicate' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number; currentName: string }>({
    completed: 0,
    total: 0,
    currentName: '',
  });
  const [importSummary, setImportSummary] = useState<{
    totalProcessed: number;
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
  } | null>(null);

  const { t } = useTranslation();

  const handleReset = () => {
    setParseResult(null);
    setImportSummary(null);
    setPastedJson('');
    setSearchQuery('');
    setFilterStatus('all');
    setConflictStrategy('skip');
    setIsImporting(false);
  };

  const handleModalClose = () => {
    if (isImporting) {
      toast.warning(t('importJson.savingProgress'));
      return;
    }
    handleReset();
    onOpenChange(false);
  };

  const handleProcessRawJson = (rawContent: string, fileName = 'du-lieu.json') => {
    try {
      const result = parseAndValidateJson(rawContent, { recipes, tips, units }, fileName);
      setParseResult(result);
      setImportSummary(null);
      if (result.totalItems === 0) {
        toast.warning(t('common.status.noResults'));
      } else {
        toast.success(t('importJson.validSummary', {
          recipes: result.items.filter(i => i.type === 'recipe').length,
          tips: result.items.filter(i => i.type === 'tip').length,
          units: result.items.filter(i => i.type === 'unit').length,
        }));
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('JSON parse error:', err);
      toast.error(err?.message || t('importJson.errorToast'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessRawJson(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error(t('importJson.errorToast'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessRawJson(content, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPastedJson(text);
        toast.success(t('importJson.pastedSuccess'));
      }
    } catch {
      toast.info(t('importJson.pasteLabel'));
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;
    setIsImporting(true);
    setImportProgress({ completed: 0, total: parseResult.items.length, currentName: t('common.status.loading') });

    try {
      const summary = await executeImport(
        parseResult.items,
        conflictStrategy,
        (completed, total, currentName) => {
          setImportProgress({ completed, total, currentName });
        }
      );
      setImportSummary(summary);
      toast.success(t('importJson.successToast', {
        recipes: summary.importedCount,
        tips: summary.updatedCount,
        units: summary.skippedCount,
      }));
      if (onSuccess) onSuccess();
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Import error:', err);
      toast.error(t('importJson.errorToast') + ': ' + (err?.message || ''));
    } finally {
      setIsImporting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!parseResult) return [];
    let items = parseResult.items;
    if (filterStatus !== 'all') items = items.filter(i => i.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => (i.title || '').toLowerCase().includes(q));
    }
    return items;
  }, [parseResult, filterStatus, searchQuery]);

  const importableCount = parseResult
    ? conflictStrategy === 'skip'
      ? parseResult.validCount
      : parseResult.validCount + parseResult.duplicateCount
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
        else onOpenChange(true);
      }}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        wrapper: "z-[200]",
        base: "bg-content1 rounded-3xl max-h-[90vh] shadow-2xl border border-divider/40 overflow-hidden",
        header: "border-b border-divider/40 px-6 py-4 shrink-0",
        body: "p-6 overflow-y-auto space-y-4",
        footer: "border-t border-divider/40 px-6 py-3.5 shrink-0 flex items-center justify-between gap-3 bg-content1"
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileUp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">{t('importJson.title')}</h3>
                    <Chip size="sm" variant="flat" color="primary" className="font-semibold text-xs">
                      {parseResult ? `${parseResult.totalItems} ${t('collections.items')}` : 'JSON Import'}
                    </Chip>
                  </div>
                  <p className="text-xs text-default-400 font-normal">
                    {parseResult ? `${t('importJson.subtitle')}: ${parseResult.fileName}` : t('importJson.fileHelp')}
                  </p>
                </div>
              </div>

              {parseResult && !importSummary && !isImporting && (
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleReset}
                  startContent={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold rounded-xl text-default-600 hover:text-foreground"
                >
                  {t('importJson.selectAnotherFile')}
                </Button>
              )}
            </ModalHeader>

            <ModalBody className="p-6 relative">
              {isImporting && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="bg-content1 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-divider flex flex-col items-center gap-5">
                    <Spinner size="lg" color="primary" />
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">{t('importJson.savingProgress')}</h3>
                      <p className="text-xs text-default-400 max-w-xs">
                        {t('importJson.savingProgressDesc')}
                      </p>
                    </div>

                    {importProgress.total > 0 && (
                      <div className="w-full space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs text-default-500 font-medium">
                          <span className="truncate max-w-[220px]">{importProgress.currentName}</span>
                          <span className="font-mono">{importProgress.completed} / {importProgress.total}</span>
                        </div>
                        <Progress
                          aria-label="Progress"
                          size="sm"
                          color="primary"
                          value={Math.round((importProgress.completed / importProgress.total) * 100)}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!parseResult && !importSummary && (
                <div className="space-y-4">
                  <Tabs 
                    selectedKey={inputTab} 
                    onSelectionChange={(k) => setInputTab(k as 'file' | 'paste')}
                    color="primary"
                    variant="underlined"
                    classNames={{
                      tabList: "gap-6 border-b border-divider/40 pb-0 px-1 w-full",
                      tab: "h-10 px-1 font-semibold text-sm",
                      cursor: "w-full bg-primary"
                    }}
                  >
                    <Tab 
                      key="file" 
                      title={
                        <div className="flex items-center gap-2">
                          <FileUp className="w-4 h-4" />
                          <span>{t('importJson.tabFile')}</span>
                        </div>
                      } 
                    />
                    <Tab 
                      key="paste" 
                      title={
                        <div className="flex items-center gap-2">
                          <ClipboardPaste className="w-4 h-4" />
                          <span>{t('importJson.tabPaste')}</span>
                        </div>
                      } 
                    />
                  </Tabs>

                  {inputTab === 'file' ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isDragging 
                          ? 'border-primary bg-primary/10 scale-[0.99]' 
                          : 'border-divider hover:border-primary/60 bg-content2/30 hover:bg-content2/50'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-foreground mb-1.5">
                        {t('importJson.dragDrop')}
                      </h4>
                      <p className="text-xs text-default-400 max-w-md mb-4 leading-relaxed">
                        {t('importJson.fileHelp')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-default-500 bg-content1 px-3.5 py-1.5 rounded-full border border-divider shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-warning" />
                        <span>{t('importJson.autoCheck')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <ClipboardPaste className="w-4 h-4 text-primary" />
                          {t('importJson.pasteLabel')}
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={handlePasteFromClipboard}
                          startContent={<ClipboardPaste className="w-3.5 h-3.5" />}
                          className="text-xs text-primary font-medium h-7"
                        >
                          {t('importJson.pasteFromClipboard')}
                        </Button>
                      </div>

                      <Textarea
                        value={pastedJson}
                        onValueChange={setPastedJson}
                        placeholder={'[\n  {\n    "title": "...",\n    "ingredients": []\n  }\n]'}
                        minRows={8}
                        maxRows={12}
                        classNames={{
                          inputWrapper: "bg-content2/40 hover:bg-content2/60 border border-divider rounded-2xl p-3.5 font-mono text-xs",
                          input: "font-mono text-xs text-foreground"
                        }}
                      />

                      <div className="flex justify-end pt-1">
                        <Button
                          color="primary"
                          isDisabled={!pastedJson.trim()}
                          onPress={() => handleProcessRawJson(pastedJson, 'pasted-snippet.json')}
                          className="font-bold text-sm px-6 h-10 rounded-xl"
                        >
                          {t('importJson.parseBtn')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {parseResult && !importSummary && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3.5 ${
                        filterStatus === 'valid'
                          ? 'border-success bg-success/20 ring-2 ring-success/30 shadow-md'
                          : 'border-success/30 bg-success/10 hover:bg-success/15'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-success/20 text-success flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-black text-foreground">{parseResult.validCount}</span>
                          <span className="text-xs font-bold text-success uppercase tracking-wider">{t('importJson.valid')}</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">{t('importJson.validDesc')}</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterStatus(filterStatus === 'duplicate' ? 'all' : 'duplicate')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3.5 ${
                        filterStatus === 'duplicate'
                          ? 'border-warning bg-warning/20 ring-2 ring-warning/30 shadow-md'
                          : 'border-warning/30 bg-warning/10 hover:bg-warning/15'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-black text-foreground">{parseResult.duplicateCount}</span>
                          <span className="text-xs font-bold text-warning uppercase tracking-wider">{t('importJson.duplicate')}</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">{t('importJson.duplicateDesc')}</span>
                      </div>
                    </div>

                    <div
                      onClick={() => setFilterStatus(filterStatus === 'invalid' ? 'all' : 'invalid')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3.5 ${
                        filterStatus === 'invalid'
                          ? 'border-danger bg-danger/20 ring-2 ring-danger/30 shadow-md'
                          : 'border-danger/30 bg-danger/10 hover:bg-danger/15'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-black text-foreground">{parseResult.invalidCount}</span>
                          <span className="text-xs font-bold text-danger uppercase tracking-wider">{t('importJson.invalid')}</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">{t('importJson.invalidDesc')}</span>
                      </div>
                    </div>
                  </div>

                  {parseResult.duplicateCount > 0 && (
                    <div className="p-4 rounded-2xl bg-content2/40 border border-divider space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-warning">
                        <Copy className="w-4 h-4" />
                        <span>{t('importJson.conflictTitle')} ({parseResult.duplicateCount}):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div
                          onClick={() => setConflictStrategy('skip')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                            conflictStrategy === 'skip'
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                              : 'border-divider bg-content1 hover:bg-default-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{t('importJson.conflictSkip')}</span>
                            {conflictStrategy === 'skip' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            {t('importJson.skipDesc')}
                          </span>
                        </div>

                        <div
                          onClick={() => setConflictStrategy('overwrite')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                            conflictStrategy === 'overwrite'
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                              : 'border-divider bg-content1 hover:bg-default-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{t('importJson.conflictOverwrite')}</span>
                            {conflictStrategy === 'overwrite' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            {t('importJson.overwriteDesc')}
                          </span>
                        </div>

                        <div
                          onClick={() => setConflictStrategy('create_copy')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                            conflictStrategy === 'create_copy'
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                              : 'border-divider bg-content1 hover:bg-default-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{t('importJson.conflictKeepBoth')}</span>
                            {conflictStrategy === 'create_copy' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            {t('importJson.createCopyDesc')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {t('importJson.previewList')} ({filteredItems.length}/{parseResult.totalItems})
                        </span>
                        {filterStatus !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setFilterStatus('all')}
                            className="text-[11px] text-primary hover:underline"
                          >
                            {t('importJson.clearFilter')}
                          </button>
                        )}
                      </div>

                      <div className="relative w-56">
                        <Search className="w-3.5 h-3.5 text-default-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('importJson.searchItemPlaceholder')}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-content2/60 border border-divider text-xs text-foreground placeholder:text-default-400 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-content2/30 rounded-2xl border border-divider divide-y divide-divider/40 max-h-56 overflow-y-auto">
                      {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-default-400">
                          {t('importJson.noMatchingItems')}
                        </div>
                      ) : (
                        filteredItems.map((item) => {
                          const isRecipe = item.type === 'recipe';
                          const isTip = item.type === 'tip';

                          return (
                            <div key={item.id} className="p-3 px-4 flex items-center justify-between gap-3 hover:bg-content1 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isRecipe ? 'bg-primary/10 text-primary' : isTip ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'
                                }`}>
                                  {isRecipe ? <ChefHat className="w-4 h-4" /> : isTip ? <Lightbulb className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                                  <span className="text-[11px] text-default-400 truncate">
                                    {item.statusReason || item.subtitle || (isRecipe ? t('nav.recipes') : isTip ? t('nav.kitchenTips') : t('nav.units'))}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {item.status === 'valid' && (
                                  <Chip size="sm" variant="flat" color="success" className="font-semibold text-[11px] h-6">
                                    {t('importJson.valid')}
                                  </Chip>
                                )}
                                {item.status === 'duplicate' && (
                                  <Chip size="sm" variant="flat" color="warning" className="font-semibold text-[11px] h-6">
                                    {t('importJson.duplicate')}
                                  </Chip>
                                )}
                                {item.status === 'invalid' && (
                                  <Chip size="sm" variant="flat" color="danger" className="font-semibold text-[11px] h-6">
                                    {t('importJson.invalid')}
                                  </Chip>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {importSummary && (
                <div className="p-6 rounded-3xl bg-success/10 border border-success/30 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-success/20 text-success flex items-center justify-center shadow-lg shadow-success/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t('importJson.successTitle')}</h3>
                    <p className="text-xs text-default-400 max-w-sm mt-0.5">
                      {t('importJson.successDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-md my-1 text-xs">
                    <div className="p-3 rounded-xl bg-success/15 border border-success/20 text-success flex flex-col items-center">
                      <span className="text-lg font-black">+{importSummary.importedCount}</span>
                      <span className="font-medium text-[11px]">{t('importJson.newAdded')}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-warning/15 border border-warning/20 text-warning flex flex-col items-center">
                      <span className="text-lg font-black">{importSummary.updatedCount}</span>
                      <span className="font-medium text-[11px]">{t('importJson.updated')}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-default-100 border border-divider text-default-500 flex flex-col items-center">
                      <span className="text-lg font-black">{importSummary.skippedCount}</span>
                      <span className="font-medium text-[11px]">{t('importJson.skipped')}</span>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 flex items-center justify-between border-t border-divider/40 bg-content1">
              <div>
                {!parseResult && !importSummary && (
                  <div className="flex items-center gap-2 text-xs text-default-400">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span>{t('importJson.localFirstNotice')}</span>
                  </div>
                )}
                {parseResult && !importSummary && (
                  <span className="text-xs text-default-500 font-medium">
                    {t('importJson.willImport')}: <strong className="text-foreground">{importableCount}</strong> {t('collections.items')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {!parseResult && !importSummary && (
                  <Button variant="flat" onPress={handleModalClose} className="font-medium text-xs rounded-xl h-10 px-4">
                    {t('common.actions.close')}
                  </Button>
                )}

                {parseResult && !importSummary && (
                  <>
                    <Button variant="flat" onPress={handleReset} className="font-medium text-xs rounded-xl h-10 px-4">
                      {t('common.actions.cancel')}
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleConfirmImport}
                      isDisabled={importableCount === 0 || isImporting}
                      isLoading={isImporting}
                      className="font-bold text-xs rounded-xl h-10 px-5 shadow-lg shadow-primary/25"
                    >
                      {t('importJson.confirmImport', { count: importableCount })}
                    </Button>
                  </>
                )}

                {importSummary && (
                  <>
                    <Button variant="flat" onPress={handleReset} className="font-medium text-xs rounded-xl h-10 px-4">
                      {t('importJson.importAnother')}
                    </Button>
                    <Button
                      color="primary"
                      onPress={() => {
                        handleModalClose();
                        navigate('/recipes');
                      }}
                      endContent={<ChevronRight className="w-4 h-4" />}
                      className="font-bold text-xs rounded-xl h-10 px-5 shadow-lg shadow-primary/25"
                    >
                      {t('importJson.viewRecipes')}
                    </Button>
                  </>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
