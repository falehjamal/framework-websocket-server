const express = require('express');
const logger = require('../../../core/services/logger');
const { createTimestamp, getRoomClientCount } = require('../../../core/utils/helpers');
const { normalizeUsername, normalizePath, roomNameFor } = require('../handlers/notificationHandlers');

class NotificationRoutes {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.router = express.Router();
        this.setupRoutes();
        this.setupActiveUsersRoute();
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
                    url: (req.body && req.body.url) || null,
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

    setupActiveUsersRoute() {
        this.router.get('/active-users', async (req, res) => {
            try {
                const rawPrefix = req.query && req.query.prefix;
                const prefixes = (Array.isArray(rawPrefix) ? rawPrefix : [rawPrefix])
                    .filter((p) => typeof p === 'string' && p.trim() !== '')
                    .map((p) => normalizePath(p).replace(/\/+$/, ''))
                    .filter(Boolean);

                if (prefixes.length === 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'prefix wajib diisi'
                    });
                }

                const sockets = await this.connectionManager.io.fetchSockets();
                const active = new Map();

                for (const s of sockets) {
                    const username = s.data && s.data.username;
                    const path = s.data && s.data.path;
                    if (!username || !path) continue;

                    const matched = prefixes.some((p) => path === p || path.startsWith(`${p}/`));
                    if (!matched) continue;

                    if (!active.has(username)) active.set(username, new Set());
                    active.get(username).add(path);
                }

                const users = Array.from(active.entries()).map(([username, paths]) => ({
                    username,
                    paths: Array.from(paths)
                }));

                res.json({
                    success: true,
                    prefixes,
                    count: users.length,
                    users,
                    timestamp: createTimestamp()
                });
            } catch (error) {
                logger.error('Error getting active notification users:', error);
                res.status(500).json({
                    success: false,
                    error: 'Gagal mengambil user aktif',
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
