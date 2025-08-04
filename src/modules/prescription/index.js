const PrescriptionHandlers = require('./handlers/prescriptionHandlers');
const PrescriptionRoutes = require('./routes/prescriptionRoutes');
const logger = require('../../core/services/logger');

class PrescriptionModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.handlers = new PrescriptionHandlers(io, connectionManager);
        this.routes = new PrescriptionRoutes(connectionManager);
        
        logger.info('📦 Prescription module initialized');
    }

    registerSocketHandlers(socket) {
        // Register prescription-specific socket handlers
        socket.on('join-prescription', () => this.handlers.handleJoinPrescription(socket));
        socket.on('leave-prescription', () => this.handlers.handleLeavePrescription(socket));
    }

    getRoutes() {
        return this.routes.getRouter();
    }

    handleDisconnection(socket) {
        // Handle prescription-specific cleanup on disconnection
        this.handlers.handleDisconnection(socket);
    }

    async shutdown() {
        logger.info('📦 Prescription module shutting down');
        // Cleanup prescription-specific resources
    }
}

module.exports = PrescriptionModule;

