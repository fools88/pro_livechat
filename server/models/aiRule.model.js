// /pro_livechat/server/models/aiRule.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const AIRule = sequelize.define(
  'AIRule',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Nanti kita akan buat ini lebih kompleks
    // Untuk V1, kita buat simpel:
    targetType: {
      // Aturan ini berlaku untuk apa?
      type: DataTypes.ENUM('website', 'visitor_id'),
      allowNull: false,
    },
    targetValue: {
      // ID dari website atau visitor
      type: DataTypes.STRING, 
      allowNull: false,
    },
    action: {
      // Apa yang harus dilakukan AI?
      type: DataTypes.ENUM('AUTO_REPLY', 'DO_NOTHING'),
      allowNull: false,
      defaultValue: 'DO_NOTHING',
    }
  },
  {
    timestamps: true,
    tableName: 'AIRules',
  }
);

module.exports = AIRule;