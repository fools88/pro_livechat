require('dotenv').config();

/**
 * PRODUCTION-READY DATABASE CONFIGURATION
 * 
 * OPTIMIZATION UNTUK PULUHAN RIBU USER:
 * - Connection pooling: Reuse connections (hemat resource)
 * - Query timeout: Kill slow queries automatically
 * - Proper indexes: 10-100x faster queries
 * 
 * SCALING ROADMAP (GRATIS/MURAH):
 * - 0-10k users: Current config OK (Docker local, $0)
 * - 10k-50k users: Add caching + archive old data ($0)
 * - 50k-100k users: Read replica + partitioning ($10-20/month VPS)
 * - 100k+ users: Managed database ($50-100/month)
 */

const baseConfig = {
  username: process.env.DB_USER || 'prochatadmin',
  password: process.env.DB_PASSWORD || 'REPLACE_ME_DB_PASSWORD',
  database: process.env.DB_NAME || 'prochat_db',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  
  // CONNECTION POOL (Optimized for 10k+ users)
  pool: {
    max: 20,        // Max 20 connections (cukup untuk 10k+ concurrent users)
    min: 5,         // Always keep 5 connections ready
    acquire: 30000, // Wait max 30s to get connection
    idle: 10000     // Close idle connections after 10s
  },

  // QUERY OPTIMIZATION
  dialectOptions: {
    statement_timeout: 30000,  // Kill queries > 30 seconds
    idle_in_transaction_session_timeout: 60000
  },

  // TIMEZONE
  timezone: '+07:00', // Jakarta (sesuaikan dengan lokasi Anda)
  
  define: {
    timestamps: true,      // Enable createdAt & updatedAt
    underscored: false,    // Use camelCase
    freezeTableName: true  // Tidak auto-pluralize
  }
};

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log,  // Log all queries in development
    benchmark: true        // Measure query performance
  },
  
  test: {
    ...baseConfig,
    logging: false,
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000
    }
  },
  
  production: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    
    logging: false,   // Disable logging (performance)
    benchmark: false,
    
    // Larger pool for production
    pool: {
      max: 30,
      min: 10,
      acquire: 60000,
      idle: 10000
    }
  }
};

