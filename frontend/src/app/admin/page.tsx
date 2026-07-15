"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "curriculum", label: "Kurikulum", icon: "📖" },
  { key: "pricing", label: "Pricing", icon: "💰" },
  { key: "users", label: "Users", icon: "👥" },
];

const PRESET_FEATURES = [
  { key: "max_sesi_per_hari", label: "Sesi per Hari", type: "number", default: 3 },
  { key: "mode_duel", label: "Mode Duel (Cari Lawan)", type: "boolean", default: false },
  { key: "ai_lawan", label: "AI Lawan (Latihan)", type: "boolean", default: true },
  { key: "ai_scoring", label: "AI Scoring & Feedback", type: "boolean", default: true },
  { key: "workspace_editor", label: "Editor Workspace", type: "select", options: ["Chat Aja", "Chat + Code", "Chat + Code + Diagram"], default: "Chat Aja" },
  { key: "elo_ranking", label: "ELO Rating & Peringkat", type: "boolean", default: false },
  { key: "riwayat_session", label: "Riwayat & Statistik", type: "boolean", default: true },
  { key: "peer_rating", label: "Peer Rating", type: "boolean", default: false },
  { key: "premium_skenario", label: "Skenario Premium", type: "boolean", default: false },
  { key: "kurikulum_belajar", label: "Kurikulum Belajar", type: "boolean", default: true },
];

interface Stats {
  totalUsers: number;
  totalSessions: number;
  totalCurriculum: number;
  totalTiers: number;
}

interface CurriculumItem {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  url: string;
  author: string;
  is_published: number;
}

interface TierFeature {
  id: string;
  feature_key: string;
  feature_label: string;
  feature_value: string;
}

interface Tier {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  is_active: number | boolean;
  sort_order: number;
  features: TierFeature[];
}

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);

  // Curriculum state
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [editItem, setEditItem] = useState<CurriculumItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Pricing state
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [editTier, setEditTier] = useState<Tier | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);

  useEffect(() => {
    if (!user?.role || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchStats();
    fetchCurriculum();
    fetchPricing();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data.data);
    } catch { setStats(null); }
  };

  const fetchCurriculum = async () => {
    try {
      const res = await api.get("/api/admin/curriculum");
      setCurriculum(res.data.data ?? []);
    } catch { setCurriculum([]); }
  };

  const fetchPricing = async () => {
    try {
      const res = await api.get("/api/admin/pricing");
      setTiers(res.data.data ?? []);
    } catch { setTiers([]); }
  };

  // ── Curriculum handlers ──
  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    data.is_published = (form.querySelector<HTMLInputElement>('[name="is_published"]')?.checked ?? false) ? "1" : "0";
    try {
      if (editItem) {
        await api.put(`/api/admin/curriculum/${editItem.id}`, data);
        toast.success("Curriculum updated");
      } else {
        await api.post("/api/admin/curriculum", data);
        toast.success("Curriculum created");
      }
      setShowForm(false);
      setEditItem(null);
      fetchCurriculum();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to save");
    }
  };

  const handleDeleteCurriculum = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/api/admin/curriculum/${id}`);
      toast.success("Deleted");
      fetchCurriculum();
    } catch { toast.error("Failed to delete"); }
  };

  // ── Pricing handlers ──
  const [tierForm, setTierForm] = useState({
    name: "",
    slug: "",
    price_monthly: "",
    price_yearly: "",
    is_active: true,
    sort_order: "0",
  });
  const [tierFeatureValues, setTierFeatureValues] = useState<Record<string, string>>({});
  const [tierFeatureToggles, setTierFeatureToggles] = useState<Record<string, boolean>>({});

  const initFeatureValues = (tier: Tier | null) => {
    const values: Record<string, string> = {};
    const toggles: Record<string, boolean> = {};
    setTierForm({
      name: tier?.name || "",
      slug: tier?.slug || "",
      price_monthly: String(tier?.price_monthly ?? ""),
      price_yearly: String(tier?.price_yearly ?? ""),
      is_active: tier ? tier.is_active !== 0 : true,
      sort_order: String(tier?.sort_order || 0),
    });
    for (const pf of PRESET_FEATURES) {
      const existing = tier?.features?.find((f: TierFeature) => f.feature_key === pf.key);
      if (existing) {
        if (pf.type === "boolean") {
          toggles[pf.key] = existing.feature_value === "true" || existing.feature_value === "✓";
        } else {
          values[pf.key] = existing.feature_value || String(pf.default);
        }
      } else {
        toggles[pf.key] = pf.type === "boolean" ? (pf.default as boolean) : true;
        values[pf.key] = pf.type !== "boolean" ? String(pf.default) : "true";
      }
    }
    setTierFeatureValues(values);
    setTierFeatureToggles(toggles);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();

    const features = PRESET_FEATURES.map((pf) => ({
      feature_key: pf.key,
      feature_label: pf.label,
      feature_value: pf.type === "boolean"
        ? (tierFeatureToggles[pf.key] ? "true" : "false")
        : (tierFeatureValues[pf.key] || String(pf.default)),
    }));

    try {
      const payload = {
        name: tierForm.name,
        slug: tierForm.slug,
        price_monthly: Number(tierForm.price_monthly) || 0,
        price_yearly: Number(tierForm.price_yearly) || 0,
        is_active: tierForm.is_active,
        sort_order: Number(tierForm.sort_order) || 0,
        features,
      };
      if (editTier) {
        await api.put(`/api/admin/pricing/${editTier.id}`, payload);
        toast.success("Tier updated");
      } else {
        await api.post("/api/admin/pricing", payload);
        toast.success("Tier created");
      }
      setShowTierForm(false);
      setEditTier(null);
      fetchPricing();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to save");
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm("Delete this tier?")) return;
    try {
      await api.delete(`/api/admin/pricing/${id}`);
      toast.success("Deleted");
      fetchPricing();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="flex-1 flex min-h-0">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-secondary/20 p-4 space-y-1">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">A</div>
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${
              tab === t.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <div className="border-t border-border pt-4 mt-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers },
                  { label: "Total Sessions", value: stats.totalSessions },
                  { label: "Curriculum Items", value: stats.totalCurriculum },
                  { label: "Pricing Tiers", value: stats.totalTiers },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-xl border border-border bg-secondary/20">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Loading stats...</p>
            )}
          </div>
        )}

        {tab === "curriculum" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Kelola Kurikulum</h1>
              <button
                onClick={() => { setEditItem(null); setShowForm(true); }}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
              >
                + Tambah
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSaveCurriculum} className="p-4 border border-border rounded-xl space-y-3 bg-secondary/10">
                <div className="grid grid-cols-2 gap-3">
                  <input name="title" defaultValue={editItem?.title} placeholder="Title" className="col-span-2 h-9 px-3 text-sm rounded-md border border-input bg-transparent" required />
                  <textarea name="description" defaultValue={editItem?.description} placeholder="Description" className="col-span-2 h-20 px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none" />
                  <select name="type" defaultValue={editItem?.type || "blog"} className="h-9 px-3 text-sm rounded-md border border-input bg-transparent">
                    <option value="blog">Blog</option>
                    <option value="video">Video</option>
                    <option value="course">Course</option>
                  </select>
                  <input name="category" defaultValue={editItem?.category} placeholder="Category (e.g. general, frontend)" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" />
                  <input name="url" defaultValue={editItem?.url} placeholder="URL" className="col-span-2 h-9 px-3 text-sm rounded-md border border-input bg-transparent" required />
                  <input name="author" defaultValue={editItem?.author} placeholder="Author" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_published" defaultChecked={editItem?.is_published !== 0} className="rounded" />
                    Published
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground">{editItem ? "Update" : "Create"}</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {curriculum.map((item: CurriculumItem) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type} · {item.category || "uncategorized"}{item.is_published ? "" : " · Draft"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <button onClick={() => { setEditItem(item); setShowForm(true); }} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                    <button onClick={() => handleDeleteCurriculum(item.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pricing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Kelola Pricing</h1>
              <button
                onClick={() => { setEditTier(null); setShowTierForm(true); initFeatureValues(null); }}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
              >
                + Tambah Tier
              </button>
            </div>

            {showTierForm && (
              <form onSubmit={handleSaveTier} className="p-4 border border-border rounded-xl space-y-3 bg-secondary/10">
                <div className="grid grid-cols-2 gap-3">
                  <input value={tierForm.name} onChange={(e) => setTierForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tier Name" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" required />
                  <input value={tierForm.slug} onChange={(e) => setTierForm((p) => ({ ...p, slug: e.target.value }))} placeholder="slug-name" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" required />
                  <input value={tierForm.price_monthly} onChange={(e) => setTierForm((p) => ({ ...p, price_monthly: e.target.value }))} type="number" step="0.01" placeholder="Monthly Price" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" />
                  <input value={tierForm.price_yearly} onChange={(e) => setTierForm((p) => ({ ...p, price_yearly: e.target.value }))} type="number" step="0.01" placeholder="Yearly Price" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={tierForm.is_active} onChange={(e) => setTierForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                  <input value={tierForm.sort_order} onChange={(e) => setTierForm((p) => ({ ...p, sort_order: e.target.value }))} type="number" placeholder="Sort Order" className="h-9 px-3 text-sm rounded-md border border-input bg-transparent" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Features</p>
                <div className="space-y-1.5">
                  {PRESET_FEATURES.map((pf) => (
                    <div key={pf.key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background">
                      <span className="text-sm">{pf.label}</span>
                      {pf.type === "boolean" ? (
                        <button
                          type="button"
                          onClick={() => setTierFeatureToggles((prev) => ({ ...prev, [pf.key]: !prev[pf.key] }))}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            tierFeatureToggles[pf.key] ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              tierFeatureToggles[pf.key] ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      ) : pf.type === "select" ? (
                        <select
                          value={tierFeatureValues[pf.key] || String(pf.default)}
                          onChange={(e) => setTierFeatureValues((prev) => ({ ...prev, [pf.key]: e.target.value }))}
                          className="h-8 px-2 text-xs rounded-md border border-input bg-transparent w-32"
                        >
                          {pf.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={tierFeatureValues[pf.key] ?? String(pf.default)}
                          onChange={(e) => setTierFeatureValues((prev) => ({ ...prev, [pf.key]: e.target.value }))}
                          className="h-8 w-20 px-2 text-xs rounded-md border border-input bg-transparent text-right"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowTierForm(false); setEditTier(null); }} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground">{editTier ? "Update" : "Create"}</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier: Tier) => (
                <div key={tier.id} className="p-4 rounded-xl border border-border bg-secondary/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{tier.name}</h3>
                    <span className="text-xs text-muted-foreground">{tier.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="text-2xl font-bold">Rp {Number(tier.price_monthly).toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                  {tier.features && (
                    <ul className="mt-3 space-y-1">
                      {tier.features.map((f: TierFeature) => {
                        const isBool = f.feature_value === "true" || f.feature_value === "false";
                        const isActive = f.feature_value === "true";
                        return (
                          <li key={f.id} className="text-xs text-muted-foreground flex items-center gap-1">
                            {isBool ? (
                              isActive ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>
                            ) : (
                              <span className="text-green-400">✓</span>
                            )}
                            {f.feature_label}{!isBool && f.feature_value ? `: ${f.feature_value}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setEditTier(tier); setShowTierForm(true); initFeatureValues(tier); }} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                    <button onClick={() => handleDeleteTier(tier.id)} className="text-xs text-red-500 hover:text-red-400">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-sm text-muted-foreground">User management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
