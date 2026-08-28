/**
 * Seeds an ADMIN user in PostgreSQL.
 * For in-memory dev mode: the server auto-seeds from ADMIN_EMAIL/ADMIN_PASSWORD on startup.
 *
 * Usage: npm run db:seed-admin
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in .env (or environment).
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { dbQuery, runMigrations, useInMemory } from '../server/db/postgres';

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'System Administrator';

async function main() {
  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  if (useInMemory()) {
    console.log('Note: DATABASE_URL is not set — running in in-memory mode.');
    console.log('The server auto-seeds the admin from ADMIN_EMAIL/ADMIN_PASSWORD on every startup.');
    console.log('To persist the admin permanently, set DATABASE_URL and re-run this script.');
    process.exit(0);
  }

  console.log('Connecting to PostgreSQL and running migrations...');
  await runMigrations();

  const existing = await dbQuery('SELECT id, role FROM users WHERE email=$1', [email]);
  if (existing.length > 0) {
    if (existing[0].role === 'ADMIN') {
      console.log(`Admin user already exists: ${email}`);
    } else {
      await dbQuery(
        `UPDATE users SET role='ADMIN', account_status='ACTIVE', is_verified=true, updated_at=NOW() WHERE email=$1`,
        [email],
      );
      console.log(`Existing user ${email} promoted to ADMIN.`);
    }
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);
  await dbQuery(
    `INSERT INTO users (id, email, password_hash, full_name, organization, designation, role, account_status, is_verified)
     VALUES ($1,$2,$3,$4,$5,$6,'ADMIN','ACTIVE',true)`,
    [randomUUID(), email, password_hash, name, 'MATSYA AI', 'System Administrator'],
  );

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
