# WebSocket Server

Server real-time untuk SIMRS. Klien tersambung lewat Socket.IO. Pembaruan antrian poli dan resep masuk dari Redis, lalu diteruskan ke room display. Notifikasi per user dikirim lewat HTTP.

Modul yang berjalan: antrian poli (alias `/queue`), resep, admin display, dan notifikasi.

## Instalasi

Butuh Node.js dan Redis.

```bash
npm install
cp env.example .env
npm start
```

Server mendengarkan di `SOCKETIO_PORT` (bawaan `6001`). Redis diatur lewat `REDIS_URL`. Cek hidup server: `GET /health`.
