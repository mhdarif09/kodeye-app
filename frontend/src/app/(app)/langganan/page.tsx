"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface TierFeature {
  id: string | number;
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
  is_active: boolean | number;
  sort_order: number;
  features: TierFeature[];
}

interface Subscription {
  tier_id: string;
  tier_name: string;
  period_end: string;
}

const PERIODS = [
  { key: "monthly", label: "Bulanan" },
  { key: "yearly", label: "Tahunan", badge: "Hemat 20%" },
];

function LanggananContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.get("/api/payment/subscription");
      setCurrentSub(res.data.data);
    } catch {
      setCurrentSub(null);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login?callbackUrl=/langganan");
      return;
    }

    const status = searchParams.get("status");
    const orderId = searchParams.get("order_id");
    if (status === "success" && orderId) {
      toast.success("Pembayaran berhasil! Langganan aktif 🎉");
      router.replace("/langganan");
    } else if (status === "cancelled") {
      toast.error("Pembayaran dibatalkan");
      router.replace("/langganan");
    }

    fetchTiers();
    fetchSubscription();
  }, [user, searchParams]);

  const fetchTiers = async () => {
    try {
      const res = await api.get("/api/admin/pricing/public");
      setTiers(res.data.data ?? []);
    } catch {
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    setPaying(tierId);
    try {
      const res = await api.post("/api/payment/create-transaction", { tierId, period });
      const { paymentUrl } = res.data.data;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error("Gagal mendapatkan URL pembayaran");
        setPaying(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Gagal memproses pembayaran");
      setPaying(null);
    }
  };

  const currentTierId = currentSub?.tier_id;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Pilih Paket Langganan</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Tingkatkan kemampuan komunikasi teknis kamu dengan paket yang sesuai
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`relative px-5 py-2 text-sm rounded-full transition-all ${
                period === p.key
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p.label}
              {p.badge && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {p.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-secondary/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, idx) => {
              const isFree = Number(tier.price_monthly) === 0;
              const isPopular = idx === 1;
              const isCurrent = currentTierId === tier.id;
              const price = period === "yearly" ? tier.price_yearly : tier.price_monthly;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                    isPopular
                      ? "border-primary shadow-lg shadow-primary/10 scale-105"
                      : "border-border"
                  } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Terpopuler
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {isFree ? "Gratis" : `Rp ${Number(price).toLocaleString()}`}
                      </span>
                      {!isFree && <span className="text-sm text-muted-foreground">/{period === "yearly" ? "tahun" : "bulan"}</span>}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    {tier.features?.map((f: TierFeature) => {
                      const isBool = f.feature_value === "true" || f.feature_value === "false";
                      const isActive = f.feature_value === "true";
                      return (
                        <div key={f.id} className="flex items-start gap-2 text-sm">
                          {isBool ? (
                            isActive ? (
                              <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                            ) : (
                              <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                            )
                          ) : (
                            <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                          )}
                          <span className={isBool && !isActive ? "text-muted-foreground" : ""}>
                            {f.feature_label}
                            {!isBool && f.feature_value ? `: ${f.feature_value}` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 text-sm rounded-xl bg-primary/20 text-primary font-medium cursor-default"
                    >
                      Paket Saat Ini
                    </button>
                  ) : isFree ? (
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-2.5 text-sm rounded-xl border border-border hover:bg-secondary/50 transition-colors"
                    >
                      Mulai Gratis
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={paying === tier.id}
                      className={`w-full py-2.5 text-sm rounded-xl font-medium transition-all ${
                        isPopular
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "bg-secondary text-foreground hover:bg-secondary/70"
                      } disabled:opacity-50`}
                    >
                      {paying === tier.id ? "Mengarahkan..." : "Langganan"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {currentSub && (
          <div className="mt-10 p-4 rounded-xl border border-border bg-secondary/10">
            <p className="text-sm text-muted-foreground">
              Kamu sedang berlangganan <strong>{currentSub.tier_name}</strong> —{" "}
              {new Date(currentSub.period_end) > new Date()
                ? `berlaku sampai ${new Date(currentSub.period_end).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                : "masa berlaku sudah habis"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LanggananPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-secondary/20 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <LanggananContent />
    </Suspense>
  );
}
