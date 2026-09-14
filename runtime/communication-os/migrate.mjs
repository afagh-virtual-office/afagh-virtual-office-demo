import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required for migration');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

const migrationName = '001_communication_os';
const sql = await fs.readFile(new URL('./migrations/001_communication_os.sql', import.meta.url), 'utf8');
const checksum = crypto.createHash('sha256').update(sql).digest('hex');
const client = await pool.connect();

try {
  await client.query('SELECT pg_advisory_lock(hashtext($1))', ['afagh:communication-os:migrations']);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name TEXT PRIMARY KEY,
      checksum_sha256 TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const existing = await client.query(
    'SELECT checksum_sha256 FROM schema_migrations WHERE migration_name=$1',
    [migrationName],
  );

  if (existing.rowCount) {
    if (existing.rows[0].checksum_sha256 !== checksum) {
      throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${migrationName}`);
    }
    console.log(`Communication OS migration ${migrationName} already applied`);
    return;
  }

  await client.query('BEGIN');
  await client.query(sql);
  await client.query(
    'INSERT INTO schema_migrations(migration_name,checksum_sha256) VALUES($1,$2)',
    [migrationName, checksum],
  );
  await client.query('COMMIT');
  console.log(`Communication OS migration ${migrationName} applied`);
} catch (error) {
  try { await client.query('ROLLBACK'); } catch {}
  throw error;
} finally {
  try { await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['afagh:communication-os:migrations']); } catch {}
  client.release();
  await pool.end();
}
