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
  staffType: text("staffType", { enum: ["REGULAR", "SHIFT_TIMER"] }).default("REGULAR"),
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
  cost: integer("cost").default(0).notNull(),
  category: text("category").notNull(),
  color: text("color").notNull().default("bg-slate-100 text-slate-700 border-slate-200"),
});

export const productRecipes = sqliteTable("product_recipes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  inventoryItemId: text("inventory_item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
});

export const shifts = sqliteTable("shift", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  shiftType: text("shiftType").notNull(),
  assignedRole: text("assignedRole", { enum: ["CASHIER", "KITCHEN", "SERVICE"] }).default("KITCHEN"),
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
  channel: text("channel", { enum: ["OFFLINE_POS", "GRAB_FOOD", "GO_FOOD", "SHOPEE_FOOD"] }).default("OFFLINE_POS").notNull(),
  
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

// HQ PROJECTION METRICS
export const monthlyTargets = sqliteTable("monthly_target", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  monthYear: text("monthYear").notNull(), // Format: "YYYY-MM"
  salesTarget: integer("salesTarget").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// INVENTORY & SUPPLY ENGINE
export const inventoryItems = sqliteTable("inventory_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  itemName: text("itemName").notNull(),
  category: text("category").notNull().default("Raw Material"),
  unit: text("unit").notNull(), // e.g., 'kg', 'pcs', 'liters'
  currentStock: integer("currentStock").notNull().default(0),
  lowStockThreshold: integer("lowStockThreshold").notNull().default(10),
  costPerUnit: integer("costPerUnit").notNull().default(0),
  lastRestocked: integer("lastRestocked", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// DAILY LEDGER & CLOSING ENGINE
export const dailyLedgers = sqliteTable("daily_ledger", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // Format: "YYYY-MM-DD"
  totalSales: integer("totalSales").notNull().default(0), // Pulled from POS
  marketSpend: integer("marketSpend").notNull().default(0), // Morning petty cash spend
  status: text("status", { enum: ["OPEN", "CLOSED"] }).default("OPEN").notNull(),
  closedAt: integer("closedAt", { mode: "timestamp_ms" }),
});

export const dailyStockSnapshots = sqliteTable("daily_stock_snapshot", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ledgerId: text("ledgerId").notNull().references(() => dailyLedgers.id, { onDelete: "cascade" }),
  itemId: text("itemId").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  openingStock: integer("openingStock").notNull().default(0),
  purchased: integer("purchased").notNull().default(0), // Added during morning market run
  sold: integer("sold").notNull().default(0), // Auto-calculated from POS
  waste: integer("waste").notNull().default(0), // Dropped/spoiled
  closingStock: integer("closingStock").notNull().default(0),
});

// DEVICE REGISTRY ENGINE
export const branchDevices = sqliteTable("branch_device", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Main Cashier Tablet", "Kitchen Terminal"
  deviceToken: text("deviceToken").notNull().unique(),
  deviceType: text("deviceType", { enum: ["ALL_PURPOSE", "POS_TERMINAL", "ATTENDANCE_KIOSK"] }).default("ALL_PURPOSE").notNull(),
  deviceModel: text("deviceModel"), // e.g. "Samsung Galaxy Tab A8", "Apple iPad Air", "Windows 11 PC"
  ipAddress: text("ipAddress"),     // e.g. "192.168.18.81" or public IP
  browser: text("browser"),         // e.g. "Chrome 126", "Safari 17"
  isAuthorized: integer("isAuthorized", { mode: "boolean" }).default(true).notNull(),
  lastActiveAt: integer("lastActiveAt", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// QR AUTHENTICATION & ATTENDANCE SESSIONS
export const qrSessions = sqliteTable("qr_session", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurantId").references(() => restaurants.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["ATTENDANCE", "POS_LOGIN", "SWITCH_CASHIER"] }).default("ATTENDANCE").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "CONSUMED", "EXPIRED"] }).default("PENDING").notNull(),
  secretToken: text("secretToken").notNull(),
  shortCode: text("shortCode").notNull(), // 6-digit code for quick manual entry
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  userName: text("userName"),
  userRole: text("userRole"),
  attendanceType: text("attendanceType"), // "CLOCK_IN" or "CLOCK_OUT"
  clockTime: text("clockTime"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
});

