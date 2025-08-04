const WebSocketServer = require('./src/app');

// Create and start the server
const server = new WebSocketServer();

// Graceful shutdown handlers
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Start the server
server.start();

