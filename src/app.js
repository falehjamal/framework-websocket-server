const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const config = require('./core/config');
const logger = require('./core/services/logger');
const RedisService = require('./core/services/redis');
const BroadcastService = require('./core/services/broadcast');
const ConnectionManager = require('./core/services/connectionManager');

// Import modules
const QueueModule = require('./modules/queue');
const PrescriptionModule = require('./modules/prescription');

class WebSocketServer {
    constructor() {
        this.config = config;
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: config.cors,
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        // Initialize core services
        this.connectionManager = new ConnectionManager(this.io);
        this.broadcastService = new BroadcastService(this.io);
        this.redisService = new RedisService(config, this.io, this.broadcastService);

        // Initialize modules
        this.modules = new Map();
        this.initializeModules();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    initializeModules() {
        // Register Queue module
        const queueModule = new QueueModule(this.io, this.connectionManager);
        this.modules.set('queue', queueModule);

        // Register Prescription module
        const prescriptionModule = new PrescriptionModule(this.io, this.connectionManager);
        this.modules.set('prescription', prescriptionModule);

        logger.info(`📦 Initialized ${this.modules.size} modules: ${Array.from(this.modules.keys()).join(', ')}`);
    }

    setupMiddleware() {
        this.app.use(cors(this.config.cors));
        this.app.use(express.json());
    }

    setupRoutes() {
        // Setup routes from all modules
        this.modules.forEach((module, name) => {
            if (module.getRoutes) {
                const routes = module.getRoutes();
                this.app.use(`/${name}`, routes);
                logger.info(`🛣️ Registered routes for module: ${name}`);
            }
        });

        // Global routes
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                modules: Array.from(this.modules.keys()),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/displays/active', (req, res) => {
            try {
                const activeDisplays = this.connectionManager.getActiveDisplays();
                res.json({
                    success: true,
                    totalActiveDisplays: activeDisplays.length,
                    displays: activeDisplays,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                logger.error('❌ Error getting active displays:', error);
                res.status(500).json({ 
                    error: 'Failed to get active displays',
                    message: error.message 
                });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`✅ Client connected: ${socket.id} from ${socket.handshake.address}`);
            this.connectionManager.addConnection(socket.id, socket.handshake.address);

            // Register handlers from all modules
            this.modules.forEach((module, name) => {
                if (module.registerSocketHandlers) {
                    module.registerSocketHandlers(socket);
                }
            });

            // Global handlers
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: new Date().toISOString() });
            });

            socket.on('disconnect', (reason) => {
                logger.info(`❌ Client disconnected: ${socket.id}`, { reason });
                
                // Notify all modules about disconnection
                this.modules.forEach((module) => {
                    if (module.handleDisconnection) {
                        module.handleDisconnection(socket);
                    }
                });

                this.connectionManager.cleanupEmptyGroups();
                this.connectionManager.removeConnection(socket.id);
            });
        });
    }

    async start() {
        try {
            // Create logs directory if it doesn't exist
            if (!fs.existsSync('logs')) {
                fs.mkdirSync('logs');
                logger.info('📁 Created logs directory');
            }

            // Initialize Redis
            await this.redisService.initialize();

            // Start server
            this.server.listen(this.config.port, '0.0.0.0', () => {
                logger.info(`🔥 Universal WebSocket server running on port ${this.config.port}`);
                logger.info(`🖥️ Active displays: GET http://localhost:${this.config.port}/displays/active`);
                logger.info(`💚 Health check: GET http://localhost:${this.config.port}/health`);
            });

        } catch (error) {
            logger.error('🔥 Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        logger.info('🛑 Shutting down gracefully');

        // Shutdown all modules
        for (const [name, module] of this.modules) {
            if (module.shutdown) {
                await module.shutdown();
                logger.info(`📦 Module ${name} shut down`);
            }
        }

        await this.redisService.shutdown();

        this.server.close(() => {
            logger.info('✅ Server shut down successfully');
            process.exit(0);
        });
    }
}

module.exports = WebSocketServer;

