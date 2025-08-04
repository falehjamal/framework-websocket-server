// Configuration
const config = {
    port: process.env.SOCKETIO_PORT || 6001,
    redis: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379/0' },
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: false
    }
};

module.exports = config;
