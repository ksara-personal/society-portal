"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Heading2, List, ListOrdered, Link2, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const TOOLBAR_BUTTONS: { command: string; icon: typeof Bold; label: string; arg?: string }[] = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "underline", icon: Underline, label: "Underline" },
  { command: "formatBlock", icon: Heading2, label: "Heading", arg: "H3" },
  { command: "insertUnorderedList", icon: List, label: "Bullet list" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
];

/** Minimal WYSIWYG editor (contentEditable + execCommand) — no external editor dependency. */
export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only seed content once (e.g. when loading an existing draft) — re-syncing on
    // every keystroke would reset the caret position.
    if (editorRef.current && !hasInitialized.current) {
      editorRef.current.innerHTML = value || "";
      hasInitialized.current = true;
    }
  }, [value]);

  function emitChange() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  }

  function handleLink() {
    const url = window.prompt("Enter URL (include https://)");
    if (!url) return;
    exec("createLink", url);
  }

  return (
    <div className={cn("rounded-md border border-input", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 p-1.5">
        {TOOLBAR_BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.label}
            onClick={() => exec(b.command, b.arg)}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <b.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Link"
          onClick={handleLink}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Undo"
          onClick={() => exec("undo")}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={() => exec("redo")}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="min-h-[220px] max-w-none p-3 text-sm leading-relaxed focus:outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:text-base [&_h3]:font-semibold [&_a]:text-primary [&_a]:underline"
      />
    </div>
  );
}
