"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CurriculumForm from "@/components/CurriculumForm";

export default function NewKurikulumPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <div>
          <Link href="/admin/kurikulum" className="text-xs text-muted-foreground hover:text-foreground mb-2 block">&larr; Kembali</Link>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Materi Baru</h1>
        </div>

        <CurriculumForm onSuccess={() => router.push("/admin/kurikulum")} />
      </div>
    </div>
  );
}
