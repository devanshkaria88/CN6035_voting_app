/**
 * Placeholder for future off-chain persistence.
 *
 * The current ClassRep Vote backend is fully on-chain: all canonical
 * state lives in the ClassRepVoting smart contract on Sepolia. The only
 * mutable in-memory store is the nonce cache used during wallet signature
 * verification (see auth.service.js).
 *
 * If the project later needs to persist activity logs, audit trails or a
 * voter directory mirror, wire a real database connection here (e.g.
 * SQLite, Postgres, MongoDB) and export a client / connection pool.
 *
 * Example:
 *
 *   const Database = require('better-sqlite3');
 *   const db = new Database(process.env.DB_PATH || './data/classrep.db');
 *   module.exports = { db };
 */

module.exports = {
  isEnabled: false,
  driver: null,
  client: null,
};
