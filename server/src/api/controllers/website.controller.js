// /pro_livechat/server/src/api/controllers/website.controller.js

const db = require('../../../models');
const Website = db.Website;
const logger = require('../../utils/logger');

// --- (A) FUNGSI UNTUK MENDAFTARKAN WEBSITE BARU ---
exports.createWebsite = async (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ message: 'Nama dan URL website wajib diisi.' });
  }

  try {
    // 'widgetKey' akan otomatis dibuat oleh database (via defaultValue)
    const newWebsite = await Website.create({
      name,
      url,
    });

    res.status(201).json({
      message: 'Website baru berhasil ditambahkan.',
      website: newWebsite,
    });
  } catch (error) {
    // Cek jika error-nya karena URL sudah ada (unique constraint)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Error: URL website sudah terdaftar.' });
    }
    res.status(500).json({ message: 'Server error saat menambahkan website.' });
  }
};

// --- (B) FUNGSI UNTUK MENGAMBIL SEMUA WEBSITE ---
exports.getAllWebsites = async (req, res) => {
  try {
    // Kita akan ambil semua website + 'User' (admin) yang terkait
    const websites = await Website.findAll({
      include: {
        model: db.User, // 'User' dari db.User
        attributes: ['id', 'username', 'email'], // Hanya tampilkan ini
        through: { attributes: [] } // Jangan tampilkan tabel perantaranya
      }
    });

    res.status(200).json(websites);
  } catch (error) {
    logger.error('Error getAllWebsites: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat mengambil data website.' });
  }
};

// --- (C) FUNGSI UNTUK MENGHAPUS WEBSITE ---
exports.deleteWebsite = async (req, res) => {
  const { id } = req.params; // Ambil ID website dari URL

  try {
    const website = await Website.findByPk(id);

    if (!website) {
      return res.status(404).json({ message: 'Website tidak ditemukan.' });
    }

    await website.destroy(); // Hapus website (dan semua visitor/chat-nya via CASCADE)

    res.status(200).json({ message: 'Website berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error saat menghapus website.' });
  }
};