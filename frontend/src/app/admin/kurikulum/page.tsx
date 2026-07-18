"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface CurriculumItem {
  id: string;
  title: string;
  type: string;
  category: string;
  level_number: number;
  mode: string;
  access: string;
  is_published: number;
  sort_order: number;
}

const CATEGORIES = ["all", "engineering", "debugging", "system-design", "data", "interview-prep", "technical-communication", "negotiation", "stakeholder-management"];
const ACCESS_FILTERS = ["all", "free", "giat", "premium"];

export default function AdminKurikulumPage() {
  const router = useRouter();
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");

  const fetchItems = () => {
    setLoading(true);
    api.get("/api/admin/curriculum")
      .then((res) => setItems(res.data?.data ?? []))
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleTogglePublish = async (item: CurriculumItem) => {
    try {
      await api.put(`/api/admin/curriculum/${item.id}`, { is_published: item.is_published ? 0 : 1 });
      toast.success(item.is_published ? "Ditarik dari publik" : "Dipublikasikan");
      fetchItems();
    } catch { toast.error("Gagal update status"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await api.delete(`/api/admin/curriculum/${id}`);
      toast.success("Materi dihapus");
      fetchItems();
    } catch { toast.error("Gagal menghapus"); }
  };

  const filtered = items.filter((i) => {
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (accessFilter !== "all" && i.access !== accessFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground mb-2 block">&larr; Kembali ke Admin Panel</Link>
            <h1 className="text-2xl font-bold tracking-tight">Kelola Kurikulum</h1>
            <p className="text-sm text-muted-foreground mt-1">{items.length} total materi</p>
          </div>
          <Link
            href="/admin/kurikulum/new"
            className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center"
          >
            + Tambah Materi
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                catFilter === cat ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
              }`}
            >
              {cat === "all" ? "Semua" : cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
          <span className="w-px h-6 bg-border mx-1 self-center" />
          {ACCESS_FILTERS.map((a) => (
            <button
              key={a}
              onClick={() => setAccessFilter(a)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                accessFilter === a ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
              }`}
            >
              {a === "all" ? "Semua Akses" : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Tidak ada materi</p>
            <Link href="/admin/kurikulum/new" className="text-sm text-primary hover:underline mt-2 inline-block">Tambah materi baru</Link>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Kategori</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Level</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Mode</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Akses</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Published</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px] md:max-w-xs">{item.title}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{item.category}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{item.level_number ?? "-"}</td>
                    <td className="px-4 py-3 text-center capitalize hidden sm:table-cell">{item.mode}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.access === "free" ? "text-emerald-500" : item.access === "giat" ? "text-yellow-500" : "text-purple-500"
                      }`}>
                        {item.access}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          item.is_published ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform ${
                          item.is_published ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/kurikulum/${item.id}/edit`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
