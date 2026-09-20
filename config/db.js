import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

let defaultUrl = "file:vakilsetu.db";
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  defaultUrl = "file:/tmp/vakilsetu.db"; // Use writable /tmp in Vercel serverless if Turso URL missing
}
const url = (process.env.DATABASE_URL || defaultUrl).trim();
const authToken = process.env.DATABASE_AUTH_TOKEN ? process.env.DATABASE_AUTH_TOKEN.trim() : undefined;

export const db = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

export default db;
