import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela de Usuários (Clientes e Admins)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  password: text("password").notNull(),
  type: text("type", { enum: ["client", "admin"] }).notNull().default("client"),
  avatar: text("avatar"),
  profileComplete: integer("profile_complete", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Endereços
export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  userId: text("user_id").references(() => users.id).notNull(),
  zipCode: text("zip_code").notNull(),
  street: text("street").notNull(),
  number: text("number"),
  complement: text("complement"),
  city: text("city").notNull(),
  state: text("state").notNull(),
});

// Tabela de Desmanches
export const desmanches = sqliteTable("desmanches", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  companyName: text("company_name").notNull(),
  tradingName: text("trading_name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password").notNull(),
  responsibleName: text("responsible_name"),
  responsibleCpf: text("responsible_cpf"),
  logo: text("logo"),
  plan: text("plan", { enum: ["percentage", "monthly"] }).notNull().default("percentage"),
  status: text("status", { enum: ["pending", "active", "inactive", "rejected"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  rating: real("rating").notNull().default(0),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Endereços dos Desmanches
export const desmancheAddresses = sqliteTable("desmanche_addresses", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  zipCode: text("zip_code").notNull(),
  street: text("street").notNull(),
  number: text("number"),
  complement: text("complement"),
  city: text("city").notNull(),
  state: text("state").notNull(),
});

// Tabela de Documentos dos Desmanches
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  type: text("type", { enum: ["alvara", "credenciamento_detran", "contrato_social", "documento_responsavel", "documento_empresa"] }).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  validUntil: integer("valid_until", { mode: "timestamp" }),
  status: text("status", { enum: ["valid", "expiring", "expired", "pending"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Pedidos
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  vehicleBrand: text("vehicle_brand").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: integer("vehicle_year").notNull(),
  vehiclePlate: text("vehicle_plate"),
  clientId: text("client_id").references(() => users.id).notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["open", "negotiating", "closed", "shipped", "completed", "cancelled"] }).notNull().default("open"),
  urgency: text("urgency", { enum: ["normal", "urgent"] }).notNull().default("normal"),
  isPartnerRequest: integer("is_partner_request", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Imagens dos Pedidos
export const orderImages = sqliteTable("order_images", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  orderId: text("order_id").references(() => orders.id).notNull(),
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Propostas
export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  orderId: text("order_id").references(() => orders.id).notNull(),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  price: real("price").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["sent", "accepted", "rejected", "withdrawn"] }).notNull().default("sent"),
  whatsappUnlocked: integer("whatsapp_unlocked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Negociações
export const negotiations = sqliteTable("negotiations", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  orderId: text("order_id").references(() => orders.id).notNull(),
  proposalId: text("proposal_id").references(() => proposals.id).notNull(),
  clientId: text("client_id").references(() => users.id).notNull(),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  price: real("price").notNull(),
  status: text("status", { enum: ["negotiating", "paid", "shipped", "delivered", "completed", "cancelled"] }).notNull().default("negotiating"),
  trackingCode: text("tracking_code"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Leilões
export const auctions = sqliteTable("auctions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  source: text("source").notNull(),
  lotCount: integer("lot_count").notNull(),
  estimatedValue: real("estimated_value").notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["live", "upcoming", "ended"] }).notNull().default("upcoming"),
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Faturas
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  month: text("month").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["paid", "pending", "overdue"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tabela de Avaliações
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16)))`),
  negotiationId: text("negotiation_id").references(() => negotiations.id).notNull(),
  clientId: text("client_id").references(() => users.id).notNull(),
  desmancheId: text("desmanche_id").references(() => desmanches.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Schemas de Inserção
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  phone: true,
  password: true,
  type: true,
});

export const insertDesmancheSchema = createInsertSchema(desmanches).pick({
  companyName: true,
  tradingName: true,
  cnpj: true,
  email: true,
  phone: true,
  password: true,
  plan: true,
  responsibleName: true,
  responsibleCpf: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  title: true,
  description: true,
  vehicleBrand: true,
  vehicleModel: true,
  vehicleYear: true,
  vehiclePlate: true,
  location: true,
  urgency: true,
  isPartnerRequest: true,
});

export const insertProposalSchema = createInsertSchema(proposals).pick({
  orderId: true,
  desmancheId: true,
  price: true,
  message: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  desmancheId: true,
  type: true,
  name: true,
  url: true,
  validUntil: true,
});

export const insertAuctionSchema = createInsertSchema(auctions).pick({
  title: true,
  source: true,
  lotCount: true,
  estimatedValue: true,
  endTime: true,
  status: true,
  url: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  desmancheId: true,
  month: true,
  description: true,
  amount: true,
  dueDate: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  negotiationId: true,
  clientId: true,
  desmancheId: true,
  rating: true,
  comment: true,
});

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  negotiations: many(negotiations),
  reviews: many(reviews),
}));

export const desmanchesRelations = relations(desmanches, ({ many }) => ({
  addresses: many(desmancheAddresses),
  documents: many(documents),
  proposals: many(proposals),
  negotiations: many(negotiations),
  invoices: many(invoices),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(users, { fields: [orders.clientId], references: [users.id] }),
  images: many(orderImages),
  proposals: many(proposals),
  negotiations: many(negotiations),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  order: one(orders, { fields: [proposals.orderId], references: [orders.id] }),
  desmanche: one(desmanches, { fields: [proposals.desmancheId], references: [desmanches.id] }),
  negotiations: many(negotiations),
}));

export const negotiationsRelations = relations(negotiations, ({ one }) => ({
  order: one(orders, { fields: [negotiations.orderId], references: [orders.id] }),
  proposal: one(proposals, { fields: [negotiations.proposalId], references: [proposals.id] }),
  client: one(users, { fields: [negotiations.clientId], references: [users.id] }),
  desmanche: one(desmanches, { fields: [negotiations.desmancheId], references: [desmanches.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  desmanche: one(desmanches, { fields: [invoices.desmancheId], references: [desmanches.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  desmanche: one(desmanches, { fields: [documents.desmancheId], references: [desmanches.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  client: one(users, { fields: [reviews.clientId], references: [users.id] }),
  desmanche: one(desmanches, { fields: [reviews.desmancheId], references: [desmanches.id] }),
  negotiation: one(negotiations, { fields: [reviews.negotiationId], references: [negotiations.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const desmancheAddressesRelations = relations(desmancheAddresses, ({ one }) => ({
  desmanche: one(desmanches, { fields: [desmancheAddresses.desmancheId], references: [desmanches.id] }),
}));

export const orderImagesRelations = relations(orderImages, ({ one }) => ({
  order: one(orders, { fields: [orderImages.orderId], references: [orders.id] }),
}));

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Desmanche = typeof desmanches.$inferSelect;
export type InsertDesmanche = z.infer<typeof insertDesmancheSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Address = typeof addresses.$inferSelect;
export type DesmancheAddress = typeof desmancheAddresses.$inferSelect;
export type OrderImage = typeof orderImages.$inferSelect;
export type Negotiation = typeof negotiations.$inferSelect;
