const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

/**
 * Template Routes Class
 * 
 * This class defines HTTP API routes for the template module.
 * Copy and modify this file for your new module.
 */
class TemplateRoutes {
    constructor(connectionManager, service) {
        this.connectionManager = connectionManager;
        this.service = service;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // GET /template/status - Get module status
        this.router.get('/status', (req, res) => {
            try {
                const status = this.service.getStatus();
                
                res.json({
                    success: true,
                    status,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error getting template status:', error);
                res.status(500).json({ 
                    error: 'Failed to get template status',
                    message: error.message 
                });
            }
        });

        // GET /template/rooms - Get active template rooms
        this.router.get('/rooms', (req, res) => {
            try {
                const rooms = [];
                
                // Get all rooms that start with 'template_'
                this.connectionManager.io.sockets.adapter.rooms.forEach((sockets, roomName) => {
                    if (roomName.startsWith('template_')) {
                        rooms.push({
                            roomName,
                            roomId: roomName.replace('template_', ''),
                            clientCount: sockets.size
                        });
                    }
                });

                res.json({
                    success: true,
                    totalRooms: rooms.length,
                    rooms,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error getting template rooms:', error);
                res.status(500).json({ 
                    error: 'Failed to get template rooms',
                    message: error.message 
                });
            }
        });

        // POST /template/broadcast - Broadcast message to all template rooms
        this.router.post('/broadcast', (req, res) => {
            try {
                const { message, data, roomId } = req.body;
                
                if (!message) {
                    return res.status(400).json({
                        error: 'Message is required'
                    });
                }

                let targetRoom = 'template';
                if (roomId) {
                    targetRoom = `template_${roomId}`;
                }

                this.connectionManager.io.to(targetRoom).emit('template-broadcast', {
                    message,
                    data,
                    roomId,
                    timestamp: createTimestamp()
                });

                res.json({
                    success: true,
                    message: 'Broadcast sent successfully',
                    targetRoom,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error broadcasting to template:', error);
                res.status(500).json({ 
                    error: 'Failed to broadcast message',
                    message: error.message 
                });
            }
        });

        // POST /template/data - Process template data
        this.router.post('/data', (req, res) => {
            try {
                const result = this.service.processTemplateData(req.body);
                
                res.json({
                    success: true,
                    result,
                    timestamp: createTimestamp()
                });

            } catch (error) {
                logger.error('❌ Error processing template data:', error);
                res.status(500).json({ 
                    error: 'Failed to process template data',
                    message: error.message 
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = TemplateRoutes;

