const { Pool } = require("pg");

let pool;
function getPool() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("Marketplace database is not configured. Add DATABASE_URL in Vercel project environment variables.");
    error.statusCode = 503;
    throw error;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000
    });
  }
  return pool;
}
function json(res, status, data) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
}
function text(value, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
module.exports = { getPool, json, text };
