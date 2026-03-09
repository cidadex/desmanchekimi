import type { Express, Request, Response } from "express";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as storage from "./storage";
import * as schema from "@shared/schema";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WebP.'));
    }
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware de autenticação
function authMiddleware(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Middleware de autorização por tipo
function requireType(types: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;
    if (!types.includes(user.type)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };
}

export async function registerRoutes(server: Server, app: Express) {
  const express = await import("express");
  app.use("/uploads", express.default.static(uploadsDir));
  // ============================================
  // AUTH ROUTES
  // ============================================
  
  // Login de usuário (cliente/admin)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const isValid = await storage.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email, type: user.type },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          type: user.type,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });
  
  // Login de desmanche
  app.post("/api/auth/login-desmanche", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }
      
      const desmanche = await storage.getDesmancheByEmail(email);
      if (!desmanche) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const isValid = await storage.verifyPassword(password, desmanche.password);
      if (!isValid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      const token = jwt.sign(
        { id: desmanche.id, email: desmanche.email, type: "desmanche" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.json({
        token,
        user: {
          id: desmanche.id,
          name: desmanche.tradingName,
          email: desmanche.email,
          phone: desmanche.phone,
          type: "desmanche",
          status: desmanche.status,
          rating: desmanche.rating,
          salesCount: desmanche.salesCount,
          plan: desmanche.plan,
        },
      });
    } catch (error) {
      console.error("Login desmanche error:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });
  
  // Registro de cliente
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = schema.insertUserSchema.parse(req.body);
      
      // Verifica se email já existe
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      const user = await storage.createUser(userData);
      
      const token = jwt.sign(
        { id: user!.id, email: user!.email, type: user!.type },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.status(201).json({
        token,
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          phone: user!.phone,
          type: user!.type,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro no registro" });
    }
  });
  
  // Registro de desmanche
  app.post("/api/auth/register-desmanche", async (req, res) => {
    try {
      const desmancheData = schema.insertDesmancheSchema.parse(req.body);
      
      // Verifica se email ou CNPJ já existe
      const existingEmail = await storage.getDesmancheByEmail(desmancheData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      const existingCnpj = await storage.getDesmancheByCnpj(desmancheData.cnpj);
      if (existingCnpj) {
        return res.status(400).json({ message: "CNPJ já cadastrado" });
      }
      
      const desmanche = await storage.createDesmanche(desmancheData);
      
      const token = jwt.sign(
        { id: desmanche!.id, email: desmanche!.email, type: "desmanche" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.status(201).json({
        token,
        user: {
          id: desmanche!.id,
          name: desmanche!.tradingName,
          email: desmanche!.email,
          phone: desmanche!.phone,
          type: "desmanche",
          status: desmanche!.status,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Register desmanche error:", error);
      res.status(500).json({ message: "Erro no registro" });
    }
  });
  
  // ============================================
  // USER ROUTES
  // ============================================
  
  app.get("/api/users/me", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      
      if (userType === "desmanche") {
        const desmanche = await storage.getDesmancheById(userId);
        if (!desmanche) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        const address = await storage.getDesmancheAddressByDesmancheId(userId);
        const docs = await storage.getDocumentsByDesmanche(userId);
        res.json({
          id: desmanche.id,
          name: desmanche.tradingName,
          email: desmanche.email,
          phone: desmanche.phone,
          type: "desmanche",
          status: desmanche.status,
          rating: desmanche.rating,
          salesCount: desmanche.salesCount,
          plan: desmanche.plan,
          companyName: desmanche.companyName,
          tradingName: desmanche.tradingName,
          cnpj: desmanche.cnpj,
          responsibleName: desmanche.responsibleName,
          responsibleCpf: desmanche.responsibleCpf,
          rejectionReason: desmanche.rejectionReason,
          address: address || null,
          documents: docs,
        });
      } else {
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        const address = await storage.getAddressByUserId(userId);
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          type: user.type,
          avatar: user.avatar,
          profileComplete: user.profileComplete,
          address: address || null,
        });
      }
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });
  
  app.patch("/api/users/me", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { name, phone, whatsapp } = req.body;
      
      const user = await storage.updateUserProfile(userId, { name, phone, whatsapp });
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const address = await storage.getAddressByUserId(userId);
      const isComplete = !!(user.whatsapp && address);
      await storage.setUserProfileComplete(userId, isComplete);
      
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        type: user.type,
        avatar: user.avatar,
        profileComplete: isComplete,
        address: address || null,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  app.get("/api/users/me/address", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const address = await storage.getAddressByUserId(userId);
      res.json(address || null);
    } catch (error) {
      console.error("Get address error:", error);
      res.status(500).json({ message: "Erro ao buscar endereço" });
    }
  });
  
  app.put("/api/users/me/address", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { zipCode, street, number, complement, city, state } = req.body;
      
      if (!zipCode || !street || !city || !state) {
        return res.status(400).json({ message: "CEP, rua, cidade e estado são obrigatórios" });
      }
      
      const address = await storage.createOrUpdateAddress(userId, {
        zipCode, street, number, complement, city, state,
      });
      
      const user = await storage.getUserById(userId);
      const isComplete = !!(user?.whatsapp && address);
      await storage.setUserProfileComplete(userId, isComplete);
      
      res.json(address);
    } catch (error) {
      console.error("Update address error:", error);
      res.status(500).json({ message: "Erro ao salvar endereço" });
    }
  });
  
  // ============================================
  // DESMANCHES ROUTES
  // ============================================
  
  app.get("/api/desmanches", authMiddleware, async (req, res) => {
    try {
      const { status, plan } = req.query;
      const desmanches = await storage.getAllDesmanches({
        status: status as string,
        plan: plan as string,
      });
      res.json(desmanches);
    } catch (error) {
      console.error("Get desmanches error:", error);
      res.status(500).json({ message: "Erro ao buscar desmanches" });
    }
  });
  
  app.patch("/api/desmanches/me", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { tradingName, phone, responsibleName, responsibleCpf } = req.body;
      const desmanche = await storage.updateDesmancheProfile(desmancheId, { tradingName, phone, responsibleName, responsibleCpf });
      res.json(desmanche);
    } catch (error) {
      console.error("Update desmanche profile error:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  app.get("/api/desmanches/me/address", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const address = await storage.getDesmancheAddressByDesmancheId(desmancheId);
      res.json(address || null);
    } catch (error) {
      console.error("Get desmanche address error:", error);
      res.status(500).json({ message: "Erro ao buscar endereço" });
    }
  });
  
  app.put("/api/desmanches/me/address", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { zipCode, street, number, complement, city, state } = req.body;
      if (!zipCode || !street || !city || !state) {
        return res.status(400).json({ message: "CEP, rua, cidade e estado são obrigatórios" });
      }
      const address = await storage.createOrUpdateDesmancheAddress(desmancheId, { zipCode, street, number, complement, city, state });
      res.json(address);
    } catch (error) {
      console.error("Update desmanche address error:", error);
      res.status(500).json({ message: "Erro ao salvar endereço" });
    }
  });
  
  app.get("/api/desmanches/:id", authMiddleware, async (req, res) => {
    try {
      const desmanche = await storage.getDesmancheById(req.params.id as string);
      if (!desmanche) {
        return res.status(404).json({ message: "Desmanche não encontrado" });
      }
      res.json(desmanche);
    } catch (error) {
      console.error("Get desmanche error:", error);
      res.status(500).json({ message: "Erro ao buscar desmanche" });
    }
  });
  
  app.patch("/api/desmanches/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const desmanche = await storage.updateDesmancheStatus(req.params.id as string, status, rejectionReason);
      res.json(desmanche);
    } catch (error) {
      console.error("Update desmanche status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // ============================================
  // ORDERS ROUTES
  // ============================================
  
  app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
      const { status, urgency, isPartnerRequest } = req.query;
      const orders = await storage.getAllOrders({
        status: status as string,
        urgency: urgency as string,
        isPartnerRequest: isPartnerRequest === "true" ? true : isPartnerRequest === "false" ? false : undefined,
      });
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });
  
  app.get("/api/orders/my", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const orders = await storage.getOrdersByClient(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get my orders error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });
  
  app.get("/api/orders/:id", authMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id as string);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  });
  
  app.post("/api/orders", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      
      const user = await storage.getUserById(clientId);
      if (!user?.profileComplete) {
        return res.status(400).json({ message: "Complete seu perfil (WhatsApp e endereço) antes de criar pedidos" });
      }
      
      const orderData = schema.insertOrderSchema.parse(req.body);
      
      const order = await storage.createOrder({
        ...orderData,
        clientId,
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create order error:", error);
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });
  
  app.patch("/api/orders/:id/status", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const { status } = req.body;
      
      const order = await storage.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
      if (userType !== "admin" && order.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updated = await storage.updateOrderStatus(req.params.id as string, status);
      res.json(updated);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // ============================================
  // PROPOSALS ROUTES
  // ============================================
  
  app.get("/api/proposals", authMiddleware, async (req, res) => {
    try {
      const { orderId, desmancheId } = req.query;
      
      if (orderId) {
        const proposals = await storage.getProposalsByOrder(orderId as string);
        return res.json(proposals);
      }
      
      if (desmancheId) {
        const proposals = await storage.getProposalsByDesmanche(desmancheId as string);
        return res.json(proposals);
      }
      
      res.status(400).json({ message: "orderId ou desmancheId é obrigatório" });
    } catch (error) {
      console.error("Get proposals error:", error);
      res.status(500).json({ message: "Erro ao buscar propostas" });
    }
  });
  
  app.post("/api/proposals", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const proposalData = schema.insertProposalSchema.parse(req.body);
      const desmancheId = (req as any).user.id;
      
      // Verifica se o desmanche está fazendo a proposta
      if (proposalData.desmancheId !== desmancheId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create proposal error:", error);
      res.status(500).json({ message: "Erro ao criar proposta" });
    }
  });
  
  app.patch("/api/proposals/:id/status", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const { status } = req.body;
      
      const proposal = await storage.getProposalById(req.params.id as string);
      if (!proposal) return res.status(404).json({ message: "Proposta não encontrada" });
      
      const order = await storage.getOrderById(proposal.orderId);
      if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
      
      if (userType === "client" && order.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (userType === "desmanche" && proposal.desmancheId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updated = await storage.updateProposalStatus(req.params.id as string, status);
      
      if (status === "accepted") {
        await storage.createNegotiation({
          orderId: updated!.orderId,
          proposalId: updated!.id,
          clientId: order.clientId,
          desmancheId: updated!.desmancheId,
          price: updated!.price,
        });
        await storage.updateOrderStatus(updated!.orderId, "negotiating");
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update proposal status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  app.post("/api/proposals/:id/unlock-whatsapp", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const proposal = await storage.getProposalById(req.params.id as string);
      if (!proposal) return res.status(404).json({ message: "Proposta não encontrada" });
      
      const order = await storage.getOrderById(proposal.orderId);
      if (!order || order.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updated = await storage.unlockWhatsapp(req.params.id as string);
      res.json(updated);
    } catch (error) {
      console.error("Unlock whatsapp error:", error);
      res.status(500).json({ message: "Erro ao desbloquear WhatsApp" });
    }
  });
  
  // ============================================
  // NEGOTIATIONS ROUTES
  // ============================================
  
  app.get("/api/negotiations", authMiddleware, async (req, res) => {
    try {
      const { clientId, desmancheId } = req.query;
      
      if (clientId) {
        const negotiations = await storage.getNegotiationsByClient(clientId as string);
        return res.json(negotiations);
      }
      
      if (desmancheId) {
        const negotiations = await storage.getNegotiationsByDesmanche(desmancheId as string);
        return res.json(negotiations);
      }
      
      res.status(400).json({ message: "clientId ou desmancheId é obrigatório" });
    } catch (error) {
      console.error("Get negotiations error:", error);
      res.status(500).json({ message: "Erro ao buscar negociações" });
    }
  });
  
  app.get("/api/negotiations/my", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      
      if (userType === "desmanche") {
        const negotiations = await storage.getNegotiationsByDesmanche(userId);
        return res.json(negotiations);
      } else {
        const negotiations = await storage.getNegotiationsByClient(userId);
        return res.json(negotiations);
      }
    } catch (error) {
      console.error("Get my negotiations error:", error);
      res.status(500).json({ message: "Erro ao buscar negociações" });
    }
  });
  
  app.patch("/api/negotiations/:id/status", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const { status, trackingCode } = req.body;
      
      const negotiation = await storage.getNegotiationById(req.params.id as string);
      if (!negotiation) return res.status(404).json({ message: "Negociação não encontrada" });
      
      if (userType === "client" && negotiation.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (userType === "desmanche" && negotiation.desmancheId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updated = await storage.updateNegotiationStatus(req.params.id as string, status, trackingCode);
      res.json(updated);
    } catch (error) {
      console.error("Update negotiation status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // ============================================
  // AUCTIONS ROUTES
  // ============================================
  
  app.get("/api/auctions", authMiddleware, async (req, res) => {
    try {
      const { status } = req.query;
      const auctions = await storage.getAllAuctions({ status: status as string });
      res.json(auctions);
    } catch (error) {
      console.error("Get auctions error:", error);
      res.status(500).json({ message: "Erro ao buscar leilões" });
    }
  });
  
  app.post("/api/auctions", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const auctionData = schema.insertAuctionSchema.parse(req.body);
      const auction = await storage.createAuction(auctionData);
      res.status(201).json(auction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create auction error:", error);
      res.status(500).json({ message: "Erro ao criar leilão" });
    }
  });
  
  // ============================================
  // INVOICES ROUTES
  // ============================================
  
  app.get("/api/invoices", authMiddleware, async (req, res) => {
    try {
      const { desmancheId } = req.query;
      
      if (desmancheId) {
        const invoices = await storage.getInvoicesByDesmanche(desmancheId as string);
        return res.json(invoices);
      }
      
      // Admin vê todas
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Erro ao buscar faturas" });
    }
  });
  
  app.get("/api/invoices/my", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const invoices = await storage.getInvoicesByDesmanche(desmancheId);
      res.json(invoices);
    } catch (error) {
      console.error("Get my invoices error:", error);
      res.status(500).json({ message: "Erro ao buscar faturas" });
    }
  });
  
  app.post("/api/invoices", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const invoiceData = schema.insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Erro ao criar fatura" });
    }
  });
  
  app.patch("/api/invoices/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateInvoiceStatus(req.params.id as string, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Update invoice status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // ============================================
  // DOCUMENTS ROUTES
  // ============================================
  
  app.get("/api/documents", authMiddleware, async (req, res) => {
    try {
      const { desmancheId } = req.query;
      if (!desmancheId) {
        return res.status(400).json({ message: "desmancheId é obrigatório" });
      }
      const userType = (req as any).user.type;
      const userId = (req as any).user.id;
      if (userType !== "admin" && userId !== desmancheId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const documents = await storage.getDocumentsByDesmanche(desmancheId as string);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });
  
  app.get("/api/documents/my", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const documents = await storage.getDocumentsByDesmanche(desmancheId);
      res.json(documents);
    } catch (error) {
      console.error("Get my documents error:", error);
      res.status(500).json({ message: "Erro ao buscar documentos" });
    }
  });
  
  app.post("/api/documents", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const documentData = schema.insertDocumentSchema.parse(req.body);
      const desmancheId = (req as any).user.id;
      
      if (documentData.desmancheId !== desmancheId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create document error:", error);
      res.status(500).json({ message: "Erro ao criar documento" });
    }
  });
  
  app.patch("/api/documents/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateDocumentStatus(req.params.id as string, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Update document status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // ============================================
  // REVIEWS ROUTES
  // ============================================
  
  app.get("/api/reviews", authMiddleware, async (req, res) => {
    try {
      const { desmancheId } = req.query;
      if (!desmancheId) {
        return res.status(400).json({ message: "desmancheId é obrigatório" });
      }
      const reviews = await storage.getReviewsByDesmanche(desmancheId as string);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Erro ao buscar avaliações" });
    }
  });
  
  app.post("/api/reviews", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const reviewData = schema.insertReviewSchema.parse(req.body);
      const clientId = (req as any).user.id;
      
      if (reviewData.clientId !== clientId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const review = await storage.createReview(reviewData);
      
      // Atualiza a nota do desmanche
      const reviews = await storage.getReviewsByDesmanche(reviewData.desmancheId);
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await storage.updateDesmancheRating(reviewData.desmancheId, avgRating);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Create review error:", error);
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });
  
  // ============================================
  // DASHBOARD STATS
  // ============================================
  
  app.get("/api/dashboard/stats", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });
  
  // ============================================
  // FILE UPLOAD ROUTE
  // ============================================
  
  app.post("/api/upload", authMiddleware, requireType(["desmanche", "admin"]), (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Erro no upload: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, originalName: req.file.originalname });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Erro ao fazer upload" });
    }
  });
  
  // ============================================
  // ADMIN ROUTES
  // ============================================
  
  app.get("/api/admin/users", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        type: u.type,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  app.get("/api/admin/orders", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Get admin orders error:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });
  
  app.get("/api/admin/desmanches", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { status } = req.query;
      const desmanches = await storage.getAllDesmanches({ status: status as string });
      const result = await Promise.all(desmanches.map(async (d) => {
        const address = await storage.getDesmancheAddressByDesmancheId(d.id);
        const docs = await storage.getDocumentsByDesmanche(d.id);
        return {
          ...d,
          password: undefined,
          address,
          documents: docs,
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Get admin desmanches error:", error);
      res.status(500).json({ message: "Erro ao buscar desmanches" });
    }
  });
  
  // Seed database
  await storage.seedDatabase();
  console.log("Database seeded successfully");
}
