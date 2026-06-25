// PostgreSQL connection pool
// Works with a local Postgres instance OR a cloud Postgres like NeonDB / Render.
// Just set DATABASE_URL in your .env file.

const { Pool } = require('pg');

const isLocal = (process.env.DATABASE_URL || '').includes('localhost');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;
