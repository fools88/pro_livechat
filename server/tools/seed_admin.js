// tools/seed_admin.js
// Script untuk membuat admin user untuk testing lokal

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function seedAdmin() {
  try {
    console.log('[SEED] Memeriksa apakah admin sudah ada...');
    
    const existingAdmin = await User.findOne({ where: { email: 'admin@prochat.local' } });
    
    if (existingAdmin) {
      console.log('[SEED] Admin sudah ada:', existingAdmin.username);
      console.log('[SEED] Email:', existingAdmin.email);
      console.log('[SEED] Gunakan kredensial ini untuk login:');
      console.log('[SEED]   Email: admin@prochat.local');
      console.log('[SEED]   Password: admin123');
      process.exit(0);
    }

    console.log('[SEED] Membuat admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@prochat.local',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('[SEED] ✅ Admin berhasil dibuat!');
    console.log('[SEED] Username:', admin.username);
    console.log('[SEED] Email:', admin.email);
    console.log('[SEED] Password: admin123');
    console.log('');
    console.log('[SEED] Sekarang buka Dashboard dan login dengan:');
    console.log('[SEED]   Email: admin@prochat.local');
    console.log('[SEED]   Password: admin123');
    
    process.exit(0);
  } catch (err) {
    console.error('[SEED] ❌ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
