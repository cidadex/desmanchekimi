import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, desc, asc, like, or, gte, lte, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const sqlite = new Database("./database.sqlite");
export const db = drizzle(sqlite, { schema });

// Inicializa as tabelas
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    password TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'client',
    avatar TEXT,
    profile_complete INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    zip_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT,
    complement TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS desmanches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    company_name TEXT NOT NULL,
    trading_name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    logo TEXT,
    plan TEXT NOT NULL DEFAULT 'percentage',
    status TEXT NOT NULL DEFAULT 'pending',
    rating REAL NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS desmanche_addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    zip_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT,
    complement TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    valid_until INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    vehicle_type TEXT,
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_plate TEXT,
    vehicle_color TEXT,
    vehicle_engine TEXT,
    part_category TEXT,
    part_name TEXT,
    part_position TEXT,
    part_condition_accepted TEXT DEFAULT 'any',
    city TEXT,
    state TEXT,
    client_id TEXT REFERENCES users(id),
    desmanche_id TEXT REFERENCES desmanches(id),
    posted_by_type TEXT NOT NULL DEFAULT 'client',
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    urgency TEXT NOT NULL DEFAULT 'normal',
    is_partner_request INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS order_images (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL REFERENCES orders(id),
    url TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL REFERENCES orders(id),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    price REAL NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    whatsapp_unlocked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS negotiations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id TEXT NOT NULL REFERENCES orders(id),
    proposal_id TEXT NOT NULL REFERENCES proposals(id),
    client_id TEXT NOT NULL REFERENCES users(id),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'negotiating',
    tracking_code TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    lot_count INTEGER NOT NULL,
    estimated_value REAL NOT NULL,
    end_time INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',
    url TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    month TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    negotiation_id TEXT NOT NULL REFERENCES negotiations(id),
    client_id TEXT NOT NULL REFERENCES users(id),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    proposal_id TEXT NOT NULL UNIQUE REFERENCES proposals(id),
    order_id TEXT NOT NULL REFERENCES orders(id),
    client_id TEXT NOT NULL REFERENCES users(id),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    last_message_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    room_id TEXT NOT NULL REFERENCES chat_rooms(id),
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    content TEXT NOT NULL,
    read_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    proposal_limit INTEGER NOT NULL DEFAULT 10,
    exclusivity_slots INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS desmanche_billing (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    desmanche_id TEXT NOT NULL UNIQUE REFERENCES desmanches(id),
    billing_model TEXT NOT NULL DEFAULT 'per_transaction',
    plan_id TEXT REFERENCES subscription_plans(id),
    monthly_transaction_count INTEGER NOT NULL DEFAULT 0,
    monthly_amount_paid REAL NOT NULL DEFAULT 0,
    current_period_start INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    asaas_customer_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS billing_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    desmanche_id TEXT NOT NULL REFERENCES desmanches(id),
    negotiation_id TEXT,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    type TEXT NOT NULL DEFAULT 'per_transaction',
    asaas_charge_id TEXT,
    payment_link TEXT,
    description TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    paid_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );
`);

// ── Migrate orders.client_id to be nullable (SQLite requires table rebuild) ──
try {
  const colInfo = sqlite.prepare("PRAGMA table_info(orders)").all() as any[];
  const clientIdCol = colInfo.find((c) => c.name === "client_id");
  if (clientIdCol && clientIdCol.notnull === 1) {
    sqlite.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS orders_rebuild (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        vehicle_type TEXT,
        vehicle_brand TEXT NOT NULL,
        vehicle_model TEXT NOT NULL,
        vehicle_year INTEGER NOT NULL,
        vehicle_plate TEXT,
        vehicle_color TEXT,
        vehicle_engine TEXT,
        part_category TEXT,
        part_name TEXT,
        part_position TEXT,
        part_condition_accepted TEXT DEFAULT 'any',
        city TEXT,
        state TEXT,
        client_id TEXT REFERENCES users(id),
        desmanche_id TEXT REFERENCES desmanches(id),
        posted_by_type TEXT NOT NULL DEFAULT 'client',
        location TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        urgency TEXT NOT NULL DEFAULT 'normal',
        is_partner_request INTEGER NOT NULL DEFAULT 0,
        expires_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      INSERT INTO orders_rebuild
        SELECT
          id, title, description,
          COALESCE(vehicle_type, NULL),
          vehicle_brand, vehicle_model, vehicle_year,
          COALESCE(vehicle_plate, NULL),
          COALESCE(vehicle_color, NULL),
          COALESCE(vehicle_engine, NULL),
          COALESCE(part_category, NULL),
          COALESCE(part_name, NULL),
          COALESCE(part_position, NULL),
          COALESCE(part_condition_accepted, 'any'),
          COALESCE(city, NULL),
          COALESCE(state, NULL),
          COALESCE(client_id, NULL),
          COALESCE(desmanche_id, NULL),
          COALESCE(posted_by_type, 'client'),
          location, status, urgency, is_partner_request,
          COALESCE(expires_at, NULL),
          created_at, updated_at
        FROM orders;
      DROP TABLE orders;
      ALTER TABLE orders_rebuild RENAME TO orders;
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
  }
} catch (e) {
  console.error("orders migration error (non-critical):", e);
}

// Migrate existing database - add new columns if they don't exist
try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN whatsapp TEXT`);
} catch (e) { /* column already exists */ }
try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN profile_complete INTEGER NOT NULL DEFAULT 0`);
} catch (e) { /* column already exists */ }
try {
  sqlite.exec(`ALTER TABLE desmanches ADD COLUMN responsible_name TEXT`);
} catch (e) { /* column already exists */ }
try {
  sqlite.exec(`ALTER TABLE desmanches ADD COLUMN responsible_cpf TEXT`);
} catch (e) { /* column already exists */ }
try {
  sqlite.exec(`ALTER TABLE desmanches ADD COLUMN rejection_reason TEXT`);
} catch (e) { /* column already exists */ }
sqlite.exec(`UPDATE desmanches SET plan = 'monthly' WHERE plan = 'percentage'`);
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN vehicle_type TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN vehicle_color TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN vehicle_engine TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN part_category TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN part_name TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN part_position TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN part_condition_accepted TEXT DEFAULT 'any'`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN city TEXT`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN state TEXT`); } catch (e) {}
// Desmanche ads: new columns
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN desmanche_id TEXT REFERENCES desmanches(id)`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN posted_by_type TEXT NOT NULL DEFAULT 'client'`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE orders ADD COLUMN expires_at INTEGER`); } catch (e) {}
// Negotiations: new columns for review gate
try { sqlite.exec(`ALTER TABLE negotiations ADD COLUMN received_at INTEGER`); } catch (e) {}
try { sqlite.exec(`ALTER TABLE negotiations ADD COLUMN review_deadline_at INTEGER`); } catch (e) {}
// Seed default system settings
const defaultSettings = [
  { key: 'reviewDeadlineDays', value: '10' },
  { key: 'maxOverdueBeforeBlock', value: '1' },
  { key: 'perTransactionAmount', value: '25' },
  { key: 'monthlyCapAmount', value: '200' },
];
for (const s of defaultSettings) {
  sqlite.exec(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('${s.key}', '${s.value}')`);
}
// Seed default subscription plans if none exist
const planCount = (sqlite.prepare('SELECT count(*) as c FROM subscription_plans').get() as any).c;
if (planCount === 0) {
  sqlite.exec(`
    INSERT INTO subscription_plans (id, name, price, proposal_limit, exclusivity_slots, description, active)
    VALUES
      (lower(hex(randomblob(16))), 'Plano Básico', 99.90, 20, 0, 'Responda até 20 pedidos por mês', 1),
      (lower(hex(randomblob(16))), 'Plano Plus', 199.90, 50, 5, 'Responda até 50 pedidos + 5 slots exclusivos', 1),
      (lower(hex(randomblob(16))), 'Plano Pro', 349.90, 999, 15, 'Propostas ilimitadas + 15 slots exclusivos', 1)
  `);
}

// Hash de senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==================== USERS ====================
export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
}

export async function createUser(userData: schema.InsertUser) {
  const hashedPassword = await hashPassword(userData.password);
  const id = randomUUID();
  
  await db.insert(schema.users).values({
    id,
    ...userData,
    password: hashedPassword,
  });
  
  return getUserById(id);
}

export async function getAllUsers() {
  return db.query.users.findMany({
    orderBy: desc(schema.users.createdAt),
  });
}

export async function updateUserProfile(id: string, data: { name?: string; phone?: string; whatsapp?: string; avatar?: string }) {
  await db.update(schema.users)
    .set(data)
    .where(eq(schema.users.id, id));
  return getUserById(id);
}

export async function setUserProfileComplete(id: string, complete: boolean) {
  await db.update(schema.users)
    .set({ profileComplete: complete })
    .where(eq(schema.users.id, id));
}

// ==================== ADDRESSES ====================
export async function getAddressByUserId(userId: string) {
  return db.query.addresses.findFirst({
    where: eq(schema.addresses.userId, userId),
  });
}

export async function createOrUpdateAddress(userId: string, data: {
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  city: string;
  state: string;
}) {
  const existing = await getAddressByUserId(userId);
  if (existing) {
    await db.update(schema.addresses)
      .set(data)
      .where(eq(schema.addresses.id, existing.id));
    return getAddressByUserId(userId);
  } else {
    const id = randomUUID();
    await db.insert(schema.addresses).values({ id, userId, ...data });
    return db.query.addresses.findFirst({ where: eq(schema.addresses.id, id) });
  }
}

// ==================== DESMANCHES ====================
export async function getDesmancheById(id: string) {
  return db.query.desmanches.findFirst({
    where: eq(schema.desmanches.id, id),
    with: {
      documents: true,
    },
  });
}

export async function getDesmancheByEmail(email: string) {
  return db.query.desmanches.findFirst({
    where: eq(schema.desmanches.email, email),
  });
}

export async function getDesmancheByCnpj(cnpj: string) {
  return db.query.desmanches.findFirst({
    where: eq(schema.desmanches.cnpj, cnpj),
  });
}

export async function createDesmanche(data: schema.InsertDesmanche) {
  const hashedPassword = await hashPassword(data.password);
  const id = randomUUID();
  
  await db.insert(schema.desmanches).values({
    id,
    ...data,
    password: hashedPassword,
  });
  
  return getDesmancheById(id);
}

export async function getAllDesmanches(filters?: { status?: string; plan?: string }) {
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(schema.desmanches.status, filters.status as any));
  }
  if (filters?.plan) {
    conditions.push(eq(schema.desmanches.plan, filters.plan as any));
  }
  
  return db.query.desmanches.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(schema.desmanches.createdAt),
  });
}

export async function updateDesmancheStatus(id: string, status: string, rejectionReason?: string) {
  const updateData: any = { status: status as any };
  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  if (status === 'active') {
    updateData.rejectionReason = null;
  }
  await db.update(schema.desmanches)
    .set(updateData)
    .where(eq(schema.desmanches.id, id));
  return getDesmancheById(id);
}

export async function updateDesmancheProfile(id: string, data: { tradingName?: string; phone?: string; responsibleName?: string; responsibleCpf?: string; logo?: string }) {
  await db.update(schema.desmanches)
    .set(data)
    .where(eq(schema.desmanches.id, id));
  return getDesmancheById(id);
}

export async function getDesmancheAddressByDesmancheId(desmancheId: string) {
  return db.query.desmancheAddresses.findFirst({
    where: eq(schema.desmancheAddresses.desmancheId, desmancheId),
  });
}

export async function createOrUpdateDesmancheAddress(desmancheId: string, data: {
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  city: string;
  state: string;
}) {
  const existing = await getDesmancheAddressByDesmancheId(desmancheId);
  if (existing) {
    await db.update(schema.desmancheAddresses)
      .set(data)
      .where(eq(schema.desmancheAddresses.id, existing.id));
    return getDesmancheAddressByDesmancheId(desmancheId);
  } else {
    const id = randomUUID();
    await db.insert(schema.desmancheAddresses).values({ id, desmancheId, ...data });
    return db.query.desmancheAddresses.findFirst({ where: eq(schema.desmancheAddresses.id, id) });
  }
}

export async function updateDesmancheRating(id: string, rating: number) {
  await db.update(schema.desmanches)
    .set({ rating })
    .where(eq(schema.desmanches.id, id));
  return getDesmancheById(id);
}

// ==================== DOCUMENTS ====================
export async function createDocument(data: schema.InsertDocument) {
  const id = randomUUID();
  await db.insert(schema.documents).values({ id, ...data });
  return db.query.documents.findFirst({ where: eq(schema.documents.id, id) });
}

export async function getDocumentsByDesmanche(desmancheId: string) {
  return db.query.documents.findMany({
    where: eq(schema.documents.desmancheId, desmancheId),
    orderBy: desc(schema.documents.createdAt),
  });
}

export async function updateDocumentStatus(id: string, status: string) {
  await db.update(schema.documents)
    .set({ status: status as any })
    .where(eq(schema.documents.id, id));
}

// ==================== ORDER IMAGES ====================
export async function createOrderImage(orderId: string, url: string) {
  const id = randomUUID();
  await db.insert(schema.orderImages).values({ id, orderId, url });
  return { id, orderId, url };
}

export async function getOrderImages(orderId: string) {
  return db.query.orderImages.findMany({
    where: eq(schema.orderImages.orderId, orderId),
  });
}

// ==================== ORDERS ====================
const THREE_DAYS_MS = 72 * 60 * 60 * 1000;

export async function createOrder(data: schema.InsertOrder & { clientId: string | null; desmancheId?: string }) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + THREE_DAYS_MS);
  await db.insert(schema.orders).values({ id, ...data, expiresAt });
  return getOrderById(id);
}

export async function reactivateOrder(orderId: string) {
  const expiresAt = new Date(Date.now() + THREE_DAYS_MS);
  await db.update(schema.orders)
    .set({ status: "open", expiresAt, updatedAt: sql`(strftime('%s', 'now'))` })
    .where(eq(schema.orders.id, orderId));
  return getOrderById(orderId);
}

export async function expireOldOrders() {
  const now = new Date();
  await db.update(schema.orders)
    .set({ status: "expired", updatedAt: sql`(strftime('%s', 'now'))` })
    .where(
      and(
        sql`${schema.orders.expiresAt} IS NOT NULL`,
        lte(schema.orders.expiresAt, now),
        sql`${schema.orders.status} IN ('open', 'negotiating')`
      )
    );
}

export async function getOrdersByDesmanche(desmancheId: string) {
  return db.query.orders.findMany({
    where: eq(schema.orders.desmancheId, desmancheId),
    orderBy: desc(schema.orders.createdAt),
    with: {
      images: true,
      proposals: {
        with: {
          desmanche: true,
        },
      },
    },
  });
}

export async function getOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
    with: {
      images: true,
      proposals: {
        with: {
          desmanche: true,
        },
      },
    },
  });
}

export async function getOrdersByClient(clientId: string) {
  return db.query.orders.findMany({
    where: and(
      eq(schema.orders.clientId, clientId),
      eq(schema.orders.postedByType, "client")
    ),
    orderBy: desc(schema.orders.createdAt),
    with: {
      images: true,
      proposals: {
        with: {
          desmanche: true,
        },
      },
    },
  });
}

export async function getAllOrders(filters?: { status?: string; urgency?: string; isPartnerRequest?: boolean; includeExpired?: boolean }) {
  let conditions: any[] = [];
  
  if (filters?.status) {
    conditions.push(eq(schema.orders.status, filters.status as any));
  } else if (!filters?.includeExpired) {
    conditions.push(sql`${schema.orders.status} != 'expired'`);
  }
  if (filters?.urgency) {
    conditions.push(eq(schema.orders.urgency, filters.urgency as any));
  }
  if (filters?.isPartnerRequest !== undefined) {
    conditions.push(eq(schema.orders.isPartnerRequest, filters.isPartnerRequest));
  }
  
  return db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(schema.orders.createdAt),
    with: {
      client: true,
      desmanche: true,
      images: true,
      proposals: {
        with: {
          desmanche: true,
        },
      },
    },
  });
}

export async function updateOrderStatus(id: string, status: string) {
  await db.update(schema.orders)
    .set({ 
      status: status as any,
      updatedAt: sql`(strftime('%s', 'now'))`,
    })
    .where(eq(schema.orders.id, id));
  return getOrderById(id);
}

// ==================== PROPOSALS ====================
export async function createProposal(data: schema.InsertProposal) {
  const id = randomUUID();
  await db.insert(schema.proposals).values({ id, ...data });
  return getProposalById(id);
}

export async function getProposalById(id: string) {
  return db.query.proposals.findFirst({
    where: eq(schema.proposals.id, id),
    with: {
      desmanche: true,
      order: true,
    },
  });
}

export async function getProposalsByOrder(orderId: string) {
  return db.query.proposals.findMany({
    where: eq(schema.proposals.orderId, orderId),
    orderBy: desc(schema.proposals.createdAt),
    with: {
      desmanche: true,
    },
  });
}

export async function getProposalsByDesmanche(desmancheId: string) {
  return db.query.proposals.findMany({
    where: eq(schema.proposals.desmancheId, desmancheId),
    orderBy: desc(schema.proposals.createdAt),
    with: {
      order: true,
    },
  });
}

export async function updateProposalStatus(id: string, status: string) {
  await db.update(schema.proposals)
    .set({ status: status as any })
    .where(eq(schema.proposals.id, id));
  return getProposalById(id);
}

export async function unlockWhatsapp(id: string) {
  await db.update(schema.proposals)
    .set({ whatsappUnlocked: true })
    .where(eq(schema.proposals.id, id));
  return getProposalById(id);
}

// ==================== NEGOTIATIONS ====================
export async function createNegotiation(data: {
  orderId: string;
  proposalId: string;
  clientId: string;
  desmancheId: string;
  price: number;
}) {
  const id = randomUUID();
  await db.insert(schema.negotiations).values({ id, ...data, status: 'negotiating' });
  return getNegotiationById(id);
}

export async function getNegotiationById(id: string) {
  return db.query.negotiations.findFirst({
    where: eq(schema.negotiations.id, id),
    with: {
      order: true,
      desmanche: true,
    },
  });
}

export async function getNegotiationsByClient(clientId: string) {
  return db.query.negotiations.findMany({
    where: eq(schema.negotiations.clientId, clientId),
    orderBy: desc(schema.negotiations.createdAt),
    with: {
      order: true,
      desmanche: true,
    },
  });
}

export async function getNegotiationsByDesmanche(desmancheId: string) {
  return db.query.negotiations.findMany({
    where: eq(schema.negotiations.desmancheId, desmancheId),
    orderBy: desc(schema.negotiations.createdAt),
    with: {
      order: true,
      client: true,
      proposal: true,
    },
  });
}

export async function updateNegotiationStatus(id: string, status: string, trackingCode?: string) {
  const updateData: any = { 
    status: status as any,
    updatedAt: sql`(strftime('%s', 'now'))`,
  };
  if (trackingCode) {
    updateData.trackingCode = trackingCode;
  }
  
  await db.update(schema.negotiations)
    .set(updateData)
    .where(eq(schema.negotiations.id, id));
  return getNegotiationById(id);
}

// ==================== AUCTIONS ====================
export async function createAuction(data: schema.InsertAuction) {
  const id = randomUUID();
  await db.insert(schema.auctions).values({ id, ...data });
  return db.query.auctions.findFirst({ where: eq(schema.auctions.id, id) });
}

export async function getAllAuctions(filters?: { status?: string }) {
  return db.query.auctions.findMany({
    where: filters?.status ? eq(schema.auctions.status, filters.status as any) : undefined,
    orderBy: desc(schema.auctions.createdAt),
  });
}

export async function updateAuctionStatus(id: string, status: string) {
  await db.update(schema.auctions)
    .set({ status: status as any })
    .where(eq(schema.auctions.id, id));
}

// ==================== INVOICES ====================
export async function createInvoice(data: schema.InsertInvoice) {
  const id = randomUUID();
  await db.insert(schema.invoices).values({ id, ...data });
  return db.query.invoices.findFirst({ where: eq(schema.invoices.id, id) });
}

export async function getInvoicesByDesmanche(desmancheId: string) {
  return db.query.invoices.findMany({
    where: eq(schema.invoices.desmancheId, desmancheId),
    orderBy: desc(schema.invoices.createdAt),
  });
}

export async function getAllInvoices() {
  return db.query.invoices.findMany({
    orderBy: desc(schema.invoices.createdAt),
    with: {
      desmanche: true,
    },
  });
}

export async function updateInvoiceStatus(id: string, status: string) {
  await db.update(schema.invoices)
    .set({ status: status as any })
    .where(eq(schema.invoices.id, id));
}

// ==================== REVIEWS ====================
export async function createReview(data: schema.InsertReview) {
  const id = randomUUID();
  await db.insert(schema.reviews).values({ id, ...data });
  return db.query.reviews.findFirst({ where: eq(schema.reviews.id, id) });
}

export async function getReviewsByDesmanche(desmancheId: string) {
  return db.query.reviews.findMany({
    where: eq(schema.reviews.desmancheId, desmancheId),
    orderBy: desc(schema.reviews.createdAt),
  });
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats() {
  const usersCount = await db.select({ count: schema.users.id }).from(schema.users);
  const desmanchesCount = await db.select({ count: schema.desmanches.id }).from(schema.desmanches);
  const ordersCount = await db.select({ count: schema.orders.id }).from(schema.orders);
  const activeDesmanches = await db.select({ count: schema.desmanches.id })
    .from(schema.desmanches)
    .where(eq(schema.desmanches.status, 'active'));
  
  const pendingApprovals = await db.select({ count: schema.desmanches.id })
    .from(schema.desmanches)
    .where(eq(schema.desmanches.status, 'pending'));
  
  const openOrders = await db.select({ count: schema.orders.id })
    .from(schema.orders)
    .where(eq(schema.orders.status, 'open'));
  
  return {
    totalUsers: usersCount[0]?.count || 0,
    totalDesmanches: desmanchesCount[0]?.count || 0,
    totalOrders: ordersCount[0]?.count || 0,
    activeDesmanches: activeDesmanches[0]?.count || 0,
    pendingApprovals: pendingApprovals[0]?.count || 0,
    openOrders: openOrders[0]?.count || 0,
  };
}

// ==================== CHAT ====================
export async function createChatRoom(data: {
  proposalId: string;
  orderId: string;
  clientId: string;
  desmancheId: string;
}) {
  const id = randomUUID();
  await db.insert(schema.chatRooms).values({ id, ...data });
  return getChatRoomById(id);
}

export async function getChatRoomById(id: string) {
  return db.query.chatRooms.findFirst({
    where: eq(schema.chatRooms.id, id),
    with: {
      proposal: true,
      order: true,
      client: true,
      desmanche: true,
      messages: {
        orderBy: desc(schema.chatMessages.createdAt),
        limit: 1,
      },
    },
  });
}

export async function getChatRoomByProposal(proposalId: string) {
  return db.query.chatRooms.findFirst({
    where: eq(schema.chatRooms.proposalId, proposalId),
  });
}

export async function getChatRoomsByClient(clientId: string) {
  return db.query.chatRooms.findMany({
    where: eq(schema.chatRooms.clientId, clientId),
    orderBy: [desc(schema.chatRooms.lastMessageAt), desc(schema.chatRooms.createdAt)],
    with: {
      order: true,
      desmanche: true,
      messages: {
        orderBy: desc(schema.chatMessages.createdAt),
        limit: 1,
      },
    },
  });
}

export async function getChatRoomsByDesmanche(desmancheId: string) {
  return db.query.chatRooms.findMany({
    where: eq(schema.chatRooms.desmancheId, desmancheId),
    orderBy: [desc(schema.chatRooms.lastMessageAt), desc(schema.chatRooms.createdAt)],
    with: {
      order: true,
      client: true,
      messages: {
        orderBy: desc(schema.chatMessages.createdAt),
        limit: 1,
      },
    },
  });
}

export async function getMessagesByRoom(roomId: string) {
  return db.query.chatMessages.findMany({
    where: eq(schema.chatMessages.roomId, roomId),
    orderBy: asc(schema.chatMessages.createdAt),
  });
}

export async function createChatMessage(data: {
  roomId: string;
  senderId: string;
  senderType: "client" | "desmanche";
  content: string;
}) {
  const id = randomUUID();
  await db.insert(schema.chatMessages).values({ id, ...data });
  await db.update(schema.chatRooms)
    .set({ lastMessageAt: sql`(strftime('%s', 'now'))` })
    .where(eq(schema.chatRooms.id, data.roomId));
  return db.query.chatMessages.findFirst({ where: eq(schema.chatMessages.id, id) });
}

export async function markRoomMessagesAsRead(roomId: string, readerId: string) {
  await db.update(schema.chatMessages)
    .set({ readAt: sql`(strftime('%s', 'now'))` })
    .where(
      and(
        eq(schema.chatMessages.roomId, roomId),
        sql`${schema.chatMessages.senderId} != ${readerId}`,
        sql`${schema.chatMessages.readAt} IS NULL`,
      )
    );
}

export async function countUnreadMessages(roomId: string, readerId: string) {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.chatMessages)
    .where(
      and(
        eq(schema.chatMessages.roomId, roomId),
        sql`${schema.chatMessages.senderId} != ${readerId}`,
        sql`${schema.chatMessages.readAt} IS NULL`,
      )
    );
  return result[0]?.count || 0;
}

// ==================== SYSTEM SETTINGS ====================
export async function getSystemSetting(key: string): Promise<string | null> {
  const row = await db.query.systemSettings.findFirst({
    where: eq(schema.systemSettings.key, key),
  });
  return row?.value ?? null;
}

export async function getSystemSettingNumber(key: string, fallback: number): Promise<number> {
  const v = await getSystemSetting(key);
  if (!v) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

export async function getAllSystemSettings() {
  return db.query.systemSettings.findMany();
}

export async function setSystemSetting(key: string, value: string) {
  await db.insert(schema.systemSettings)
    .values({ key, value, updatedAt: sql`(strftime('%s', 'now'))` })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value, updatedAt: sql`(strftime('%s', 'now'))` } });
}

// ==================== SUBSCRIPTION PLANS ====================
export async function getAllSubscriptionPlans(onlyActive = false) {
  return db.query.subscriptionPlans.findMany({
    where: onlyActive ? eq(schema.subscriptionPlans.active, true) : undefined,
    orderBy: asc(schema.subscriptionPlans.price),
  });
}

export async function getSubscriptionPlanById(id: string) {
  return db.query.subscriptionPlans.findFirst({
    where: eq(schema.subscriptionPlans.id, id),
  });
}

export async function createSubscriptionPlan(data: schema.InsertSubscriptionPlan) {
  const id = randomUUID();
  await db.insert(schema.subscriptionPlans).values({ id, ...data });
  return getSubscriptionPlanById(id);
}

export async function updateSubscriptionPlan(id: string, data: Partial<schema.InsertSubscriptionPlan>) {
  await db.update(schema.subscriptionPlans).set(data).where(eq(schema.subscriptionPlans.id, id));
  return getSubscriptionPlanById(id);
}

export async function deleteSubscriptionPlan(id: string) {
  await db.delete(schema.subscriptionPlans).where(eq(schema.subscriptionPlans.id, id));
}

// ==================== DESMANCHE BILLING ====================
export async function getDesmancheBilling(desmancheId: string) {
  return db.query.desmancheBilling.findFirst({
    where: eq(schema.desmancheBilling.desmancheId, desmancheId),
    with: { plan: true },
  });
}

export async function createOrUpdateDesmancheBilling(desmancheId: string, data: {
  billingModel: "subscription" | "per_transaction";
  planId?: string | null;
  asaasCustomerId?: string;
}) {
  const existing = await getDesmancheBilling(desmancheId);
  if (existing) {
    await db.update(schema.desmancheBilling)
      .set({ billingModel: data.billingModel, planId: data.planId ?? null, ...(data.asaasCustomerId ? { asaasCustomerId: data.asaasCustomerId } : {}) })
      .where(eq(schema.desmancheBilling.desmancheId, desmancheId));
  } else {
    const id = randomUUID();
    await db.insert(schema.desmancheBilling).values({
      id,
      desmancheId,
      billingModel: data.billingModel,
      planId: data.planId ?? null,
      asaasCustomerId: data.asaasCustomerId,
      currentPeriodStart: sql`(strftime('%s', 'now'))`,
    });
  }
  return getDesmancheBilling(desmancheId);
}

export async function incrementBillingTransaction(desmancheId: string, amount: number) {
  await db.update(schema.desmancheBilling)
    .set({
      monthlyTransactionCount: sql`monthly_transaction_count + 1`,
      monthlyAmountPaid: sql`monthly_amount_paid + ${amount}`,
    })
    .where(eq(schema.desmancheBilling.desmancheId, desmancheId));
}

export async function resetMonthlyBillingCounters(desmancheId: string) {
  await db.update(schema.desmancheBilling)
    .set({
      monthlyTransactionCount: 0,
      monthlyAmountPaid: 0,
      currentPeriodStart: sql`(strftime('%s', 'now'))`,
    })
    .where(eq(schema.desmancheBilling.desmancheId, desmancheId));
}

// ==================== BILLING TRANSACTIONS ====================
export async function getBillingTransactionsByDesmanche(desmancheId: string) {
  return db.query.billingTransactions.findMany({
    where: eq(schema.billingTransactions.desmancheId, desmancheId),
    orderBy: desc(schema.billingTransactions.createdAt),
  });
}

export async function getAllBillingTransactions() {
  return db.query.billingTransactions.findMany({
    orderBy: desc(schema.billingTransactions.createdAt),
    with: { desmanche: true },
  });
}

export async function createBillingTransaction(data: {
  desmancheId: string;
  negotiationId?: string;
  amount: number;
  type: "per_transaction" | "subscription";
  description?: string;
  asaasChargeId?: string;
  paymentLink?: string;
  status?: "pending" | "paid" | "failed" | "exempt";
}) {
  const id = randomUUID();
  await db.insert(schema.billingTransactions).values({
    id,
    desmancheId: data.desmancheId,
    negotiationId: data.negotiationId,
    amount: data.amount,
    type: data.type,
    description: data.description,
    asaasChargeId: data.asaasChargeId,
    paymentLink: data.paymentLink,
    status: data.status ?? "pending",
  });
  return db.query.billingTransactions.findFirst({ where: eq(schema.billingTransactions.id, id) });
}

export async function updateBillingTransactionStatus(id: string, status: "pending" | "paid" | "failed" | "exempt", asaasChargeId?: string, paymentLink?: string) {
  const updateData: any = { status };
  if (asaasChargeId) updateData.asaasChargeId = asaasChargeId;
  if (paymentLink) updateData.paymentLink = paymentLink;
  if (status === "paid") updateData.paidAt = sql`(strftime('%s', 'now'))`;
  await db.update(schema.billingTransactions).set(updateData).where(eq(schema.billingTransactions.id, id));
}

// ==================== REVIEW GATE / BLOCKING ====================
export async function getOverdueReviewCountForClient(clientId: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.negotiations)
    .where(
      and(
        eq(schema.negotiations.clientId, clientId),
        eq(schema.negotiations.status, 'awaiting_review'),
        sql`${schema.negotiations.reviewDeadlineAt} IS NOT NULL`,
        sql`${schema.negotiations.reviewDeadlineAt} < ${now}`,
      )
    );
  return result[0]?.count || 0;
}

export async function getOverdueReviewCountForDesmanche(desmancheId: string): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.negotiations)
    .where(
      and(
        eq(schema.negotiations.desmancheId, desmancheId),
        eq(schema.negotiations.status, 'awaiting_review'),
        sql`${schema.negotiations.reviewDeadlineAt} IS NOT NULL`,
        sql`${schema.negotiations.reviewDeadlineAt} < ${now}`,
      )
    );
  return result[0]?.count || 0;
}

export async function getPendingReviewsForClient(clientId: string) {
  return db.query.negotiations.findMany({
    where: and(
      eq(schema.negotiations.clientId, clientId),
      eq(schema.negotiations.status, 'awaiting_review'),
    ),
    with: { order: true, desmanche: true },
  });
}

export async function autoExpireOverdueReviews() {
  const now = Math.floor(Date.now() / 1000);
  await db.update(schema.negotiations)
    .set({ status: 'completed', updatedAt: sql`(strftime('%s', 'now'))` })
    .where(
      and(
        eq(schema.negotiations.status, 'awaiting_review'),
        sql`${schema.negotiations.reviewDeadlineAt} IS NOT NULL`,
        sql`${schema.negotiations.reviewDeadlineAt} < ${now}`,
      )
    );
}

export async function setNegotiationReceived(id: string, reviewDeadlineDays: number) {
  const now = Math.floor(Date.now() / 1000);
  const deadlineTs = now + (reviewDeadlineDays * 24 * 60 * 60);
  await db.update(schema.negotiations)
    .set({
      status: 'awaiting_review',
      receivedAt: sql`(strftime('%s', 'now'))`,
      reviewDeadlineAt: deadlineTs,
      updatedAt: sql`(strftime('%s', 'now'))`,
    })
    .where(eq(schema.negotiations.id, id));
  return getNegotiationById(id);
}

// ==================== SEED DATA ====================
export async function seedDatabase() {
  // Verifica se já existe admin
  const admin = await getUserByEmail('admin@centraldesmanches.com');
  if (!admin) {
    await createUser({
      name: 'Administrador',
      email: 'admin@centraldesmanches.com',
      phone: '(11) 99999-9999',
      password: 'admin123',
      type: 'admin',
    });
    console.log('Admin criado: admin@centraldesmanches.com / admin123');
  }
  
  // Verifica se já existe desmanche
  const desmanche = await getDesmancheByEmail('contato@irmaossilva.com');
  if (!desmanche) {
    const newDesmanche = await createDesmanche({
      companyName: 'Desmanche Irmãos Silva Ltda',
      tradingName: 'Irmãos Silva',
      cnpj: '98.765.432/0001-10',
      email: 'contato@irmaossilva.com',
      phone: '(11) 98888-5555',
      password: 'desmanche123',
      plan: 'percentage',
    });
    
    if (newDesmanche) {
      await updateDesmancheStatus(newDesmanche.id, 'active');
      
      // Adiciona documentos
      await createDocument({
        desmancheId: newDesmanche.id,
        type: 'alvara',
        name: 'Alvará de Funcionamento',
        url: '/docs/alvara.pdf',
        validUntil: new Date('2026-04-15'),
      });
      
      await createDocument({
        desmancheId: newDesmanche.id,
        type: 'credenciamento_detran',
        name: 'Credenciamento Detran',
        url: '/docs/credenciamento.pdf',
        validUntil: new Date('2026-12-10'),
      });
      
      console.log('Desmanche criado: contato@irmaossilva.com / desmanche123');
    }
  }
  
  // Verifica se já existe cliente
  const client = await getUserByEmail('cliente@email.com');
  if (!client) {
    await createUser({
      name: 'Carlos Eduardo',
      email: 'cliente@email.com',
      phone: '(11) 98888-7777',
      password: 'cliente123',
      type: 'client',
    });
    console.log('Cliente criado: cliente@email.com / cliente123');
  }
  
  // Cria alguns leilões
  const auctions = await getAllAuctions();
  if (auctions.length === 0) {
    await createAuction({
      title: 'Leilão Detran/SP - Lote Veículos Inteiros',
      source: 'Detran SP',
      lotCount: 450,
      estimatedValue: 1200000,
      endTime: new Date(Date.now() + 7200 * 1000), // 2 horas
      status: 'live',
      url: 'https://leiloes.detran.sp.gov.br',
    });
    
    await createAuction({
      title: 'Sucatas e Peças Aproveitáveis - Seguradora',
      source: 'Seguradora XYZ',
      lotCount: 120,
      estimatedValue: 450000,
      endTime: new Date(Date.now() + 86400 * 1000), // 24 horas
      status: 'upcoming',
      url: 'https://leiloes.seguradora.com',
    });
    
    console.log('Leilões de exemplo criados');
  }
}
