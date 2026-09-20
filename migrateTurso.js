import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';
import { initDb } from './config/initDb.js';

async function runMigration() {
  console.log("Emptying lawyers table...");
  await db.execute("DELETE FROM lawyers");
  console.log("Emptying clients table just in case...");
  await db.execute("DELETE FROM clients");
  
  console.log("Running initDb to seed new Indian data...");
  await initDb();
  
  console.log("Migration complete!");
}

runMigration().catch(console.error);
