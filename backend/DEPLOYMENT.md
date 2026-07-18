# Kodeye — Deployment & Dokumentasi

## 1. Deploy ke VPS

```bash
cd /opt/kodeye-app
git pull origin main

# Cari lokasi compose file
find . -name "docker-compose*" -o -name "compose*"

# Jalankan migration
docker compose -f backend/docker-compose.yml exec backend node src/db/migrate.js

# Restart backend
docker compose -f backend/docker-compose.yml restart backend

# Rebuild frontend
docker compose -f backend/docker-compose.yml build frontend
docker compose -f backend/docker-compose.yml up -d frontend
```

---

## 2. Fitur Baru

### Donasi
- `/donasi` — donasi via iPaymu/Midtrans
- Admin atur di admin panel → tab **Donasi**

### Feedback
- `/feedback` — kirim saran/kritik
- Admin kelola di admin panel → tab **Feedback**

### Dual Payment Gateway
- iPaymu + Midtrans Snap
- Aktifkan/nonaktifkan & isi key di admin panel → tab **Payment**
- Key disimpan di DB (`payment_config`)

### Kurikulum + Rich Editor (TipTap)
- Admin bikin materi pakai editor mirip Notion
- Fitur: B, I, S, H, Link, Image (upload & URL), Code Block, List, Task, Quote, Align
- Slash command `/`
- Image upload: `POST /api/upload/image` (validasi tipe, max 5MB, UUID)

### Curriculum Reader + Sertifikat
- `/curriculum/[id]` — baca materi + YouTube embed
- `/curriculum` — filter kategori/tipe
- Akses Free / Premium
- Progress & sertifikat otomatis
- `/sertifikat` — lihat sertifikat

---

## 3. Admin Panel Tabs

| Tab | Fungsi |
|-----|--------|
| **Landing** | Edit hero, fitur, pricing |
| **Pricing** | CRUD paket (slug auto-cek) |
| **Scenarios** | CRUD skenario |
| **Payment** | Konfigurasi gateway |
| **Feedback** | Kelola feedback |
| **Donasi** | Atur info donasi |
| **Curriculum** | CRUD materi + rich editor |

---

## 4. Troubleshooting

### "no configuration file provided"
```bash
ls
ls *.yml
ls **/docker-compose.yml
docker compose -f backend/docker-compose.yml exec backend node src/db/migrate.js
```

### Google Login 400
Tambahkan `https://app.kodeye.net` ke Google Cloud Console → Authorized JavaScript origins.

### Image upload 403
Pastikan sudah login (JWT di cookie).

### Midtrans notifikasi tidak masuk
Cek admin → Payment → pastikan Midtrans aktif & Server Key terisi.
