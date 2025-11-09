// /pro_livechat/server/src/api/controllers/user.controller.js

const db = require('../../../models');
const User = db.User;

// --- (A) FUNGSI UNTUK AMBIL SEMUA USER (AGENT) ---
exports.getAllUsers = async (req, res) => {
  try {
    // Ambil semua user, TAPI jangan ikutkan passwordHash
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error saat mengambil data user.' });
  }
};

// --- (B) FUNGSI UNTUK MENGHAPUS USER ---
exports.deleteUser = async (req, res) => {
  const { id } = req.params; // Ambil ID user dari URL (mis: /api/users/12345)

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Cek agar user tidak bisa menghapus dirinya sendiri
    if (req.userId === id) {
        return res.status(400).json({ message: 'Tidak bisa menghapus diri sendiri.'});
    }

    await user.destroy(); // Hapus user dari database

    res.status(200).json({ message: 'User berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error saat menghapus user.' });
  }
};

// --- (C) FUNGSI UNTUK MENGUBAH ROLE USER ---
exports.updateUserRole = async (req, res) => {
  const { id } = req.params; // ID user yang mau diubah
  const { role } = req.body; // Role baru ('admin' or 'agent')

  if (!role || (role !== 'admin' && role !== 'agent')) {
      return res.status(400).json({ message: "Role tidak valid. Harus 'admin' atau 'agent'."});
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    user.role = role;
    await user.save(); // Simpan perubahan

    res.status(200).json({ message: 'Role user berhasil diupdate.', user: { id: user.id, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error saat update role user.' });
  }
};