import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import crypto from "crypto";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role", { enum: ["SUPER_ADMIN", "MANAGER", "WORKER"] }).default("WORKER").notNull(),
  restaurantId: text("restaurantId").references(() => restaurants.id, { onDelete: "set null" }), 
  phone: text("phone"),
  bankAccount: text("bankAccount"),
  address: text("address"),
  emergencyContact: text("emergencyContact"),
});

export const restaurants = sqliteTable("restaurant", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// NEW: PRODUCTS (MENU) ENGINE
export const products = sqliteTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  // If restaurantId is NULL, it is a Global HQ item. If populated, it is a branch-specific custom item.
  restaurantId: text("restaurantId").references(() => restaurants.id, { onDelete: "cascade" }), 
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull().default("bg-slate-100 text-slate-700 border-slate-200"),
});

export const shifts = sqliteTable("shift", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  shiftType: text("shiftType", { enum: ["MORNING", "AFTERNOON", "NIGHT", "MIDNIGHT"] }).notNull(),
  expectedPay: integer("expectedPay").notNull(),
  status: text("status", { enum: ["SCHEDULED", "COMPLETED", "ABSENT"] }).default("SCHEDULED").notNull(),
  clockInTime: text("clockInTime"),
  clockOutTime: text("clockOutTime"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// POS TRANSACTIONS ENGINE
export const orders = sqliteTable("order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }), 
  total: integer("total").notNull(),
  status: text("status", { enum: ["OPEN", "PENDING_PAYMENT", "PAID", "REFUNDED"] }).default("PAID").notNull(),
  
  // Queuing System
  orderNumber: text("orderNumber"), // e.g. "A-102"
  orderType: text("orderType", { enum: ["DINE_IN", "TAKE_AWAY"] }).default("DINE_IN"),
  customerName: text("customerName"),

  // Payment Gateway / Cash Tracking
  paymentMethod: text("paymentMethod"), // "CASH", "QRIS"
  amountTendered: integer("amountTendered"),
  changeDue: integer("changeDue"),
  midtransTransactionId: text("midtransTransactionId"),
  
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productName: text("productName").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  note: text("note"), // Optional custom requests (e.g. "Spicy", "No Sauce")
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  }
);
