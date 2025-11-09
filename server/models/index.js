// /pro_livechat/server/models/index.js
// (VERSI V15 - MENAMBAHKAN KATEGORI)

const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

// (A) Buat "wadah" untuk database kita
const db = {};

// (B) "Kenalkan" sequelize ke wadah
db.Sequelize = require('sequelize');
db.sequelize = sequelize;

// (C) "Daftarkan" semua model kita ke wadah
db.User = require('./user.model.js');
db.Website = require('./website.model.js');
db.Visitor = require('./visitor.model.js');
db.Conversation = require('./conversation.model.js');
db.Message = require('./message.model.js');
db.AIPersona = require('./aiPersona.model.js');
db.AIKnowledge = require('./aiKnowledge.model.js');
db.AIRule = require('./aiRule.model.js');
db.KnowledgeCategory = require('./knowledgeCategory.model.js'); // <-- (DAFTARKAN V15)
db.File = require('./file.model.js')(sequelize); // 🆕 V22: File Sharing

// --- (D) BANGUN JEMBATAN (RELASI) ---

// ... (Relasi #1 s/d #5 Anda tetap sama) ...
// 1. Jembatan: Website <--> Visitor (Aman)
db.Website.hasMany(db.Visitor, { foreignKey: 'websiteId', onDelete: 'CASCADE' });
db.Visitor.belongsTo(db.Website, { foreignKey: 'websiteId' });
// 2. Jembatan: User <--> Website (Aman)
db.User.belongsToMany(db.Website, { through: 'UserWebsites', foreignKey: 'userId' });
db.Website.belongsToMany(db.User, { through: 'UserWebsites', foreignKey: 'websiteId' });
// 3. Jembatan: Conversation <--> (Website & Visitor) (Aman)
db.Conversation.belongsTo(db.Website, { foreignKey: 'websiteId' });
db.Website.hasMany(db.Conversation, { foreignKey: 'websiteId' });
db.Conversation.belongsTo(db.Visitor, { foreignKey: 'visitorId' });
db.Visitor.hasMany(db.Conversation, { foreignKey: 'visitorId' });
// 4. Jembatan: Conversation <--> Message (Aman)
db.Conversation.hasMany(db.Message, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
db.Message.belongsTo(db.Conversation, { foreignKey: 'conversationId' });
// 5. Jembatan Opsional (Aman)
db.User.hasMany(db.Conversation, { foreignKey: 'assignedAdminId', as: 'assignedConversations' });
db.Conversation.belongsTo(db.User, { foreignKey: 'assignedAdminId', as: 'assignedAdmin' });
db.User.hasMany(db.Message, { foreignKey: 'senderId', constraints: false, scope: { senderType: 'admin' } });
db.Message.belongsTo(db.User, { foreignKey: 'senderId', constraints: false, as: 'adminSender' });
db.Visitor.hasMany(db.Message, { foreignKey: 'senderId', constraints: false, scope: { senderType: 'visitor' } });
db.Message.belongsTo(db.Visitor, { foreignKey: 'senderId', constraints: false, as: 'visitorSender' });

// 6. Jembatan AI (V14 - Aman)
db.Website.hasMany(db.AIPersona, { foreignKey: 'websiteId' });
db.AIPersona.belongsTo(db.Website, { foreignKey: 'websiteId' });

// --- (PERUBAHAN V15 DI SINI) ---

// 7. Jembatan V15 - Knowledge & Kategori
// Relasi #1: Website -> Kategori (Satu Website punya BANYAK Kategori)
db.Website.hasMany(db.KnowledgeCategory, { foreignKey: 'websiteId', onDelete: 'CASCADE' });
db.KnowledgeCategory.belongsTo(db.Website, { foreignKey: 'websiteId' });

// Relasi #2: Kategori -> Knowledge (Satu Kategori berisi BANYAK File Knowledge)
db.KnowledgeCategory.hasMany(db.AIKnowledge, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
db.AIKnowledge.belongsTo(db.KnowledgeCategory, { foreignKey: 'categoryId' });

// Relasi #3: Website -> Knowledge (Tetap dipertahankan)
db.Website.hasMany(db.AIKnowledge, { foreignKey: 'websiteId' });
db.AIKnowledge.belongsTo(db.Website, { foreignKey: 'websiteId' });

// Relasi #4: Website -> Rules (Aman)
db.Website.hasMany(db.AIRule, { foreignKey: 'websiteId' });
db.AIRule.belongsTo(db.Website, { foreignKey: 'websiteId' });

// 🆕 V22: File Sharing Relationships
// Relasi #1: Message -> Files (One message can have many files)
db.Message.hasMany(db.File, { foreignKey: 'messageId', as: 'files', onDelete: 'CASCADE' });
db.File.belongsTo(db.Message, { foreignKey: 'messageId', as: 'message' });

// Relasi #2: Conversation -> Files (One conversation can have many files)
db.Conversation.hasMany(db.File, { foreignKey: 'conversationId', as: 'files' });
db.File.belongsTo(db.Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Relasi #3: Polymorphic - File uploader (Admin or Visitor)
db.User.hasMany(db.File, { foreignKey: 'uploaderId', constraints: false, as: 'uploadedFiles' });
db.Visitor.hasMany(db.File, { foreignKey: 'uploaderId', constraints: false, as: 'uploadedFiles' });

// (E) Ekspor wadah database kita
module.exports = db;