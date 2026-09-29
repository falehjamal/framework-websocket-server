const logger = require('./logger');
const { createTimestamp, getRoomClientCount } = require('../utils/helpers');

class ConnectionManager {
    constructor(io) {
        this.io = io;
        this.activeConnections = new Map();
        this.groupPermalinks = new Map(); // Store permalinks for each group
    }

    addConnection(socketId, ipAddress) {
        this.activeConnections.set(socketId, {
            id: socketId,
            connectedAt: createTimestamp(),
            ipAddress: ipAddress
        });
        logger.info(`✅ Connection added: ${socketId}`);
    }

    removeConnection(socketId) {
        this.activeConnections.delete(socketId);
        logger.info(`❌ Connection removed: ${socketId}`);
    }

    getConnection(socketId) {
        return this.activeConnections.get(socketId);
    }

    getAllConnections() {
        return Array.from(this.activeConnections.values());
    }

    setGroupPermalink(groupId, groupName) {
        const groupIdStr = String(groupId);
        this.groupPermalinks.set(groupIdStr, groupName);
        logger.info(`💾 Stored permalink for group ${groupIdStr}: "${groupName}"`);
    }

    getGroupPermalink(groupId) {
        return this.groupPermalinks.get(String(groupId));
    }

    removeGroupPermalink(groupId) {
        const groupIdStr = String(groupId);
        this.groupPermalinks.delete(groupIdStr);
        logger.info(`🗑️ Removed permalink for group ${groupIdStr}`);
    }

    cleanupEmptyGroups() {
        const allRooms = Array.from(this.io.sockets.adapter.rooms.keys());
        const groupRooms = allRooms.filter(room => room.startsWith('group_'));
        
        groupRooms.forEach(roomName => {
            const groupId = roomName.replace('group_', '');
            const clientCount = getRoomClientCount(this.io, roomName);
            if (clientCount === 0) {
                const groupIdStr = String(groupId);
                this.groupPermalinks.delete(groupIdStr);
                logger.info(`🗑️ Cleaned up permalink for empty group ${groupIdStr}`);
            }
        });
    }

    getActiveDisplays() {
        const allRooms = Array.from(this.io.sockets.adapter.rooms.keys());
        const groupRooms = allRooms.filter(room => room.startsWith('group_'));
        
        const activeDisplays = groupRooms.map(roomName => {
            const groupId = roomName.replace('group_', '');
            const clientCount = getRoomClientCount(this.io, roomName);
            const clients = Array.from(this.io.sockets.adapter.rooms.get(roomName) || []);
            
            // Get client details for this room
            const clientDetails = clients.map(socketId => {
                const connection = this.activeConnections.get(socketId);
                return {
                    socketId,
                    connectedAt: connection?.connectedAt,
                    ipAddress: connection?.ipAddress
                };
            }).filter(Boolean);

            // Get the actual permalink from stored data, fallback to default format
            const storedPermalink = this.groupPermalinks.get(groupId);
            const actualPermalink = storedPermalink || `/display/group/${groupId}`;

            return {
                groupNumber: parseInt(groupId),
                permalink: actualPermalink,
                roomName,
                clientCount,
                clients: clientDetails,
                isActive: clientCount > 0,
                lastUpdated: createTimestamp()
            };
        }).filter(display => display.isActive); // Only return active displays

        // Sort by group number
        activeDisplays.sort((a, b) => a.groupNumber - b.groupNumber);

        return activeDisplays;
    }
}

module.exports = ConnectionManager;
