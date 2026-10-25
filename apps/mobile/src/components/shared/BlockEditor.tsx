import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/ui';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Quote, Link as LinkIcon, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BlockEditor({ value, onChange, placeholder = 'Bắt đầu bài học...' }: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[150px] h-full',
      },
    },
  });

  // Cập nhật giá trị khi có thay đổi từ ngoài (ví dụ đổi bài học)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bubble Menu nổi lên khi người dùng bôi đen chữ */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          className="flex items-center gap-1 p-1 bg-content1 shadow-md border border-default-200 rounded-lg"
        >
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('bold') ? 'solid' : 'light'}
            color={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('italic') ? 'solid' : 'light'}
            color={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('strike') ? 'solid' : 'light'}
            color={editor.isActive('strike') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('heading', { level: 1 }) ? 'solid' : 'light'}
            color={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('heading', { level: 2 }) ? 'solid' : 'light'}
            color={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('bulletList') ? 'solid' : 'light'}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('orderedList') ? 'solid' : 'light'}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-default-300 mx-1" />
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('blockquote') ? 'solid' : 'light'}
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant={editor.isActive('link') ? 'solid' : 'light'}
            color={editor.isActive('link') ? 'primary' : 'default'}
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const url = window.prompt('URL liên kết:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
      
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #a1a1aa;
          pointer-events: none;
          height: 0;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .tiptap iframe {
          max-width: 100%;
          border-radius: 0.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
}
