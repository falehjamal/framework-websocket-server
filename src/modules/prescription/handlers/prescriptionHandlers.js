const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

class PrescriptionHandlers {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
    }

    handleJoinPrescription(socket) {
        try {
            const roomName = 'prescription';
            
            socket.join(roomName);
            socket.emit('prescription-joined', { 
                message: 'Successfully joined prescription room',
                socketId: socket.id,
                roomName,
                timestamp: createTimestamp()
            });

            logger.info(`💊 Client ${socket.id} joined prescription room`);

        } catch (error) {
            logger.error('❌ Error handling join-prescription:', error);
            socket.emit('error', { message: 'Failed to join prescription room' });
        }
    }

    handleLeavePrescription(socket) {
        try {
            const roomName = 'prescription';
            
            socket.leave(roomName);
            socket.emit('prescription-left', { 
                message: 'Successfully left prescription room',
                socketId: socket.id,
                roomName,
                timestamp: createTimestamp()
            });

            logger.info(`💊 Client ${socket.id} left prescription room`);

        } catch (error) {
            logger.error('❌ Error handling leave-prescription:', error);
            socket.emit('error', { message: 'Failed to leave prescription room' });
        }
    }

    handleDisconnection(socket) {
        // Prescription-specific cleanup on disconnection
        logger.debug(`💊 Prescription module handling disconnection for ${socket.id}`);
    }
}

module.exports = PrescriptionHandlers;

