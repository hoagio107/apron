import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Indent, Outdent } from 'lucide-react';
import { Button } from '@/ui';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
}

export function RichTextEditor({ value, onChange, placeholder, isInvalid, errorMessage }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Nhập nội dung...',
        emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-default-400 dark:before:text-default-400 before:pointer-events-none',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert text-foreground dark:text-foreground max-w-none focus:outline-none min-h-[120px] p-4 [&_*]:text-foreground',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <>
    <div className={`flex flex-col border rounded-xl bg-default-100 text-foreground transition-colors hover:bg-default-200/80 focus-within:bg-default-100 ${isInvalid ? 'border-danger' : 'border-transparent'}`}>
      {/* BubbleMenu appended to body avoids overflow clipping */}
      {editor && (
        // @ts-expect-error tippyOptions is valid but types might be outdated
        <BubbleMenu editor={editor} tippyOptions={{ appendTo: document.body, zIndex: 99999 }} className="flex items-center gap-1 p-1.5 bg-content1 border border-divider shadow-xl rounded-xl">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className={editor.isActive('bold') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className={editor.isActive('italic') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className={editor.isActive('strike') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-4 bg-default-200 mx-1" />
          
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className={editor.isActive('bulletList') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className={editor.isActive('orderedList') ? 'bg-default-200 text-foreground' : 'text-default-500 hover:text-foreground hover:bg-default-100'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-default-200 mx-1" />

          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className="text-default-500 hover:text-foreground hover:bg-default-100"
            onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
            isDisabled={!editor.can().sinkListItem('listItem')}
          >
            <Indent className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            radius="md"
            className="text-default-500 hover:text-foreground hover:bg-default-100"
            onClick={() => editor.chain().focus().liftListItem('listItem').run()}
            isDisabled={!editor.can().liftListItem('listItem')}
          >
            <Outdent className="w-4 h-4" />
          </Button>
        </BubbleMenu>
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
