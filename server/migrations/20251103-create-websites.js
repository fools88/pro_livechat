"use strict";

module.exports = {
  up: async (_queryInterface, _Sequelize) => {
    // No-op: moved Websites creation to an earlier migration (20251102-create-websites.js)
    console.log('Skipping create-websites: handled by 20251102-create-websites.js');
  },
  down: async (_queryInterface, _Sequelize) => {
    // No-op
    console.log('Skipping drop-websites in this migration; handled by 20251102-create-websites.js');
  }
};
