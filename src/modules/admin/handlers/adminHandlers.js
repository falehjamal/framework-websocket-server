const logger = require('../../../core/services/logger');

class AdminHandlers {
    constructor(io, connectionManager, broadcastService) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.broadcastService = broadcastService;
    }

    handleRefreshAllDisplays(socket, data) {
        logger.info(`🔄 Admin refresh-all-displays command from ${socket.id}`, data);
        
        try {
            // Broadcast refresh command to all display clients
            const broadcastResult = this.broadcastService.broadcastToAllDisplays('refresh-all-displays', {
                action: 'refresh',
                timestamp: new Date().toISOString(),
                source: data?.source || 'admin-panel',
                requestId: data?.requestId || `refresh_${Date.now()}`,
                ...data
            });

            // Send acknowledgment back to the admin client
            socket.emit('refresh-all-displays-ack', {
                success: true,
                message: 'Refresh command sent to all display clients',
                ...broadcastResult,
                timestamp: new Date().toISOString()
            });

            logger.info(`✅ Admin refresh command broadcasted successfully`, {
                adminSocketId: socket.id,
                ...broadcastResult
            });

            return broadcastResult;
        } catch (error) {
            logger.error(`❌ Error handling refresh-all-displays:`, error);
            
            socket.emit('refresh-all-displays-error', {
                success: false,
                error: 'Failed to broadcast refresh command',
                message: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    handleBroadcastMessage(socket, data) {
        logger.info(`📢 Admin broadcast message from ${socket.id}`, data);
        
        try {
            const { event, message, target = 'all-displays' } = data;
            
            if (!event || !message) {
                throw new Error('Event and message are required');
            }

            let broadcastResult;
            
            if (target === 'all-displays') {
                broadcastResult = this.broadcastService.broadcastToAllDisplays(event, {
                    message,
                    timestamp: new Date().toISOString(),
                    source: 'admin-panel',
                    ...data
                });
            } else {
                // Handle specific group broadcast if needed
                throw new Error('Specific group broadcast not implemented yet');
            }

            socket.emit('broadcast-message-ack', {
                success: true,
                message: 'Message broadcasted successfully',
                ...broadcastResult,
                timestamp: new Date().toISOString()
            });

            logger.info(`✅ Admin broadcast message sent successfully`, {
                adminSocketId: socket.id,
                event,
                target,
                ...broadcastResult
            });

            return broadcastResult;
        } catch (error) {
            logger.error(`❌ Error handling broadcast message:`, error);
            
            socket.emit('broadcast-message-error', {
                success: false,
                error: 'Failed to broadcast message',
                message: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    handleGetActiveDisplays(socket) {
        try {
            const activeDisplays = this.connectionManager.getActiveDisplays();
            
            socket.emit('active-displays-response', {
                success: true,
                totalActiveDisplays: activeDisplays.length,
                displays: activeDisplays,
                timestamp: new Date().toISOString()
            });

            logger.info(`📊 Sent active displays info to admin ${socket.id}`, {
                totalActiveDisplays: activeDisplays.length
            });

            return activeDisplays;
        } catch (error) {
            logger.error(`❌ Error getting active displays:`, error);
            
            socket.emit('active-displays-error', {
                success: false,
                error: 'Failed to get active displays',
                message: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }
}

module.exports = AdminHandlers;
