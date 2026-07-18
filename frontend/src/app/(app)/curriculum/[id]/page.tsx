"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface CurriculumDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  access: string;
}

const EMBED_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "medium.com"];

function isEmbeddable(url: string) {
  try {
    const host = new URL(url).hostname;
    return EMBED_HOSTS.includes(host);
  } catch {
    return false;
  }
}

function getYoutubeEmbedUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function CurriculumReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<CurriculumDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/curriculum/${id}`)
      .then((res) => setItem(res.data.data))
      .catch((err) => {
        const msg = err.response?.data?.error?.message || "Gagal memuat materi";
        if (err.response?.status === 403) {
          toast.error(msg);
          router.push("/langganan");
        } else {
          toast.error(msg);
          router.back();
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!item) return null;

  const hasContent = item.content && item.content.length > 10;
  const hasUrl = !!item.url;
  const ytEmbed = hasUrl ? getYoutubeEmbedUrl(item.url!) : null;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={() => router.back()} className="text-xs text-muted-foreground hover:text-foreground mb-4 block">&larr; Kembali</button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>{item.type === "video" ? "🎬 Video" : item.type === "course" ? "🎓 Kursus" : "📄 Artikel"}</span>
          {item.category && <span>· {item.category}</span>}
          {item.access === "premium" && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] font-medium">PREMIUM</span>}
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">{item.title}</h1>
        {item.author && <p className="text-sm text-muted-foreground mb-6">— {item.author}</p>}

        {/* Rich text content */}
        {hasContent && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: item.content! }}
          />
        )}

        {/* YouTube embed */}
        {ytEmbed && (
          <div className="mt-6 aspect-video rounded-xl overflow-hidden">
            <iframe
              src={ytEmbed}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {/* External URL (non-embeddable) */}
        {hasUrl && !ytEmbed && !hasContent && (
          <div className="mt-6 p-6 rounded-xl border border-border bg-secondary/10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Materi ini tersedia di sumber eksternal.</p>
            <a
              href={item.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors items-center"
            >
              Buka di {(() => { try { return new URL(item.url!).hostname; } catch { return "sumber eksternal"; } })()}
            </a>
          </div>
        )}

        {/* Empty state */}
        {!hasContent && !hasUrl && (
          <p className="text-muted-foreground">{item.description || "Tidak ada konten untuk materi ini."}</p>
        )}
      </div>
    </div>
  );
}
