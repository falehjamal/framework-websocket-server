const QueueHandlers = require('./handlers/queueHandlers');
const QueueRoutes = require('./routes/queueRoutes');
const logger = require('../../core/services/logger');

class QueueModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.handlers = new QueueHandlers(io, connectionManager);
        this.routes = new QueueRoutes(connectionManager);
        
        logger.info('📦 Queue module initialized');
    }

    registerSocketHandlers(socket) {
        // Register queue-specific socket handlers
        socket.on('join-group', (data) => this.handlers.handleJoinGroup(socket, data));
        socket.on('leave-group', (data) => this.handlers.handleLeaveGroup(socket, data));
    }

    getRoutes() {
        return this.routes.getRouter();
    }

    handleDisconnection(socket) {
        // Handle queue-specific cleanup on disconnection
        this.handlers.handleDisconnection(socket);
    }

    async shutdown() {
        logger.info('📦 Queue module shutting down');
        // Cleanup queue-specific resources
    }
}

module.exports = QueueModule;

