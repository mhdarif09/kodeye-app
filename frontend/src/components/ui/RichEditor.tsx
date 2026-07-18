"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const lowlight = createLowlight(common);

const SLASH_COMMANDS = [
  { label: "Text", icon: "T", action: (e: any) => e.chain().focus().setParagraph().run() },
  { label: "Heading", icon: "H", action: (e: any) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Subheading", icon: "H3", action: (e: any) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bold", icon: "B", action: (e: any) => e.chain().focus().toggleBold().run() },
  { label: "Italic", icon: "I", action: (e: any) => e.chain().focus().toggleItalic().run() },
  { label: "Link", icon: "🔗", action: (e: any) => insertLink(e) },
  { label: "Image", icon: "🖼", action: (e: any) => insertImage(e) },
  { label: "Bullet List", icon: "•", action: (e: any) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", icon: "1.", action: (e: any) => e.chain().focus().toggleOrderedList().run() },
  { label: "Task List", icon: "☑", action: (e: any) => e.chain().focus().toggleTaskList().run() },
  { label: "Code Block", icon: "<>", action: (e: any) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Quote", icon: '"', action: (e: any) => e.chain().focus().toggleBlockquote().run() },
  { label: "Divider", icon: "—", action: (e: any) => e.chain().focus().setHorizontalRule().run() },
  { label: "Left", icon: "⬅", action: (e: any) => e.chain().focus().setTextAlign("left").run() },
  { label: "Center", icon: "⬌", action: (e: any) => e.chain().focus().setTextAlign("center").run() },
];

let insertLink: any = null;
let insertImage: any = null;

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder }: Props) {
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const slashRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImageEditor = useRef<any>(null);

  insertLink = useCallback((e: any) => {
    const url = prompt("Masukkan URL:");
    if (url) {
      if (e.state.selection.empty) {
        e.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
      } else {
        e.chain().focus().toggleLink({ href: url }).run();
      }
    }
  }, []);

  insertImage = useCallback((e: any) => {
    pendingImageEditor.current = e;
    setImageUrl("");
    setShowImageModal(true);
  }, []);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const res = await api.post("/api/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.url;
      pendingImageEditor.current?.chain().focus().setImage({ src: url }).run();
      setShowImageModal(false);
    } catch {
      toast.error("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      pendingImageEditor.current?.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageModal(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: placeholder || "Ketik / untuk perintah..." }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      handleSlash(editor);
    },
    onSelectionUpdate: ({ editor }) => handleSlash(editor),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-3 py-2",
      },
    },
  });

  const handleSlash = useCallback((editor: any) => {
    const { from, empty } = editor.state.selection;
    if (!empty) { setShowSlash(false); return; }
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
    const slashIdx = textBefore.lastIndexOf("/");
    if (slashIdx !== -1 && slashIdx === textBefore.length - 1) {
      setShowSlash(true);
      setSlashQuery("");
      setSlashPos(from);
    } else if (slashIdx !== -1 && textBefore.slice(slashIdx + 1).length < 15 && !textBefore.slice(slashIdx + 1).includes(" ")) {
      setShowSlash(true);
      setSlashQuery(textBefore.slice(slashIdx + 1));
      setSlashPos(from);
    } else {
      setShowSlash(false);
    }
  }, []);

  const runSlashCommand = useCallback(
    (cmd: typeof SLASH_COMMANDS[0]) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
      const slashIdx = textBefore.lastIndexOf("/");
      if (slashIdx !== -1) {
        const deleteFrom = from - (textBefore.length - slashIdx);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }
      setTimeout(() => {
        cmd.action(editor);
        setShowSlash(false);
      }, 10);
    },
    [editor]
  );

  useEffect(() => {
    if (!showSlash) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowSlash(false); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSlash]);

  const filtered = SLASH_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(slashQuery.toLowerCase())
  );

  if (!editor) return null;

  return (
    <div className="border border-input rounded-md relative" ref={editorRef}>
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
        {[
          { icon: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), label: "Bold" },
          { icon: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), label: "Italic" },
          { icon: "S", action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), label: "Strike" },
          { icon: "🔗", action: () => insertLink(editor), active: editor.isActive("link"), label: "Link" },
          { icon: "🖼", action: () => insertImage(editor), active: false, label: "Image" },
          { icon: "H", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), label: "Heading" },
          { icon: "H3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }), label: "Subheading" },
          { icon: "<>", action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock"), label: "Code Block" },
          { icon: "•", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), label: "Bullet" },
          { icon: "1.", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), label: "Ordered" },
          { icon: "☑", action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive("taskList"), label: "Task" },
          { icon: '"', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), label: "Quote" },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`h-7 w-7 flex items-center justify-center text-xs rounded hover:bg-muted transition-colors ${btn.active ? "bg-muted font-bold" : ""}`}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />

      {showSlash && (
        <div
          ref={slashRef}
          className="absolute left-3 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
        >
          {filtered.map((cmd) => (
            <button
              key={cmd.label}
              type="button"
              onClick={() => runSlashCommand(cmd)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded bg-muted text-[11px] font-mono">{cmd.icon}</span>
              {cmd.label}
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowImageModal(false)}>
          <div className="bg-card rounded-xl shadow-xl border border-border p-5 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">Tambah Gambar</h3>
            <div className="space-y-3">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {uploading ? "Mengupload..." : "Upload dari komputer"}
              </button>
              <div className="flex items-center gap-2">
                <hr className="flex-1 border-border" />
                <span className="text-xs text-muted-foreground">atau</span>
                <hr className="flex-1 border-border" />
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://...gambar.jpg"
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm"
                />
                <button
                  type="button"
                  onClick={handleImageUrlSubmit}
                  disabled={!imageUrl}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Pakai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
