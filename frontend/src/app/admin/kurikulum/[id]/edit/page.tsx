"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import CurriculumForm from "@/components/CurriculumForm";

interface FormData {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  category: string;
  level_number: number;
  mode: string;
  access: string;
  content: string;
  thumbnail_url: string;
  author: string;
  is_published: number;
  sort_order: number;
}

export default function EditKurikulumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get("/api/admin/curriculum")
      .then((res) => {
        const item = (res.data?.data ?? []).find((i: any) => i.id === id);
        if (item) setData(item);
        else { toast.error("Materi tidak ditemukan"); router.push("/admin/kurikulum"); }
      })
      .catch(() => { toast.error("Gagal memuat data"); router.push("/admin/kurikulum"); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div>
          <Link href="/admin/kurikulum" className="text-xs text-muted-foreground hover:text-foreground mb-2 block">&larr; Kembali</Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Materi</h1>
        </div>

        <CurriculumForm
          initialData={{
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            level_number: data.level_number,
            mode: data.mode,
            access: data.access,
            type: data.type,
            url: data.url,
            content: data.content,
            thumbnail_url: data.thumbnail_url,
            author: data.author,
            is_published: data.is_published,
            sort_order: data.sort_order,
          }}
          onSuccess={() => router.push("/admin/kurikulum")}
        />
      </div>
    </div>
  );
}
