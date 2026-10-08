const express = require('express');
const logger = require('../../core/services/logger');

const PRESENCE_EVENTS = [
    'join-notification',
    'leave-notification',
    'join-prescription',
    'leave-prescription',
    'join-user-room',
    'join-group',
    'leave-group',
    'register-display'
];

class MonitoringModule {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.timer = null;
        this.router = express.Router();
        this.router.get('/clients', async (req, res) => {
            try {
                const snapshot = await this.connectionManager.buildMonitoringSnapshot();
                res.json({ success: true, ...snapshot });
            } catch (error) {
                logger.error('Error building monitoring snapshot:', error);
                res.status(500).json({
                    success: false,
                    error: 'Gagal mengambil klien websocket',
                    message: error.message
                });
            }
        });

        logger.info('Monitoring module initialized');
    }

    registerSocketHandlers(socket) {
        socket.on('join-monitoring', () => {
            socket.join('monitoring');
            socket.data.monitoring = true;
            this.schedule();
        });

        PRESENCE_EVENTS.forEach((eventName) => {
            socket.on(eventName, () => this.schedule());
        });
    }

    schedule() {
        if (this.timer) {
            return;
        }

        this.timer = setTimeout(() => {
            this.timer = null;
            this.push();
        }, 200);
    }

    async push() {
        try {
            const room = this.io.sockets.adapter.rooms.get('monitoring');
            if (!room || room.size === 0) {
                return;
            }

            const snapshot = await this.connectionManager.buildMonitoringSnapshot();
            this.io.to('monitoring').emit('monitoring:update', {
                success: true,
                ...snapshot
            });
        } catch (error) {
            logger.error('Error pushing monitoring snapshot:', error);
        }
    }

    getRoutes() {
        return this.router;
    }

    handleDisconnection() {
        this.schedule();
    }

    async shutdown() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        logger.info('Monitoring module shutting down');
    }
}

module.exports = MonitoringModule;
