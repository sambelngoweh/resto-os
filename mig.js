const Database = require('better-sqlite3');
const db = new Database('local.db');
try { db.exec('ALTER TABLE "user" ADD COLUMN address text;'); } catch(e) { console.log(e.message); }
try { db.exec('ALTER TABLE "user" ADD COLUMN emergencyContact text;'); } catch(e) { console.log(e.message); }
console.log('Done');
