const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class QueueRoutes {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Get active groups
        this.router.get('/groups/active', (req, res) => {
            try {
                const activeDisplays = this.connectionManager.getActiveDisplays();
                const queueGroups = activeDisplays.filter(display => 
                    display.rooms && display.rooms.some(room => room.startsWith('group_'))
                );

                res.json({
                    success: true,
                    totalActiveGroups: queueGroups.length,
                    groups: queueGroups,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error getting active queue groups:', error);
                res.status(500).json({ 
                    error: 'Failed to get active queue groups',
                    message: error.message 
                });
            }
        });

        // Get specific group info
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
                logger.error('❌ Error getting group info:', error);
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

module.exports = QueueRoutes;

