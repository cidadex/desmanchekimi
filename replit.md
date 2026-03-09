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
- `server/routes.ts` — API routes (auth, users, orders, proposals, negotiations, reviews, auctions, invoices, documents, admin, file upload, chat)
- `server/storage.ts` — Drizzle ORM + SQLite database logic + seed data
- `client/src/App.tsx` — React app root with routes: `/`, `/como-funciona`, `/cadastro-desmanche`, `/cliente`, `/admin`, `/desmanche`
- `client/src/pages/CadastroDesmanche.tsx` — Full-page desmanche registration (benefits + 6-step wizard: company, responsible, address, logo, docs, access)
- `client/src/pages/ComoFunciona.tsx` — How-it-works marketing page for clients and desmanches with FAQ
- `client/src/pages/ClientDashboard.tsx` — Client panel (profile, orders, proposals, negotiations, chat)
- `client/src/components/chat/ChatTab.tsx` — Shared chat UI component (rooms list + messages) used by both client and desmanche panels
- `client/src/pages/AdminDashboard.tsx` — Admin panel (overview, desmanches, users, orders, approvals)
- `client/src/pages/DesmancheDashboard.tsx` — Desmanche panel (overview, orders, negotiations, docs, finance, profile)
- `client/src/components/client/CreateOrderWizard.tsx` — Multi-step order creation wizard (6 steps: vehicle type → vehicle details → part category → specific part + position → details/photos → review)
- `client/src/components/client/` — Client panel tab components
- `client/src/components/admin/` — Admin panel tab components (all connected to real API)
- `client/src/components/desmanche/` — Desmanche panel tab components
- `client/src/components/auth/` — LoginModal, RegisterModal (with document uploads for desmanches)
- `vite.config.ts` — Vite configuration (root: `client/`, host: `0.0.0.0`, allowedHosts: true)
- `shared/schema.ts` — Drizzle + Zod schemas shared between client and server

## Database Tables

users, addresses, desmanches, desmanche_addresses, documents, orders, order_images, proposals, negotiations, auctions, invoices, reviews

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
- Create/list/cancel orders
- View/accept/reject proposals from desmanches
- WhatsApp unlock for contacting desmanches
- Negotiations pipeline (negotiating -> shipped -> delivered -> completed)
- Review/rate desmanches after delivery

## Admin Panel Features (Fully Connected to API)

- Dashboard overview with real stats (users, desmanches, orders, pending approvals)
- Desmanches list with status filters, search, table view
- Users list with cards, search filter
- Orders list with status badges, search, filters
- Approvals: view pending desmanches with uploaded documents, approve/reject with reason
- Auctions and Finance tabs (still use mock data - no real endpoints yet)

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

### Admin
- GET /api/admin/users, /api/admin/orders, /api/admin/desmanches
- GET /api/dashboard/stats

### File Upload
- POST /api/upload (multipart, field "file")

## Deployment

- Target: autoscale
- Build: `npm run build`
- Run: `node dist/index.cjs`
