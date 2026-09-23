const { createClient } = require('redis');
const logger = require('./logger');
const { extractGroupIdFromChannel } = require('../utils/helpers');

class RedisService {
    constructor(config, broadcastService) {
        this.config = config;
        this.broadcastService = broadcastService;
        this.redisSubscriber = null;
    }

    async initialize() {
        try {
            if (!this.config.redis.url) {
                logger.info('⚠️ Redis URL not provided, skipping Redis initialization');
                return;
            }

            logger.info('🔄 Initializing Redis with URL:', this.config.redis.url);

            this.redisSubscriber = createClient({ url: this.config.redis.url });
            this.redisSubscriber.on('error', (err) => {
                logger.error('❌ Redis Subscriber Error:', err);
            });

            await this.redisSubscriber.connect();

            logger.info('✅ Redis connection established');
            await this.setupListeners();

        } catch (error) {
            logger.error('🔥 Failed to initialize Redis:', error);
            logger.warn('⚠️ Continuing without Redis connection...');
        }
    }

    processMessage(message, channel) {
        logger.debug('Redis message', { channel, message });

        try {
            const data = JSON.parse(message);
            logger.debug('Parsed redis data', { channel, data });

            if (!data.event || !data.data) {
                logger.warn('⚠️ Invalid message format', { channel });
                return;
            }

            if (channel.startsWith('antrian.')) {
                const groupId = extractGroupIdFromChannel(channel);
                if (!groupId) {
                    logger.warn('⚠️ Could not extract group ID from channel:', channel);
                    return;
                }
                this.broadcastService.broadcastToClients(channel, data.event, data.data, groupId);
                return;
            }

            if (data.event.startsWith('prescription.')) {
                this.broadcastService.broadcastToPrescriptionRoom(channel, data.event, data.data);
                return;
            }

            logger.debug('Ignored redis message', { channel, event: data.event });

        } catch (error) {
            logger.error('❌ Error processing message:', error);
        }
    }

    async setupListeners() {
        try {
            if (!this.redisSubscriber) {
                logger.info('⚠️ Redis not initialized, skipping listeners setup');
                return;
            }

            logger.info('🔄 Setting up Redis pattern subscription...');

            await this.redisSubscriber.pSubscribe('*', (message, channel) => {
                this.processMessage(message, channel);
            });

            logger.info('✅ Subscribed to Redis pattern: *');

        } catch (error) {
            logger.error('🔥 Failed to setup Redis listeners:', error);
            throw error;
        }
    }

    async shutdown() {
        try {
            if (this.redisSubscriber) {
                await this.redisSubscriber.quit();
                logger.info('✅ Redis subscriber disconnected');
            }
        } catch (error) {
            logger.error('❌ Error shutting down Redis:', error);
        }
    }
}

module.exports = RedisService;
