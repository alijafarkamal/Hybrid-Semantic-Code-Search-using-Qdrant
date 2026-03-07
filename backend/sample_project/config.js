/**
 * Application configuration and environment variables.
 */

const config = {
    // Server configuration
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    
    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'myapp',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },
    
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    // API configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        timeout: parseInt(process.env.API_TIMEOUT || '5000', 10)
    },
    
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
    }
};

/**
 * Get configuration value by path.
 * @param {string} path - Dot-separated path (e.g., 'database.host')
 * @returns {any} Configuration value
 */
function getConfig(path) {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
}

/**
 * Validate required configuration values.
 * @param {string[]} requiredPaths - Array of required config paths
 * @throws {Error} If any required config is missing
 */
function validateConfig(requiredPaths) {
    const missing = requiredPaths.filter(path => getConfig(path) === undefined);
    
    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
}

module.exports = {
    config,
    getConfig,
    validateConfig
};

