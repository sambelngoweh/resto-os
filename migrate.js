const db = require('better-sqlite3')('local.db');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "product" (
      "id" text PRIMARY KEY NOT NULL,
      "restaurantId" text,
      "name" text NOT NULL,
      "price" integer NOT NULL,
      "category" text NOT NULL,
      "color" text DEFAULT 'bg-slate-100 text-slate-700 border-slate-200' NOT NULL,
      FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE cascade
    );
    CREATE TABLE IF NOT EXISTS "order" (
      "id" text PRIMARY KEY NOT NULL,
      "restaurantId" text NOT NULL,
      "userId" text,
      "total" integer NOT NULL,
      "status" text DEFAULT 'PAID' NOT NULL,
      "paymentMethod" text,
      "midtransTransactionId" text,
      "created_at" integer,
      FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE cascade,
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE set null
    );
    CREATE TABLE IF NOT EXISTS "order_item" (
      "id" text PRIMARY KEY NOT NULL,
      "orderId" text NOT NULL,
      "productName" text NOT NULL,
      "quantity" integer NOT NULL,
      "price" integer NOT NULL,
      FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE cascade
    );
  `);
  console.log('Tables created successfully.');
} catch(e) {
  console.error(e);
}
