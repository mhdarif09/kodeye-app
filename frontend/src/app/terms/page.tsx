"use client";

import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SECTIONS = [
  {
    title: "1. Penerimaan Ketentuan",
    content: "Dengan menggunakan platform Kodeye, kamu menyetujui Syarat dan Ketentuan ini. Jika kamu tidak setuju dengan bagian manapun dari ketentuan ini, kamu tidak diperbolehkan menggunakan platform.",
  },
  {
    title: "2. Akun Pengguna",
    content: "Kamu bertanggung jawab menjaga kerahasiaan credential akun kamu. Aktivitas yang terjadi dalam akun kamu adalah tanggung jawab kamu. Kamu harus berusia minimal 13 tahun untuk menggunakan platform ini.",
  },
  {
    title: "3. Konten dan Perilaku",
    content: "Kamu setuju untuk tidak: (a) menyalahgunakan platform untuk aktivitas ilegal, (b) melecehkan atau merugikan pengguna lain, (c) mengirim spam atau konten berbahaya, (d) mencoba meretas atau mengganggu infrastruktur Kodeye. Chat transcript sesi latihan bersifat rahasia antar peserta.",
  },
  {
    title: "4. Layanan Berbayar",
    content: "Beberapa fitur mungkin memerlukan langganan berbayar. Pembayaran diproses melalui pihak ketiga (iPaymu) dan tunduk pada ketentuan mereka. Kamu setuju bahwa kamu tidak akan melakukan chargeback tanpa alasan yang sah.",
  },
  {
    title: "5. Hak Kekayaan Intelektual",
    content: "Semua konten platform, termasuk skenario latihan, sistem scoring, dan branding Kodeye, adalah milik Kodeye dan dilindungi hukum hak cipta. Kamu tidak diizinkan menyalin, memodifikasi, atau mendistribusikan konten tanpa izin tertulis.",
  },
  {
    title: "6. Batasan Tanggung Jawab",
    content: "Kodeye menyediakan platform \"sebagaimana adanya\". Kami tidak menjamin bahwa platform akan bebas dari gangguan atau error. Kodeye tidak bertanggung jawab atas kerugian yang timbul dari penggunaan platform, termasuk keputusan karier berdasarkan feedback AI.",
  },
  {
    title: "7. Penghentian Layanan",
    content: "Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini. Kamu bisa menghapus akun kapan saja melalui pengaturan akun. Data akan dihapus sesuai kebijakan privasi.",
  },
  {
    title: "8. Perubahan Ketentuan",
    content: "Kami dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Pengguna akan diberitahu melalui email atau notifikasi di platform. Penggunaan lanjutan setelah perubahan berarti persetujuan terhadap ketentuan baru.",
  },
  {
    title: "9. Hukum yang Berlaku",
    content: "Ketentuan ini diatur oleh hukum Republik Indonesia. Segala sengketa akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai, melalui pengadilan yang berwenang.",
  },
  {
    title: "10. Kontak",
    content: "Untuk pertanyaan terkait Syarat dan Ketentuan, hubungi hello@kodeye.dev.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <section className="text-center space-y-4 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Syarat & Ketentuan</h1>
            <p className="text-muted-foreground">
              Terakhir diperbarui: Juli 2026
            </p>
          </section>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
