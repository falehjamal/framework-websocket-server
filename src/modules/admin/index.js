const AdminHandlers = require('./handlers/adminHandlers');
const AdminRoutes = require('./routes/adminRoutes');
const logger = require('../../core/services/logger');

class AdminModule {
    constructor(io, connectionManager, broadcastService) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.broadcastService = broadcastService;
        
        // Initialize handlers and routes
        this.handlers = new AdminHandlers(io, connectionManager, broadcastService);
        this.routes = new AdminRoutes(connectionManager, broadcastService);
        
        logger.info('🛡️ Admin module initialized');
    }

    registerSocketHandlers(socket) {
        // Register admin-specific socket handlers
        
        // Handle refresh all displays command
        socket.on('refresh-all-displays', (data) => {
            this.handlers.handleRefreshAllDisplays(socket, data);
        });

        // Handle custom broadcast message
        socket.on('admin-broadcast-message', (data) => {
            this.handlers.handleBroadcastMessage(socket, data);
        });

        // Handle get active displays request
        socket.on('admin-get-active-displays', () => {
            this.handlers.handleGetActiveDisplays(socket);
        });

        // Join admin room for admin-specific broadcasts
        socket.on('join-admin', (data) => {
            socket.join('admin');
            socket.emit('admin-joined', {
                success: true,
                message: 'Successfully joined admin room',
                timestamp: new Date().toISOString(),
                socketId: socket.id
            });
            logger.info(`🛡️ Socket ${socket.id} joined admin room`);
        });

        // Leave admin room
        socket.on('leave-admin', () => {
            socket.leave('admin');
            socket.emit('admin-left', {
                success: true,
                message: 'Successfully left admin room',
                timestamp: new Date().toISOString()
            });
            logger.info(`🛡️ Socket ${socket.id} left admin room`);
        });

        logger.debug(`🛡️ Admin handlers registered for socket ${socket.id}`);
    }

    getRoutes() {
        return this.routes.getRoutes();
    }

    handleDisconnection(socket) {
        // Handle admin disconnection if needed
        logger.debug(`🛡️ Admin module handling disconnection for socket ${socket.id}`);
    }

    async shutdown() {
        logger.info('🛡️ Admin module shutting down');
        // Cleanup admin-specific resources if needed
    }
}

module.exports = AdminModule;
