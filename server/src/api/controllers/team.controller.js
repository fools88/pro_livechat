// /pro_livechat/server/src/api/controllers/team.controller.js

const db = require('../../../models');
const logger = require('../../utils/logger');

// (A) FUNGSI UNTUK MENUGASKAN AGENT KE WEBSITE
exports.assignAgentToWebsite = async (req, res) => {
  const { userId, websiteId } = req.body;

  if (!userId || !websiteId) {
    return res.status(400).json({ message: 'userId dan websiteId wajib diisi.' });
  }

  try {
    // 1. Cari Website-nya
    const website = await db.Website.findByPk(websiteId);
    if (!website) {
      return res.status(404).json({ message: 'Website tidak ditemukan.' });
    }

    // 2. Cari User (Agent)-nya
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User (Agent) tidak ditemukan.' });
    }

    // 3. "Jembatani" mereka
    // (Sequelize punya "magic method" .addUser())
    // Ini akan otomatis membuat 1 baris di tabel "UserWebsites"
    await website.addUser(user); 

    res.status(200).json({ message: `Agent ${user.username} berhasil ditugaskan ke ${website.name}.` });

  } catch (error) {
    // Cek jika error-nya karena "jembatan"-nya sudah ada
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Agent ini sudah ditugaskan ke website tersebut.' });
    }
    logger.error('[Team Controller] GAGAL assign agent: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat menugaskan agent.' });
  }
};

// (B) FUNGSI UNTUK MENGHAPUS AGENT DARI WEBSITE
exports.removeAgentFromWebsite = async (req, res) => {
  const { userId, websiteId } = req.body;

  try {
    const website = await db.Website.findByPk(websiteId);
    if (!website) {
      return res.status(404).json({ message: 'Website tidak ditemukan.' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User (Agent) tidak ditemukan.' });
    }

    // 4. "Hapus Jembatan" (Magic method: .removeUser())
    await website.removeUser(user);

    res.status(200).json({ message: `Tugas agent ${user.username} dari ${website.name} berhasil dihapus.` });

  } catch (error) {
    logger.error('[Team Controller] GAGAL remove agent: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat menghapus tugas agent.' });
  }
};