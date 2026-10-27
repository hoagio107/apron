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
      toast.warning('Dữ liệu đang được nhập, vui lòng đợi hoàn tất.');
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
        toast.warning('Tệp không chứa dữ liệu công thức, mẹo hoặc đơn vị nào.');
      } else {
        toast.success(`Đã phân tích ${result.totalItems} mục dữ liệu!`);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('JSON parse error:', err);
      toast.error(err?.message || 'Tệp JSON không hợp lệ hoặc cấu trúc bị lỗi.');
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
      toast.error('Vui lòng chọn tệp định dạng .json');
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
        toast.success('Đã dán nội dung từ clipboard!');
      }
    } catch {
      toast.info('Vui lòng nhấn Ctrl+V để dán trực tiếp vào ô.');
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;
    setIsImporting(true);
    setImportProgress({ completed: 0, total: parseResult.items.length, currentName: 'Khởi tạo...' });

    try {
      const summary = await executeImport(
        parseResult.items,
        conflictStrategy,
        (completed, total, currentName) => {
          setImportProgress({ completed, total, currentName });
        }
      );
      setImportSummary(summary);
      toast.success(`Nhập dữ liệu hoàn tất: Thêm mới ${summary.importedCount} mục, Cập nhật ${summary.updatedCount} mục!`);
      if (onSuccess) onSuccess();
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Import error:', err);
      toast.error('Có lỗi xảy ra khi nhập dữ liệu: ' + (err?.message || ''));
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
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Nhập dữ liệu JSON</h3>
                    <Chip size="sm" variant="flat" color="primary" className="font-semibold text-xs">
                      {parseResult ? `${parseResult.totalItems} mục` : 'JSON Import'}
                    </Chip>
                  </div>
                  <p className="text-xs text-default-400 font-normal">
                    {parseResult ? `Tệp nguồn: ${parseResult.fileName}` : 'Nạp công thức, mẹo vặt & đơn vị đo vào cơ sở dữ liệu Apron'}
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
                  Chọn tệp khác
                </Button>
              )}
            </ModalHeader>

            <ModalBody className="p-6 relative">
              {isImporting && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                  <div className="bg-content1 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-divider flex flex-col items-center gap-5">
                    <Spinner size="lg" color="primary" />
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-1">Đang lưu trữ dữ liệu vào máy...</h3>
                      <p className="text-xs text-default-400 max-w-xs">
                        Đang ghi dữ liệu và đồng bộ chỉ mục tìm kiếm nhanh. Vui lòng không đóng cửa sổ.
                      </p>
                    </div>

                    {importProgress.total > 0 && (
                      <div className="w-full space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs text-default-500 font-medium">
                          <span className="truncate max-w-[220px]">{importProgress.currentName}</span>
                          <span className="font-mono">{importProgress.completed} / {importProgress.total}</span>
                        </div>
                        <Progress
                          aria-label="Tiến trình nhập dữ liệu"
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
                          <span>Tải tệp JSON (.json)</span>
                        </div>
                      } 
                    />
                    <Tab 
                      key="paste" 
                      title={
                        <div className="flex items-center gap-2">
                          <ClipboardPaste className="w-4 h-4" />
                          <span>Dán trực tiếp mã JSON</span>
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
                        Kéo thả tệp JSON vào đây, hoặc bấm để duyệt tệp
                      </h4>
                      <p className="text-xs text-default-400 max-w-md mb-4 leading-relaxed">
                        Hỗ trợ bản sao lưu Apron, danh sách công thức, mẹo vặt nhà bếp hoặc danh mục đơn vị đo.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-default-500 bg-content1 px-3.5 py-1.5 rounded-full border border-divider shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-warning" />
                        <span>Hệ thống tự động kiểm tra trùng lặp và phân loại trước khi lưu</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <ClipboardPaste className="w-4 h-4 text-primary" />
                          Dán chuỗi JSON vào khung bên dưới:
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={handlePasteFromClipboard}
                          startContent={<ClipboardPaste className="w-3.5 h-3.5" />}
                          className="text-xs text-primary font-medium h-7"
                        >
                          Dán từ Clipboard
                        </Button>
                      </div>

                      <Textarea
                        value={pastedJson}
                        onValueChange={setPastedJson}
                        placeholder={'[\n  {\n    "title": "Bò kho gừng sả",\n    "ingredients": [\n      {"name": "Thịt bò", "amount": 500, "unit": "g"}\n    ]\n  }\n]'}
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
                          Phân tích dữ liệu JSON
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
                          <span className="text-xs font-bold text-success uppercase tracking-wider">Hợp lệ</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">Sẵn sàng thêm mới</span>
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
                          <span className="text-xs font-bold text-warning uppercase tracking-wider">Trùng lặp</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">Đã có trong cơ sở dữ liệu</span>
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
                          <span className="text-xs font-bold text-danger uppercase tracking-wider">Lỗi</span>
                        </div>
                        <span className="text-xs text-default-400 truncate">Cấu trúc thiếu thông tin</span>
                      </div>
                    </div>
                  </div>

                  {parseResult.duplicateCount > 0 && (
                    <div className="p-4 rounded-2xl bg-content2/40 border border-divider space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-warning">
                        <Copy className="w-4 h-4" />
                        <span>Phương án giải quyết cho {parseResult.duplicateCount} mục trùng lặp:</span>
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
                            <span className="text-xs font-bold text-foreground">Bỏ qua (Khuyên dùng)</span>
                            {conflictStrategy === 'skip' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            Giữ nguyên dữ liệu hiện tại, chỉ nạp thêm các mục mới.
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
                            <span className="text-xs font-bold text-foreground">Ghi đè dữ liệu cũ</span>
                            {conflictStrategy === 'overwrite' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            Cập nhật nội dung các mục cũ bằng dữ liệu mới từ tệp JSON.
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
                            <span className="text-xs font-bold text-foreground">Tạo bản sao mới</span>
                            {conflictStrategy === 'create_copy' && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[11px] text-default-400 leading-tight">
                            Giữ lại cả hai, đổi tên mục mới thành &quot;(Bản sao)&quot; với ID riêng.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          Danh sách xem trước ({filteredItems.length}/{parseResult.totalItems})
                        </span>
                        {filterStatus !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setFilterStatus('all')}
                            className="text-[11px] text-primary hover:underline"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>

                      <div className="relative w-56">
                        <Search className="w-3.5 h-3.5 text-default-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm nhanh tên mục..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-content2/60 border border-divider text-xs text-foreground placeholder:text-default-400 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="bg-content2/30 rounded-2xl border border-divider divide-y divide-divider/40 max-h-56 overflow-y-auto">
                      {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-default-400">
                          Không tìm thấy mục nào phù hợp với bộ lọc hiện tại.
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
                                    {item.statusReason || item.subtitle || (isRecipe ? 'Công thức nấu ăn' : isTip ? 'Mẹo vặt bếp' : 'Đơn vị đo')}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {item.status === 'valid' && (
                                  <Chip size="sm" variant="flat" color="success" className="font-semibold text-[11px] h-6">
                                    Hợp lệ
                                  </Chip>
                                )}
                                {item.status === 'duplicate' && (
                                  <Chip size="sm" variant="flat" color="warning" className="font-semibold text-[11px] h-6">
                                    Trùng lặp
                                  </Chip>
                                )}
                                {item.status === 'invalid' && (
                                  <Chip size="sm" variant="flat" color="danger" className="font-semibold text-[11px] h-6">
                                    Lỗi
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
                    <h3 className="text-lg font-bold text-foreground">Nhập dữ liệu thành công!</h3>
                    <p className="text-xs text-default-400 max-w-sm mt-0.5">
                      Dữ liệu đã được nạp an toàn và chỉ mục tìm kiếm nhanh đã được đồng bộ tức thì.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-md my-1 text-xs">
                    <div className="p-3 rounded-xl bg-success/15 border border-success/20 text-success flex flex-col items-center">
                      <span className="text-lg font-black">+{importSummary.importedCount}</span>
                      <span className="font-medium text-[11px]">Thêm mới</span>
                    </div>

                    <div className="p-3 rounded-xl bg-warning/15 border border-warning/20 text-warning flex flex-col items-center">
                      <span className="text-lg font-black">{importSummary.updatedCount}</span>
                      <span className="font-medium text-[11px]">Cập nhật</span>
                    </div>

                    <div className="p-3 rounded-xl bg-default-100 border border-divider text-default-500 flex flex-col items-center">
                      <span className="text-lg font-black">{importSummary.skippedCount}</span>
                      <span className="font-medium text-[11px]">Bỏ qua</span>
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
                    <span>Dữ liệu lưu cục bộ trên máy của bạn (Local First)</span>
                  </div>
                )}
                {parseResult && !importSummary && (
                  <span className="text-xs text-default-500 font-medium">
                    Sẽ nhập: <strong className="text-foreground">{importableCount}</strong> mục
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {!parseResult && !importSummary && (
                  <Button variant="flat" onPress={handleModalClose} className="font-medium text-xs rounded-xl h-10 px-4">
                    Đóng
                  </Button>
                )}

                {parseResult && !importSummary && (
                  <>
                    <Button variant="flat" onPress={handleReset} className="font-medium text-xs rounded-xl h-10 px-4">
                      Huỷ bỏ
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleConfirmImport}
                      isDisabled={importableCount === 0 || isImporting}
                      isLoading={isImporting}
                      className="font-bold text-xs rounded-xl h-10 px-5 shadow-lg shadow-primary/25"
                    >
                      Xác nhận nhập ({importableCount} mục)
                    </Button>
                  </>
                )}

                {importSummary && (
                  <>
                    <Button variant="flat" onPress={handleReset} className="font-medium text-xs rounded-xl h-10 px-4">
                      Nhập tệp khác
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
                      Xem danh sách công thức
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
