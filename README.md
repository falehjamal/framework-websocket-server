# WebSocket Server

Server real-time berbasis Socket.io dan Express. Aplikasi (termasuk Laravel) mengirim event lewat Redis; server ini meneruskannya ke client yang sedang terhubung, misalnya layar antrian poli, farmasi, dan notifikasi.

Butuh Node.js dan Redis. Server default berjalan di port `6001`.

## Fitur

- **Antrian poli.** Client masuk room per grup (`join-group` / `leave-group`). Event Redis di channel `antrian.*` di-broadcast ke grup yang sesuai. Route lama `/queue` tetap mengarah ke modul ini.
- **Prescription.** Client bergabung ke room farmasi (`join-prescription` / `leave-prescription`). Event Redis yang namanya diawali `prescription.` dikirim ke room itu.
- **Notifikasi.** Client masuk room berdasarkan username. HTTP `POST /notification/send` mengirim notifikasi ke user tersebut.
- **Admin.** Melihat display yang aktif, menyuruh semua display refresh, dan mengirim broadcast ke layar.
- **Redis.** Subscriber pola `antrian.*` dan `*`. Jika Redis tidak tersedia, server tetap jalan tanpa penerusan pesan.
- **Monitoring.** `GET /health` untuk status server, `GET /displays/active` untuk display yang sedang terhubung, `GET /monitoring/clients` untuk snapshot notifikasi, resep, dan display. Client di room `monitoring` menerima event `monitoring:update` saat ada yang join atau leave.
- **Log.** Error ditulis ke `logs/error.log`. Log `info` dan `warn` hanya tampil di console.

## Instalasi

1. Pastikan Node.js dan Redis sudah terpasang dan Redis berjalan.
2. Masuk ke folder proyek, lalu pasang dependency:

```bash
npm install
```

3. Salin environment:

```bash
cp env.example .env
```

Isi `.env` yang dibaca server:

```bash
SOCKETIO_PORT=6001
REDIS_URL=redis://127.0.0.1:6379/0
```

4. Jalankan server:

```bash
npm start
```

Cek server:

```bash
curl http://localhost:6001/health
```

Client Socket.io terhubung ke `http://localhost:6001` (transport `websocket` dan `polling`).

## Endpoint singkat

- `GET /health` — status server dan daftar modul
- `GET /displays/active` — display yang sedang terhubung
- `GET /antrianpoli/groups/active` — grup antrian yang punya client
- `GET /antrianpoli/groups/:groupId` — info satu grup
- `GET /prescription/active` — client di room prescription
- `POST /prescription/broadcast` — kirim event ke room prescription
- `POST /notification/send` — kirim notifikasi (`username`, `title`, `message`)
- `GET /notification/active-users` — user notifikasi yang sedang online
- `GET /admin/displays/active` — display aktif
- `POST /admin/displays/refresh` — refresh semua display
- `POST /admin/displays/broadcast` — broadcast pesan ke display
- `GET /admin/system/stats` — statistik koneksi
- `GET /monitoring/clients` — snapshot klien notifikasi, resep, dan display antrian

Route antrian yang sama juga tersedia di prefix `/queue`.
