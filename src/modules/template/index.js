const TemplateHandlers = require('./handlers/templateHandlers');
const TemplateRoutes = require('./routes/templateRoutes');
const TemplateService = require('./services/templateService');
const logger = require('../../core/services/logger');

/**
 * Template Module Class
 * 
 * This is a template for creating new modules in the WebSocket server.
 * Copy this entire folder and modify it according to your needs.
 * 
 * Each module should follow this structure:
 * - index.js: Main module class (this file)
 * - handlers/: Socket event handlers
 * - routes/: HTTP API routes
 * - services/: Business logic and services
 */
class TemplateModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        
        // Initialize handlers, routes, and services
        this.service = new TemplateService();
        this.handlers = new TemplateHandlers(io, connectionManager, this.service);
        this.routes = new TemplateRoutes(connectionManager, this.service);
        
        logger.info('📦 Template module initialized');
    }

    /**
     * Register socket event handlers for this module
     * This method is called automatically by the main app
     */
    registerSocketHandlers(socket) {
        // Register your socket event handlers here
        socket.on('template-event', (data) => this.handlers.handleTemplateEvent(socket, data));
        socket.on('template-join', (data) => this.handlers.handleJoinTemplate(socket, data));
        socket.on('template-leave', (data) => this.handlers.handleLeaveTemplate(socket, data));
    }

    /**
     * Get HTTP routes for this module
     * This method is called automatically by the main app
     */
    getRoutes() {
        return this.routes.getRouter();
    }

    /**
     * Handle client disconnection
     * This method is called automatically when a client disconnects
     */
    handleDisconnection(socket) {
        this.handlers.handleDisconnection(socket);
    }

    /**
     * Shutdown the module gracefully
     * This method is called when the server is shutting down
     */
    async shutdown() {
        logger.info('📦 Template module shutting down');
        
        // Cleanup resources here
        if (this.service && this.service.cleanup) {
            await this.service.cleanup();
        }
    }
}

module.exports = TemplateModule;

