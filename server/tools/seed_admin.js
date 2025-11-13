// tools/seed_admin.js
// Script untuk membuat admin user untuk testing lokal

require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');

function generatePassword(len = 12) {
  // generate url-safe random base64 and strip non-alphanum
  const raw = crypto.randomBytes(Math.max(8, len)).toString('base64');
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, len);
}

async function seedAdmin() {
  try {
    console.log('[SEED] Memeriksa apakah admin sudah ada (idempotent)...');

    // Accept ADMIN_PASSWORD from environment for CI / secure flows.
    // If not provided, generate a random password for local dev.
    const envPassword = process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim();
    const isCI = !!(process.env.CI || process.env.GITHUB_ACTIONS);
    const adminPassword = envPassword && envPassword.length > 0 ? envPassword : generatePassword(12);

    // Hash password first so we can supply it as a default for creation.
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

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
      console.log('[SEED] Gunakan kredensial yang sudah dikonfigurasi untuk login (password disembunyikan).');
      process.exit(0);
    }

    console.log('[SEED] Membuat admin user...');
    console.log('[SEED] ✅ Admin berhasil dibuat!');
    console.log('[SEED] Username:', admin.username);
    console.log('[SEED] Email:', admin.email);

    if (isCI) {
      console.log('[SEED] Password: (hidden in CI)');
      console.log('[SEED] Note: set ADMIN_PASSWORD in CI if you need a known value');
    } else {
      // Only print the password for local/dev runs where environment is not CI
      console.log('[SEED] Password:', adminPassword);
      console.log('');
      console.log('[SEED] Sekarang buka Dashboard dan login dengan:');
      console.log('[SEED]   Email: admin@prochat.local');
      console.log('[SEED]   Password: (shown above)');
    }

    process.exit(0);
  } catch (err) {
    console.error('[SEED] ❌ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
