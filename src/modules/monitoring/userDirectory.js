const mysql = require('mysql2/promise');
const logger = require('../../core/services/logger');

const MODEL_TYPE = 'App\\Models\\User';

class UserDirectory {
    constructor() {
        this.cache = new Map();
        this.pool = null;
        this.initPromise = null;
    }

    async ensureReady() {
        if (!this.initPromise) {
            this.initPromise = this.connect();
        }
        return this.initPromise;
    }

    async connect() {
        const host = process.env.MYSQL_HOST || '';
        const database = process.env.MYSQL_DATABASE || '';
        const user = process.env.MYSQL_USER || '';

        if (!host || !database || !user) {
            logger.warn('User directory nonaktif: MYSQL_HOST, MYSQL_DATABASE, atau MYSQL_USER kosong');
            return;
        }

        this.pool = mysql.createPool({
            host,
            port: Number(process.env.MYSQL_PORT || 3306),
            database,
            user,
            password: process.env.MYSQL_PASSWORD || '',
            waitForConnections: true,
            connectionLimit: 2,
            charset: 'utf8mb4'
        });

        logger.info('User directory terhubung ke MySQL untuk cache nama dan role');
    }

    async enrich(snapshot) {
        await this.ensureReady();

        const notifications = snapshot.notifications || [];
        const prescriptions = snapshot.prescriptions || [];
        const displays = snapshot.displays || [];
        const needed = new Set();

        for (const row of notifications.concat(prescriptions)) {
            const username = normalizeUsername(row.username);
            if (username && !this.cache.has(username)) {
                needed.add(username);
            }
        }

        if (needed.size > 0) {
            await this.fetchMissing(Array.from(needed));
        }

        const notificationsOut = notifications.map((row) => this.apply(row));
        const prescriptionsOut = prescriptions.map((row) => this.apply(row));
        const users = new Set(notificationsOut.map((row) => row.username).filter(Boolean));

        return {
            ...snapshot,
            notifications: notificationsOut,
            prescriptions: prescriptionsOut,
            displays,
            updated_at: snapshot.timestamp,
            summary: {
                notification_tabs: notificationsOut.length,
                notification_users: users.size,
                prescription_tabs: prescriptionsOut.length,
                display_screens: displays.length
            }
        };
    }

    apply(row) {
        const username = normalizeUsername(row.username);
        const cached = username ? this.cache.get(username) : null;

        return {
            ...row,
            username: username || null,
            name: cached ? cached.name : null,
            roles: cached ? cached.roles.slice() : []
        };
    }

    async fetchMissing(usernames) {
        if (!this.pool) {
            usernames.forEach((username) => {
                this.cache.set(username, { name: null, roles: [] });
            });
            return;
        }

        const placeholders = usernames.map(() => '?').join(', ');
        const sql = `
            SELECT LOWER(u.username) AS username, u.name AS name, r.name AS role_name
            FROM users u
            LEFT JOIN model_has_roles mhr
                ON mhr.model_id = u.id AND mhr.model_type = ?
            LEFT JOIN roles r ON r.uuid = mhr.role_id
            WHERE LOWER(u.username) IN (${placeholders})
        `;

        try {
            const [rows] = await this.pool.query(sql, [MODEL_TYPE, ...usernames]);
            const grouped = new Map();

            for (const row of rows) {
                const username = normalizeUsername(row.username);
                if (!username) continue;
                if (!grouped.has(username)) {
                    grouped.set(username, { name: row.name || null, roles: [] });
                }
                if (row.role_name && !grouped.get(username).roles.includes(row.role_name)) {
                    grouped.get(username).roles.push(row.role_name);
                }
            }

            usernames.forEach((username) => {
                this.cache.set(username, grouped.get(username) || { name: null, roles: [] });
            });
        } catch (error) {
            logger.error('Gagal mengambil nama dan role:', error);
        }
    }

    async shutdown() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

module.exports = UserDirectory;
