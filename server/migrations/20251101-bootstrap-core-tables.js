"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create core tables deterministically for CI and migrations that rely on them.
    // Use raw SQL with IF NOT EXISTS to be idempotent.
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Websites" (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        "widgetKey" UUID NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Visitors" (
        id UUID PRIMARY KEY,
        name TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "KnowledgeCategories" (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop core tables if they exist (safe for CI reset scenarios)
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "KnowledgeCategories" CASCADE;`);
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "Visitors" CASCADE;`);
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "Websites" CASCADE;`);
  }
};
