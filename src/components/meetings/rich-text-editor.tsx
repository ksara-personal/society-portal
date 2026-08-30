"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  Pilcrow, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, ImageIcon, Table2, Undo2, Redo2, Palette, Highlighter,
  Rows3, Columns3, Trash2,
} from "lucide-react";
import { uploadFile } from "@/actions/upload";
import { useToast } from "@/components/ui/use-toast";
import { MEETING_CONTENT_CLASSES } from "./html-content";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const TEXT_COLORS = ["#111827", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#9333ea"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

async function uploadEditorImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return uploadFile(formData);
}

/** WYSIWYG editor built on Tiptap/ProseMirror — schema-driven paste strips Word/PDF clipboard cruft. */
export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const { toast } = useToast();
  const hasInitialized = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded" } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[220px] max-w-none p-3 text-sm leading-relaxed focus:outline-none",
          "[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-gray-400 [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          MEETING_CONTENT_CLASSES
        ),
      },
      handleDrop(_view, event) {
        const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        void insertImageFile(file);
        return true;
      },
      handlePaste(_view, event) {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        void insertImageFile(file);
        return true;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Only seed content once (e.g. when loading an existing draft) — re-syncing on
  // every keystroke would reset the caret position.
  useEffect(() => {
    if (editor && !hasInitialized.current) {
      editor.commands.setContent(value || "");
      hasInitialized.current = true;
    }
  }, [editor, value]);

  async function insertImageFile(file: File) {
    if (!editor) return;
    const result = await uploadEditorImage(file);
    if ("error" in result) {
      toast({ title: "Image upload failed", description: result.error, variant: "destructive" });
      return;
    }
    editor.chain().focus().setImage({ src: result.url }).run();
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void insertImageFile(file);
  }

  function handleLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL (include https://)", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-input", className)}>
      <Toolbar editor={editor} onLink={handleLink} onImageClick={() => imageInputRef.current?.click()} />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageInputChange}
      />
      <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-md border bg-white p-1 shadow-md">
        <MarkButton editor={editor} mark="bold" icon={Bold} label="Bold" />
        <MarkButton editor={editor} mark="italic" icon={Italic} label="Italic" />
        <MarkButton editor={editor} mark="underline" icon={UnderlineIcon} label="Underline" />
        <MarkButton editor={editor} mark="strike" icon={Strikethrough} label="Strikethrough" />
        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={handleLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
  onLink: () => void;
  onImageClick: () => void;
}

function Toolbar({ editor, onLink, onImageClick }: ToolbarProps) {
  const inTable = editor.isActive("table");

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 p-1.5">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <MarkButton editor={editor} mark="bold" icon={Bold} label="Bold" />
      <MarkButton editor={editor} mark="italic" icon={Italic} label="Italic" />
      <MarkButton editor={editor} mark="underline" icon={UnderlineIcon} label="Underline" />
      <MarkButton editor={editor} mark="strike" icon={Strikethrough} label="Strikethrough" />

      <Divider />

      <ColorPicker
        title="Text color"
        icon={Palette}
        colors={TEXT_COLORS}
        onPick={(color) => editor.chain().focus().setColor(color).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPicker
        title="Highlight"
        icon={Highlighter}
        colors={HIGHLIGHT_COLORS}
        onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <Divider />

      <ToolbarButton
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Justify"
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={onLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={onImageClick}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {!inTable ? (
        <ToolbarButton
          title="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 className="h-4 w-4" />
        </ToolbarButton>
      ) : (
        <>
          <ToolbarButton title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            <Rows3 className="h-4 w-4 text-destructive" />
          </ToolbarButton>
          <ToolbarButton title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Columns3 className="h-4 w-4 text-destructive" />
          </ToolbarButton>
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

type MarkName = "bold" | "italic" | "underline" | "strike";

const MARK_COMMANDS: Record<MarkName, (editor: Editor) => void> = {
  bold: (editor) => editor.chain().focus().toggleBold().run(),
  italic: (editor) => editor.chain().focus().toggleItalic().run(),
  underline: (editor) => editor.chain().focus().toggleUnderline().run(),
  strike: (editor) => editor.chain().focus().toggleStrike().run(),
};

function MarkButton({
  editor,
  mark,
  icon: Icon,
  label,
}: {
  editor: Editor;
  mark: MarkName;
  icon: typeof Bold;
  label: string;
}) {
  return (
    <ToolbarButton title={label} active={editor.isActive(mark)} onClick={() => MARK_COMMANDS[mark](editor)}>
      <Icon className="h-4 w-4" />
    </ToolbarButton>
  );
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900",
        active && "bg-gray-200 text-gray-900"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-gray-300" />;
}

function ColorPicker({
  title,
  icon: Icon,
  colors,
  onPick,
  onClear,
}: {
  title: string;
  icon: typeof Palette;
  colors: string[];
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        title={title}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      >
        <Icon className="h-4 w-4" />
      </button>
      <div className="absolute left-0 top-full z-10 hidden gap-1 rounded-md border bg-white p-1.5 shadow-md group-focus-within:flex group-hover:flex">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onPick(color)}
            className="h-5 w-5 rounded-full border border-gray-300"
            style={{ backgroundColor: color }}
          />
        ))}
        <button
          type="button"
          title="Clear"
          onClick={onClear}
          className="h-5 w-5 rounded-full border border-gray-300 bg-white text-[10px] leading-5 text-gray-500"
        >
          ×
        </button>
      </div>
    </div>
  );
}
