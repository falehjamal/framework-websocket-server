const logger = require('../../../core/services/logger');
const { createTimestamp, getRoomClientCount } = require('../../../core/utils/helpers');

class AntrianPoliHandlers {
	constructor(io, connectionManager) {
		this.io = io;
		this.connectionManager = connectionManager;
	}

	handleJoinGroup(socket, data) {
		try {
			const { groupId, groupName } = data || {};

			if (!groupId) {
				socket.emit('error', { message: 'Group ID is required' });
				return;
			}

			const roomName = `group_${groupId}`;

			// Store permalink (groupName) for this group
			if (groupName) {
				this.connectionManager.setGroupPermalink(groupId, groupName);
			} else {
				logger.warn(`⚠️ No groupName provided for group ${groupId}`);
			}

			// Leave previous group rooms
			socket.rooms.forEach(room => {
				if (room !== socket.id && room.startsWith('group_')) {
					socket.leave(room);
					logger.info(`🚪 Client ${socket.id} left room ${room}`);
				}
			});

			socket.join(roomName);
			socket.data.displayUrl = (data && data.url) || null;
			socket.data.displaySlug = (data && data.display) || null;
			socket.data.displayRegistered = false;
			socket.emit('joined-group', {
				groupId, groupName, roomName,
				timestamp: createTimestamp()
			});

			logger.info(`🏠 Client ${socket.id} joined group ${groupId} (${groupName})`);

		} catch (error) {
			logger.error('❌ Error handling join-group:', error);
			socket.emit('error', { message: 'Failed to join group' });
		}
	}

	handleLeaveGroup(socket, data) {
		try {
			const { groupId } = data || {};
			const roomName = `group_${groupId}`;

			socket.leave(roomName);
			
			// Check if no more clients in this group, then remove permalink
			const remainingClients = getRoomClientCount(this.io, roomName);
			if (remainingClients === 0) {
				this.connectionManager.removeGroupPermalink(groupId);
			}
			
			socket.emit('left-group', {
				groupId, roomName,
				timestamp: createTimestamp()
			});

			logger.info(`🚪 Client ${socket.id} left group ${groupId}`);

		} catch (error) {
			logger.error('❌ Error handling leave-group:', error);
			socket.emit('error', { message: 'Failed to leave group' });
		}
	}

	handleRegisterDisplay(socket, data) {
		try {
			const info = data || {};
			socket.data.displayRegistered = true;
			socket.data.displayUrl = info.url || null;
			socket.data.displaySlug = info.display || null;
			socket.emit('display-registered', {
				display: socket.data.displaySlug,
				url: socket.data.displayUrl,
				timestamp: createTimestamp()
			});
			logger.info(`📺 Client ${socket.id} registered display ${socket.data.displaySlug || '-'}`);
		} catch (error) {
			logger.error('❌ Error handling register-display:', error);
			socket.emit('error', { message: 'Failed to register display' });
		}
	}

	handleDisconnection(socket) {
		// Antrianpoli-specific cleanup on disconnection
		logger.debug(`🏠 AntrianPoli module handling disconnection for ${socket.id}`);
	}
}

module.exports = AntrianPoliHandlers;


