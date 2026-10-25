import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

const TOOLBAR_BUTTON =
  'rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-transparent'

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-content min-h-48 w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:outline-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="rounded-md border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          Angka
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${TOOLBAR_BUTTON} ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        >
          Quote
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
