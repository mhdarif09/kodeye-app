"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), { ssr: false });

const CATEGORIES = [
  "engineering", "debugging", "system-design", "data",
  "interview-prep", "technical-communication", "negotiation", "stakeholder-management",
] as const;

const MODES = ["solo", "duel", "peer", "coop"] as const;
const ACCESS_LEVELS = ["free", "giat", "premium"] as const;
const TYPES = ["blog", "video", "course"] as const;

interface FormValues {
  title: string;
  description?: string;
  category: string;
  level_number: number;
  mode: string;
  access: string;
  type: string;
  url: string;
  content: string;
  thumbnail_url?: string;
  author?: string;
  sort_order: number;
}

const schema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  category: z.string().min(1),
  level_number: z.number().int().min(1).max(5),
  mode: z.string().min(1),
  access: z.string().min(1),
  type: z.string().min(1),
  url: z.string().min(1, "URL wajib diisi"),
  content: z.string().min(20, "Konten minimal 20 karakter"),
  thumbnail_url: z.string().optional(),
  author: z.string().optional(),
  sort_order: z.number().int().default(0),
});

interface Props {
  initialData?: Partial<FormValues> & { id?: string; is_published?: number };
  onSuccess: () => void;
}

export default function CurriculumForm({ initialData, onSuccess }: Props) {
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "engineering",
      level_number: initialData?.level_number || 1,
      mode: initialData?.mode || "solo",
      access: initialData?.access || "free",
      type: initialData?.type || "course",
      url: initialData?.url || "",
      content: initialData?.content || "",
      thumbnail_url: initialData?.thumbnail_url || "",
      author: initialData?.author || "",
      sort_order: initialData?.sort_order || 0,
    },
  });

  const content = watch("content");
  const isEdit = !!initialData?.id;

  const onSubmit = async (data: FormValues, publish: boolean) => {
    setSaving(true);
    try {
      const body = { ...data, is_published: publish ? 1 : 0 };
      if (isEdit) {
        await api.put(`/api/admin/curriculum/${initialData.id}`, body);
        toast.success(publish ? "Materi dipublikasikan" : "Draft tersimpan");
      } else {
        await api.post("/api/admin/curriculum", body);
        toast.success(publish ? "Materi dipublikasikan" : "Draft tersimpan");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPreview(false)}>
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              <button onClick={() => setPreview(false)} className="text-xs text-muted-foreground hover:text-foreground">Tutup</button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-1 block">Judul</label>
          <input {...register("title")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent" placeholder="Judul materi" />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1 block">Deskripsi</label>
          <textarea {...register("description")} className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-input bg-transparent resize-none" placeholder="Deskripsi singkat (muncul di card)" />
        </div>

        {/* Row: Category, Level, Mode, Access */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Kategori</label>
            <select {...register("category")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Level</label>
            <select {...register("level_number", { valueAsNumber: true })} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>Level {n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mode</label>
            <select {...register("mode")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent">
              <option value="solo">Solo</option>
              <option value="duel">Duel</option>
              <option value="peer">Peer</option>
              <option value="coop">Co-op</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Akses</label>
            <select {...register("access")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent">
              <option value="free">Free</option>
              <option value="giat">Giat</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Row: Type, URL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Tipe</label>
            <select {...register("type")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent">
              <option value="course">Course</option>
              <option value="blog">Blog</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">URL</label>
            <input {...register("url")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent" placeholder="contoh: /kurikulum/engineering/level-1" />
            {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>}
          </div>
        </div>

        {/* Content - MD Editor */}
        <div>
          <label className="text-sm font-medium mb-1 block">Konten (Markdown)</label>
          <div data-color-mode="dark">
            <MDEditor
              value={content}
              onChange={(val) => setValue("content", val || "")}
              height={400}
              preview="edit"
            />
          </div>
          {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
        </div>

        {/* Row: Thumbnail, Author, Sort Order */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Thumbnail URL</label>
            <input {...register("thumbnail_url")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent" placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Author</label>
            <input {...register("author")} className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent" placeholder="Nama penulis" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sort Order</label>
            <input {...register("sort_order", { valueAsNumber: true })} type="number" className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-transparent" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="h-10 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan sebagai Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((data) => onSubmit(data, true))}
            className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
