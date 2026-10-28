import { useState, useRef } from 'react';
import { Button, Progress } from '@/ui';
import { CloudUpload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { FileManager } from '../../lib/file-manager';

interface FileUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  label?: string;
}

export function FileUploader({ value = [], onChange, label = "Kéo thả file vào đây" }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<{id: string, name: string, status: 'processing' | 'complete' | 'failed', progress: number}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const newPending = fileArray.map(f => ({ id: crypto.randomUUID(), name: f.name, status: 'processing' as const, progress: 0 }));
    
    setPendingUploads(prev => [...prev, ...newPending]);
    
    let currentUrls = [...(value || [])];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const pendingId = newPending[i].id;
      
      try {
        // Simulate progress for UI feedback
        for (let p = 10; p <= 90; p += 20) {
          setPendingUploads(prev => prev.map(u => u.id === pendingId ? { ...u, progress: p } : u));
          await new Promise(r => setTimeout(r, 100));
        }

        const path = await FileManager.saveAttachment(file);
        currentUrls = [...currentUrls, path];
        
        setPendingUploads(prev => prev.map(p => p.id === pendingId ? { ...p, status: 'complete', progress: 100 } : p));
        
        if (onChange) {
          onChange(currentUrls);
        }
      } catch (e) {
        console.error("Upload failed", e);
        setPendingUploads(prev => prev.map(p => p.id === pendingId ? { ...p, status: 'failed', progress: 0 } : p));
      }
    }
    
    setTimeout(() => {
      setPendingUploads(prev => prev.filter(p => p.status !== 'complete'));
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const newUrls = (value || []).filter((_, idx) => idx !== indexToRemove);
    if (onChange) {
      onChange(newUrls);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone */}
      <div 
        className={`
          w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/10 dark:bg-primary/20' : 'border-default-300 bg-default-50 hover:bg-default-100'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload className={`w-8 h-8 mb-3 ${isDragging ? 'text-primary' : 'text-default-400'}`} />
        <p className="text-sm font-semibold text-default-700">{label}</p>
        <p className="text-xs text-default-500 mt-1 text-center">Có thể chọn nhiều file cùng lúc<br/>(PDF, DOCX, ZIP...)</p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
      </div>

      {/* File List */}
      {(value.length > 0 || pendingUploads.length > 0) && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
          {/* Pending / Uploading files */}
          {pendingUploads.map((u) => (
            <div key={u.id} className={`flex flex-col p-2 rounded-lg border ${u.status === 'failed' ? 'border-danger-200 bg-danger/10 dark:bg-danger/20' : 'border-primary-200 bg-primary/10 dark:bg-primary/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${u.status === 'failed' ? 'bg-danger-100 text-danger' : 'bg-content1 text-primary'}`}>
                  {u.status === 'complete' ? <FileIcon className="w-4 h-4" /> : <Loader2 className={`w-4 h-4 ${u.status === 'processing' ? 'animate-spin' : ''}`} />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-medium truncate" title={u.name}>{u.name}</span>
                  <span className={`text-xs ${u.status === 'failed' ? 'text-danger' : u.status === 'complete' ? 'text-success' : 'text-primary'}`}>
                    {u.status === 'processing' ? 'Đang tải lên...' : u.status === 'complete' ? 'Hoàn tất' : 'Lỗi tải lên'}
                  </span>
                </div>
              </div>
              {u.status === 'processing' && (
                <Progress size="sm" value={u.progress} color="primary" className="mt-2" aria-label="Upload progress" />
              )}
            </div>
          ))}

          {/* Uploaded files */}
          {value.map((url, idx) => {
            const filename = FileManager.getFilename(url);
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-divider bg-content1">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-default-100 flex items-center justify-center flex-shrink-0 text-default-600">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium truncate" title={filename}>{filename}</span>
                </div>
                <Button 
                  isIconOnly 
                  size="sm" 
                  variant="light" 
                  color="danger" 
                  onPress={() => removeFile(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
