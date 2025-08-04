// Utility functions
const extractGroupIdFromChannel = (channel) => {
    const match = channel.match(/antrian\.group\.(\d+)/);
    return match ? match[1] : null;
};

const getRoomClientCount = (io, roomName) => {
    return io.sockets.adapter.rooms.get(roomName)?.size || 0;
};

const createTimestamp = () => new Date().toISOString();

module.exports = {
    extractGroupIdFromChannel,
    getRoomClientCount,
    createTimestamp
};
