"use client";

import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SECTIONS = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: "Kami mengumpulkan data yang kamu berikan langsung saat registrasi (nama, email, password terenkripsi). Selama menggunakan platform, kami mengumpulkan data sesi latihan (skor, chat transcript, feedback AI) untuk keperluan evaluasi dan peningkatan layanan. Kami juga mengumpulkan data teknis dasar seperti alamat IP, browser, dan halaman yang dikunjungi melalui cookies.",
  },
  {
    title: "2. Penggunaan Data",
    content: "Data kamu digunakan untuk: (a) menyediakan dan meningkatkan layanan Kodeye, (b) mengirim notifikasi terkait akun, (c) menganalisis tren penggunaan untuk pengembangan fitur, (d) keperluan compliance dan keamanan. Kami tidak akan menjual data pribadi kamu ke pihak ketiga.",
  },
  {
    title: "3. Keamanan Data",
    content: "Kami menerapkan enkripsi SSL/TLS untuk semua transmisi data. Password dienkripsi menggunakan bcrypt. Chat transcript hanya bisa diakses oleh peserta sesi yang bersangkutan. Kami melakukan audit keamanan secara berkala untuk menjaga integritas data.",
  },
  {
    title: "4. Retensi Data",
    content: "Data akun kamu akan kami simpan selama akun masih aktif. Jika akun dihapus, data pribadi akan dihapus dalam waktu 30 hari. Data sesi latihan anonim dapat kami simpan untuk keperluan analisis produk.",
  },
  {
    title: "5. Hak Kamu",
    content: "Kamu berhak untuk: (a) mengakses data pribadi kamu, (b) memperbaiki data yang tidak akurat, (c) menghapus akun dan data terkait, (d) menolak pengumpulan data tertentu. Hubungi kami di hello@kodeye.dev untuk menjalankan hak-hak tersebut.",
  },
  {
    title: "6. Cookies",
    content: "Kami menggunakan cookies untuk autentikasi sesi dan preferensi pengguna. Kamu bisa mengatur preferensi cookies melalui pengaturan browser. Menonaktifkan cookies dapat mempengaruhi fungsionalitas platform.",
  },
  {
    title: "7. Perubahan Kebijakan",
    content: "Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan diumumkan melalui email atau notifikasi di platform. Lanjutan penggunaan setelah perubahan berarti kamu menyetujui kebijakan yang diperbarui.",
  },
  {
    title: "8. Kontak",
    content: "Untuk pertanyaan terkait privasi data, hubungi kami di hello@kodeye.dev atau melalui halaman Kontak.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <section className="text-center space-y-4 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Kebijakan Privasi</h1>
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
