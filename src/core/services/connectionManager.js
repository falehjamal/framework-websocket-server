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

    async buildMonitoringSnapshot() {
        const sockets = await this.io.fetchSockets();
        const notifications = [];
        const prescriptions = [];
        const displays = [];

        for (const socket of sockets) {
            const connection = this.activeConnections.get(socket.id);
            const base = {
                socketId: socket.id,
                connectedAt: connection ? connection.connectedAt : null,
                ipAddress: cleanIp(connection && connection.ipAddress)
            };
            const data = socket.data || {};
            const rooms = socket.rooms || new Set();

            if (data.notificationRoom && data.username && rooms.has(data.notificationRoom)) {
                notifications.push({
                    ...base,
                    username: data.username,
                    path: data.path || ''
                });
            }

            if (rooms.has('prescription')) {
                prescriptions.push({
                    ...base,
                    username: data.prescriptionUsername || null
                });
            }

            let inGroup = false;
            for (const room of rooms) {
                if (!room.startsWith('group_')) {
                    continue;
                }
                inGroup = true;
                const groupId = room.slice('group_'.length);
                displays.push({
                    ...base,
                    groupId,
                    groupName: this.getGroupPermalink(groupId) || null,
                    url: data.displayUrl || null,
                    slug: data.displaySlug || null
                });
            }

            if (!inGroup && data.displayRegistered) {
                displays.push({
                    ...base,
                    groupId: null,
                    groupName: null,
                    url: data.displayUrl || null,
                    slug: data.displaySlug || null
                });
            }
        }

        notifications.sort((a, b) => `${a.username}|${a.path}`.localeCompare(`${b.username}|${b.path}`));
        prescriptions.sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));
        displays.sort((a, b) => String(a.groupName || a.slug || '').localeCompare(String(b.groupName || b.slug || '')));

        return {
            notifications,
            prescriptions,
            displays,
            timestamp: createTimestamp()
        };
    }
}

function cleanIp(ipAddress) {
    return String(ipAddress || '').replace(/^::ffff:/, '');
}

module.exports = ConnectionManager;
