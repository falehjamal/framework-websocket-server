const logger = require('./logger');
const { getRoomClientCount } = require('../utils/helpers');

class BroadcastService {
    constructor(io) {
        this.io = io;
    }

    broadcastToClients(channel, event, data, groupId) {
        const roomName = `group_${groupId}`;
        const clientCount = getRoomClientCount(this.io, roomName);

        logger.info(`🏠 Room: ${roomName} (${clientCount} clients)`);

        if (clientCount === 0) {
            logger.warn(`⚠️ No clients in room ${roomName}`);
            return;
        }

        logger.info(`📡 Emitting "${event}" to room "${roomName}"`);
        this.io.to(roomName).emit(event, data);

        logger.info(`✅ Broadcasted ${event} to ${clientCount} clients`, {
            channel, event, groupId, clientCount, roomName
        });
    }

    broadcastToPrescriptionRoom(channel, event, data) {
        const roomName = 'prescription';
        const clientCount = getRoomClientCount(this.io, roomName);

        logger.info(`💊 Prescription Room: ${roomName} (${clientCount} clients)`);

        if (clientCount === 0) {
            logger.warn(`⚠️ No clients in prescription room`);
            return;
        }

        logger.info(`📡 Emitting prescription "${event}" to room "${roomName}"`);
        this.io.to(roomName).emit(`${channel}:${event}`, data);

        logger.info(`✅ Broadcasted prescription ${event} to ${clientCount} clients`, {
            channel, event, clientCount, roomName
        });
    }
}

module.exports = BroadcastService;
