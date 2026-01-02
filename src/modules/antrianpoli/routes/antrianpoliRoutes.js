const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class AntrianPoliRoutes {
	constructor(connectionManager) {
		this.connectionManager = connectionManager;
		this.router = express.Router();
		this.setupRoutes();
	}

	setupRoutes() {
		// GET /antrianpoli/groups/active
		this.router.get('/groups/active', (req, res) => {
			try {
				const activeDisplays = this.connectionManager.getActiveDisplays();
				res.json({
					success: true,
					totalActiveGroups: activeDisplays.length,
					groups: activeDisplays,
					timestamp: createTimestamp()
				});

			} catch (error) {
				logger.error('❌ Error getting active antrianpoli groups:', error);
				res.status(500).json({ 
					error: 'Failed to get active antrianpoli groups',
					message: error.message 
				});
			}
		});

		// GET /antrianpoli/groups/:groupId
		this.router.get('/groups/:groupId', (req, res) => {
			try {
				const { groupId } = req.params;
				const roomName = `group_${groupId}`;
				
				// Get clients in this group
				const room = this.connectionManager.io.sockets.adapter.rooms.get(roomName);
				const clientCount = room ? room.size : 0;
				
				res.json({
					success: true,
					groupId,
					roomName,
					clientCount,
					timestamp: createTimestamp()
				});

			} catch (error) {
				logger.error('❌ Error getting antrianpoli group info:', error);
				res.status(500).json({ 
					error: 'Failed to get group info',
					message: error.message 
				});
			}
		});
	}

	getRouter() {
		return this.router;
	}
}

module.exports = AntrianPoliRoutes;


