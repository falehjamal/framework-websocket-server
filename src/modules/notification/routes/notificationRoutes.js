const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp, getRoomClientCount } = require('../../../core/utils/helpers');
const { normalizeUsername, roomNameFor } = require('../handlers/notificationHandlers');

class NotificationRoutes {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/send', (req, res) => {
            try {
                const username = normalizeUsername(req.body && req.body.username);
                const title = String((req.body && req.body.title) || '').trim();
                const message = String((req.body && req.body.message) || '').trim();

                if (!username || !title || !message) {
                    return res.status(400).json({
                        success: false,
                        error: 'username, title, dan message wajib diisi'
                    });
                }

                const roomName = roomNameFor(username);
                const clientCount = getRoomClientCount(this.connectionManager.io, roomName);
                const payload = {
                    id: req.body && req.body.id ? req.body.id : null,
                    title,
                    message,
                    username,
                    created_at: (req.body && req.body.created_at) || null,
                    timestamp: createTimestamp()
                };

                this.connectionManager.io.to(roomName).emit('notification', payload);

                logger.info(`Notification sent to ${roomName} (${clientCount} clients)`, payload);

                res.json({
                    success: true,
                    message: 'Notifikasi terkirim',
                    roomName,
                    clientCount,
                    timestamp: payload.timestamp
                });
            } catch (error) {
                logger.error('Error sending notification:', error);
                res.status(500).json({
                    success: false,
                    error: 'Gagal mengirim notifikasi',
                    message: error.message
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NotificationRoutes;
