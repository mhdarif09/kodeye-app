import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight mb-2">
              <div className="h-6 w-6 rounded bg-primary" />
              Kodeye
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs">
              Platform latihan soft skill teknis buat developer. Roleplay real-time, scoring AI, feedback dari peers.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produk</p>
              <ul className="space-y-1.5">
                <li><a href="/#scenarios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skenario</a></li>
                <li><Link href="/langganan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Harga</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perusahaan</p>
              <ul className="space-y-1.5">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tentang</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kontak</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Kodeye. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
