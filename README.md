# ⚡ KilasFeed – Agregator RSS Berita Indonesia & Telegram Bot Auto-Poster

**KilasFeed** adalah web agregator berita RSS modern, super cepat, dan responsif yang menyajikan berita terkini dari **15+ portal media nasional & finansial terkemuka Indonesia** (ANTARA, Tempo, Detik, CNBC Indonesia, Republika, Liputan6, CNN Indonesia, dan lainnya).

Dilengkapi dengan integrasi **Bot Telegram** otomatis dan manual untuk membagikan berita terbaru secara *real-time* ke Channel atau Group Telegram Anda.

---

## 🌟 Fitur Utama

- ⚡ **Strategi Parallel Proxy Racing (Super Cepat)**:
  Memanggil multiple parser (Direct XML, Feed2JSON, RSS2JSON, Codetabs, AllOrigins) secara paralel. Proxy mana pun yang merespons paling cepat (70ms – 160ms) akan langsung memenangkan balapan dan menampilkan berita seketika.
- 🚀 **SWR In-Memory Caching (0ms Instant Switch)**:
  Perpindahan antar kanal berita berlangsung instan **0 milidetik** tanpa *loading spinner* untuk kanal yang pernah dibuka.
- 🖼️ **Ekstraksi Gambar Pintar (Smart Image Extraction)**:
  Mengekstrak foto berita asli langsung dari tag `<img src="...">`, `<media:content>`, `<enclosure>`, dan CDATA RSS XML tanpa gambar rekayasa/dummy.
- 📱 **Desain Ultra-Responsif**:
  Tampilan antarmuka (UI) yang nyaman, indah, dan presisi di semua ukuran layar (**Mobile HP**, **Tablet**, dan **Desktop**).
- 🤖 **Integrasi Telegram Bot Dual-Mode**:
  - **Manual Send Button**: Tombol *Kirim Telegram* di setiap berita pada UI website.
  - **Background Auto-Poster Script** (`telegram-bot.js`): Mengecek seluruh RSS secara berkala (misal setiap 10 menit) dengan sistem pencegah duplikasi berita (`sent_articles.json`).
  - **Vercel Cron Job Ready** (`/api/cron.js`): Berjalan otomatis setiap 15 menit secara gratis di Vercel.
- 🔍 **Pencarian & Pengurutan Berita Real-time**: Filter berita berdasarkan kata kunci dan urutkan berdasarkan waktu publikasi atau abjad.
- 🔖 **Favorit & Simpanan Lokal**: Simpan berita favorit Anda langsung di browser tanpa registrasi.
- 🌙 **Mode Gelap / Terang (Dark / Light Theme)**: Transisi tema visual yang nyaman di mata.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, Vite 5, Tailwind CSS
- **Icons**: Lucide React
- **RSS Engines & Parsers**: Feed2JSON API, RSS2JSON API, Native DOMParser XML
- **Backend / Script**: Node.js (ES Module), Telegram Bot API (`sendPhoto` & `sendMessage` HTML format)
- **Deployment**: Vercel (Static Web + Vercel Serverless Cron Jobs)

---

## 📁 Struktur Direktori Utama

```text
rss-reader/
├── api/
│   └── cron.js                # Handler Vercel Serverless Cron Job
├── src/
│   ├── components/            # Komponen UI (Header, NewsCard, NewsGrid, DetailModal, dll)
│   ├── data/                  # Daftar 15+ kanal RSS feeds (feeds.js)
│   ├── hooks/                 # Custom React Hooks (useRssFeed, useTheme, useBookmarks)
│   ├── services/              # Telegram Service Utility (telegramService.js)
│   ├── App.jsx                # Komponen Utama Aplikasi
│   └── index.css              # Design System Tailwind CSS & Animasi
├── telegram-bot.js            # Script Background Auto-Poster Node.js (CLI / Local Cron)
├── sent_articles.json         # Cache Riwayat Berita Terkirim (Auto Generated)
├── .env.example               # Template Konfigurasi Environment Variables
├── .gitignore                 # File Keamanan Git (Mencegah Kebocoran Token .env)
├── vercel.json                # Konfigurasi Jadwal Vercel Cron Job
├── vite.config.js             # Konfigurasi Vite
└── package.json               # Dependensi & NPM Scripts
```

---

## 🚀 Panduan Instalasi & Penggunaan Lokal

### 1. Clone Repository & Install Dependensi
```bash
git clone https://github.com/username/kilasfeed-rss-reader.git
cd kilasfeed-rss-reader
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel dengan token Telegram Bot Anda:
```env
# Telegram Bot Token dari @BotFather
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Chat ID / @channelusername Telegram Anda
TELEGRAM_CHAT_ID=your_chat_id_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here

# Interval Pengecekan Auto-Poster (dalam menit)
CHECK_INTERVAL_MINUTES=10
```

### 3. Jalankan Server Pengembang Website
```bash
npm run dev
```
Buka browser Anda di `http://localhost:3000/`.

---

## 🤖 Menjalankan Bot Telegram (Auto-Poster Local)

Jika ingin menjalankan bot otomatis di komputer/server lokal:
```bash
# Menjalankan bot terus menerus (pengecekan otomatis setiap 10 menit)
npm run bot

# Atau menjalankan pengecekan 1x saja tanpa perulangan
npm run bot:once
```

---

## 🌐 Deploy ke Vercel

1. **Push ke GitHub**:
   Pastikan Anda telah melakukan push kode ke repository GitHub Anda (file `.env` secara otomatis tidak akan ikut terupload karena sudah dilindungi oleh `.gitignore`).

2. **Import ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com) ➔ Klik **Add New Project**.
   - Hubungkan repository GitHub KilasFeed Anda.

3. **Tambahkan Environment Variables di Vercel**:
   Pada menu **Environment Variables** di Vercel, masukkan:
   - `TELEGRAM_BOT_TOKEN`: `TOKEN_BOT_ANDA`
   - `TELEGRAM_CHAT_ID`: `CHAT_ID_ANDA`

4. **Deploy**:
   Klik tombol **Deploy**. Website akan langsung online dan Vercel Cron Job akan otomatis mengeksekusi bot background setiap 15 menit secara gratis!

---

## 🔒 Keamanan (Security)

File `.gitignore` pada proyek ini telah dikonfigurasi untuk secara ketat mengecualikan file rahasia berikut dari pengunggahan ke publik:
- File lingkungan `.env` & `.env.local`
- File cache riwayat `sent_articles.json`
- Folder `node_modules/` dan `dist/`

---

## 📄 Lisensi

Distribusi terbuka di bawah lisensi MIT. Silakan gunakan dan kembangkan sesuai kebutuhan Anda.
