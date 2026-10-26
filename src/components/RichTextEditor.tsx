import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TOOLBAR_BUTTON =
  "rounded-(--md-sys-shape-corner-medium) px-2.5 py-1 text-xs font-medium text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-primary-container) transition-colors border border-transparent";

export default function RichTextEditor({
  content,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-content min-h-48 w-full rounded-b-(--md-sys-shape-corner-medium) bg-(--md-sys-color-surface) p-3 text-sm text-(--md-sys-color-on-surface) focus:outline-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) overflow-hidden focus-within:border-(--md-sys-color-primary) focus-within:ring-1 focus-within:ring-(--md-sys-color-primary) transition-all">
      <div className="flex flex-wrap gap-1 border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-1.5">
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("heading", { level: 2 })
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("heading", { level: 3 })
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("bold")
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("italic")
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("bulletList")
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("orderedList")
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          Angka
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${TOOLBAR_BUTTON} ${
            editor.isActive("blockquote")
              ? "bg-(--md-sys-color-primary-container) font-bold text-(--md-sys-color-on-primary-container)"
              : ""
          }`}
        >
          Quote
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
