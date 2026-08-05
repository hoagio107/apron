
"use client";

import { 
  Bold, Italic, Underline, Heading1, Heading2, 
  Heading3, List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Loader2, Quote, Type, ListTree, PlusCircle,
  ExternalLink, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { uploadImageToDrive } from '@/lib/google-drive';
import { useToast } from '@/hooks/use-toast';

interface RichTextToolbarProps {
  onFormat?: (type: string) => void;
  target?: HTMLTextAreaElement | null;
  targetId?: string;
  className?: string;
  renderRight?: React.ReactNode;
}

type GroupId = 'text' | 'heading' | 'list' | 'align' | 'insert';

export function RichTextToolbar({ onFormat, target, targetId, className, renderRight }: RichTextToolbarProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<GroupId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link Dialog State
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  
  const [savedSelection, setSavedSelection] = useState({ start: 0, end: 0 });

  const setInputValue = (textarea: HTMLTextAreaElement, newValue: string, selectionStart: number, selectionEnd: number) => {
    textarea.focus();

    // Trigger React's onChange by simulating a native value set
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, newValue);
    } else {
      textarea.value = newValue;
    }
    
    // Dispatch events so React state updates
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  };

  const insertContent = (insertion: string, newStartOffset = 0, newEndOffset = 0) => {
    const textarea = target || (targetId ? document.getElementById(targetId) as HTMLTextAreaElement : null);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newValue = text.substring(0, start) + insertion + text.substring(end);
    const finalStart = start + (newStartOffset || insertion.length);
    const finalEnd = start + (newEndOffset || insertion.length);
    
    setInputValue(textarea, newValue, finalStart, finalEnd);
  };

  const applyFormat = (type: string) => {
    if (onFormat) {
      onFormat(type);
    }

    const textarea = target || (targetId ? document.getElementById(targetId) as HTMLTextAreaElement : null);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    let insertion = '';
    let startOffset = 0;
    let endOffset = 0;

    switch (type) {
      case 'bold':
        insertion = `**${selection}**`;
        startOffset = selection ? insertion.length : 2;
        endOffset = selection ? insertion.length : 2;
        break;
      case 'italic':
        insertion = `*${selection}*`;
        startOffset = selection ? insertion.length : 1;
        endOffset = selection ? insertion.length : 1;
        break;
      case 'underline':
        insertion = `<u>${selection}</u>`;
        startOffset = selection ? insertion.length : 3;
        endOffset = selection ? insertion.length : 3;
        break;
      case 'h1':
        insertion = `\n# ${selection || 'Tiêu đề lớn'}`;
        break;
      case 'h2':
        insertion = `\n## ${selection || 'Tiêu đề vừa'}`;
        break;
      case 'h3':
        insertion = `\n### ${selection || 'Tiêu đề nhỏ'}`;
        break;
      case 'list':
        insertion = `\n- ${selection || 'Mục lục'}`;
        break;
      case 'ordered-list':
        insertion = `\n1. ${selection || 'Mục lục số'}`;
        break;
      case 'quote':
        insertion = `\n> ${selection || 'Trích dẫn'}`;
        break;
      case 'link':
        setSavedSelection({ start, end });
        setIsLinkDialogOpen(true);
        return;
    }

    if (insertion) {
      insertContent(insertion, startOffset, endOffset);
    }
  };

  const handleLinkConfirm = () => {
    if (!linkUrl) return;
    const textarea = target || (targetId ? document.getElementById(targetId) as HTMLTextAreaElement : null);
    if (!textarea) return;

    const text = textarea.value;
    const selection = text.substring(savedSelection.start, savedSelection.end);
    const insertion = `[${selection || 'liên kết'}](${linkUrl})`;
    
    insertContent(insertion);
    setIsLinkDialogOpen(false);
    setLinkUrl('https://');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToDrive(file);
      const insertion = `\n![Hình ảnh minh họa](${url})\n`;
      insertContent(insertion);
      toast({ title: "Đã tải ảnh lên thành công" });
    } catch (err) {
      toast({ variant: "destructive", title: "Lỗi tải ảnh" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const btnClass = "h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-md text-gray-500 dark:text-gray-400";
  const mobileGroupBtnClass = "flex-1 flex items-center justify-center py-2 transition-all border-b-2";

  return (
    <div className={cn("flex flex-col w-full bg-gray-50 dark:bg-gray-800 border-b border-border/50 relative", className)}>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      
      {isUploading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        </div>
      )}

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden md:flex flex-wrap items-center gap-1 p-1">
        <div className="flex items-center gap-0.5 px-1 border-r border-border/50">
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('bold')} className={btnClass} title="In đậm"><Bold className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('italic')} className={btnClass} title="In nghiêng"><Italic className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('underline')} className={btnClass} title="Gạch chân"><Underline className="w-4 h-4" /></Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border/50">
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h1')} className={cn(btnClass, "font-bold text-xs")}>H1</Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h2')} className={cn(btnClass, "font-bold text-xs")}>H2</Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h3')} className={cn(btnClass, "font-bold text-xs")}>H3</Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-border/50">
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('list')} className={btnClass} title="Danh sách"><List className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('ordered-list')} className={btnClass} title="Danh sách số"><ListOrdered className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('quote')} className={btnClass} title="Trích dẫn"><Quote className="w-4 h-4" /></Button>
        </div>

        <div className="flex items-center gap-0.5 px-1">
          <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('link')} className={cn(btnClass, "text-blue-600")} title="Chèn liên kết"><LinkIcon className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className={cn(btnClass, "text-orange-600")} title="Tải ảnh lên"><ImageIcon className="w-4 h-4" /></Button>
        </div>

        {renderRight && (
          <div className="ml-auto flex items-center pr-1 border-l border-border/50 pl-1">
            {renderRight}
          </div>
        )}
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden flex flex-col">
        <div className="flex items-center bg-white dark:bg-gray-900 border-b border-border/50">
          <div className="flex-grow flex items-center">
            <button type="button" onClick={() => setActiveGroup(activeGroup === 'text' ? null : 'text')} 
              className={cn(mobileGroupBtnClass, activeGroup === 'text' ? "text-orange-600 border-orange-500 bg-orange-50/30" : "text-gray-400 border-transparent")}>
              <Type className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setActiveGroup(activeGroup === 'heading' ? null : 'heading')} 
              className={cn(mobileGroupBtnClass, activeGroup === 'heading' ? "text-orange-600 border-orange-500 bg-orange-50/30" : "text-gray-400 border-transparent")}>
              <Heading1 className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setActiveGroup(activeGroup === 'list' ? null : 'list')} 
              className={cn(mobileGroupBtnClass, activeGroup === 'list' ? "text-orange-600 border-orange-500 bg-orange-50/30" : "text-gray-400 border-transparent")}>
              <ListTree className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setActiveGroup(activeGroup === 'insert' ? null : 'insert')} 
              className={cn(mobileGroupBtnClass, activeGroup === 'insert' ? "text-orange-600 border-orange-500 bg-orange-50/30" : "text-gray-400 border-transparent")}>
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          {renderRight && (
            <div className="shrink-0 flex items-center pr-1 h-full pl-1 border-l border-border/50">
              {renderRight}
            </div>
          )}
        </div>

        {activeGroup && (
          <div className="flex items-center justify-around p-2 bg-gray-50 dark:bg-gray-800/50 animate-in slide-in-from-top-1 duration-200">
            {activeGroup === 'text' && (
              <>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('bold')} className={btnClass}><Bold className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('italic')} className={btnClass}><Italic className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('underline')} className={btnClass}><Underline className="w-4 h-4" /></Button>
              </>
            )}
            {activeGroup === 'heading' && (
              <>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h1')} className="font-bold">H1</Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h2')} className="font-bold">H2</Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('h3')} className="font-bold">H3</Button>
              </>
            )}
            {activeGroup === 'list' && (
              <>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('list')} className={btnClass}><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('ordered-list')} className={btnClass}><ListOrdered className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('quote')} className={btnClass}><Quote className="w-4 h-4" /></Button>
              </>
            )}
            {activeGroup === 'insert' && (
              <>
                <Button variant="ghost" size="sm" type="button" onClick={() => applyFormat('link')} className={cn(btnClass, "text-blue-600")}><LinkIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className={cn(btnClass, "text-orange-600")}><ImageIcon className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Link Insertion Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <ExternalLink className="w-5 h-5 text-blue-500" /> Chèn liên kết
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Địa chỉ URL</label>
              <Input 
                placeholder="https://example.com" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                className="h-12 rounded-xl bg-gray-50 border-none shadow-none font-bold" 
                autoFocus 
                onKeyDown={(e) => e.key === 'Enter' && handleLinkConfirm()}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsLinkDialogOpen(false)} className="rounded-xl font-bold flex-1">Hủy</Button>
            <Button onClick={handleLinkConfirm} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8 border-none text-white shadow-none flex-1">Chèn ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
