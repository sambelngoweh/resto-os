const db = require('better-sqlite3')('local.db');
db.exec('DROP TABLE IF EXISTS "order_item";');
db.exec('DROP TABLE IF EXISTS "order";');
console.log("Tables dropped.");
