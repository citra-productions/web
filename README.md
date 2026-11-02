# Citra Production

Website katalog Citra Production (Vue 3 + Vite) yang tersambung ke backend Laravel (REST API `/api/v1`).

## Menjalankan

Backend, dari folder `../backend`:

```bash
mise install
mise run setup
mise run db:up
mise run serve
```

API berjalan di `http://localhost:8000`. Untuk full stack container, `mise run stack` menjalankan API di `http://localhost:8080`.

Frontend, dari folder ini:

```bash
mise install
mise run install
cp .env.example .env.local
mise run dev
```

Buka `http://localhost:5173`. Jika alamat backend berbeda, ubah `VITE_API_BASE_URL` di `.env.local`. Nilai default `http://localhost:8080/api/v1`; untuk API lokal dari `mise run serve`, gunakan `http://localhost:8000/api/v1`.

Admin: buka `http://localhost:5173/#/admin`, masuk dengan email dan password admin.

## Build dan deploy

```bash
mise run build
```

Hasil build ada di `dist/`. Untuk produksi, `.env.production` mengarahkan frontend ke `https://cp-api.atalariq.dev/api/v1`. Deploy memakai Cloudflare Workers static assets:

```bash
npx wrangler deploy
```

Domain produksi: `https://cp.atalariq.dev`.

## Catatan perilaku (mengikuti aturan API)

- Status moderasi: `pending → published | rejected`, `published ↔ withdrawn`; `rejected` final. Hapus hanya untuk yang ditolak/disembunyikan.
- Produk perlu kategori dan harga sebelum bisa ditayangkan. Harga diisi min dan max (satu harga = min sama dengan max).
- Foto: JPG/PNG/WebP, dikompres otomatis di browser; alt text diisi satu kali per produk/portofolio.
- Gambar hero: letakkan file `src/assets/hero.jpg` (atau png/webp); tidak diatur lewat API.
- Urutan FAQ belum bisa diatur dari antarmuka admin.
- `npm run build` menghasilkan folder `dist`.
