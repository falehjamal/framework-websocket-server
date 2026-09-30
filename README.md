# WebSocket Server - Modular Architecture

WebSocket server yang telah direfactor dengan arsitektur modular untuk mendukung pengembangan fitur-fitur baru secara scalable dan maintainable.

## 🚀 Fitur Utama

- **Arsitektur Modular**: Setiap fitur dalam modul terpisah yang independen
- **WebSocket Antrian Poli**: Sistem antrian dengan grouping dan broadcast
- **Modul Prescription**: Sistem farmasi dengan room-based communication
- **Auto Module Registration**: Modul baru otomatis terdaftar
- **Scalable Structure**: Mudah menambah fitur baru tanpa mengubah core
- **Comprehensive Logging**: Logging terpusat dengan level yang berbeda
- **Redis Integration**: Support untuk Redis sebagai message broker
- **Health Monitoring**: Health check endpoints untuk setiap modul

## 📁 Struktur Project

```
websocket-server-refactored/
├── server.js                           # Entry point minimal
├── package.json                        # Dependencies
├── .env                                # Environment variables
├── MODULE_DEVELOPMENT_GUIDE.md         # Panduan pengembangan modul
├── logs/                               # Log files
└── src/
    ├── app.js                          # Main application
    ├── core/                           # Core system components
    │   ├── config/                     # Configuration management
    │   ├── services/                   # Core services
    │   └── utils/                      # Utility functions
    ├── modules/                        # Feature modules
    │   ├── queue/                      # WebSocket Antrian Poli
    │   ├── prescription/               # Modul Prescription
    │   └── template/                   # Template untuk modul baru
    └── shared/                         # Shared utilities
        ├── middleware/
        └── types/
```

## 🛠️ Installation

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd websocket-server-refactored
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment**:
   ```bash
   cp env.example .env
   # Edit .env file sesuai kebutuhan
   ```

4. **Start Server**:
   ```bash
   npm start
   ```

## 🔧 Configuration

Konfigurasi utama dapat diatur melalui environment variables di file `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

```

## 📡 API Endpoints

### Global Endpoints

- `GET /health` - Health check untuk semua modul
- `GET /displays/active` - Daftar display aktif

### Queue Module

- `GET /queue/groups/active` - Daftar grup antrian aktif
- `GET /queue/groups/:groupId` - Info grup antrian spesifik

### Prescription Module

- `GET /prescription/active` - Koneksi prescription aktif
- `POST /prescription/broadcast` - Broadcast ke semua client prescription

## 🔌 WebSocket Events

### Queue Module Events

**Client to Server:**
- `join-group` - Join ke grup antrian
- `leave-group` - Leave grup antrian

**Server to Client:**
- `joined-group` - Konfirmasi join grup
- `left-group` - Konfirmasi leave grup

### Prescription Module Events

**Client to Server:**
- `join-prescription` - Join ke room prescription
- `leave-prescription` - Leave room prescription

**Server to Client:**
- `prescription-joined` - Konfirmasi join prescription
- `prescription-left` - Konfirmasi leave prescription
- `prescription-broadcast` - Broadcast message

### Global Events

- `ping` / `pong` - Heartbeat
- `error` - Error notifications

## 🧩 Menambahkan Modul Baru

Untuk menambahkan modul baru, ikuti langkah-langkah di [MODULE_DEVELOPMENT_GUIDE.md](./MODULE_DEVELOPMENT_GUIDE.md).

### Quick Start

1. **Copy Template**:
   ```bash
   cp -r src/modules/template src/modules/your-module
   ```

2. **Update Module Name** di semua file

3. **Register Module** di `src/app.js`:
   ```javascript
   const YourModule = require('./modules/your-module');
   
   // In initializeModules()
   const yourModule = new YourModule(this.io, this.connectionManager);
   this.modules.set('your-module', yourModule);
   ```

4. **Test Module**:
   ```bash
   curl http://localhost:3000/your-module/status
   ```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
```bash
# Test WebSocket connection
npm run test:socket

# Test HTTP endpoints
npm run test:api
```

## 📊 Monitoring

### Health Checks

Setiap modul memiliki health check endpoint:

```bash
# Global health check
curl http://localhost:3000/health

# Module-specific health check
curl http://localhost:3000/queue/status
curl http://localhost:3000/prescription/active
```

### Logging

Log error tersimpan di `logs/error.log`. Log `info` dan `warn` hanya tampil di console.

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
# Build image
docker build -t websocket-server .

# Run container
docker run -p 3000:3000 websocket-server
```

### Docker Compose
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Ikuti struktur modular yang sudah ada
- Tambahkan tests untuk fitur baru
- Update dokumentasi
- Gunakan logging yang konsisten
- Implementasikan error handling yang proper

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika ada pertanyaan atau masalah:

1. Baca [MODULE_DEVELOPMENT_GUIDE.md](./MODULE_DEVELOPMENT_GUIDE.md)
2. Check existing issues
3. Create new issue dengan detail yang lengkap

## 🔄 Migration dari Versi Lama

Jika Anda memiliki WebSocket server versi lama, ikuti panduan migrasi:

1. **Backup Data**: Backup semua data dan konfigurasi
2. **Update Dependencies**: Update package.json
3. **Migrate Handlers**: Pindahkan socket handlers ke modul yang sesuai
4. **Update Client Code**: Update client untuk menggunakan event names yang baru
5. **Test Thoroughly**: Test semua functionality sebelum production

## 📈 Roadmap

- [ ] Add authentication middleware
- [ ] Implement rate limiting
- [ ] Add database integration
- [ ] Create admin dashboard
- [ ] Add metrics and analytics
- [ ] Implement clustering support
- [ ] Add automated testing pipeline

