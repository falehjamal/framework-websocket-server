const express = require('express');
const logger = require('../../../core/services/logger');

class AdminRoutes {
    constructor(connectionManager, broadcastService) {
        this.connectionManager = connectionManager;
        this.broadcastService = broadcastService;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // GET /admin/displays/active - Get all active displays
        this.router.get('/displays/active', (req, res) => {
            try {
                const activeDisplays = this.connectionManager.getActiveDisplays();
                res.json({
                    success: true,
                    totalActiveDisplays: activeDisplays.length,
                    displays: activeDisplays,
                    timestamp: new Date().toISOString()
                });
                logger.info(`📊 Admin API: Active displays requested - ${activeDisplays.length} displays found`);
            } catch (error) {
                logger.error('❌ Admin API: Error getting active displays:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get active displays',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // POST /admin/displays/refresh - Trigger refresh all displays
        this.router.post('/displays/refresh', (req, res) => {
            try {
                const { source = 'admin-api', message } = req.body;
                
                const broadcastResult = this.broadcastService.broadcastToAllDisplays('refresh-all-displays', {
                    action: 'refresh',
                    timestamp: new Date().toISOString(),
                    source,
                    message,
                    requestId: `api_refresh_${Date.now()}`
                });

                res.json({
                    success: true,
                    message: 'Refresh command sent to all display clients',
                    ...broadcastResult,
                    timestamp: new Date().toISOString()
                });

                logger.info(`✅ Admin API: Refresh command broadcasted`, broadcastResult);
            } catch (error) {
                logger.error('❌ Admin API: Error broadcasting refresh:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to broadcast refresh command',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // POST /admin/displays/broadcast - Broadcast custom message to displays
        this.router.post('/displays/broadcast', (req, res) => {
            try {
                const { event, message, data = {} } = req.body;
                
                if (!event || !message) {
                    return res.status(400).json({
                        success: false,
                        error: 'Event and message are required',
                        timestamp: new Date().toISOString()
                    });
                }

                const broadcastResult = this.broadcastService.broadcastToAllDisplays(event, {
                    message,
                    timestamp: new Date().toISOString(),
                    source: 'admin-api',
                    requestId: `api_broadcast_${Date.now()}`,
                    ...data
                });

                res.json({
                    success: true,
                    message: 'Custom message broadcasted to all display clients',
                    ...broadcastResult,
                    timestamp: new Date().toISOString()
                });

                logger.info(`✅ Admin API: Custom broadcast sent`, {
                    event,
                    message,
                    ...broadcastResult
                });
            } catch (error) {
                logger.error('❌ Admin API: Error broadcasting custom message:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to broadcast custom message',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // GET /admin/system/stats - Get system statistics
        this.router.get('/system/stats', (req, res) => {
            try {
                const activeDisplays = this.connectionManager.getActiveDisplays();
                const allConnections = this.connectionManager.getAllConnections();
                
                const stats = {
                    totalConnections: allConnections.length,
                    totalActiveDisplays: activeDisplays.length,
                    displayGroups: activeDisplays.map(display => ({
                        groupNumber: display.groupNumber,
                        clientCount: display.clientCount,
                        permalink: display.permalink
                    })),
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                };

                res.json({
                    success: true,
                    stats,
                    timestamp: new Date().toISOString()
                });

                logger.info(`📊 Admin API: System stats requested`);
            } catch (error) {
                logger.error('❌ Admin API: Error getting system stats:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get system stats',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    getRoutes() {
        return this.router;
    }
}

module.exports = AdminRoutes;
