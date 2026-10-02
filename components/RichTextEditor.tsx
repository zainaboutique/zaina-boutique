"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Link2, Image as ImageIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading2, Heading3, Pilcrow, Undo, Redo,
} from "lucide-react";
import { fileToDataUrl } from "@/lib/utils";
import { storage, isFirebaseConfigured } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FONT_CHOICES = [
  { label: "Default", value: "" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Sans-serif", value: "Arial, sans-serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
}

// A lightweight Word-style editor: select text and click a button to format
// it, same as any familiar word processor. Built directly on the browser's
// own content-editing engine rather than a large third-party editor library,
// which keeps this simple and dependency-free. Two things worth knowing:
// - Dragging a selected image or block of text to a new spot within the
//   editor is a native browser behavior here, not something extra to click.
// - Image "alignment" (left/center/right) is set via the toolbar after
//   clicking an inserted image, rather than true freeform pixel positioning
//   — the right approach for content that still needs to read naturally on
//   a phone screen, where fixed positions wouldn't make sense anyway.
export default function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    // Only sync on first mount / external value changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function exec(command: string, argument?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
  }

  function handleLink() {
    const url = window.prompt("Link URL (e.g. https://example.com or /shop):");
    if (url) exec("createLink", url);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      let url: string;
      if (isFirebaseConfigured && storage) {
        const fileRef = ref(storage, `blog/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      } else {
        url = await fileToDataUrl(file);
      }
      exec("insertImage", url);
    } finally {
      setUploading(false);
    }
  }

  function alignSelectedImage(align: "left" | "center" | "right") {
    if (!selectedImage) return;
    selectedImage.style.display = align === "center" ? "block" : "inline";
    selectedImage.style.float = align === "left" ? "left" : align === "right" ? "right" : "none";
    selectedImage.style.margin = align === "center" ? "0.5rem auto" : align === "left" ? "0.25rem 1rem 0.5rem 0" : align === "right" ? "0.25rem 0 0.5rem 1rem" : "0.5rem 0";
    selectedImage.style.maxWidth = align === "center" ? "100%" : "50%";
    emitChange();
  }

  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    setSelectedImage(target.tagName === "IMG" ? (target as HTMLImageElement) : null);
  }

  return (
    <div className="border border-black/10 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-bg border-b border-black/10">
        <ToolbarButton onClick={() => exec("bold")} label="Bold"><Bold size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} label="Italic"><Italic size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} label="Underline"><Underline size={15} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => exec("formatBlock", "H2")} label="Heading"><Heading2 size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "H3")} label="Subheading"><Heading3 size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "P")} label="Paragraph"><Pilcrow size={15} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => exec("insertUnorderedList")} label="Bullet list"><List size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} label="Numbered list"><ListOrdered size={15} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={handleLink} label="Insert link"><Link2 size={15} /></ToolbarButton>
        <label className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center cursor-pointer" title="Insert image">
          <ImageIcon size={15} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
        </label>
        <Divider />
        <ToolbarButton onClick={() => exec("undo")} label="Undo"><Undo size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => exec("redo")} label="Redo"><Redo size={15} /></ToolbarButton>
        <Divider />
        <select
          onChange={(e) => e.target.value && exec("fontName", e.target.value)}
          defaultValue=""
          className="text-xs bg-white rounded-lg px-2 py-1.5 outline-none"
          title="Font"
        >
          {FONT_CHOICES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => e.target.value && exec("fontSize", e.target.value)}
          defaultValue=""
          className="text-xs bg-white rounded-lg px-2 py-1.5 outline-none"
          title="Text size"
        >
          <option value="">Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Extra Large</option>
        </select>

        {selectedImage && (
          <>
            <Divider />
            <span className="text-[11px] text-gray-400 px-1">Image:</span>
            <ToolbarButton onClick={() => alignSelectedImage("left")} label="Align image left"><AlignLeft size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => alignSelectedImage("center")} label="Center image"><AlignCenter size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => alignSelectedImage("right")} label="Align image right"><AlignRight size={15} /></ToolbarButton>
          </>
        )}

        {uploading && <span className="text-xs text-gray-400 px-2">Uploading image...</span>}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onClick={handleEditorClick}
        className="prose-editor min-h-[300px] max-h-[600px] overflow-y-auto px-4 py-3 text-sm leading-relaxed outline-none"
      />

      <style jsx global>{`
        .prose-editor h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .prose-editor h3 { font-size: 1.2rem; font-weight: 700; margin: 0.875rem 0 0.4rem; }
        .prose-editor p { margin: 0.5rem 0; }
        .prose-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-editor a { color: var(--brand-accent, #EF4444); text-decoration: underline; }
        .prose-editor img { border-radius: 0.75rem; }
      `}</style>
    </div>
  );
}

function ToolbarButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-black/10 mx-0.5" />;
}
