import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// If DATABASE_URL is set, it takes priority (matches node-pg-migrate's default behavior).
// Otherwise, fall back to individual PG* env vars.
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      }
);

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(1);
});
