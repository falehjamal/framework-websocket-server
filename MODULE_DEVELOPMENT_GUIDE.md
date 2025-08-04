# Panduan Pengembangan Modul WebSocket Server

## Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Arsitektur Modular](#arsitektur-modular)
3. [Struktur Modul](#struktur-modul)
4. [Cara Menambahkan Modul Baru](#cara-menambahkan-modul-baru)
5. [Template Modul](#template-modul)
6. [Best Practices](#best-practices)
7. [Contoh Implementasi](#contoh-implementasi)
8. [Testing](#testing)
9. [Deployment](#deployment)

## Pengenalan

WebSocket Server ini telah direfactor untuk menggunakan arsitektur modular yang memungkinkan pengembangan fitur-fitur baru secara terpisah dan independen. Setiap modul memiliki tanggung jawab yang jelas dan dapat dikembangkan, ditest, dan di-maintain secara terpisah.

### Keuntungan Arsitektur Modular

- **Separation of Concerns**: Setiap modul menangani satu domain bisnis spesifik
- **Scalability**: Mudah menambahkan fitur baru tanpa mengubah kode yang sudah ada
- **Maintainability**: Kode lebih mudah dipelihara dan di-debug
- **Testability**: Setiap modul dapat ditest secara independen
- **Reusability**: Komponen dapat digunakan ulang di modul lain

## Arsitektur Modular

### Struktur Direktori

```
websocket-server-refactored/
├── server.js                           # Entry point minimal
├── package.json                        # Dependencies
├── .env                                # Environment variables
├── logs/                               # Log files
└── src/
    ├── app.js                          # Main application (minimal)
    ├── core/                           # Core system components
    │   ├── config/                     # Configuration management
    │   ├── services/                   # Core services (Redis, Logger, etc.)
    │   └── utils/                      # Utility functions
    ├── modules/                        # Feature modules
    │   ├── queue/                      # WebSocket Antrian Poli
    │   │   ├── handlers/               # Socket event handlers
    │   │   ├── services/               # Business logic
    │   │   ├── routes/                 # HTTP API routes
    │   │   └── index.js                # Module entry point
    │   ├── prescription/               # Modul Prescription
    │   │   ├── handlers/
    │   │   ├── services/
    │   │   ├── routes/
    │   │   └── index.js
    │   └── template/                   # Template untuk modul baru
    │       ├── handlers/
    │       ├── services/
    │       ├── routes/
    │       └── index.js
    └── shared/                         # Shared utilities
        ├── middleware/                 # Custom middleware
        └── types/                      # Type definitions
```

### Komponen Utama

#### 1. Core Services
- **Config**: Manajemen konfigurasi aplikasi
- **Logger**: Sistem logging terpusat
- **Redis**: Integrasi dengan Redis
- **Broadcast**: Service untuk broadcasting
- **ConnectionManager**: Manajemen koneksi WebSocket

#### 2. Module System
- **Module Registration**: Otomatis mendaftarkan semua modul
- **Event Handling**: Setiap modul menangani event sendiri
- **Route Management**: HTTP routes per modul
- **Lifecycle Management**: Startup dan shutdown hooks

## Struktur Modul

Setiap modul harus mengikuti struktur standar berikut:

### File Struktur Modul

```
modules/your-module/
├── index.js                    # Main module class
├── handlers/                   # WebSocket event handlers
│   └── yourModuleHandlers.js
├── routes/                     # HTTP API routes
│   └── yourModuleRoutes.js
└── services/                   # Business logic
    └── yourModuleService.js
```

### Interface Modul

Setiap modul harus mengimplementasikan interface berikut:

```javascript
class YourModule {
    constructor(io, connectionManager) {
        // Initialization
    }

    registerSocketHandlers(socket) {
        // Register WebSocket event handlers
    }

    getRoutes() {
        // Return Express router for HTTP routes
    }

    handleDisconnection(socket) {
        // Handle client disconnection
    }

    async shutdown() {
        // Cleanup resources
    }
}
```



## Cara Menambahkan Modul Baru

### Langkah 1: Persiapan

1. **Tentukan Nama Modul**: Pilih nama yang deskriptif dan konsisten (contoh: `radiology`, `laboratory`, `appointment`)

2. **Buat Direktori Modul**: 
   ```bash
   mkdir -p src/modules/your-module/{handlers,routes,services}
   ```

3. **Copy Template**: Salin semua file dari `src/modules/template/` ke direktori modul baru Anda

### Langkah 2: Implementasi Module Class

Buat file `src/modules/your-module/index.js`:

```javascript
const YourModuleHandlers = require('./handlers/yourModuleHandlers');
const YourModuleRoutes = require('./routes/yourModuleRoutes');
const YourModuleService = require('./services/yourModuleService');
const logger = require('../../core/services/logger');

class YourModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        
        // Initialize services first
        this.service = new YourModuleService();
        
        // Then initialize handlers and routes
        this.handlers = new YourModuleHandlers(io, connectionManager, this.service);
        this.routes = new YourModuleRoutes(connectionManager, this.service);
        
        logger.info('📦 YourModule initialized');
    }

    registerSocketHandlers(socket) {
        // Register all socket events for this module
        socket.on('your-module-event', (data) => 
            this.handlers.handleYourEvent(socket, data));
        socket.on('your-module-join', (data) => 
            this.handlers.handleJoin(socket, data));
        socket.on('your-module-leave', (data) => 
            this.handlers.handleLeave(socket, data));
    }

    getRoutes() {
        return this.routes.getRouter();
    }

    handleDisconnection(socket) {
        this.handlers.handleDisconnection(socket);
    }

    async shutdown() {
        logger.info('📦 YourModule shutting down');
        if (this.service && this.service.cleanup) {
            await this.service.cleanup();
        }
    }
}

module.exports = YourModule;
```

### Langkah 3: Implementasi Handlers

Buat file `src/modules/your-module/handlers/yourModuleHandlers.js`:

```javascript
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class YourModuleHandlers {
    constructor(io, connectionManager, service) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.service = service;
    }

    handleYourEvent(socket, data) {
        try {
            logger.info(`🔧 Your module event from ${socket.id}:`, data);
            
            // Process data using service
            const result = this.service.processData(data);
            
            // Send response
            socket.emit('your-module-response', {
                success: true,
                data: result,
                timestamp: createTimestamp()
            });

        } catch (error) {
            logger.error('❌ Error handling your module event:', error);
            socket.emit('error', { 
                message: 'Failed to process your module event',
                error: error.message 
            });
        }
    }

    handleJoin(socket, data) {
        try {
            const { roomId } = data;
            
            if (!roomId) {
                socket.emit('error', { message: 'Room ID is required' });
                return;
            }

            const roomName = `your_module_${roomId}`;
            
            socket.join(roomName);
            socket.emit('your-module-joined', {
                roomId,
                roomName,
                timestamp: createTimestamp()
            });

            logger.info(`🔧 Client ${socket.id} joined your module room ${roomId}`);

        } catch (error) {
            logger.error('❌ Error handling join:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }

    handleLeave(socket, data) {
        try {
            const { roomId } = data;
            const roomName = `your_module_${roomId}`;
            
            socket.leave(roomName);
            socket.emit('your-module-left', {
                roomId,
                roomName,
                timestamp: createTimestamp()
            });

            logger.info(`🔧 Client ${socket.id} left your module room ${roomId}`);

        } catch (error) {
            logger.error('❌ Error handling leave:', error);
            socket.emit('error', { message: 'Failed to leave room' });
        }
    }

    handleDisconnection(socket) {
        logger.debug(`🔧 YourModule handling disconnection for ${socket.id}`);
        // Add cleanup logic here
    }
}

module.exports = YourModuleHandlers;
```

### Langkah 4: Implementasi Routes

Buat file `src/modules/your-module/routes/yourModuleRoutes.js`:

```javascript
const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class YourModuleRoutes {
    constructor(connectionManager, service) {
        this.connectionManager = connectionManager;
        this.service = service;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // GET /your-module/status
        this.router.get('/status', (req, res) => {
            try {
                const status = this.service.getStatus();
                
                res.json({
                    success: true,
                    status,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error getting status:', error);
                res.status(500).json({ 
                    error: 'Failed to get status',
                    message: error.message 
                });
            }
        });

        // POST /your-module/data
        this.router.post('/data', (req, res) => {
            try {
                const result = this.service.processData(req.body);
                
                res.json({
                    success: true,
                    result,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error processing data:', error);
                res.status(500).json({ 
                    error: 'Failed to process data',
                    message: error.message 
                });
            }
        });

        // POST /your-module/broadcast
        this.router.post('/broadcast', (req, res) => {
            try {
                const { message, data, roomId } = req.body;
                
                if (!message) {
                    return res.status(400).json({
                        error: 'Message is required'
                    });
                }

                let targetRoom = 'your_module';
                if (roomId) {
                    targetRoom = `your_module_${roomId}`;
                }

                this.connectionManager.io.to(targetRoom).emit('your-module-broadcast', {
                    message,
                    data,
                    roomId,
                    timestamp: createTimestamp()
                });

                res.json({
                    success: true,
                    message: 'Broadcast sent successfully',
                    targetRoom,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error broadcasting:', error);
                res.status(500).json({ 
                    error: 'Failed to broadcast message',
                    message: error.message 
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = YourModuleRoutes;
```

### Langkah 5: Implementasi Service

Buat file `src/modules/your-module/services/yourModuleService.js`:

```javascript
const logger = require('../../../core/services/logger');

class YourModuleService {
    constructor() {
        this.data = new Map();
        this.isActive = true;
        
        logger.info('🔧 YourModule service initialized');
    }

    processData(inputData) {
        try {
            logger.debug('🔧 Processing data:', inputData);
            
            // Implement your business logic here
            const processedData = {
                id: Date.now(),
                originalData: inputData,
                processedAt: new Date().toISOString(),
                status: 'processed'
            };

            this.data.set(processedData.id, processedData);
            
            return processedData;

        } catch (error) {
            logger.error('❌ Error processing data:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isActive: this.isActive,
            dataCount: this.data.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    getData(id) {
        return this.data.get(id);
    }

    getAllData() {
        return Array.from(this.data.values());
    }

    clearData() {
        this.data.clear();
        logger.info('🔧 YourModule service data cleared');
    }

    async cleanup() {
        logger.info('🔧 YourModule service cleaning up');
        
        this.isActive = false;
        this.data.clear();
        
        // Add cleanup logic here
    }
}

module.exports = YourModuleService;
```

### Langkah 6: Registrasi Modul

Tambahkan modul baru ke `src/app.js`:

```javascript
// Import your new module
const YourModule = require('./modules/your-module');

// In the initializeModules() method, add:
const yourModule = new YourModule(this.io, this.connectionManager);
this.modules.set('your-module', yourModule);
```

### Langkah 7: Testing

1. **Start Server**: 
   ```bash
   npm start
   ```

2. **Test HTTP Endpoints**:
   ```bash
   # Check module status
   curl http://localhost:3000/your-module/status
   
   # Test data processing
   curl -X POST http://localhost:3000/your-module/data \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Test WebSocket Events**: Gunakan client WebSocket untuk test event handling

### Langkah 8: Dokumentasi

Buat file `src/modules/your-module/README.md` yang menjelaskan:
- Tujuan modul
- API endpoints yang tersedia
- WebSocket events yang didukung
- Contoh penggunaan
- Dependencies khusus (jika ada)


## Template Modul

Folder `src/modules/template/` berisi template lengkap yang dapat Anda copy dan modifikasi untuk modul baru. Template ini sudah mencakup:

- Struktur class yang benar
- Error handling yang proper
- Logging yang konsisten
- Dokumentasi inline
- Contoh implementasi untuk berbagai use case

### Menggunakan Template

1. Copy folder template:
   ```bash
   cp -r src/modules/template src/modules/your-module
   ```

2. Rename semua file dan class sesuai dengan nama modul Anda

3. Modifikasi logic sesuai kebutuhan bisnis Anda

4. Update dokumentasi dan comments

## Best Practices

### 1. Naming Conventions

- **Module Names**: Gunakan kebab-case untuk nama folder (`radiology`, `laboratory`, `patient-management`)
- **Class Names**: Gunakan PascalCase (`RadiologyModule`, `LaboratoryHandlers`)
- **File Names**: Gunakan camelCase dengan suffix yang jelas (`radiologyHandlers.js`, `radiologyService.js`)
- **Event Names**: Gunakan kebab-case dengan prefix modul (`radiology-scan-request`, `lab-result-ready`)

### 2. Error Handling

Selalu implementasikan error handling yang proper:

```javascript
try {
    // Your logic here
    const result = await this.service.processData(data);
    socket.emit('success-response', result);
} catch (error) {
    logger.error('❌ Error in handler:', error);
    socket.emit('error', { 
        message: 'User-friendly error message',
        code: 'ERROR_CODE',
        timestamp: createTimestamp()
    });
}
```

### 3. Logging

Gunakan logging yang konsisten dan informatif:

```javascript
// Info level untuk operasi normal
logger.info(`📋 Patient ${patientId} registered for radiology scan`);

// Warn level untuk situasi yang perlu perhatian
logger.warn(`⚠️ Scan queue is getting full: ${queueSize} items`);

// Error level untuk error yang perlu investigasi
logger.error('❌ Failed to process scan request:', error);

// Debug level untuk debugging (tidak muncul di production)
logger.debug('🔍 Processing scan data:', scanData);
```

### 4. Room Management

Gunakan naming convention yang konsisten untuk rooms:

```javascript
// Format: {module}_{type}_{id}
const roomName = `radiology_scan_${scanId}`;
const queueRoom = `queue_poli_${poliId}`;
const prescriptionRoom = `prescription_${pharmacyId}`;
```

### 5. Data Validation

Selalu validasi input data:

```javascript
handleScanRequest(socket, data) {
    // Validate required fields
    const { patientId, scanType, priority } = data;
    
    if (!patientId || !scanType) {
        socket.emit('error', { 
            message: 'Patient ID and scan type are required',
            code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
    }
    
    // Validate data types and formats
    if (typeof patientId !== 'string' || patientId.length < 3) {
        socket.emit('error', { 
            message: 'Invalid patient ID format',
            code: 'INVALID_PATIENT_ID'
        });
        return;
    }
    
    // Continue with processing...
}
```

### 6. Service Layer Pattern

Pisahkan business logic ke service layer:

```javascript
// ❌ Bad: Business logic in handler
handleScanRequest(socket, data) {
    // Complex business logic here...
    const scanData = {
        id: generateId(),
        patientId: data.patientId,
        status: 'pending',
        createdAt: new Date(),
        // ... more logic
    };
    
    // Database operations...
    // Validation logic...
    // Notification logic...
}

// ✅ Good: Delegate to service
handleScanRequest(socket, data) {
    try {
        const scan = this.service.createScanRequest(data);
        socket.emit('scan-created', scan);
    } catch (error) {
        this.handleError(socket, error);
    }
}
```

### 7. Configuration Management

Gunakan configuration untuk nilai yang dapat berubah:

```javascript
// src/modules/radiology/config/radiologyConfig.js
module.exports = {
    maxQueueSize: process.env.RADIOLOGY_MAX_QUEUE_SIZE || 100,
    scanTimeout: process.env.RADIOLOGY_SCAN_TIMEOUT || 30000,
    supportedScanTypes: ['CT', 'MRI', 'X-RAY', 'ULTRASOUND'],
    priorities: ['LOW', 'NORMAL', 'HIGH', 'URGENT']
};
```

## Contoh Implementasi: Modul Radiologi

Berikut adalah contoh implementasi lengkap untuk modul radiologi:

### Struktur Modul Radiologi

```
src/modules/radiology/
├── index.js                    # Main module class
├── handlers/
│   └── radiologyHandlers.js    # WebSocket handlers
├── routes/
│   └── radiologyRoutes.js      # HTTP API routes
├── services/
│   └── radiologyService.js     # Business logic
├── config/
│   └── radiologyConfig.js      # Module configuration
└── README.md                   # Module documentation
```

### Implementasi Service

```javascript
// src/modules/radiology/services/radiologyService.js
const logger = require('../../../core/services/logger');
const config = require('../config/radiologyConfig');

class RadiologyService {
    constructor() {
        this.scanQueue = new Map();
        this.activeScans = new Map();
        this.completedScans = new Map();
        this.isActive = true;
        
        logger.info('🏥 Radiology service initialized');
    }

    createScanRequest(data) {
        const { patientId, scanType, priority = 'NORMAL', notes } = data;
        
        // Validate scan type
        if (!config.supportedScanTypes.includes(scanType)) {
            throw new Error(`Unsupported scan type: ${scanType}`);
        }
        
        // Validate priority
        if (!config.priorities.includes(priority)) {
            throw new Error(`Invalid priority: ${priority}`);
        }
        
        // Check queue capacity
        if (this.scanQueue.size >= config.maxQueueSize) {
            throw new Error('Scan queue is full');
        }
        
        const scan = {
            id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            patientId,
            scanType,
            priority,
            notes,
            status: 'queued',
            queuedAt: new Date().toISOString(),
            estimatedDuration: this.getEstimatedDuration(scanType)
        };
        
        this.scanQueue.set(scan.id, scan);
        
        logger.info(`🏥 Scan request created: ${scan.id} for patient ${patientId}`);
        
        return scan;
    }

    startScan(scanId) {
        const scan = this.scanQueue.get(scanId);
        
        if (!scan) {
            throw new Error(`Scan not found: ${scanId}`);
        }
        
        scan.status = 'in_progress';
        scan.startedAt = new Date().toISOString();
        
        this.activeScans.set(scanId, scan);
        this.scanQueue.delete(scanId);
        
        logger.info(`🏥 Scan started: ${scanId}`);
        
        return scan;
    }

    completeScan(scanId, results) {
        const scan = this.activeScans.get(scanId);
        
        if (!scan) {
            throw new Error(`Active scan not found: ${scanId}`);
        }
        
        scan.status = 'completed';
        scan.completedAt = new Date().toISOString();
        scan.results = results;
        
        this.completedScans.set(scanId, scan);
        this.activeScans.delete(scanId);
        
        logger.info(`🏥 Scan completed: ${scanId}`);
        
        return scan;
    }

    getQueueStatus() {
        return {
            queued: this.scanQueue.size,
            active: this.activeScans.size,
            completed: this.completedScans.size,
            queuedScans: Array.from(this.scanQueue.values()),
            activeScans: Array.from(this.activeScans.values())
        };
    }

    getEstimatedDuration(scanType) {
        const durations = {
            'CT': 30,      // 30 minutes
            'MRI': 60,     // 60 minutes
            'X-RAY': 15,   // 15 minutes
            'ULTRASOUND': 20 // 20 minutes
        };
        
        return durations[scanType] || 30;
    }

    async cleanup() {
        logger.info('🏥 Radiology service cleaning up');
        
        this.isActive = false;
        this.scanQueue.clear();
        this.activeScans.clear();
        this.completedScans.clear();
    }
}

module.exports = RadiologyService;
```

### Implementasi Handlers

```javascript
// src/modules/radiology/handlers/radiologyHandlers.js
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class RadiologyHandlers {
    constructor(io, connectionManager, service) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.service = service;
    }

    handleScanRequest(socket, data) {
        try {
            const scan = this.service.createScanRequest(data);
            
            // Notify the requesting client
            socket.emit('scan-request-created', {
                success: true,
                scan,
                timestamp: createTimestamp()
            });
            
            // Broadcast to radiology staff
            this.io.to('radiology_staff').emit('new-scan-request', {
                scan,
                timestamp: createTimestamp()
            });
            
            logger.info(`🏥 Scan request handled: ${scan.id}`);

        } catch (error) {
            logger.error('❌ Error handling scan request:', error);
            socket.emit('error', { 
                message: error.message,
                code: 'SCAN_REQUEST_FAILED',
                timestamp: createTimestamp()
            });
        }
    }

    handleStartScan(socket, data) {
        try {
            const { scanId } = data;
            const scan = this.service.startScan(scanId);
            
            // Notify all relevant parties
            this.io.to('radiology_staff').emit('scan-started', {
                scan,
                timestamp: createTimestamp()
            });
            
            this.io.to(`patient_${scan.patientId}`).emit('scan-started', {
                scanId: scan.id,
                message: 'Your scan has started',
                timestamp: createTimestamp()
            });

        } catch (error) {
            logger.error('❌ Error starting scan:', error);
            socket.emit('error', { 
                message: error.message,
                code: 'SCAN_START_FAILED',
                timestamp: createTimestamp()
            });
        }
    }

    handleCompleteScan(socket, data) {
        try {
            const { scanId, results } = data;
            const scan = this.service.completeScan(scanId, results);
            
            // Notify relevant parties
            this.io.to('radiology_staff').emit('scan-completed', {
                scan,
                timestamp: createTimestamp()
            });
            
            this.io.to(`patient_${scan.patientId}`).emit('scan-completed', {
                scanId: scan.id,
                message: 'Your scan has been completed',
                timestamp: createTimestamp()
            });

        } catch (error) {
            logger.error('❌ Error completing scan:', error);
            socket.emit('error', { 
                message: error.message,
                code: 'SCAN_COMPLETE_FAILED',
                timestamp: createTimestamp()
            });
        }
    }

    handleJoinRadiologyStaff(socket) {
        try {
            socket.join('radiology_staff');
            socket.emit('radiology-staff-joined', {
                message: 'Successfully joined radiology staff room',
                timestamp: createTimestamp()
            });
            
            logger.info(`🏥 Staff ${socket.id} joined radiology room`);

        } catch (error) {
            logger.error('❌ Error joining radiology staff:', error);
            socket.emit('error', { 
                message: 'Failed to join radiology staff room',
                timestamp: createTimestamp()
            });
        }
    }

    handleDisconnection(socket) {
        logger.debug(`🏥 Radiology module handling disconnection for ${socket.id}`);
        // Add any cleanup logic specific to radiology
    }
}

module.exports = RadiologyHandlers;
```

## Testing

### Unit Testing

Buat file test untuk setiap komponen:

```javascript
// tests/modules/radiology/radiologyService.test.js
const RadiologyService = require('../../../src/modules/radiology/services/radiologyService');

describe('RadiologyService', () => {
    let service;
    
    beforeEach(() => {
        service = new RadiologyService();
    });
    
    afterEach(async () => {
        await service.cleanup();
    });
    
    describe('createScanRequest', () => {
        it('should create a valid scan request', () => {
            const data = {
                patientId: 'P123',
                scanType: 'CT',
                priority: 'NORMAL'
            };
            
            const scan = service.createScanRequest(data);
            
            expect(scan).toHaveProperty('id');
            expect(scan.patientId).toBe('P123');
            expect(scan.scanType).toBe('CT');
            expect(scan.status).toBe('queued');
        });
        
        it('should throw error for invalid scan type', () => {
            const data = {
                patientId: 'P123',
                scanType: 'INVALID',
                priority: 'NORMAL'
            };
            
            expect(() => service.createScanRequest(data))
                .toThrow('Unsupported scan type: INVALID');
        });
    });
});
```

### Integration Testing

Test integrasi antar komponen:

```javascript
// tests/modules/radiology/radiology.integration.test.js
const request = require('supertest');
const io = require('socket.io-client');
const app = require('../../../src/app');

describe('Radiology Module Integration', () => {
    let server;
    let clientSocket;
    
    beforeAll((done) => {
        server = app.listen(() => {
            const port = server.address().port;
            clientSocket = io(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
    });
    
    afterAll(() => {
        server.close();
        clientSocket.close();
    });
    
    it('should handle scan request via WebSocket', (done) => {
        clientSocket.emit('radiology-scan-request', {
            patientId: 'P123',
            scanType: 'CT',
            priority: 'NORMAL'
        });
        
        clientSocket.on('scan-request-created', (response) => {
            expect(response.success).toBe(true);
            expect(response.scan.patientId).toBe('P123');
            done();
        });
    });
    
    it('should get queue status via HTTP', async () => {
        const response = await request(app)
            .get('/radiology/queue')
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('queueStatus');
    });
});
```

## Deployment

### Environment Variables

Tambahkan environment variables untuk modul baru di `.env`:

```bash
# Radiology Module Configuration
RADIOLOGY_MAX_QUEUE_SIZE=100
RADIOLOGY_SCAN_TIMEOUT=30000
RADIOLOGY_AUTO_START_SCANS=false
```

### Docker Configuration

Jika menggunakan Docker, update `Dockerfile` dan `docker-compose.yml`:

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  websocket-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - RADIOLOGY_MAX_QUEUE_SIZE=200
    volumes:
      - ./logs:/app/logs
    depends_on:
      - redis
      
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Monitoring

Implementasikan health checks untuk setiap modul:

```javascript
// src/modules/radiology/routes/radiologyRoutes.js
this.router.get('/health', (req, res) => {
    const health = {
        status: this.service.isActive ? 'healthy' : 'unhealthy',
        queueSize: this.service.scanQueue.size,
        activeScans: this.service.activeScans.size,
        uptime: process.uptime(),
        timestamp: createTimestamp()
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});
```

## Kesimpulan

Dengan mengikuti panduan ini, Anda dapat dengan mudah menambahkan modul baru ke dalam sistem WebSocket server. Arsitektur modular ini memungkinkan pengembangan yang scalable, maintainable, dan testable.

### Checklist untuk Modul Baru

- [ ] Buat struktur direktori yang benar
- [ ] Implementasikan interface modul yang standar
- [ ] Tambahkan error handling yang proper
- [ ] Implementasikan logging yang konsisten
- [ ] Buat unit tests dan integration tests
- [ ] Dokumentasikan API endpoints dan WebSocket events
- [ ] Update environment variables jika diperlukan
- [ ] Test secara menyeluruh sebelum deployment

### Resources Tambahan

- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Testing WebSocket Applications](https://socket.io/docs/testing/)

