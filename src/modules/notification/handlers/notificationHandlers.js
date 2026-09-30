const logger = require('../../../core/services/logger');
const { createTimestamp } = require('../../../core/utils/helpers');

function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

function normalizePath(path) {
    return String(path || '').split('?')[0].split('#')[0].trim().toLowerCase();
}

function roomNameFor(username) {
    return `notif_user_${normalizeUsername(username)}`;
}

class NotificationHandlers {
    constructor(io, connectionManager) {
        this.io = io;
        this.connectionManager = connectionManager;
    }

    handleJoinNotification(socket, data) {
        try {
            const username = normalizeUsername(data && data.username);
            if (!username) {
                socket.emit('error', { message: 'Username wajib diisi' });
                return;
            }

            const roomName = roomNameFor(username);
            socket.join(roomName);
            socket.data.notificationRoom = roomName;
            socket.data.username = username;
            socket.data.path = normalizePath(data && data.path);

            socket.emit('notification-joined', {
                message: 'Berhasil join room notifikasi',
                socketId: socket.id,
                roomName,
                username,
                timestamp: createTimestamp()
            });

            logger.info(`Client ${socket.id} joined notification room ${roomName}`);
        } catch (error) {
            logger.error('Error handling join-notification:', error);
            socket.emit('error', { message: 'Gagal join room notifikasi' });
        }
    }

    handleLeaveNotification(socket) {
        try {
            const roomName = socket.data && socket.data.notificationRoom;
            if (roomName) {
                socket.leave(roomName);
            }
            if (socket.data) {
                delete socket.data.username;
                delete socket.data.path;
            }

            socket.emit('notification-left', {
                message: 'Berhasil leave room notifikasi',
                socketId: socket.id,
                roomName: roomName || null,
                timestamp: createTimestamp()
            });
        } catch (error) {
            logger.error('Error handling leave-notification:', error);
            socket.emit('error', { message: 'Gagal leave room notifikasi' });
        }
    }

    handleDisconnection(socket) {
        logger.debug(`Notification module handling disconnection for ${socket.id}`);
    }
}

module.exports = NotificationHandlers;
module.exports.normalizeUsername = normalizeUsername;
module.exports.normalizePath = normalizePath;
module.exports.roomNameFor = roomNameFor;
