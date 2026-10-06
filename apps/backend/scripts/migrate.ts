/**
 * Applies every SQL file in db/migrations (in name order) using a direct
 * Postgres connection. Requires SUPABASE_DB_URL (Supabase → Project Settings →
 * Database → Connection string → URI). Alternatively paste the SQL files into
 * the Supabase SQL editor — they are idempotent.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');
const url = process.env.SUPABASE_DB_URL;

if (!url) {
  console.error(
    '\nSUPABASE_DB_URL is not set.\n' +
      'Either add it to apps/backend/.env, or open the Supabase SQL editor and run\n' +
      `the files in ${dir} in order.\n`,
  );
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
await client.connect();
try {
  for (const file of files) {
    process.stdout.write(`→ ${file} … `);
    await client.query(await readFile(join(dir, file), 'utf8'));
    console.log('done');
  }
  console.log('\n✅ Database schema is up to date.');
} finally {
  await client.end();
}
