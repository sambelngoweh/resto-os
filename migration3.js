const db = require('better-sqlite3')('local.db');
try {
  db.exec(`ALTER TABLE "order_item" ADD COLUMN note text;`);
  console.log('Column added successfully');
} catch(e) {
  console.error(e.message);
}
