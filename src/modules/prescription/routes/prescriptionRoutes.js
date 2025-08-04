const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class PrescriptionRoutes {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Get active prescription connections
        this.router.get('/active', (req, res) => {
            try {
                const roomName = 'prescription';
                const room = this.connectionManager.io.sockets.adapter.rooms.get(roomName);
                const clientCount = room ? room.size : 0;
                
                res.json({
                    success: true,
                    roomName,
                    activeConnections: clientCount,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error getting prescription connections:', error);
                res.status(500).json({ 
                    error: 'Failed to get prescription connections',
                    message: error.message 
                });
            }
        });

        // Broadcast message to all prescription clients
        this.router.post('/broadcast', (req, res) => {
            try {
                const { message, data } = req.body;
                
                if (!message) {
                    return res.status(400).json({
                        error: 'Message is required'
                    });
                }

                this.connectionManager.io.to('prescription').emit('prescription-broadcast', {
                    message,
                    data,
                    timestamp: createTimestamp()
                });

                res.json({
                    success: true,
                    message: 'Broadcast sent successfully',
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error broadcasting to prescription:', error);
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

module.exports = PrescriptionRoutes;

