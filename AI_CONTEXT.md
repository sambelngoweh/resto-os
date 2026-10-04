# Resto-OS: Complete System Architecture & Handoff Guide

**To the next AI Agent working on this repository:**  
Please read this entire document before making modifications. Resto-OS is a production-grade multi-branch Food & Beverage POS and Restaurant Operating System with hardware fleet telemetry, QR authentication, Gacha shift scheduling, recipe depletion, and financial ledgering.

---

## 1. High-Level Architecture & Tech Stack

* **Framework:** Next.js 15 (App Router, Server Actions, React 19).
* **Styling:** Tailwind CSS v4 (using `@custom-variant dark` in `src/app/globals.css`) + `next-themes` for Dark/Light mode support.
* **Database:** SQLite (`local.db`) managed via Drizzle ORM (`better-sqlite3`, Drizzle ORM `drizzle-orm`).
* **Authentication:** NextAuth.js (Auth.js v5) with Google OAuth (`src/auth.ts`).
* **Hardware & Thermal Printing:** 58mm & 80mm thermal receipt printing via CSS `@media print`.
* **Exporting & Sharing:** HTML Canvas snapshot generation (`html2canvas`) and WhatsApp formatted copy text.
* **Network & Telemetry:** User-Agent hardware model extraction, client IP tracing, and persistent terminal cookie tokens (`device_auth_token`).

---

## 2. Directory Map

```text
src/
├── app/
│   ├── actions/
│   │   └── qrSessionActions.ts       # QR authentication engine, polling, cashier eligibility firewall
│   ├── admin/                         # Super Admin HQ Dashboard
│   │   ├── AdminDashboardClient.tsx   # Tabbed HQ UI (Fleet, Outlets, Staff, Menu)
│   │   ├── DeviceManagementSection.tsx# Hardware terminals, telemetry, remote termination, 1-click binding
│   │   ├── StaffManagementSection.tsx # Global staff roster, role assignment, Regular vs Shift Timer toggle
│   │   ├── BranchesSection.tsx        # Branch outlet management
│   │   ├── actions.ts                 # Super admin server actions
│   │   └── menu/                      # Global menu management & category groupings
│   ├── branch/[id]/                   # Branch Portal
│   │   ├── pos/                       # POS terminal, order cart, table management, thermal receipt modal
│   │   ├── scheduler/                 # Gacha Shift Scheduler (Weekly/Monthly fairness engine, WhatsApp export)
│   │   ├── team/                      # Staff roster, shift attendance payroll, Regular vs Shift Timer switch
│   │   ├── timeclock/                 # Worker self-service shift clock-in/out
│   │   ├── inventory/                 # Stock levels, unit measurements, low-stock alerts
│   │   ├── recipes/                   # Ingredient bill of materials (BOM) mapped to menu items
│   │   ├── closing/                   # Daily closing ledger, drawer cash reconciliation, shift audit
│   │   ├── projection/                # Labor cost vs revenue projections
│   │   └── deviceActions.ts           # Branch device authorization & token verification
│   ├── qr-auth/                       # Mobile phone authentication page for QR / short code scanning
│   ├── profile/                       # Staff HR personal profile (bank account, phone, emergency contact)
│   └── page.tsx                       # Landing page & quick terminal kiosk
├── components/
│   ├── TerminalQrModal.tsx            # POS modal displaying dynamic QR code & short code for login/attendance
│   └── ...
├── db/
│   └── schema.ts                      # Drizzle schema (users, restaurants, shifts, orders, branch_devices, etc.)
└── lib/
    ├── deviceAuth.ts                  # Device verification, telemetry parsing (iPad, Galaxy Tab, PC, IP)
    └── utils.ts
```

---

## 3. Database Schema Entities (`src/db/schema.ts`)

1. **`users` (`user` table):**
   * `id`, `name`, `email`, `role` (`"SUPER_ADMIN" | "MANAGER" | "WORKER"`).
   * `staffType` (`"REGULAR" | "SHIFT_TIMER"`):
     * `"REGULAR"`: Eligible for full 8h and part 6h shifts in general Gacha pool.
     * `"SHIFT_TIMER"`: Dedicated hourly workers. Eligible **only** for the special hourly rush shift (10:00 - 13:00).
   * `restaurantId`: Assigned branch ID (or null for floating/HQ).
   * HR Data: `phone`, `bankAccount`, `address`, `emergencyContact`.

2. **`shifts` (`shift` table):**
   * `id`, `restaurantId`, `userId`, `date` (YYYY-MM-DD).
   * `shiftType`:
     * `FULL_MORNING`: 07:00 – 15:00 (8h, Kasir, Rp 60.000).
     * `PART_MORNING`: 09:00 – 15:00 (6h, Kitchen, Rp 40.000).
     * `SPECIAL_MORNING`: 10:00 – 13:00 (3h @ Rp 6.000/jam = Rp 18.000, Kitchen/Support).
     * `FULL_EVENING`: 15:00 – 23:00 (8h, Kasir, Rp 60.000).
     * `PART_EVENING`: 15:00 – 21:00 (6h, Kitchen, Rp 40.000).
     * `MIDNIGHT`: 23:00 – 07:00 (8h, Kasir, Rp 60.000).
   * `assignedRole` (`"CASHIER" | "KITCHEN" | "SERVICE"`): Determines POS operating permissions.
   * `expectedPay` (integer in IDR): Base pay for the shift.
   * `status` (`"SCHEDULED" | "COMPLETED" | "ABSENT"`).
   * `clockInTime`, `clockOutTime`.

3. **`branch_devices` (`branch_devices` table):**
   * Hardware fleet oversight: `id`, `restaurantId`, `deviceName`, `deviceToken`, `deviceType` (`"POS" | "KITCHEN" | "ATTENDANCE" | "MANAGER"`).
   * Telemetry: `deviceModel` (e.g. "Apple iPad", "Samsung Galaxy Tab", "Windows PC"), `browser` (e.g. "Chrome 128"), `ipAddress` (IPv4), `lastActiveAt`, `isRevoked`.

4. **`qr_sessions` (`qr_sessions` table):**
   * Real-time mobile QR auth handshake: `id`, `restaurantId`, `deviceId`, `shortCode` (6-digit), `action` (`"POS_LOGIN" | "SWITCH_CASHIER" | "ATTENDANCE"`), `status` (`"PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"`), `authorizedUserId`.

5. **`orders`, `order_items`, `products`, `inventory_items`, `product_recipes`, `daily_closings`:**
   * Full transactional engine with recipe depletion upon order creation and end-of-day cash reconciliation.

---

## 4. Key Business Logic & Subsystems

### A. Gacha Shift Engine & Worker Pool Partitioning
* **Location:** [`src/app/branch/[id]/scheduler/actions.ts`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/app/branch/[id]/scheduler/actions.ts)
* **Rule:** Regular workers (`staffType: REGULAR`) are assigned to standard 8h and 6h shifts.
* **Rule:** Hourly rush shifts (`SPECIAL_MORNING`: 10:00 - 13:00) are drawn **strictly from `staffType: SHIFT_TIMER`** workers.
* **Fairness Algorithm:** Sorts available candidates by minimum shifts worked this week before rolling the tie-breaker Gacha.
* **Manager Role Toggle:** Managers can click `⇄ Change` on any scheduled shift card to toggle between `Kasir POS` and `Kitchen`.

### B. Dynamic QR POS Security Firewall
* **Location:** [`src/app/actions/qrSessionActions.ts`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/app/actions/qrSessionActions.ts) & [`src/app/qr-auth/QrAuthClient.tsx`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/app/qr-auth/QrAuthClient.tsx)
* **Eligibility Rule:**
  * Super Admins & Managers: Always eligible to authorize POS login.
  * Workers: Must have a scheduled shift for today where `assignedRole === "CASHIER"` (or fallback to full shift if assignedRole is unset).
  * Non-cashier workers (Kitchen/Service) scanning a POS Login QR are blocked (`🚫 POS Login Restricted (Not Cashier)`) and directed to Quick Attendance.
  * Quick Attendance (`ATTENDANCE`) is open to all active staff.

### C. Device Geofencing & Telemetry
* **Location:** [`src/lib/deviceAuth.ts`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/lib/deviceAuth.ts)
* POS terminals verify the `device_auth_token` cookie against `branch_devices`.
* Automatic User-Agent telemetry detects hardware models, browser versions, and network IP on every authorization.
* Super Admin can revoke any terminal instantly from `/admin` or 1-click bind an unlinked terminal slot to their active machine.

---

## 5. Development & Running

* Dev Server: `npm run dev` (Runs on `http://localhost:3000`).
* Database inspect: `local.db` (SQLite). Use Node scripts or `better-sqlite3` to query. In PowerShell, escape nested quotes or write temporary `.js` scripts.

---

## 6. Cloudflare D1 & Cloudflare Pages / Workers Migration Blueprint

**Crucial Insight for the Next AI Agent:**  
Resto-OS was deliberately engineered with SQLite and Drizzle ORM dialect (`dialect: 'sqlite'`). Cloudflare D1 is **native SQLite**, meaning all existing table definitions, types, relations, and SQL queries in [`src/db/schema.ts`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/db/schema.ts) are **100% compatible with Cloudflare D1 without altering schema syntax**.

### Step 1: Framework Adapter & Cloudflare Runtime
For Next.js 15 App Router, deploy using `@opennextjs/cloudflare` (the modern recommended Cloudflare deployment path):
```bash
npm install -D @opennextjs/cloudflare wrangler
```
Add `wrangler.jsonc` (or `wrangler.toml`):
```jsonc
{
  "name": "resto-os",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "resto-os-db",
      "database_id": "<YOUR-CLOUDFLARE-D1-DATABASE-ID>"
    }
  ]
}
```

### Step 2: Drizzle ORM Cloudflare D1 Adapter
Currently in [`src/db/index.ts`](file:///C:/Users/V14%20AMD%203020e%20DOS/.gemini/antigravity/scratch/resto-os/src/db/index.ts), `better-sqlite3` is used for local Node.js runtime.  
To support both local Node dev and Cloudflare D1 production:
```typescript
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Helper to acquire database connection
export function getDb(d1Binding?: any) {
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }
  
  // Local fallback (Node.js runtime / local test scripts)
  const Database = require('better-sqlite3');
  const sqlite = new Database('local.db');
  return drizzleSqlite(sqlite, { schema });
}

// In Cloudflare Worker / OpenNext, access via getRequestContext().env.DB or export:
export const db = getDb();
```

### Step 3: Database Creation & D1 Migrations
1. Create the D1 database on Cloudflare:
   ```bash
   npx wrangler d1 create resto-os-db
   ```
2. Generate migration SQL files using Drizzle Kit:
   ```bash
   npx drizzle-kit generate
   ```
3. Apply migration to local D1 preview:
   ```bash
   npx wrangler d1 execute resto-os-db --local --file=./drizzle/0000_*.sql
   ```
4. Apply migration to production Cloudflare D1:
   ```bash
   npx wrangler d1 execute resto-os-db --remote --file=./drizzle/0000_*.sql
   ```

### Step 4: Migrating Data from `local.db` to Remote D1
To export existing local branches, products, and user accounts to Cloudflare D1:
1. Export data from local SQLite:
   ```bash
   sqlite3 local.db .dump > dump.sql
   ```
2. Strip out SQLite internal tables (e.g. `sqlite_sequence`) and transaction headers if present.
3. Import into remote D1:
   ```bash
   npx wrangler d1 execute resto-os-db --remote --file=./dump.sql
   ```

### Step 5: NextAuth.js (Auth.js) on Cloudflare Workers
* Resto-OS uses `auth.ts` (NextAuth v5 beta).
* Ensure `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are configured as Cloudflare Secrets:
  ```bash
  npx wrangler secret put AUTH_SECRET
  npx wrangler secret put AUTH_GOOGLE_ID
  npx wrangler secret put AUTH_GOOGLE_SECRET
  npx wrangler secret put MIDTRANS_SERVER_KEY
  ```
* Web Crypto APIs (`crypto.randomUUID()`) are natively supported in Cloudflare Workers with `nodejs_compat`.

