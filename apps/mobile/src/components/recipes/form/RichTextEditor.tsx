import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Indent, Outdent, Check } from 'lucide-react';
import { Button } from '@/ui';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  isInvalid, 
  errorMessage,
  onFocus,
  onBlur 
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:left-3 before:top-2 before:text-default-400 dark:before:text-default-400 before:pointer-events-none',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => {
      setIsFocused(true);
      onFocus?.();
    },
    onBlur: () => {
      setIsFocused(false);
      onBlur?.();
    },
    onTransaction: ({ editor }) => {
      setIsFocused(editor.isFocused);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert text-foreground dark:text-foreground max-w-none focus:outline-none min-h-[72px] px-3 py-2 text-sm leading-relaxed relative [&_p]:my-0 [&_*]:text-foreground',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
    <div className={`flex flex-col border rounded-xl bg-default-100 dark:bg-default-50/20 text-foreground transition-colors focus-within:bg-default-50 dark:focus-within:bg-default-100/30 ${isInvalid ? 'border-danger' : 'border-transparent hover:bg-default-200 dark:hover:bg-default-100/40'}`}>
      
      {/* Sticky Bottom Bar on Mobile */}
      {editor && (
        <div 
          className={`fixed left-0 right-0 z-[100] bg-background border-t border-divider shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 pb-[env(safe-area-inset-bottom)] ${
            isFocused ? 'bottom-0 opacity-100 visible' : '-bottom-20 opacity-0 invisible'
          }`}
          onMouseDown={(e) => e.preventDefault()} // Giữ focus cho editor khi click vào toolbar
        >
          <div className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar px-2 py-2">
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className={editor.isActive('bold') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className={editor.isActive('italic') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className={editor.isActive('strike') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-5 h-5" />
            </Button>
            
            <div className="w-px h-6 bg-divider mx-1 shrink-0" />
            
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className={editor.isActive('bulletList') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className={editor.isActive('orderedList') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-5 h-5" />
            </Button>

            <div className="w-px h-6 bg-divider mx-1 shrink-0" />

            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className="text-default-500 hover:text-foreground hover:bg-default-100"
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
              isDisabled={!editor.can().sinkListItem('listItem')}
            >
              <Indent className="w-5 h-5" />
            </Button>
            <Button
              isIconOnly
              size="md"
              variant="light"
              radius="md"
              className="text-default-500 hover:text-foreground hover:bg-default-100"
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
              isDisabled={!editor.can().liftListItem('listItem')}
            >
              <Outdent className="w-5 h-5" />
            </Button>

            <div className="ml-auto pl-2 flex items-center shrink-0">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                radius="full"
                className="font-semibold text-xs px-3 h-8 shadow-sm"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  editor.commands.blur();
                  setIsFocused(false);
                }}
                onClick={() => {
                  editor.commands.blur();
                  setIsFocused(false);
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                Xong
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
    {isInvalid && errorMessage && (
      <div className="text-tiny text-danger mt-1">
        {errorMessage}
      </div>
    )}
    </>
  );
}
