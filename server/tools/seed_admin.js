// tools/seed_admin.js
// Script untuk membuat admin user untuk testing lokal

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function seedAdmin() {
  try {
    console.log('[SEED] Memeriksa apakah admin sudah ada (idempotent)...');

    // Hash password first so we can supply it as a default for creation.
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Use findOrCreate to avoid races / duplicate-key failures when multiple
    // seeding processes run concurrently. This will either return the existing
    // admin or create it with the provided defaults.
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@prochat.local' },
      // Use model's actual column names in defaults (passwordHash is the DB column)
      defaults: {
        username: 'admin',
        email: 'admin@prochat.local',
        passwordHash: hashedPassword,
        role: 'admin'
      }
    });

    if (!created) {
      console.log('[SEED] Admin sudah ada:', admin.username);
      console.log('[SEED] Email:', admin.email);
      console.log('[SEED] Gunakan kredensial ini untuk login:');
      console.log('[SEED]   Email: admin@prochat.local');
      console.log('[SEED]   Password: admin123');
      process.exit(0);
    }

    console.log('[SEED] Membuat admin user...');
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
