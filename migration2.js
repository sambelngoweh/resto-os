const db = require('better-sqlite3')('local.db');
try {
  db.exec(`
    ALTER TABLE "order" ADD COLUMN orderNumber text;
    ALTER TABLE "order" ADD COLUMN orderType text DEFAULT 'DINE_IN';
    ALTER TABLE "order" ADD COLUMN customerName text;
    ALTER TABLE "order" ADD COLUMN amountTendered integer;
    ALTER TABLE "order" ADD COLUMN changeDue integer;
  `);
  console.log('Columns added successfully');
} catch(e) {
  console.error(e.message);
}
