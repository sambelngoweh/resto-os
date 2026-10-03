# Resto-OS: AI Agent Context & Handoff Document

**To the next AI Agent working on this repository:** Please read this entire document to understand the project architecture, tech stack, and design decisions before making changes.

## 1. Project Overview
Resto-OS is a modern, multi-branch Food & Beverage Point of Sale (POS) and HR Management system. It is designed to handle multiple restaurant branches, role-based access control (Super Admin, Manager, Worker), automated payroll mapping, and integrated payments.

## 2. Tech Stack & Framework
* **Framework:** Next.js 15 (App Router)
* **Styling:** Tailwind CSS v4 (using `@custom-variant dark` in `globals.css`) + `next-themes` for Dark Mode.
* **Database:** SQLite (`local.db`) managed via Drizzle ORM (`drizzle-orm`, `drizzle-kit`).
* **Authentication:** NextAuth.js (Auth.js v5) with Google OAuth.
* **Payments:** Midtrans Node Client (QRIS integration).
* **Icons:** `lucide-react`.
* **Hardware Integrations:** Thermal printing (58mm via CSS `@media print`), WhatsApp sharing via Web Share API (`navigator.share`) & `html2canvas`.

## 3. Directory Structure
* `src/app/admin/...`: HQ Dashboard for Super Admins. Controls Global Menu pushing, global staff mapping, and branch creation.
* `src/app/branch/[id]/...`: The Branch Portal. Includes POS Terminal, Shift Scheduler, Team Roster, and Timeclock.
* `src/app/profile/...`: User profile settings (HR data like Bank Account, Phone, Address).
* `src/db/...`: Drizzle ORM schema (`schema.ts`) and initialization.
* `local.db`: The active local SQLite database.

## 4. Key Design Decisions & Nuances
1. **Device Authorization (Geofencing):** Workers cannot access the POS or Timeclock unless the device is authorized. This is handled via a 10-year cookie set by an Admin/Manager through `/branch/[id]?authorize=true`.
2. **NextAuth Email Workaround:** When mapping a worker *before* they sign in, we create a dummy email (`pending-[uuid]@unbound.local`). When the user signs in with Google, `bindStaffEmail` updates their row, preserving their assigned role.
3. **Dark Mode Architecture:** We use `next-themes` toggling a `.dark` class on the `<html>` element. Because we use Tailwind v4, standard `dark:` utilities require the custom variant injected in `src/app/globals.css`. 
4. **Midtrans QRIS:** Configured using the sandbox server key (`SB-Mid-server-h1_wg60TQ8U3G2qCrVQQ7j4M`). Modals hold the order in `PENDING` state until the webhook resolves it to `PAID`.

## 5. Outstanding / Pending Tasks
* **Cloudflare Migration:** The system currently runs on `better-sqlite3`. The user plans to deploy this to Cloudflare Pages and Cloudflare D1. The Drizzle config and DB initialization will need to be swapped to `@opensearch-project/opensearch` or `@cloudflare/d1` bindings.
* **HQ Analytics:** The Super Admin HQ Dashboard needs a Gross vs Net profit projection chart/widget.

## 6. Note on Repository Size
If the project folder looks massive (>1GB), it is entirely due to the `node_modules` (downloaded libraries) and `.next` (compiled cache) folders. The actual custom source code is very lightweight and efficiently written.
