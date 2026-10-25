import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/ui';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Quote, ImageIcon, Link as LinkIcon, Youtube as YoutubeIcon } from 'lucide-react';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Bắt đầu soạn thảo...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Disabled: we add Link separately below with custom config
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
        class: 'prose prose-sm dark:prose-invert text-foreground dark:text-foreground [&_*]:text-foreground max-w-none focus:outline-none min-h-[150px] p-4 bg-default-100 dark:bg-default-50/20 rounded-xl',
      },
    },
  });

  // Update content if value changes from outside (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 relative group">
      {/* Menu Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-content2 rounded-lg border border-default-200 opacity-50 group-focus-within:opacity-100 transition-opacity">
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
        <Button
          isIconOnly
          size="md"
          variant={editor.isActive('blockquote') ? 'solid' : 'light'}
          color={editor.isActive('blockquote') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-default-300 mx-1" />
        <Button
          isIconOnly
          size="md"
          variant="light"
          onClick={() => {
            const url = window.prompt('URL hình ảnh:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        >
          <ImageIcon className="w-4 h-4" />
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
        <Button
          isIconOnly
          size="md"
          variant="light"
          onClick={() => {
            const url = window.prompt('URL YouTube:');
            if (url) {
              editor.chain().focus().setYoutubeVideo({ src: url }).run();
            }
          }}
        >
          <YoutubeIcon className="w-4 h-4" />
        </Button>
      </div>
      
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
        }
        .tiptap iframe {
          max-width: 100%;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
