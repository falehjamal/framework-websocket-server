const NotificationHandlers = require('./handlers/notificationHandlers');
const NotificationRoutes = require('./routes/notificationRoutes');
const logger = require('../../core/services/logger');

class NotificationModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.handlers = new NotificationHandlers(io, connectionManager);
        this.routes = new NotificationRoutes(connectionManager);

        logger.info('Notification module initialized');
    }

    registerSocketHandlers(socket) {
        socket.on('join-notification', (data) => this.handlers.handleJoinNotification(socket, data));
        socket.on('leave-notification', () => this.handlers.handleLeaveNotification(socket));
    }

    getRoutes() {
        return this.routes.getRouter();
    }

    handleDisconnection(socket) {
        this.handlers.handleDisconnection(socket);
    }

    async shutdown() {
        logger.info('Notification module shutting down');
    }
}

module.exports = NotificationModule;
