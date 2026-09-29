const AntrianPoliHandlers = require('./handlers/antrianpoliHandlers');
const AntrianPoliRoutes = require('./routes/antrianpoliRoutes');
const logger = require('../../core/services/logger');

class AntrianPoliModule {
	constructor(io, connectionManager) {
		this.io = io;
		this.connectionManager = connectionManager;
		this.handlers = new AntrianPoliHandlers(io, connectionManager);
		this.routes = new AntrianPoliRoutes(connectionManager);
		
		logger.info('📦 AntrianPoli module initialized');
	}

	registerSocketHandlers(socket) {
		// Register antrianpoli-specific socket handlers
		socket.on('join-group', (data) => this.handlers.handleJoinGroup(socket, data));
		socket.on('leave-group', (data) => this.handlers.handleLeaveGroup(socket, data));
	}

	getRoutes() {
		return this.routes.getRouter();
	}

	handleDisconnection(socket) {
		// Handle antrianpoli-specific cleanup on disconnection
		this.handlers.handleDisconnection(socket);
	}

	async shutdown() {
		logger.info('📦 AntrianPoli module shutting down');
		// Cleanup antrianpoli-specific resources
	}
}

module.exports = AntrianPoliModule;


