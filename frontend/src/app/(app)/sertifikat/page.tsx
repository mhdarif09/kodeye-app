"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

interface Certificate {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: string;
  issued_at: string;
}

export default function SertifikatPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    api.get("/api/curriculum/certificates/list").then((res) => {
      setCerts(res.data.data ?? []);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">🎓 Sertifikat</h1>
          <p className="text-sm text-muted-foreground mt-1">Sertifikat yang kamu dapatkan</p>
        </div>

        {certs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">🏆</div>
            <p className="font-medium">Belum ada sertifikat</p>
            <p className="text-sm mt-1">Selesaikan materi premium atau dapatkan skor tinggi di duel/AI practice untuk mendapatkan sertifikat.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {certs.map((cert) => (
              <div key={cert.id} className="p-6 rounded-xl border border-border bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎓</div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{cert.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{cert.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Diterbitkan: {new Date(cert.issued_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
