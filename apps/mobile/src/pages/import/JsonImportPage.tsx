import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Spinner, 
  Progress,
  toast 
} from '@/ui';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChefHat, 
  Lightbulb, 
  Scale, 
  Search, 
  Copy, 
  Sparkles,
  ChevronRight,
  ClipboardPaste
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

export function JsonImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { recipes } = useRecipeStore();
  const { tips } = useTipStore();
  const { units } = useUnitStore();

  const [inputTab, setInputTab] = useState<'file' | 'paste'>('file');
  const [pastedJson, setPastedJson] = useState('');

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

  const handleProcessRawJson = (rawContent: string, fileName = 'du-lieu.json') => {
    try {
      const result = parseAndValidateJson(
        rawContent,
        { recipes, tips, units },
        fileName
      );
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
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Import error:', err);
      toast.error(t('importJson.errorToast') + ': ' + (err?.message || ''));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setParseResult(null);
    setImportSummary(null);
    setPastedJson('');
    setSearchQuery('');
    setFilterStatus('all');
  };

  const filteredItems = useMemo(() => {
    if (!parseResult) return [];
    let items = parseResult.items;

    if (filterStatus !== 'all') {
      items = items.filter(i => i.status === filterStatus);
    }

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
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <PageHeader 
        title={t('importJson.title')} 
        showBackButton
        onBack={() => navigate(-1)}
      />

      {/* OVERLAY SPINNER KHI ĐANG NHẬP DỮ LIỆU */}
      {isImporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-content1 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-divider flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-200">
            <Spinner size="lg" color="primary" />
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">{t('importJson.savingProgress')}</h3>
              <p className="text-xs text-default-400">{t('importJson.savingProgressDesc')}</p>
            </div>
            {importProgress.total > 0 && (
              <div className="w-full mt-2">
                <div className="flex items-center justify-between text-xs text-default-500 mb-1">
                  <span className="truncate max-w-[180px] font-medium">{importProgress.currentName}</span>
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

      <div className="flex-1 px-4 py-4 flex flex-col gap-4">
        {/* BƯỚC 4: THÔNG BÁO HOÀN THÀNH */}
        {importSummary && (
          <div className="bg-success/10 border border-success/30 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-success/20 text-success flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{t('importJson.successTitle')}</h2>
              <p className="text-xs text-default-400 mt-0.5">{t('importJson.successDesc')}</p>
            </div>

            <div className="flex flex-col gap-1.5 w-full my-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-success/10 text-success font-medium">
                <span>{t('importJson.newAdded')}:</span>
                <span className="font-bold">+{importSummary.importedCount}</span>
              </div>
              {importSummary.updatedCount > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-warning/10 text-warning font-medium">
                  <span>{t('importJson.updated')}:</span>
                  <span className="font-bold">{importSummary.updatedCount}</span>
                </div>
              )}
              {importSummary.skippedCount > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-default-100 text-default-500 font-medium">
                  <span>{t('importJson.skipped')}:</span>
                  <span className="font-bold">{importSummary.skippedCount}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <Button
                color="primary"
                onPress={() => navigate('/recipes')}
                endContent={<ChevronRight className="w-4 h-4" />}
                className="w-full rounded-2xl font-bold text-sm h-11"
              >
                {t('importJson.viewRecipes')}
              </Button>
              <Button
                variant="flat"
                onPress={handleReset}
                className="w-full rounded-2xl font-medium text-xs h-10"
              >
                {t('importJson.importAnother')}
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 1: CHỌN HOẶC DÁN TỆP (Khi chưa phân tích) */}
        {!parseResult && !importSummary && (
          <div className="flex flex-col gap-4">
            {/* Input Toggle */}
            <div className="flex items-center bg-content2/40 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setInputTab('file')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  inputTab === 'file'
                    ? 'bg-content1 text-foreground shadow-sm'
                    : 'text-default-400'
                }`}
              >
                {t('importJson.tabFile')}
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  inputTab === 'paste'
                    ? 'bg-content1 text-foreground shadow-sm'
                    : 'text-default-400'
                }`}
              >
                {t('importJson.tabPaste')}
              </button>
            </div>

            {inputTab === 'file' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-divider hover:border-primary active:scale-[0.99] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-content1/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  {t('importJson.dragDrop')}
                </h3>
                <p className="text-xs text-default-400 max-w-xs mb-3">
                  {t('importJson.fileHelp')}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-default-400 bg-default-100/70 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                  <span>{t('importJson.autoCheck')}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-default-400">{t('importJson.pasteLabel')}</span>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={handlePasteFromClipboard}
                    startContent={<ClipboardPaste className="w-3.5 h-3.5 text-primary" />}
                    className="text-xs text-primary h-7 px-2"
                  >
                    {t('importJson.pasteFromClipboard')}
                  </Button>
                </div>
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='[{"title": "...", "ingredients": []}]'
                  rows={8}
                  className="w-full p-3.5 rounded-2xl bg-content2/30 border border-divider text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  color="primary"
                  isDisabled={!pastedJson.trim()}
                  onPress={() => handleProcessRawJson(pastedJson, 'pasted-data.json')}
                  className="w-full rounded-2xl font-bold text-sm h-11"
                >
                  {t('importJson.parseBtn')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* BƯỚC 2: THÔNG BÁO DỮ LIỆU & BỘ LỌC KIỂM TRA (Pre-import validation) */}
        {parseResult && !importSummary && (
          <div className="flex flex-col gap-4 animate-in fade-in-50 duration-200">
            {/* Header tệp đã chọn */}
            <div className="flex items-center justify-between bg-content2/40 px-3.5 py-2.5 rounded-2xl">
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {parseResult.fileName}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-primary font-medium"
              >
                {t('importJson.selectAnotherFile')}
              </button>
            </div>

            {/* 3 Thẻ thống kê tình trạng: Hợp lệ, Trùng lặp, Không hợp lệ */}
            <div className="grid grid-cols-3 gap-2">
              {/* Hợp lệ */}
              <div
                onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  filterStatus === 'valid'
                    ? 'border-success bg-success/20 ring-2 ring-success/30'
                    : 'border-success/20 bg-success/10 hover:bg-success/15'
                }`}
              >
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-base font-bold">{parseResult.validCount}</span>
                </div>
                <span className="text-[10px] text-default-500 font-medium">{t('importJson.valid')}</span>
              </div>

              {/* Trùng lặp */}
              <div
                onClick={() => setFilterStatus(filterStatus === 'duplicate' ? 'all' : 'duplicate')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  filterStatus === 'duplicate'
                    ? 'border-warning bg-warning/20 ring-2 ring-warning/30'
                    : 'border-warning/20 bg-warning/10 hover:bg-warning/15'
                }`}
              >
                <div className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-base font-bold">{parseResult.duplicateCount}</span>
                </div>
                <span className="text-[10px] text-default-500 font-medium">{t('importJson.duplicate')}</span>
              </div>

              {/* Lỗi */}
              <div
                onClick={() => setFilterStatus(filterStatus === 'invalid' ? 'all' : 'invalid')}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  filterStatus === 'invalid'
                    ? 'border-danger bg-danger/20 ring-2 ring-danger/30'
                    : 'border-danger/20 bg-danger/10 hover:bg-danger/15'
                }`}
              >
                <div className="flex items-center gap-1 text-danger">
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="text-base font-bold">{parseResult.invalidCount}</span>
                </div>
                <span className="text-[10px] text-default-500 font-medium">{t('importJson.invalid')}</span>
              </div>
            </div>

            {/* Xử lý trùng lặp nếu có */}
            {parseResult.duplicateCount > 0 && (
              <div className="bg-content2/30 border border-divider p-3.5 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('importJson.conflictTitle')} ({parseResult.duplicateCount}):</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    conflictStrategy === 'skip' ? 'border-primary bg-primary/10 font-bold' : 'border-divider bg-content1'
                  }`}>
                    <span className="text-foreground">{t('importJson.conflictSkip')}</span>
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'skip'}
                      onChange={() => setConflictStrategy('skip')}
                      className="accent-primary"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    conflictStrategy === 'overwrite' ? 'border-primary bg-primary/10 font-bold' : 'border-divider bg-content1'
                  }`}>
                    <span className="text-foreground">{t('importJson.conflictOverwrite')}</span>
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'overwrite'}
                      onChange={() => setConflictStrategy('overwrite')}
                      className="accent-primary"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    conflictStrategy === 'create_copy' ? 'border-primary bg-primary/10 font-bold' : 'border-divider bg-content1'
                  }`}>
                    <span className="text-foreground">{t('importJson.conflictKeepBoth')}</span>
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'create_copy'}
                      onChange={() => setConflictStrategy('create_copy')}
                      className="accent-primary"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Danh sách xem trước */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground">
                  {t('importJson.previewList')} ({filteredItems.length} {t('collections.items')})
                </span>
                <div className="relative w-44">
                  <Search className="w-3 h-3 text-default-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('importJson.searchItemPlaceholder')}
                    className="w-full pl-7 pr-2 py-1 rounded-xl bg-default-100 border border-divider text-xs text-foreground placeholder:text-default-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-content1 rounded-2xl border border-divider divide-y divide-divider/30 max-h-60 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-default-400">
                    {t('importJson.noMatchingItems')}
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isRecipe = item.type === 'recipe';
                    const isTip = item.type === 'tip';

                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isRecipe ? 'bg-primary/10 text-primary' : isTip ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'
                          }`}>
                            {isRecipe ? <ChefHat className="w-3.5 h-3.5" /> : isTip ? <Lightbulb className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                            <span className="text-[10px] text-default-400 truncate">
                              {item.statusReason || item.subtitle || (isRecipe ? t('nav.recipes') : isTip ? t('nav.kitchenTips') : t('nav.units'))}
                            </span>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div className="shrink-0">
                          {item.status === 'valid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">
                              {t('importJson.valid')}
                            </span>
                          )}
                          {item.status === 'duplicate' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning">
                              {t('importJson.duplicate')}
                            </span>
                          )}
                          {item.status === 'invalid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/15 text-danger">
                              {t('importJson.invalid')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* STICKY BOTTOM BAR ĐỂ XÁC NHẬN NHẬP */}
            <div className="fixed bottom-0 left-0 right-0 bg-content1 border-t border-divider p-4 z-40 flex items-center gap-3">
              <Button
                variant="flat"
                onPress={handleReset}
                className="rounded-2xl text-xs font-medium h-11 px-4"
              >
                {t('common.actions.cancel')}
              </Button>

              <Button
                color="primary"
                onPress={handleConfirmImport}
                isDisabled={importableCount === 0}
                className="flex-1 rounded-2xl font-bold text-sm h-11 shadow-lg shadow-primary/25"
              >
                {t('importJson.confirmImport', { count: importableCount })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
