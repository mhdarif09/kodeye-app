# Kodeye — Panduan Migrasi ke VPS

## Arsitektur

```
Internet
  │
  ├── kodeye.net (Landing Page)
  │     └── Nginx → Next.js (port 3001)
  │
  ├── app.kodeye.com (App Dashboard)
  │     └── Nginx → Next.js (port 3001)
  │
  └── api.kodeye.net (Backend API + WebSocket)
        └── Nginx (Cloudflare IP only) → Express (port 3000)
              └── Socket.IO (wss://) via same port
```

## Prasyarat

- VPS dengan Docker & Docker Compose terinstall
- Domain: kodeye.net, app.kodeye.com, api.kodeye.net → pointing ke IP VPS
- SSL certificate untuk ketiga domain (gunakan Let's Encrypt / Certbot)
- Cloudflare (opsional, tapi recommended untuk API security)

## File Penting

| File | Lokasi | Fungsi |
|------|--------|--------|
| `docker-compose.yml` | `backend/docker-compose.yml` | Orkestrasi semua container |
| `Dockerfile` | `backend/Dockerfile` | Build backend Express |
| `docker-entrypoint.sh` | `backend/docker-entrypoint.sh` | Tunggu MySQL → Migrate → Start |
| `Dockerfile` | `frontend/Dockerfile` | Build Next.js (standalone) |
| `kodeye.conf` | `backend/nginx/kodeye.conf` | Konfigurasi Nginx reverse proxy |
| `.env.production` | `backend/.env.production` | Contoh env production |

## Langkah Migrasi

### 1. Clone atau Upload Kode ke VPS

```bash
# Di VPS:
mkdir -p /opt/kodeye
# Upload seluruh folder backend & frontend ke /opt/kodeye/
```

### 2. Setup SSL Certificate

Gunakan Certbot untuk generate SSL:

```bash
# Install certbot
apt install certbot

# Generate certificate untuk setiap domain
certbot certonly --standalone -d kodeye.net -d www.kodeye.net
certbot certonly --standalone -d app.kodeye.com
certbot certonly --standalone -d api.kodeye.net

# Copy ke folder nginx/ssl
mkdir -p /opt/kodeye/backend/nginx/ssl
cp /etc/letsencrypt/live/kodeye.net/fullchain.pem /opt/kodeye/backend/nginx/ssl/kodeye.net.pem
cp /etc/letsencrypt/live/kodeye.net/privkey.pem /opt/kodeye/backend/nginx/ssl/kodeye.net-key.pem
cp /etc/letsencrypt/live/app.kodeye.com/fullchain.pem /opt/kodeye/backend/nginx/ssl/app.kodeye.com.pem
cp /etc/letsencrypt/live/app.kodeye.com/privkey.pem /opt/kodeye/backend/nginx/ssl/app.kodeye.com-key.pem
cp /etc/letsencrypt/live/api.kodeye.net/fullchain.pem /opt/kodeye/backend/nginx/ssl/api.kodeye.net.pem
cp /etc/letsencrypt/live/api.kodeye.net/privkey.pem /opt/kodeye/backend/nginx/ssl/api.kodeye.net-key.pem
```

> **Auto-renewal:** Setelah certbot renew, copy ulang certificate ke folder nginx/ssl.

### 3. Setup Cloudflare (Recommended untuk API Security)

1. Masuk ke Cloudflare dashboard
2. Tambahkan 3 domain: kodeye.net, app.kodeye.com, api.kodeye.net
3. Set DNS records:
   ```
   kodeye.net   A → IP_VPS (Proxied / orange cloud)
   app.kodeye.com  A → IP_VPS (Proxied)
   api.kodeye.net  A → IP_VPS (Proxied)
   ```
4. Untuk api.kodeye.net:
   - **Cloudflare Access** → Buat Zero Trust policy: allow only authenticated requests
   - Atau set **WAF Custom Rule**: block all requests except from your frontend domains

### 4. Update Cloudflare IP di Nginx

```bash
# Jalankan script update Cloudflare IP
chmod +x /opt/kodeye/backend/nginx/update-cloudflare-ip.sh
/opt/kodeye/backend/nginx/update-cloudflare-ip.sh

# Setup cron untuk update otomatis (setiap hari):
echo "0 4 * * * /opt/kodeye/backend/nginx/update-cloudflare-ip.sh" | crontab -
```

### 5. Setup Environment Variables

```bash
cd /opt/kodeye/backend

# Copy & edit production env
cp .env.production .env
nano .env
# Isi semua variabel dengan nilai production
```

### 6. Docker Compose

```bash
cd /opt/kodeye/backend

# Load env vars from .env file
set -a && source .env && set +a

# Build & start containers
docker compose up -d --build

# Check logs
docker compose logs -f backend
docker compose logs -f frontend
```

### 7. Initial Setup

Setelah container berjalan, seed admin user:

```bash
docker exec -it kodeye_backend node seeds/admin.js
```

## OWASP API Security — api.kodeye.net

API domain **tidak bisa diakses publik** secara langsung:

| Lapisan | Metode |
|---------|--------|
| **DNS** | Cloudflare Proxied (IP asli tersembunyi) |
| **Nginx** | Deny all kecuali dari Cloudflare IP range |
| **Auth** | JWT access token (15 menit expiry) |
| **Rate Limit** | 100 request per 15 menit per IP |
| **Headers** | Helmet, CORS restricted, HSTS |

### Verifikasi Keamanan API

```bash
# Pastikan langsung dari server luar ditolak:
curl -v https://api.kodeye.net/api/auth/login
# Harus return 403 Forbidden

# Pastikan request dari frontend tetap jalan:
# (Automatis karena Cloudflare proxy)
```

## Domain Checklist

| Domain | Tujuan | Cloudflare Proxy | Public Access |
|--------|--------|-----------------|---------------|
| `kodeye.net` | Landing Page | ✅ Yes | ✅ Yes |
| `app.kodeye.com` | App Dashboard | ✅ Yes | ✅ Yes (via login) |
| `api.kodeye.net` | API + WebSocket | ✅ Yes | ❌ No (Cloudflare IP only) |

## Perintah Berguna

```bash
# Lihat log semua service
docker compose logs -f

# Restart service tertentu
docker compose restart backend

# Build ulang frontend (misal ada perubahan env)
docker compose build --no-cache frontend

# Backup database
docker exec kodeye_mysql mysqldump -u root -p kodeye_db > backup.sql

# SSH ke container
docker exec -it kodeye_backend sh

# Update Cloudflare IP
/opt/kodeye/backend/nginx/update-cloudflare-ip.sh
```

## Troubleshooting

### CORS Error saat Register/Login (500)
Penyebab: Browser di `app.kodeye.com` atau `kodeye.net` kirim request ke `api.kodeye.net`, tapi backend CORS cuma allow satu origin.

**Fix:** Pastikan environment variable `FRONTEND_URLS` di docker-compose berisi semua domain yang dipake:
```yaml
FRONTEND_URL: https://kodeye.net
FRONTEND_URLS: https://app.kodeye.com,https://www.kodeye.net
```
Backend akan allow semua origin yang ada di `FRONTEND_URL` + `FRONTEND_URLS`.

### Frontend tidak bisa connect ke API
- Pastikan `NEXT_PUBLIC_API_URL=https://api.kodeye.net` di docker-compose
- Pastikan DNS api.kodeye.net pointing ke IP VPS
- Cek log nginx: `docker compose logs nginx`

### WebSocket tidak connect
- Pastikan Nginx proxy WebSocket (upgrade header)
- Socket.IO path harus `/socket.io/` (default)
- Cek koneksi: `curl -v https://api.kodeye.net/socket.io/?EIO=4`

### Database migration gagal
```bash
docker compose logs backend
# Manual: masuk ke container dan jalankan
docker exec -it kodeye_backend sh
node src/db/migrate.js
```

### SSL Certificate expired
```bash
certbot renew
cp /etc/letsencrypt/live/*/fullchain.pem /opt/kodeye/backend/nginx/ssl/
cp /etc/letsencrypt/live/*/privkey.pem /opt/kodeye/backend/nginx/ssl/
docker compose restart nginx
```
