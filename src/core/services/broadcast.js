const logger = require('./logger');
const { getRoomClientCount } = require('../utils/helpers');

class BroadcastService {
    constructor(io) {
        this.io = io;
    }

    broadcastToClients(channel, event, data, groupId) {
        const roomName = `group_${groupId}`;
        const clientCount = getRoomClientCount(this.io, roomName);

        if (clientCount === 0) {
            logger.warn(`⚠️ No clients in room ${roomName}`);
            return;
        }

        this.io.to(roomName).emit(event, data);
        logger.info(`Broadcast ${event} to ${roomName} (${clientCount} clients)`, {
            channel, event, groupId, clientCount
        });
    }

    broadcastToPrescriptionRoom(channel, event, data) {
        const roomName = 'prescription';
        const clientCount = getRoomClientCount(this.io, roomName);

        if (clientCount === 0) {
            logger.warn(`⚠️ No clients in prescription room`);
            return;
        }

        this.io.to(roomName).emit(`${channel}:${event}`, data);
        logger.info(`Broadcast ${channel}:${event} to ${roomName} (${clientCount} clients)`, {
            channel, event, clientCount
        });
    }

    broadcastToAllDisplays(event, data) {
        // Get all room names that start with 'group_' (display rooms)
        const allRooms = Array.from(this.io.sockets.adapter.rooms.keys());
        const displayRooms = allRooms.filter(room => room.startsWith('group_'));
        
        let totalClientsReached = 0;
        const broadcastResults = [];

        displayRooms.forEach(roomName => {
            const clientCount = getRoomClientCount(this.io, roomName);
            if (clientCount > 0) {
                this.io.to(roomName).emit(event, data);
                totalClientsReached += clientCount;
                broadcastResults.push({
                    roomName,
                    clientCount,
                    broadcasted: true
                });
            } else {
                broadcastResults.push({
                    roomName,
                    clientCount: 0,
                    broadcasted: false
                });
            }
        });

        if (totalClientsReached === 0) {
            logger.warn(`⚠️ No active display clients found for broadcast "${event}"`);
        } else {
            logger.info(`Broadcast ${event} to ${totalClientsReached} clients across ${displayRooms.length} display rooms`, {
                event,
                totalClientsReached,
                displayRoomsCount: displayRooms.length
            });
            logger.debug('Display broadcast rooms', { event, broadcastResults });
        }

        return {
            totalClientsReached,
            displayRoomsCount: displayRooms.length,
            broadcastResults
        };
    }
}

module.exports = BroadcastService;
