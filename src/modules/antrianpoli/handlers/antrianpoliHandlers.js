const logger = require('../../../core/services/logger');
const { createTimestamp, getRoomClientCount } = require('../../../core/utils/helpers');

class AntrianPoliHandlers {
	constructor(io, connectionManager) {
		this.io = io;
		this.connectionManager = connectionManager;
	}

	async leaveGroupRoom(socket, roomName) {
		await socket.leave(roomName);
		if (getRoomClientCount(this.io, roomName) === 0) {
			this.connectionManager.removeGroupPermalink(roomName.replace('group_', ''));
		}
	}

	async handleJoinGroup(socket, data) {
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

			const previousRooms = [...socket.rooms];
			for (const room of previousRooms) {
				if (room !== socket.id && room.startsWith('group_') && room !== roomName) {
					await this.leaveGroupRoom(socket, room);
					logger.info(`🚪 Client ${socket.id} left room ${room}`);
				}
			}

			await socket.join(roomName);
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

	async handleLeaveGroup(socket, data) {
		try {
			const { groupId } = data || {};
			const roomName = `group_${groupId}`;

			await this.leaveGroupRoom(socket, roomName);

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

	handleDisconnecting(socket) {
		for (const room of [...socket.rooms]) {
			if (room !== socket.id && room.startsWith('group_') && getRoomClientCount(this.io, room) <= 1) {
				this.connectionManager.removeGroupPermalink(room.replace('group_', ''));
			}
		}
	}

	handleDisconnection(socket) {
		logger.debug(`🏠 AntrianPoli module handling disconnection for ${socket.id}`);
	}
}

module.exports = AntrianPoliHandlers;


