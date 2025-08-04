const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

/**
 * Template Handlers Class
 * 
 * This class handles all WebSocket events for the template module.
 * Copy and modify this file for your new module.
 */
class TemplateHandlers {
    constructor(io, connectionManager, service) {
        this.io = io;
        this.connectionManager = connectionManager;
        this.service = service;
    }

    /**
     * Handle template-specific event
     * Example: socket.emit('template-event', { message: 'Hello' })
     */
    handleTemplateEvent(socket, data) {
        try {
            logger.info(`📝 Template event from ${socket.id}:`, data);
            
            // Process the data using the service
            const result = this.service.processTemplateData(data);
            
            // Send response back to client
            socket.emit('template-response', {
                success: true,
                data: result,
                timestamp: createTimestamp()
            });

        } catch (error) {
            logger.error('❌ Error handling template event:', error);
            socket.emit('error', { 
                message: 'Failed to process template event',
                error: error.message 
            });
        }
    }

    /**
     * Handle joining template room
     * Example: socket.emit('template-join', { roomId: 'room123' })
     */
    handleJoinTemplate(socket, data) {
        try {
            const { roomId } = data;
            
            if (!roomId) {
                socket.emit('error', { message: 'Room ID is required' });
                return;
            }

            const roomName = `template_${roomId}`;
            
            socket.join(roomName);
            socket.emit('template-joined', {
                roomId,
                roomName,
                message: `Successfully joined template room ${roomId}`,
                timestamp: createTimestamp()
            });

            logger.info(`📝 Client ${socket.id} joined template room ${roomId}`);

        } catch (error) {
            logger.error('❌ Error handling template join:', error);
            socket.emit('error', { message: 'Failed to join template room' });
        }
    }

    /**
     * Handle leaving template room
     * Example: socket.emit('template-leave', { roomId: 'room123' })
     */
    handleLeaveTemplate(socket, data) {
        try {
            const { roomId } = data;
            const roomName = `template_${roomId}`;
            
            socket.leave(roomName);
            socket.emit('template-left', {
                roomId,
                roomName,
                message: `Successfully left template room ${roomId}`,
                timestamp: createTimestamp()
            });

            logger.info(`📝 Client ${socket.id} left template room ${roomId}`);

        } catch (error) {
            logger.error('❌ Error handling template leave:', error);
            socket.emit('error', { message: 'Failed to leave template room' });
        }
    }

    /**
     * Handle client disconnection
     * Clean up any template-specific resources
     */
    handleDisconnection(socket) {
        logger.debug(`📝 Template module handling disconnection for ${socket.id}`);
        
        // Add any cleanup logic here
        // For example, remove from active users list, cleanup resources, etc.
    }
}

module.exports = TemplateHandlers;

