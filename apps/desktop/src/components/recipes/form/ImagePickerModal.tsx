import { useState, useRef, useCallback } from 'react';
import { 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Tabs, Tab, Input, Progress 
} from '@apron/ui';
import { CloudUpload, Link as LinkIcon, Trash2, CheckCircle2, XCircle, FileImage } from 'lucide-react';
import { validateMediaFile, formatBytes, MAX_FILE_SIZE_MB, MAX_VIDEO_SIZE_MB } from '../../../lib/image-utils';
import { ImageManager } from '../../../lib/image-manager';

interface ImagePickerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMedia: (images: string[], videos: string[]) => void;
}

type FileStatus = 'processing' | 'complete' | 'failed';

interface UploadItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  type?: 'image' | 'video' | 'unknown';
}

export function ImagePickerModal({ isOpen, onOpenChange, onSelectMedia }: ImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<string>('upload');
  
  // Upload Tab State
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL Tab State
  const [urlInput, setUrlInput] = useState('');
  const [urlList, setUrlList] = useState<string[]>([]);

  // Reset state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setUploads([]);
        setUrlInput('');
        setUrlList([]);
      }, 300);
    }
    onOpenChange(open);
  };

  const processFile = async (file: File, id: string) => {
    const { valid, type, error } = validateMediaFile(file);
    
    if (!valid) {
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'failed', error: error || 'Invalid file', type } : u
      ));
      return;
    }

    if (type === 'video') {
      const videoUrl = URL.createObjectURL(file) + '#video';
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'complete', progress: 100, resultUrl: videoUrl, type: 'video' } : u
      ));
      return;
    }

    try {
      const tempPath = await ImageManager.saveToTemp(file);
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'complete', progress: 100, resultUrl: tempPath, type: 'image' } : u
      ));
    } catch (error: any) {
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'failed', error: error.message || 'Lỗi lưu file tạm', type: 'image' } : u
      ));
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const newUploads = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'processing' as FileStatus,
      progress: 0
    }));

    setUploads(prev => [...prev, ...newUploads]);

    newUploads.forEach(u => {
      processFile(u.file, u.id);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleRemoveUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setUrlList(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveUrl = (index: number) => {
    setUrlList(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const finalImages: string[] = [];
    const finalVideos: string[] = [];
    
    // Get completed uploads
    uploads.forEach(u => {
      if (u.status === 'complete' && u.resultUrl) {
        if (u.type === 'video') finalVideos.push(u.resultUrl);
        else finalImages.push(u.resultUrl);
      }
    });

    // Add URLs
    urlList.forEach(url => {
      if (/\.(mp4|webm|mov|ogg)$/i.test(url)) {
        finalVideos.push(url);
      } else {
        finalImages.push(url);
      }
    });

    if (finalImages.length > 0 || finalVideos.length > 0) {
      onSelectMedia(finalImages, finalVideos);
    }
    
    handleOpenChange(false);
  };

  const hasItems = uploads.length > 0 || urlList.length > 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={handleOpenChange} 
      size="2xl"
      classNames={{ base: "bg-white dark:bg-gray-900" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Thêm Ảnh / Video (BYOS)
            </ModalHeader>
            <ModalBody>
              <Tabs 
                selectedKey={activeTab} 
                onSelectionChange={(key) => setActiveTab(key.toString())}
                color="primary" 
                variant="underlined"
                classNames={{ tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider" }}
              >
                <Tab 
                  key="upload" 
                  title={
                    <div className="flex items-center gap-2">
                      <CloudUpload className="w-4 h-4" />
                      <span>Tải lên (Upload)</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-4 mt-2">
                    {/* Dropzone */}
                    <div 
                      className={`
                        w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors
                        ${isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-default-300 bg-default-50'}
                      `}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={handleDrop}
                    >
                      <CloudUpload className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary' : 'text-default-400'}`} />
                      <p className="text-base font-semibold text-default-700">Kéo thả file vào đây</p>
                      <p className="text-sm text-default-500 mt-1 mb-4">Hỗ trợ Ảnh (Dưới {MAX_FILE_SIZE_MB}MB) hoặc Video (Dưới {MAX_VIDEO_SIZE_MB}MB)</p>
                      <p className="text-xs text-primary bg-primary-50 px-3 py-1 rounded-full mb-4 font-medium">Ảnh sẽ tự động convert sang WebP</p>
                      
                      <Button color="primary" variant="flat" onPress={() => fileInputRef.current?.click()}>
                        Chọn File
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*,video/*"
                        onChange={(e) => {
                          if (e.target.files) handleFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Upload List */}
                    {uploads.length > 0 && (
                      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {uploads.map(u => (
                          <div 
                            key={u.id} 
                            className={`
                              flex items-center gap-4 p-3 rounded-xl border
                              ${u.status === 'failed' ? 'border-danger-200 bg-danger-50' : 'border-default-200 bg-white dark:bg-gray-800'}
                            `}
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-default-100 flex-shrink-0">
                              {u.status === 'complete' && u.resultUrl ? (
                                u.type === 'video' ? (
                                  <video src={u.resultUrl} className="w-full h-full object-cover rounded-lg" muted />
                                ) : (
                                  <img src={ImageManager.getAssetUrl(u.resultUrl)} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                )
                              ) : (
                                <FileImage className={`w-5 h-5 ${u.status === 'failed' ? 'text-danger' : 'text-default-400'}`} />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.file.name}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-default-500">{formatBytes(u.file.size)}</span>
                                <span className="text-default-300">•</span>
                                {u.status === 'processing' && (
                                  <span className="text-warning font-medium">Đang xử lý...</span>
                                )}
                                {u.status === 'complete' && (
                                  <span className="text-success font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                                  </span>
                                )}
                                {u.status === 'failed' && (
                                  <span className="text-danger font-medium flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> {u.error}
                                  </span>
                                )}
                              </div>
                              {u.status === 'processing' && (
                                <Progress size="sm" value={u.progress} color="primary" className="mt-2" />
                              )}
                            </div>
                            
                            <Button 
                              isIconOnly 
                              variant="light" 
                              color="danger" 
                              size="sm"
                              onPress={() => handleRemoveUpload(u.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab 
                  key="url" 
                  title={
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      <span>Từ URL</span>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        variant="flat"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUrl();
                          }
                        }}
                      />
                      <Button color="primary" onPress={handleAddUrl}>Thêm</Button>
                    </div>

                    {urlList.length > 0 && (
                      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {urlList.map((url, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-default-200 bg-white dark:bg-gray-800">
                            <div className="w-10 h-10 rounded-lg bg-default-100 flex-shrink-0 overflow-hidden">
                              <img src={url} alt="URL Preview" className="w-full h-full object-cover" onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5Z29uIHBvaW50cz0iMTQgMiAxOCA2IDcgMTcgMyAxNyAzIDEzIDE0IDIiPjwvcG9seWdvbj48bGluZSB4MT0iMyIgeTE9IjIyIiB4Mj0iMjEiIHkyPSIyMiI+PC9saW5lPjwvc3ZnPg=='; // fallback
                              }} />
                            </div>
                            <p className="flex-1 text-sm font-medium truncate text-default-700">{url}</p>
                            <Button 
                              isIconOnly 
                              variant="light" 
                              color="danger" 
                              size="sm"
                              onPress={() => handleRemoveUrl(i)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button color="primary" onPress={handleConfirm} isDisabled={!hasItems}>
                Xác nhận
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
