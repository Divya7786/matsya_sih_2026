#!/usr/bin/env tsx
// Database inspection script — safe for development use.
// Never prints password_hash, DATABASE_URL, or API keys.
// Usage: npm run db:inspect

import dotenv from 'dotenv';
dotenv.config();

import { dbHealthCheck, dbGetSafeUsers, useInMemory } from '../server/db/postgres';

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  MATSYA AI — Database Inspection (dev-only)');
  console.log('═══════════════════════════════════════════════════\n');

  const mode = useInMemory() ? 'in-memory' : 'postgresql';
  console.log(`Mode: ${mode.toUpperCase()}`);

  if (useInMemory()) {
    console.log('\n⚠  DATABASE_URL is not set.');
    console.log('   Running in IN-MEMORY mode — data resets on server restart.\n');
    console.log('   NOTE: The running server stores users in its own process memory.');
    console.log('   This script runs a separate process, so it starts with an empty store.');
    console.log('   With PostgreSQL (DATABASE_URL set), this script connects to the same DB');
    console.log('   as the server and shows the actual persisted rows.\n');
    console.log('   To enable PostgreSQL persistence, add to your .env file:');
    console.log('   DATABASE_URL=postgresql://user:password@localhost:5432/matsya_ai\n');
  }

  const health = await dbHealthCheck();

  console.log('DATABASE STATUS');
  console.log('───────────────────────────────────────────────────');
  console.log(`PostgreSQL connected : ${health.connected ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Database mode        : ${health.mode}`);
  console.log(`Database name        : ${health.databaseName ?? '(in-memory)'}`);
  console.log(`User count           : ${health.userCount}`);

  console.log('\nTABLES');
  console.log('───────────────────────────────────────────────────');
  for (const [table, exists] of Object.entries(health.tables)) {
    console.log(`  ${exists ? '✓' : '✗'} ${table}`);
  }

  const users = await dbGetSafeUsers();
  console.log('\nUSERS (safe fields only — no passwords)');
  console.log('───────────────────────────────────────────────────');

  if (users.length === 0) {
    console.log('  No users found.');
  } else {
    const header = 'ID (first 8)       | NAME                    | EMAIL                        | ROLE                | VERIFIED | CREATED';
    console.log(header);
    console.log('─'.repeat(header.length));
    for (const u of users) {
      const id = u.id.slice(0, 8).padEnd(18);
      const name = u.full_name.slice(0, 22).padEnd(23);
      const email = u.email.slice(0, 28).padEnd(29);
      const role = u.role.slice(0, 18).padEnd(19);
      const verified = u.is_verified ? 'YES     ' : 'NO      ';
      const created = new Date(u.created_at).toLocaleString();
      console.log(`${id} | ${name} | ${email} | ${role} | ${verified} | ${created}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Inspection failed:', err.message);
  process.exit(1);
});
