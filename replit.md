# Central dos Desmanches

A marketplace/leads platform connecting accredited vehicle dismantling facilities (ferro-velhos) with customers, workshops, and other dismantling businesses for automotive, nautical, and aeronautic parts.

## Architecture

- **Frontend**: React 19 + TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, TanStack Query, wouter routing
- **Backend**: Express.js 5 + TypeScript (tsx in dev), JWT auth, WebSockets (ws), multer (file uploads)
- **Database**: SQLite via Drizzle ORM (better-sqlite3)
- **Monorepo layout**: `client/` (frontend), `server/` (backend), `shared/` (shared schemas/types)

## Running the App

The Express server serves both the API and the Vite dev client on **port 5000** via a single process.

```bash
npm run dev       # Development (tsx server/index.ts)
npm run build     # Production build (esbuild + Vite)
npm start         # Run production build
```

## Key Files

- `server/index.ts` — Express app entry point
- `server/routes.ts` — API routes (auth, users, orders, proposals, negotiations, reviews, auctions, invoices, documents, admin, file upload, chat, email verification, password reset, site settings, brand logos)
- `server/storage.ts` — Drizzle ORM + SQLite database logic + seed data
- `server/email.ts` — Nodemailer email utility (SMTP via env vars; falls back to console logging in dev)
- `client/src/App.tsx` — React app root with routes: `/`, `/como-funciona`, `/cadastro-desmanche`, `/cliente`, `/admin`, `/desmanche`, `/verificar-email`, `/redefinir-senha`
- `client/src/pages/CadastroDesmanche.tsx` — Full-page desmanche registration (benefits + 6-step wizard: company, responsible, address, logo, docs, access)
- `client/src/pages/ComoFunciona.tsx` — How-it-works marketing page for clients and desmanches with FAQ
- `client/src/pages/ClientDashboard.tsx` — Client panel (profile, orders, proposals, negotiations, chat)
- `client/src/components/chat/ChatTab.tsx` — Shared chat UI component (rooms list + messages) used by both client and desmanche panels
- `client/src/pages/AdminDashboard.tsx` — Admin panel (overview, desmanches, users, orders, approvals, complaints, permissions)
- `client/src/pages/DesmancheDashboard.tsx` — Desmanche panel (overview, orders, negotiations, docs, finance, profile)
- `client/src/components/client/CreateOrderWizard.tsx` — Multi-step order creation wizard (6 steps: vehicle type → vehicle details → part category → specific part + position → details/photos → review)
- `client/src/components/client/` — Client panel tab components
- `client/src/components/admin/` — Admin panel tab components (all connected to real API)
- `client/src/components/desmanche/` — Desmanche panel tab components
- `client/src/components/auth/` — LoginModal, RegisterModal (with document uploads for desmanches)
- `vite.config.ts` — Vite configuration (root: `client/`, host: `0.0.0.0`, allowedHosts: true)
- `shared/schema.ts` — Drizzle + Zod schemas shared between client and server

## Multi-Item Order Architecture

Orders are "carts" — each order contains one or more `order_items`, where each item can be for a different vehicle type. Key principles:
- Each `order_item` routes independently to matching desmanches based on its `vehicleType`
- Proposals, negotiations, and images attach to the `order_item` (via `orderItemId` FK), not just the order
- Items have their own `status` lifecycle: open → has_proposals → negotiating → closed/completed/cancelled/expired
- In `DesmancheOrdersTab`, orders are flattened to individual items and filtered by desmanche's `vehicleTypes`
- `CreateOrderWizard` lets clients add multiple items (different vehicles/parts) in one request

## Database Tables

users, addresses, desmanches, desmanche_addresses, documents, orders, order_items, order_images, proposals, negotiations, auctions, invoices, reviews, subscription_plans, desmanche_billing, billing_transactions, system_settings, site_settings, brand_logos

### users Table Extra Columns (added via ALTER TABLE)
- `email_verified` INTEGER DEFAULT 0 — must be 1 to create orders (TEMP: backend check commented out in routes.ts line ~639 for testing; re-enable after launch)
- `email_verification_token` TEXT — 24h verification token sent on register
- `email_verification_expires` INTEGER — unix timestamp
- `password_reset_token` TEXT — 1h reset token sent on forgot-password
- `password_reset_expires` INTEGER — unix timestamp

### Desmanches Table Fields
- companyName, tradingName, cnpj, email, phone, password
- responsibleName, responsibleCpf (responsible person info)
- logo, plan (percentage/monthly), status (pending/active/inactive/rejected)
- rejectionReason, rating, salesCount

### Documents Table Types
- alvara (Alvará de Funcionamento)
- credenciamento_detran (Credenciamento Detran)
- contrato_social (Contrato Social)
- documento_responsavel (Documento do Responsável)
- documento_empresa (Documento da Empresa)

## File Uploads

Files are uploaded via `POST /api/upload` (multipart, field "file") and stored in `/uploads/` directory. Served statically at `/uploads/filename`.

## Client Panel Features (Fully Connected to API)

- Profile completion (name, phone, whatsapp, address with CEP auto-fill)
- Profile completeness check (whatsapp + address required to create orders)
- Create/list/cancel orders (blocked if has overdue reviews)
- View/accept/reject proposals from desmanches
- WhatsApp unlock for contacting desmanches
- Negotiations pipeline: negotiating → shipped → awaiting_review → completed
- Confirm receipt (PATCH /received) starts review deadline countdown
- Review gate with countdown timer (days/hours until deadline)
- Block banner shown when reviews are overdue
- Review/rate desmanches triggers billing and auto-completes negotiation

## Admin Panel Features (Fully Connected to API)

- Dashboard overview with real stats (users, desmanches, orders, pending approvals)
- Desmanches list with status filters, search, table view
- Users list with cards, search filter
- Orders list with status badges, search, filters
- Approvals: view pending desmanches with uploaded documents, approve/reject with reason
- Finance tab: real billing data (transactions, totals, plan list)
- Plans tab: full CRUD for subscription plans (name, price, limits, active toggle)
- Settings tab: system config (review deadline days, overdue block threshold, per-tx amount, monthly cap)

## Desmanche Registration Flow

1. User fills form: company info, responsible person (name + CPF), contact, plan
2. User uploads 3 required documents: Alvará, Doc do Responsável, Doc da Empresa
3. Account is created with status "pending"
4. Files are uploaded and registered as documents in DB
5. Admin reviews and approves/rejects from the Approvals tab

## Default Credentials (seeded)

- Admin: `admin@centraldesmanches.com` / `admin123`
- Desmanche: `contato@irmaossilva.com` / `desmanche123` (status: active)
- Cliente (Carlos Eduardo): `cliente@email.com` / `cliente123`
- Cliente (DEBORA - tem pedidos): `recriarme@gmail.com` / `debora123`

## API Endpoints

### Auth
- POST /api/auth/login, /api/auth/login-desmanche
- POST /api/auth/register, /api/auth/register-desmanche

### Users
- GET /api/users/me, PATCH /api/users/me
- GET /api/users/me/address, PUT /api/users/me/address

### Desmanches
- GET /api/desmanches, GET /api/desmanches/:id
- PATCH /api/desmanches/me (update profile)
- GET /api/desmanches/me/address, PUT /api/desmanches/me/address
- PATCH /api/desmanches/:id/status (admin only, accepts rejectionReason)

### Orders, Proposals, Negotiations, Documents, Reviews, Auctions, Invoices
- Standard CRUD with auth middleware

### Negotiations (new)
- PATCH /api/negotiations/:id/ship — desmanche marks as shipped (with trackingCode)
- PATCH /api/negotiations/:id/received — client confirms receipt, starts review deadline
- GET /api/client/review-block-status — client check if blocked by overdue reviews
- GET /api/desmanche/review-block-status — desmanche check if blocked

### Billing / Asaas
- GET /api/billing/my — desmanche billing info + transactions
- POST /api/billing/setup — configure billing model (per_transaction | subscription)
- POST /api/billing/webhook — Asaas webhook receiver

### Subscription Plans (admin)
- GET /api/subscription-plans — list plans (admin sees all, others see active only)
- POST /api/subscription-plans — create plan
- PATCH /api/subscription-plans/:id — update plan
- DELETE /api/subscription-plans/:id — delete plan

### System Settings (admin)
- GET /api/admin/settings — all system settings as key/value
- PATCH /api/admin/settings — update settings (reviewDeadlineDays, maxOverdueBeforeBlock, perTransactionAmount, monthlyCapAmount)
- GET /api/admin/billing — all transactions + totals + plans

### Admin
- GET /api/admin/users, /api/admin/orders, /api/admin/desmanches
- GET /api/dashboard/stats

### File Upload
- POST /api/upload (multipart, field "file")

## Deployment

- Target: autoscale
- Build: `npm run build`
- Run: `node dist/index.cjs`
