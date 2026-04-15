import type { Express, Request, Response } from "express";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as storage from "./storage";
import * as schema from "@shared/schema";
import * as asaas from "./asaas";
import * as email from "./email";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

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

      if ((user as any).status === "inactive") {
        return res.status(403).json({ message: "Usuário desativado. Entre em contato com o suporte." });
      }
      
      const permissions = user.type === "admin" ? storage.getAdminPermissions(user.id) : undefined;

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
          permissions: user.type === "admin" ? permissions : undefined,
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
      
      // Send verification email
      const verifyToken = randomBytes(32).toString("hex");
      const verifyExpires = Math.floor(Date.now() / 1000) + 86400; // 24h
      storage.setEmailVerificationToken(user!.id, verifyToken, verifyExpires);
      email.sendVerificationEmail(user!.email, verifyToken).catch(err => console.error("Email error:", err));
      
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
          emailVerified: false,
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
  
  // ─── EMAIL VERIFICATION ─────────────────────────────────────────────────────

  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ message: "Token inválido" });
      const user = storage.getUserByVerificationToken(token);
      if (!user) return res.status(400).json({ message: "Link inválido ou já utilizado." });
      const now = Math.floor(Date.now() / 1000);
      if (user.email_verification_expires && user.email_verification_expires < now) {
        return res.status(400).json({ message: "Link expirado. Solicite um novo e-mail de verificação." });
      }
      storage.markEmailVerified(user.id);
      res.json({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ message: "Erro ao verificar e-mail" });
    }
  });

  app.post("/api/auth/resend-verification", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      if (storage.isEmailVerified(userId)) {
        return res.status(400).json({ message: "E-mail já verificado." });
      }
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
      const token = randomBytes(32).toString("hex");
      const expires = Math.floor(Date.now() / 1000) + 86400;
      storage.setEmailVerificationToken(userId, token, expires);
      await email.sendVerificationEmail(user.email, token);
      res.json({ message: "E-mail de verificação reenviado!" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Erro ao reenviar e-mail" });
    }
  });

  // ─── PASSWORD RESET ──────────────────────────────────────────────────────────

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email: userEmail } = req.body;
      if (!userEmail) return res.status(400).json({ message: "E-mail obrigatório" });
      const user = await storage.getUserByEmail(userEmail);
      // Always return success to avoid email enumeration
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expires = Math.floor(Date.now() / 1000) + 3600; // 1h
        storage.setPasswordResetToken(user.id, token, expires);
        email.sendPasswordResetEmail(user.email, token).catch(err => console.error("Email error:", err));
      }
      res.json({ message: "Se este e-mail estiver cadastrado, você receberá as instruções em breve." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password: newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "Token e senha são obrigatórios" });
      if (newPassword.length < 6) return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      const user = storage.getUserByPasswordResetToken(token);
      if (!user) return res.status(400).json({ message: "Link inválido ou já utilizado." });
      const now = Math.floor(Date.now() / 1000);
      if (user.password_reset_expires && user.password_reset_expires < now) {
        return res.status(400).json({ message: "Link expirado. Solicite um novo." });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hash);
      storage.clearPasswordResetToken(user.id);
      res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
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
        const profileComplete = !!(user.whatsapp && address?.zipCode && address?.street && address?.city);
        const emailVerified = storage.isEmailVerified(userId);
        const adminPerms = user.type === "admin" ? storage.getAdminPermissions(user.id) : undefined;
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          type: user.type,
          avatar: user.avatar,
          profileComplete,
          emailVerified,
          address: address || null,
          permissions: user.type === "admin" ? adminPerms : undefined,
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
  
  app.get("/api/desmanches/me", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const desmanche = await storage.getDesmancheById(desmancheId);
      if (!desmanche) return res.status(404).json({ message: "Desmanche não encontrado" });
      const { password: _, ...safe } = desmanche as any;
      res.json(safe);
    } catch (error) {
      console.error("Get desmanche me error:", error);
      res.status(500).json({ message: "Erro ao buscar dados" });
    }
  });

  app.patch("/api/desmanches/me", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { tradingName, phone, responsibleName, responsibleCpf, logo, vehicleTypes } = req.body;
      const vtJson = vehicleTypes !== undefined ? JSON.stringify(vehicleTypes) : undefined;
      const desmanche = await storage.updateDesmancheProfile(desmancheId, { tradingName, phone, responsibleName, responsibleCpf, logo, vehicleTypes: vtJson });
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

  app.get("/api/orders/my-ads", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const orders = await storage.getOrdersByDesmanche(desmancheId);
      res.json(orders);
    } catch (error) {
      console.error("Get my ads error:", error);
      res.status(500).json({ message: "Erro ao buscar anúncios" });
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

  app.post("/api/orders", authMiddleware, requireType(["client", "desmanche"]), async (req, res) => {
    try {
      const reqUser = (req as any).user;
      
      if (reqUser.type === "desmanche") {
        const desmancheId = reqUser.id;
        const desmanche = await storage.getDesmancheById(desmancheId);
        if (!desmanche || desmanche.status !== "active") {
          return res.status(403).json({ message: "Apenas desmanches credenciados podem publicar anúncios" });
        }
        const orderData = schema.insertOrderSchema.parse(req.body);
        const order = await storage.createOrder({
          ...orderData,
          clientId: null,
          desmancheId,
          postedByType: "desmanche",
        });
        return res.status(201).json(order);
      }

      // Client flow
      const clientId = reqUser.id;
      // TEMP: email verification disabled for testing — re-enable after launch
      // if (!storage.isEmailVerified(clientId)) {
      //   return res.status(403).json({ message: "Confirme seu e-mail antes de criar pedidos.", emailNotVerified: true });
      // }
      const user = await storage.getUserById(clientId);
      if (!user?.profileComplete) {
        return res.status(400).json({ message: "Complete seu perfil (WhatsApp e endereço) antes de criar pedidos" });
      }
      
      const maxOverdue = await storage.getSystemSettingNumber("maxOverdueBeforeBlock", 1);
      const overdueCount = await storage.getOverdueReviewCountForClient(clientId);
      if (overdueCount >= maxOverdue) {
        const pending = await storage.getPendingReviewsForClient(clientId);
        return res.status(403).json({
          message: "Você possui avaliações atrasadas. Avalie as negociações concluídas para criar novos pedidos.",
          blocked: true,
          pendingReviews: pending,
        });
      }
      
      const orderData = schema.insertOrderSchema.parse(req.body);
      const items = req.body.items as any[] | undefined;
      const order = await storage.createOrder({
        ...orderData,
        clientId,
        postedByType: "client",
        items: items && items.length > 0 ? items : undefined,
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

  // ============================================
  // ORDER ITEMS ROUTES
  // ============================================

  app.get("/api/order-items/:id", authMiddleware, async (req, res) => {
    try {
      const item = await storage.getOrderItemById(req.params.id);
      if (!item) return res.status(404).json({ message: "Item não encontrado" });
      res.json(item);
    } catch (error) {
      console.error("Get order item error:", error);
      res.status(500).json({ message: "Erro ao buscar item" });
    }
  });

  app.patch("/api/order-items/:id/status", authMiddleware, async (req, res) => {
    try {
      const { status } = req.body;
      const item = await storage.updateOrderItemStatus(req.params.id, status);
      res.json(item);
    } catch (error) {
      console.error("Update order item status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status do item" });
    }
  });

  app.patch("/api/order-items/:id/reactivate", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const item = await storage.getOrderItemById(req.params.id);
      if (!item) return res.status(404).json({ message: "Item não encontrado" });
      const order = await storage.getOrderById(item.orderId);
      if (!order || order.clientId !== clientId) return res.status(403).json({ message: "Sem permissão" });
      const updated = await storage.reactivateOrderItem(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Reactivate order item error:", error);
      res.status(500).json({ message: "Erro ao reativar item" });
    }
  });

  app.patch("/api/orders/:id/reactivate", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const order = await storage.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ message: "Anúncio não encontrado" });
      if (order.desmancheId !== desmancheId) return res.status(403).json({ message: "Sem permissão" });
      if (order.postedByType !== "desmanche") return res.status(400).json({ message: "Apenas anúncios de desmanche podem ser reativados" });
      const updated = await storage.reactivateOrder(order.id);
      res.json(updated);
    } catch (error) {
      console.error("Reactivate order error:", error);
      res.status(500).json({ message: "Erro ao reativar anúncio" });
    }
  });
  
  app.patch("/api/orders/:id/status", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const { status } = req.body;
      
      const order = await storage.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
      const isOwner = order.postedByType === "desmanche"
        ? order.desmancheId === userId
        : order.clientId === userId;
      if (userType !== "admin" && !isOwner) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const updated = await storage.updateOrderStatus(req.params.id as string, status);
      res.json(updated);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  // Direct buy endpoint for clients purchasing desmanche-posted ads (no proposal needed)
  app.post("/api/orders/:id/buy", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const order = await storage.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ message: "Anúncio não encontrado" });
      if (order.postedByType !== "desmanche") {
        return res.status(400).json({ message: "Este pedido não é um anúncio de desmanche" });
      }
      if (order.status !== "open") {
        return res.status(409).json({ message: "Este anúncio não está disponível" });
      }
      if (!order.desmancheId) {
        return res.status(500).json({ message: "Anúncio sem desmanche associado" });
      }

      // Create a purchase proposal on behalf of the desmanche owner so the negotiation chain is consistent
      const proposal = await storage.createProposal({
        orderId: order.id,
        desmancheId: order.desmancheId,
        price: req.body.price ?? 0,
        message: req.body.message ?? "Compra direta via anúncio",
      });
      await storage.updateProposalStatus(proposal!.id, "accepted");

      const negotiation = await storage.createNegotiation({
        orderId: order.id,
        proposalId: proposal!.id,
        clientId,
        desmancheId: order.desmancheId,
        price: proposal!.price,
      });
      await storage.updateOrderStatus(order.id, "negotiating");

      try {
        await storage.createChatRoom({
          proposalId: proposal!.id,
          orderId: order.id,
          clientId,
          desmancheId: order.desmancheId,
        });
      } catch (chatErr) {
        console.error("Buy chat room creation error (non-critical):", chatErr);
      }

      res.status(201).json(negotiation);
    } catch (error) {
      console.error("Buy order error:", error);
      res.status(500).json({ message: "Erro ao processar compra" });
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
      const desmancheId = (req as any).user.id;
      let proposalData = schema.insertProposalSchema.parse(req.body);

      // Se veio orderItemId mas não orderId, derivar orderId do item
      if (proposalData.orderItemId && !proposalData.orderId) {
        const item = await storage.getOrderItemById(proposalData.orderItemId);
        if (!item) return res.status(404).json({ message: "Item não encontrado" });
        proposalData = { ...proposalData, orderId: item.orderId };
      }

      // Verifica se o desmanche está fazendo a proposta
      if (proposalData.desmancheId !== desmancheId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      // Impede que um desmanche responda ao próprio anúncio
      const proposalOrder = await storage.getOrderById(proposalData.orderId);
      if (proposalOrder && proposalOrder.postedByType === "desmanche" && proposalOrder.desmancheId === desmancheId) {
        return res.status(403).json({ message: "Você não pode enviar propostas para o seu próprio anúncio." });
      }
      
      // Verificação de bloqueio por avaliação pendente
      const maxOverdue = await storage.getSystemSettingNumber("maxOverdueBeforeBlock", 1);
      const overdueCount = await storage.getOverdueReviewCountForDesmanche(desmancheId);
      if (overdueCount >= maxOverdue) {
        return res.status(403).json({
          message: "Você possui avaliações atrasadas. Aguarde a avaliação do cliente para enviar novas propostas.",
          blocked: true,
        });
      }

      // Verificação de limite de propostas mensais (modelo assinatura)
      const billing = await storage.getDesmancheBilling(desmancheId);
      if (billing && billing.billingModel === "subscription" && billing.planId) {
        const plan = await storage.getSubscriptionPlanById(billing.planId);
        if (plan && plan.proposalLimit < 999) {
          const monthlyCount = await storage.getMonthlyProposalCountForDesmanche(desmancheId);
          if (monthlyCount >= plan.proposalLimit) {
            return res.status(429).json({
              message: `Limite de ${plan.proposalLimit} propostas do plano ${plan.name} atingido este mês. Aguarde o próximo ciclo ou faça upgrade do plano.`,
              proposalLimitReached: true,
              limit: plan.proposalLimit,
              currentCount: monthlyCount,
            });
          }
        }
      }

      const proposal = await storage.createProposal(proposalData);

      // Atualiza status do item para has_proposals
      if (proposalData.orderItemId) {
        await storage.updateOrderItemStatus(proposalData.orderItemId, 'has_proposals');
      }
      
      // Auto-create chat room when proposal is sent (only for client orders)
      try {
        const order = await storage.getOrderById(proposalData.orderId);
        if (order && order.clientId) {
          await storage.createChatRoom({
            proposalId: proposal!.id,
            orderId: proposalData.orderId,
            clientId: order.clientId,
            desmancheId: proposalData.desmancheId,
          });
        }
      } catch (chatErr) {
        console.error("Chat room creation error (non-critical):", chatErr);
      }
      
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
      
      const isDesmancheAd = order.postedByType === "desmanche";

      if (isDesmancheAd) {
        // For desmanche-posted ads: only clients can "buy" (accept), or the ad-owner desmanche can reject/withdraw
        if (userType === "client" && status === "accepted") {
          // Any authenticated client may accept a desmanche ad
        } else if (userType === "desmanche" && order.desmancheId === userId && status !== "accepted") {
          // Desmanche owner may reject/withdraw their own proposal
        } else if (userType === "admin") {
          // Admin always allowed
        } else {
          return res.status(403).json({ message: "Acesso negado" });
        }
      } else {
        // For client-posted orders: only the order's client or an admin may change proposal status
        if (userType === "client" && order.clientId !== userId) {
          return res.status(403).json({ message: "Acesso negado" });
        }
        if (userType === "desmanche" && proposal.desmancheId !== userId) {
          return res.status(403).json({ message: "Acesso negado" });
        }
      }
      
      const updated = await storage.updateProposalStatus(req.params.id as string, status);
      
      if (status === "accepted") {
        // For desmanche ads the "client" is the user who accepted; for client orders it's order.clientId
        const negotiationClientId = isDesmancheAd ? userId : order.clientId!;
        const negotiationDesmancheId = isDesmancheAd ? order.desmancheId! : updated!.desmancheId;
        await storage.createNegotiation({
          orderId: updated!.orderId,
          proposalId: updated!.id,
          clientId: negotiationClientId,
          desmancheId: negotiationDesmancheId,
          price: updated!.price,
        });
        await storage.updateOrderStatus(updated!.orderId, "negotiating");
        // For desmanche ads, create the chat room now (deferred from proposal creation)
        if (isDesmancheAd) {
          try {
            await storage.createChatRoom({
              proposalId: updated!.id,
              orderId: updated!.orderId,
              clientId: negotiationClientId,
              desmancheId: negotiationDesmancheId,
            });
          } catch (chatErr) {
            console.error("Deferred chat room creation error (non-critical):", chatErr);
          }
        }
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
      const { type, name, url, validUntil } = req.body;
      const desmancheId = (req as any).user.id;

      const validTypes = ["alvara", "credenciamento_detran", "contrato_social", "documento_responsavel", "documento_empresa"];
      if (!type || !name || !url || !validTypes.includes(type)) {
        return res.status(400).json({ message: "Dados inválidos: type, name e url são obrigatórios" });
      }

      // validUntil vem do frontend como Unix timestamp em segundos (número)
      // O Drizzle espera Date, então convertemos aqui antes de salvar
      const validUntilDate: Date | undefined = validUntil
        ? new Date(Number(validUntil) * 1000)
        : undefined;

      const document = await storage.createDocument({
        desmancheId,
        type: type as any,
        name,
        url,
        validUntil: validUntilDate,
      });
      res.status(201).json(document);
    } catch (error) {
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
      
      // Marca negociação como concluída após avaliação
      const completedNeg = await storage.updateNegotiationStatus(reviewData.negotiationId, 'completed');
      
      // Atualiza o status do pedido para "completed"
      if (completedNeg?.orderId) {
        try {
          await storage.updateOrderStatus(completedNeg.orderId, 'completed');
        } catch (orderErr) {
          console.error("Order status update error (non-critical):", orderErr);
        }
      }
      
      // Dispara cobrança por transação se aplicável
      try {
        await triggerTransactionBilling(reviewData.desmancheId, reviewData.negotiationId);
      } catch (billingErr) {
        console.error("Billing trigger error (non-critical):", billingErr);
      }
      
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
  
  app.post("/api/orders/:id/images", authMiddleware, requireType(["client", "desmanche"]), (req, res, next) => {
    upload.array("photos", 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Erro no upload: ${err.message}` });
      }
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  }, async (req, res) => {
    try {
      const reqUser = (req as any).user;
      const order = await storage.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
      const isOwner = reqUser.type === "desmanche"
        ? order.desmancheId === reqUser.id
        : order.clientId === reqUser.id;
      if (!isOwner) return res.status(403).json({ message: "Acesso negado" });
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      const orderItemId = req.query.itemId as string | undefined;
      const images = await Promise.all(files.map(f => storage.createOrderImage(order.id, `/uploads/${f.filename}`, orderItemId)));
      res.json({ images });
    } catch (error) {
      console.error("Order image upload error:", error);
      res.status(500).json({ message: "Erro ao fazer upload das fotos" });
    }
  });

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
  
  app.get("/api/admin/users/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUserById(id);
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      const orders = await storage.getOrdersByClient(id);
      const negotiations = await storage.getNegotiationsByClient(id);

      const ordersWithCount = orders.map((o: any) => ({
        id: o.id,
        title: o.title,
        vehicleBrand: o.vehicleBrand,
        vehicleModel: o.vehicleModel,
        vehicleYear: o.vehicleYear,
        status: o.status,
        createdAt: o.createdAt,
        proposalCount: (o.proposals || []).length,
      }));

      const negotiationsDetail = negotiations.map((n: any) => ({
        id: n.id,
        status: n.status,
        agreedPrice: n.agreedPrice,
        createdAt: n.createdAt,
        orderTitle: n.order?.title || null,
        desmancheName: n.desmanche?.tradingName || n.desmanche?.companyName || null,
        desmancheRating: n.desmanche?.rating || null,
      }));

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        type: user.type,
        createdAt: user.createdAt,
        orders: ordersWithCount,
        negotiations: negotiationsDetail,
        stats: {
          totalOrders: orders.length,
          totalWithProposals: orders.filter((o: any) => (o.proposals || []).length > 0).length,
          totalNegotiating: negotiations.filter((n: any) => n.status === "negotiating").length,
          totalCompleted: negotiations.filter((n: any) => n.status === "completed").length,
          totalCancelled: negotiations.filter((n: any) => n.status === "cancelled").length,
        },
      });
    } catch (error) {
      console.error("Get admin user detail error:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.get("/api/admin/users", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        type: u.type,
        status: u.status ?? "active",
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.patch("/api/admin/users/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({ message: "Status inválido" });
      }
      storage.setUserStatus(id, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Toggle user status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });
  
  app.get("/api/admin/orders/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      if (!order) return res.status(404).json({ message: "Pedido não encontrado" });

      const [proposals, negotiations, chatRooms] = await Promise.all([
        storage.getProposalsByOrder(id),
        storage.getNegotiationsByOrder ? storage.getNegotiationsByOrder(id) : Promise.resolve([]),
        storage.getChatRoomsByOrder(id),
      ]);

      // Get reviews per negotiation
      const negIds = (negotiations as any[]).map((n: any) => n.id);
      const reviews: any[] = [];
      for (const neg of negotiations as any[]) {
        if (neg.review) reviews.push({ ...neg.review, negotiationId: neg.id, desmancheName: neg.desmanche?.tradingName || neg.desmanche?.companyName });
      }

      res.json({
        ...order,
        proposals: (proposals as any[]).map((p: any) => ({
          id: p.id,
          price: p.price,
          message: p.message,
          status: p.status,
          createdAt: p.createdAt,
          whatsappUnlocked: p.whatsappUnlocked,
          desmanche: p.desmanche ? {
            id: p.desmanche.id,
            tradingName: p.desmanche.tradingName,
            companyName: p.desmanche.companyName,
            rating: p.desmanche.rating,
            phone: p.desmanche.phone,
            city: p.desmanche.city,
            state: p.desmanche.state,
          } : null,
        })),
        negotiations: (negotiations as any[]).map((n: any) => ({
          id: n.id,
          status: n.status,
          agreedPrice: n.agreedPrice,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          trackingCode: n.trackingCode,
          desmancheId: n.desmancheId,
          desmancheName: n.desmanche?.tradingName || n.desmanche?.companyName || null,
          desmanchePhone: n.desmanche?.phone || null,
          desmancheRating: n.desmanche?.rating || null,
          clientName: n.client?.name || null,
          clientEmail: n.client?.email || null,
        })),
        chatRooms: (chatRooms as any[]).map((r: any) => ({
          id: r.id,
          desmancheName: r.desmanche?.tradingName || r.desmanche?.companyName || null,
          clientName: r.client?.name || null,
          messageCount: r.messages?.length ?? 0,
          lastMessageAt: r.lastMessageAt,
          lastMessage: r.messages?.[0] ? {
            content: r.messages[0].content,
            senderType: r.messages[0].senderType,
            createdAt: r.messages[0].createdAt,
          } : null,
        })),
        reviews,
      });
    } catch (error) {
      console.error("Get admin order detail error:", error);
      res.status(500).json({ message: "Erro ao buscar pedido" });
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
  
  app.get("/api/admin/desmanches/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const desmanche = await storage.getDesmancheById(id);
      if (!desmanche) return res.status(404).json({ message: "Desmanche não encontrado" });
      const address = await storage.getDesmancheAddressByDesmancheId(id);
      const docs = await storage.getDocumentsByDesmanche(id);
      const negotiations = await storage.getNegotiationsByDesmanche(id);
      const reviews = await storage.getReviewsByDesmanche(id);
      const billing = await storage.getDesmancheBilling(id);
      const transactions = await storage.getBillingTransactionsByDesmanche(id);

      const negotiationsWithClient = await Promise.all(negotiations.map(async (neg: any) => {
        const order = neg.order || null;
        const client = neg.client || null;
        return { ...neg, order, client };
      }));

      res.json({
        ...desmanche,
        password: undefined,
        address,
        documents: docs,
        negotiations: negotiationsWithClient,
        reviews,
        billing: billing || null,
        billingTransactions: transactions,
        totalPaid: transactions.filter((t: any) => t.status === "paid").reduce((s: number, t: any) => s + t.amount, 0),
        totalPending: transactions.filter((t: any) => t.status === "pending").reduce((s: number, t: any) => s + t.amount, 0),
      });
    } catch (error) {
      console.error("Get admin desmanche detail error:", error);
      res.status(500).json({ message: "Erro ao buscar desmanche" });
    }
  });

  app.patch("/api/admin/desmanches/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      if (!["active", "inactive", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      await storage.updateDesmancheStatus(id, status, rejectionReason);
      const updated = await storage.getDesmancheById(id);
      res.json({ ...updated, password: undefined });
    } catch (error) {
      console.error("Update desmanche status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
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
  
  // ============================================
  // CHAT ROUTES
  // ============================================

  app.get("/api/chat/rooms", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;

      let rooms: any[];
      if (userType === "desmanche") {
        rooms = await storage.getChatRoomsByDesmanche(userId);
      } else {
        rooms = await storage.getChatRoomsByClient(userId);
      }

      const roomsWithUnread = await Promise.all(
        rooms.map(async (room: any) => {
          const unread = await storage.countUnreadMessages(room.id, userId);
          return { ...room, unreadCount: unread };
        })
      );
      res.json(roomsWithUnread);
    } catch (error) {
      console.error("Get chat rooms error:", error);
      res.status(500).json({ message: "Erro ao buscar conversas" });
    }
  });

  app.get("/api/chat/rooms/:roomId/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const room = await storage.getChatRoomById(req.params.roomId);

      if (!room) return res.status(404).json({ message: "Conversa não encontrada" });

      if (userType === "client" && room.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (userType === "desmanche" && room.desmancheId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      await storage.markRoomMessagesAsRead(req.params.roomId, userId);
      const messages = await storage.getMessagesByRoom(req.params.roomId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/chat/rooms/:roomId/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const userType = (req as any).user.type;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Mensagem não pode ser vazia" });
      }

      const room = await storage.getChatRoomById(req.params.roomId);
      if (!room) return res.status(404).json({ message: "Conversa não encontrada" });

      if (userType === "client" && room.clientId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      if (userType === "desmanche" && room.desmancheId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const senderType = userType === "desmanche" ? "desmanche" : "client";
      const message = await storage.createChatMessage({
        roomId: req.params.roomId,
        senderId: userId,
        senderType,
        content: content.trim(),
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // ============================================
  // NEGOTIATION - SHIP / RECEIVED
  // ============================================

  app.patch("/api/negotiations/:id/ship", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { trackingCode } = req.body;
      const negotiation = await storage.getNegotiationById(req.params.id);
      if (!negotiation) return res.status(404).json({ message: "Negociação não encontrada" });
      if (negotiation.desmancheId !== desmancheId) return res.status(403).json({ message: "Acesso negado" });
      if (negotiation.status !== "negotiating") {
        return res.status(400).json({ message: "Negociação não está no status correto para marcar envio" });
      }
      const updated = await storage.updateNegotiationStatus(req.params.id, "shipped", trackingCode);
      res.json(updated);
    } catch (error) {
      console.error("Ship negotiation error:", error);
      res.status(500).json({ message: "Erro ao marcar envio" });
    }
  });

  app.patch("/api/negotiations/:id/received", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const negotiation = await storage.getNegotiationById(req.params.id);
      if (!negotiation) return res.status(404).json({ message: "Negociação não encontrada" });
      if (negotiation.clientId !== clientId) return res.status(403).json({ message: "Acesso negado" });
      if (negotiation.status !== "shipped") {
        return res.status(400).json({ message: "Negociação não está no status correto" });
      }
      const reviewDeadlineDays = await storage.getSystemSettingNumber("reviewDeadlineDays", 10);
      const updated = await storage.setNegotiationReceived(req.params.id, reviewDeadlineDays);
      res.json(updated);
    } catch (error) {
      console.error("Received negotiation error:", error);
      res.status(500).json({ message: "Erro ao confirmar recebimento" });
    }
  });

  // Resposta do desmanche sobre negociação parada
  app.patch("/api/negotiations/:id/stale-desmanche-response", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { response } = req.body;
      if (!["nothing_happened", "still_negotiating"].includes(response)) {
        return res.status(400).json({ message: "Resposta inválida" });
      }
      const negotiation = await storage.getNegotiationById(req.params.id);
      if (!negotiation) return res.status(404).json({ message: "Negociação não encontrada" });
      if (negotiation.desmancheId !== desmancheId) return res.status(403).json({ message: "Acesso negado" });
      if (negotiation.status !== "stale_awaiting_desmanche") {
        return res.status(400).json({ message: "Negociação não está aguardando resposta do desmanche" });
      }
      const updated = await storage.respondStaleAsDesmanche(req.params.id, response);
      res.json(updated);
    } catch (error) {
      console.error("Stale desmanche response error:", error);
      res.status(500).json({ message: "Erro ao processar resposta" });
    }
  });

  // Resposta do cliente sobre negociação parada
  app.patch("/api/negotiations/:id/stale-client-response", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const { response } = req.body;
      if (!["confirmed_nothing", "received_it"].includes(response)) {
        return res.status(400).json({ message: "Resposta inválida" });
      }
      const negotiation = await storage.getNegotiationById(req.params.id);
      if (!negotiation) return res.status(404).json({ message: "Negociação não encontrada" });
      if (negotiation.clientId !== clientId) return res.status(403).json({ message: "Acesso negado" });
      if (negotiation.status !== "stale_awaiting_client") {
        return res.status(400).json({ message: "Negociação não está aguardando confirmação do cliente" });
      }
      const reviewDeadlineDays = await storage.getSystemSettingNumber("reviewDeadlineDays", 10);
      const updated = await storage.respondStaleAsClient(req.params.id, response, reviewDeadlineDays);
      // Se o cliente confirmou que recebeu, gerar cobrança
      if (response === "received_it") {
        try {
          await triggerTransactionBilling(negotiation.desmancheId, negotiation.id);
        } catch (billingErr) {
          console.error("Billing on client stale response error:", billingErr);
        }
      }
      res.json(updated);
    } catch (error) {
      console.error("Stale client response error:", error);
      res.status(500).json({ message: "Erro ao processar resposta" });
    }
  });

  // Endpoint para checar bloqueio do cliente (usado no frontend)
  app.get("/api/client/review-block-status", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const maxOverdue = await storage.getSystemSettingNumber("maxOverdueBeforeBlock", 1);
      const overdueCount = await storage.getOverdueReviewCountForClient(clientId);
      const isBlocked = overdueCount >= maxOverdue;
      const pending = isBlocked ? await storage.getPendingReviewsForClient(clientId) : [];
      res.json({ isBlocked, overdueCount, pendingReviews: pending });
    } catch (error) {
      res.status(500).json({ message: "Erro" });
    }
  });

  // Endpoint para checar bloqueio do desmanche
  app.get("/api/desmanche/review-block-status", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const maxOverdue = await storage.getSystemSettingNumber("maxOverdueBeforeBlock", 1);
      const overdueCount = await storage.getOverdueReviewCountForDesmanche(desmancheId);
      const isBlocked = overdueCount >= maxOverdue;
      res.json({ isBlocked, overdueCount });
    } catch (error) {
      res.status(500).json({ message: "Erro" });
    }
  });

  // ============================================
  // ADMIN USER MANAGEMENT (PERMISSIONS)
  // ============================================

  app.get("/api/admin/admin-users", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const callerPerms = storage.getAdminPermissions((req as any).user.id);
      if (callerPerms !== null) {
        return res.status(403).json({ message: "Apenas super-admins podem gerenciar permissões" });
      }
      const admins = storage.getAdminUsers();
      const mapped = admins.map((a: any) => ({
        ...a,
        permissions: a.permissions ? JSON.parse(a.permissions) : null,
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ message: "Erro ao listar admins" });
    }
  });

  app.post("/api/admin/admin-users", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const callerPerms = storage.getAdminPermissions((req as any).user.id);
      if (callerPerms !== null) {
        return res.status(403).json({ message: "Apenas super-admins podem criar admins" });
      }
      const { name, email, phone, password, permissions } = req.body;
      if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });
      }
      const existing = await storage.getUserByEmail(email.trim());
      if (existing) return res.status(409).json({ message: "Email já cadastrado" });

      const created = await storage.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        password: password,
        type: "admin",
      });

      if (permissions && Array.isArray(permissions)) {
        storage.setAdminPermissions(created.id, permissions);
      }

      res.status(201).json({ id: created.id, name: created.name, email: created.email });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Erro ao criar admin" });
    }
  });

  app.patch("/api/admin/admin-users/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const callerPerms = storage.getAdminPermissions((req as any).user.id);
      if (callerPerms !== null) {
        return res.status(403).json({ message: "Apenas super-admins podem editar permissões" });
      }
      const { id } = req.params;
      const { permissions, name } = req.body;

      if (name) {
        storage.updateAdminUser(id, { name });
      }
      if (permissions !== undefined) {
        storage.setAdminPermissions(id, permissions);
      }

      const admins = storage.getAdminUsers();
      const updated = admins.find((a: any) => a.id === id);
      if (!updated) return res.status(404).json({ message: "Admin não encontrado" });
      res.json({ ...updated, permissions: updated.permissions ? JSON.parse(updated.permissions) : null });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar admin" });
    }
  });

  app.patch("/api/admin/admin-users/:id/status", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const callerPerms = storage.getAdminPermissions((req as any).user.id);
      if (callerPerms !== null) {
        return res.status(403).json({ message: "Apenas super-admins podem alterar status de admins" });
      }
      const { id } = req.params;
      const { status } = req.body;
      if (status !== "active" && status !== "inactive") {
        return res.status(400).json({ message: "Status inválido" });
      }
      if (id === (req as any).user.id) {
        return res.status(400).json({ message: "Você não pode desativar sua própria conta" });
      }
      storage.setUserStatus(id, status);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Toggle admin status error:", error);
      res.status(500).json({ message: "Erro ao atualizar status do admin" });
    }
  });

  app.delete("/api/admin/admin-users/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const callerPerms = storage.getAdminPermissions((req as any).user.id);
      if (callerPerms !== null) {
        return res.status(403).json({ message: "Apenas super-admins podem remover admins" });
      }
      const { id } = req.params;
      if (id === (req as any).user.id) {
        return res.status(400).json({ message: "Você não pode remover sua própria conta" });
      }
      storage.deleteAdminUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover admin" });
    }
  });

  // ============================================
  // COMPLAINTS / FEEDBACK
  // ============================================

  app.get("/api/complaints/my-desmanches", authMiddleware, requireType(["client"]), async (req, res) => {
    try {
      const clientId = (req as any).user.id;
      const result = await storage.getDesmanchesByClientInteractions(clientId);
      res.json(result);
    } catch (error) {
      console.error("Get my desmanches error:", error);
      res.status(500).json({ message: "Erro ao buscar desmanches" });
    }
  });

  app.post("/api/complaints", authMiddleware, async (req, res) => {
    try {
      const { type, subject, message, targetType, targetId, targetDescription, desmancheId } = req.body;
      if (!type || !["denuncia", "sugestao", "reclamacao"].includes(type)) {
        return res.status(400).json({ message: "Tipo inválido. Use: denuncia, sugestao ou reclamacao" });
      }
      if (!subject?.trim()) return res.status(400).json({ message: "Assunto obrigatório" });
      if (!message?.trim()) return res.status(400).json({ message: "Mensagem obrigatória" });

      const authorId = (req as any).user.id;
      const authorType = (req as any).user.type; // "client" or "desmanche"

      let authorName = "";
      if (authorType === "client" || authorType === "admin") {
        const u = await storage.getUserById(authorId);
        authorName = u?.name || "";
      } else if (authorType === "desmanche") {
        const d = await storage.getDesmancheById(authorId);
        authorName = d?.tradingName || d?.companyName || "";
      }

      const complaint = storage.createComplaint({
        type, subject: subject.trim(), message: message.trim(),
        authorId, authorType: authorType === "admin" ? "client" : authorType,
        authorName, targetType, targetId, targetDescription, desmancheId,
      });

      res.status(201).json(complaint);
    } catch (error) {
      console.error("Create complaint error:", error);
      res.status(500).json({ message: "Erro ao registrar" });
    }
  });

  app.get("/api/complaints/my", authMiddleware, async (req, res) => {
    try {
      const authorId = (req as any).user.id;
      const complaints = storage.getComplaintsByAuthor(authorId);
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar" });
    }
  });

  app.get("/api/admin/complaints", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { type, status } = req.query as any;
      const complaints = storage.getAllComplaints({ type, status });
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar reclamações" });
    }
  });

  app.patch("/api/admin/complaints/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const valid = ["pending", "reviewing", "resolved", "dismissed"];
      if (status && !valid.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }
      const updated = storage.updateComplaintStatus(id, status, adminNotes);
      if (!updated) return res.status(404).json({ message: "Não encontrado" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar" });
    }
  });

  // ============================================
  // ADMIN: CRIAR CLIENTE / DESMANCHE
  // ============================================

  app.post("/api/admin/create-client", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "Nome, e-mail, telefone e senha são obrigatórios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "E-mail já cadastrado" });

      const user = await storage.createUser({ name, email, phone, password, type: "client" });
      if (!user) return res.status(500).json({ message: "Erro ao criar cliente" });

      // Marca e-mail como verificado imediatamente
      storage.markEmailVerified(user.id);

      res.status(201).json({
        message: "Cliente cadastrado com sucesso",
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, type: user.type },
      });
    } catch (error) {
      console.error("Admin create client error:", error);
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.post("/api/admin/create-desmanche", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const {
        companyName, tradingName, cnpj, email, phone, password,
        responsibleName, responsibleCpf, vehicleTypes,
        // endereço (opcional)
        zipCode, street, number, complement, city, state,
      } = req.body;

      if (!companyName || !tradingName || !cnpj || !email || !phone || !password) {
        return res.status(400).json({ message: "Campos obrigatórios: Razão Social, Nome Fantasia, CNPJ, E-mail, Telefone e Senha" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      const existingEmail = await storage.getDesmancheByEmail(email);
      if (existingEmail) return res.status(400).json({ message: "E-mail já cadastrado" });

      const existingCnpj = await storage.getDesmancheByCnpj(cnpj);
      if (existingCnpj) return res.status(400).json({ message: "CNPJ já cadastrado" });

      // Cria já como ativo
      const desmanche = await storage.createDesmanche({
        companyName, tradingName,
        cnpj: cnpj.replace(/\D/g, ""),
        email, phone, password,
        responsibleName: responsibleName || undefined,
        responsibleCpf: responsibleCpf || undefined,
        vehicleTypes: JSON.stringify(vehicleTypes || []),
        plan: "monthly",
        status: "active",
      } as any);

      if (!desmanche) return res.status(500).json({ message: "Erro ao criar desmanche" });

      // Cria endereço se fornecido
      if (city && state && street && zipCode) {
        await storage.createOrUpdateDesmancheAddress(desmanche.id, { zipCode, street, number, complement, city, state });
      }

      res.status(201).json({
        message: "Desmanche cadastrado e ativado com sucesso",
        desmanche: { id: desmanche.id, tradingName: desmanche.tradingName, email: desmanche.email, status: desmanche.status },
      });
    } catch (error) {
      console.error("Admin create desmanche error:", error);
      res.status(500).json({ message: "Erro ao criar desmanche" });
    }
  });

  // ============================================
  // LICENSE ALERTS
  // ============================================

  // Desmanche: checks own Detran license expiry
  app.get("/api/desmanche/license-alert", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const alertDays = await storage.getSystemSettingNumber("licenseAlertDays", 30);
      const docs = await storage.getDocumentsByDesmanche(desmancheId);
      const detranDocs = docs.filter((d: any) => d.type === "credenciamento_detran" && d.validUntil);
      const now = Date.now();
      const thresholdMs = alertDays * 24 * 60 * 60 * 1000;
      const alerts = detranDocs.map((d: any) => {
        const validUntilMs = d.validUntil instanceof Date ? d.validUntil.getTime() : new Date(d.validUntil).getTime();
        const daysLeft = Math.ceil((validUntilMs - now) / (24 * 60 * 60 * 1000));
        return { id: d.id, name: d.name, validUntil: d.validUntil, daysLeft, expired: daysLeft < 0 };
      }).filter((d: any) => d.daysLeft <= alertDays);
      res.json({ alerts, alertDays });
    } catch (error) {
      console.error("License alert error:", error);
      res.status(500).json({ message: "Erro ao verificar licenças" });
    }
  });

  // Admin: returns all desmanches with expiring/expired Detran licenses
  app.get("/api/admin/license-alerts", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const alertDays = await storage.getSystemSettingNumber("licenseAlertDays", 30);
      const desmanches = await storage.getAllDesmanches();
      const now = Date.now();
      const thresholdMs = alertDays * 24 * 60 * 60 * 1000;
      const results = await Promise.all(desmanches.map(async (dm: any) => {
        const docs = await storage.getDocumentsByDesmanche(dm.id);
        const detranDocs = docs.filter((d: any) => d.type === "credenciamento_detran" && d.validUntil);
        const alerts = detranDocs.map((d: any) => {
          const validUntilMs = d.validUntil instanceof Date ? d.validUntil.getTime() : new Date(d.validUntil).getTime();
          const daysLeft = Math.ceil((validUntilMs - now) / (24 * 60 * 60 * 1000));
          return { id: d.id, name: d.name, validUntil: d.validUntil, daysLeft, expired: daysLeft < 0 };
        }).filter((d: any) => d.daysLeft <= alertDays);
        return { desmanche: { id: dm.id, companyName: dm.companyName, tradingName: dm.tradingName }, alerts };
      }));
      const withAlerts = results.filter((r: any) => r.alerts.length > 0);
      res.json({ items: withAlerts, alertDays });
    } catch (error) {
      console.error("Admin license alerts error:", error);
      res.status(500).json({ message: "Erro ao verificar licenças" });
    }
  });

  // ============================================
  // BILLING / ASAAS ROUTES
  // ============================================

  app.get("/api/billing/my", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      let billing = await storage.getDesmancheBilling(desmancheId);
      // Auto-create billing record with default model if desmanche hasn't configured it yet
      if (!billing) {
        billing = await storage.createOrUpdateDesmancheBilling(desmancheId, { billingModel: "per_transaction" });
      }
      const transactions = await storage.getBillingTransactionsByDesmanche(desmancheId);
      const capAmount = await storage.getSystemSettingNumber("monthlyCapAmount", 200);
      const perTxAmount = await storage.getSystemSettingNumber("perTransactionAmount", 25);
      const monthlyProposalCount = await storage.getMonthlyProposalCountForDesmanche(desmancheId);
      res.json({
        billing: billing || null,
        transactions,
        settings: { capAmount, perTxAmount },
        asaasConfigured: asaas.isAsaasConfigured(),
        monthlyProposalCount,
      });
    } catch (error) {
      console.error("Get billing error:", error);
      res.status(500).json({ message: "Erro ao buscar cobrança" });
    }
  });

  app.post("/api/billing/setup", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { billingModel, planId } = req.body;
      if (!billingModel || !["subscription", "per_transaction"].includes(billingModel)) {
        return res.status(400).json({ message: "Modelo de cobrança inválido" });
      }
      if (billingModel === "subscription" && !planId) {
        return res.status(400).json({ message: "Plano obrigatório para assinatura" });
      }
      const desmanche = await storage.getDesmancheById(desmancheId);
      if (!desmanche) return res.status(404).json({ message: "Desmanche não encontrado" });

      let asaasCustomerId: string | undefined;
      if (asaas.isAsaasConfigured()) {
        const customer = await asaas.createAsaasCustomer({
          name: desmanche.companyName,
          email: desmanche.email,
          phone: desmanche.phone,
          cpfCnpj: desmanche.cnpj,
        });
        if (customer && !("error" in customer)) asaasCustomerId = customer.id;
      }

      const billing = await storage.createOrUpdateDesmancheBilling(desmancheId, {
        billingModel,
        planId: planId || null,
        asaasCustomerId,
      });
      res.json(billing);
    } catch (error) {
      console.error("Billing setup error:", error);
      res.status(500).json({ message: "Erro ao configurar cobrança" });
    }
  });

  // Webhook Asaas - confirma pagamento
  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const { event, payment } = req.body;
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        if (payment?.id) {
          const allTx = await storage.getAllBillingTransactions();
          const tx = allTx.find((t: any) => t.asaasChargeId === payment.id);
          if (tx) {
            await storage.updateBillingTransactionStatus(tx.id, "paid");
          }
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Erro no webhook" });
    }
  });

  // Gerar/retentar cobrança Asaas para transação pendente sem link
  app.post("/api/billing/transactions/:txId/charge", authMiddleware, requireType(["desmanche"]), async (req, res) => {
    try {
      const desmancheId = (req as any).user.id;
      const { txId } = req.params;

      const allTx = await storage.getBillingTransactionsByDesmanche(desmancheId);
      const tx = allTx.find((t: any) => t.id === txId);
      if (!tx) return res.status(404).json({ message: "Transação não encontrada" });
      if (tx.status !== "pending") return res.status(400).json({ message: "Transação não está pendente" });
      if (tx.asaasChargeId) return res.status(400).json({ message: "Cobrança já existe no Asaas" });
      if (!asaas.isAsaasConfigured()) return res.status(400).json({ message: "Asaas não configurado" });

      let billing = await storage.getDesmancheBilling(desmancheId);
      if (!billing) return res.status(404).json({ message: "Dados de cobrança não encontrados" });

      // Se não tem cliente Asaas, cria agora
      if (!billing.asaasCustomerId) {
        const desmanche = await storage.getDesmancheById(desmancheId);
        if (!desmanche) return res.status(404).json({ message: "Desmanche não encontrado" });
        const customer = await asaas.createAsaasCustomer({
          name: desmanche.companyName,
          email: desmanche.email,
          phone: desmanche.phone,
          cpfCnpj: desmanche.cnpj,
        });
        if (!customer) return res.status(502).json({ message: "Erro de conexão com o Asaas. Tente novamente." });
        if ("error" in customer) {
          return res.status(422).json({ message: `Asaas: ${customer.error}. Verifique o CNPJ no Perfil da Empresa.` });
        }
        billing = await storage.createOrUpdateDesmancheBilling(desmancheId, { asaasCustomerId: customer.id });
      }

      const charge = await asaas.createAsaasCharge({
        customerId: billing!.asaasCustomerId!,
        value: tx.amount,
        dueDate: asaas.getDueDateString(3),
        description: tx.description || `Central dos Desmanches — transação #${txId.slice(0, 8)}`,
        billingType: "PIX",
      });
      if (!charge) return res.status(502).json({ message: "Erro ao criar cobrança no Asaas" });

      const paymentLink = charge.invoiceUrl || charge.bankSlipUrl;
      await storage.updateBillingTransactionStatus(txId, "pending", charge.id, paymentLink);

      res.json({ asaasChargeId: charge.id, paymentLink });
    } catch (error) {
      console.error("Retry charge error:", error);
      res.status(500).json({ message: "Erro ao gerar cobrança" });
    }
  });

  // ============================================
  // SUBSCRIPTION PLANS (ADMIN)
  // ============================================

  app.get("/api/subscription-plans", async (req, res) => {
    try {
      let onlyActive = true;
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded?.type === "admin") onlyActive = false;
        } catch {}
      }
      const plans = await storage.getAllSubscriptionPlans(onlyActive);
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar planos" });
    }
  });

  app.post("/api/subscription-plans", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const data = schema.insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar plano" });
    }
  });

  app.patch("/api/subscription-plans/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const plan = await storage.updateSubscriptionPlan(req.params.id, req.body);
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar plano" });
    }
  });

  app.delete("/api/subscription-plans/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar plano" });
    }
  });

  // ============================================
  // SYSTEM SETTINGS (ADMIN)
  // ============================================

  app.get("/api/admin/settings", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      const obj: Record<string, string> = {};
      for (const s of settings) obj[s.key] = s.value;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.patch("/api/admin/settings", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const allowed = ["reviewDeadlineDays", "maxOverdueBeforeBlock", "perTransactionAmount", "monthlyCapAmount", "asaasApiKey", "asaasEnvironment", "licenseAlertDays", "staleNegotiationDays"];
      const numericRanges: Record<string, [number, number]> = {
        reviewDeadlineDays: [1, 90],
        maxOverdueBeforeBlock: [1, 100],
        perTransactionAmount: [1, 1000],
        monthlyCapAmount: [1, 10000],
        licenseAlertDays: [1, 365],
        staleNegotiationDays: [7, 180],
      };
      for (const [key, value] of Object.entries(req.body)) {
        if (allowed.includes(key)) {
          if (key in numericRanges) {
            const num = Number(value);
            const [min, max] = numericRanges[key];
            if (isNaN(num) || num < min || num > max) {
              return res.status(400).json({ message: `${key} deve ser um número entre ${min} e ${max}` });
            }
          }
          await storage.setSystemSetting(key, String(value));
        }
      }
      // Apply Asaas config dynamically if updated
      const apiKey = await storage.getSystemSetting("asaasApiKey");
      const env = await storage.getSystemSetting("asaasEnvironment");
      asaas.setAsaasConfig(apiKey || "", env || "sandbox");

      const settings = await storage.getAllSystemSettings();
      const obj: Record<string, string> = {};
      for (const s of settings) obj[s.key] = s.value;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar configurações" });
    }
  });

  // ─── SITE SETTINGS (public read, admin write) ───────────────────────────────

  app.get("/api/site-settings", async (_req, res) => {
    try {
      res.json(storage.getSiteSettings());
    } catch {
      res.status(500).json({ message: "Erro ao buscar configurações do site" });
    }
  });

  app.patch("/api/site-settings", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      storage.setSiteSettings(req.body as Record<string, string>);
      res.json(storage.getSiteSettings());
    } catch {
      res.status(500).json({ message: "Erro ao salvar configurações do site" });
    }
  });

  // ─── REAL SITE STATS (public) ───────────────────────────────────────────────

  app.get("/api/site-stats/real", async (_req, res) => {
    try {
      res.json(storage.getRealStats());
    } catch (err) {
      console.error("Real stats error:", err);
      res.status(500).json({ message: "Erro ao buscar dados reais" });
    }
  });

  // ─── BRAND LOGOS (public read, admin write) ─────────────────────────────────

  app.get("/api/brand-logos", async (_req, res) => {
    try {
      res.json(storage.getBrandLogos());
    } catch {
      res.status(500).json({ message: "Erro ao buscar logos" });
    }
  });

  app.post("/api/brand-logos", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const { brandId, brandName, logoUrl, vehicleType } = req.body;
      if (!brandId || !brandName || !logoUrl) return res.status(400).json({ message: "brandId, brandName e logoUrl são obrigatórios" });
      const logo = storage.upsertBrandLogo(String(brandId), String(brandName), String(logoUrl), vehicleType || "car");
      res.json(logo);
    } catch {
      res.status(500).json({ message: "Erro ao salvar logo" });
    }
  });

  app.delete("/api/brand-logos/:id", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      storage.deleteBrandLogo(req.params.id);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Erro ao excluir logo" });
    }
  });

  // ============================================
  // ADMIN FINANCE
  // ============================================

  app.get("/api/admin/billing", authMiddleware, requireType(["admin"]), async (req, res) => {
    try {
      const transactions = await storage.getAllBillingTransactions();
      const totalPaid = transactions
        .filter((t: any) => t.status === "paid")
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalPending = transactions
        .filter((t: any) => t.status === "pending")
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const plans = await storage.getAllSubscriptionPlans();
      res.json({ transactions, totalPaid, totalPending, plans });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar financeiro" });
    }
  });

  // Auto-expire overdue reviews e order items
  async function runAutoExpire() {
    try {
      // Auto-complete negociações com prazo de avaliação vencido e gerar cobrança para cada uma
      const expired = await storage.autoExpireOverdueReviews();
      for (const neg of expired) {
        try {
          await triggerTransactionBilling(neg.desmancheId, neg.id);
        } catch (billingErr) {
          console.error(`Billing on auto-expire error for neg ${neg.id}:`, billingErr);
        }
      }

      // Detectar negociações paradas e mover para verificação
      const staleDays = await storage.getSystemSettingNumber("staleNegotiationDays", 30);
      await storage.detectStaleNegotiations(staleDays);

      await storage.expireOldOrderItems();
      await storage.expireOldOrders();
      storage.expireOrdersWithAllExpiredItems();
    } catch (e) {
      console.error("Auto-expire error:", e);
    }
  }

  // Billing helper
  async function triggerTransactionBilling(desmancheId: string, negotiationId: string) {
    let billing = await storage.getDesmancheBilling(desmancheId);

    // Auto-create billing record with default per_transaction model if not set up yet
    if (!billing) {
      billing = await storage.createOrUpdateDesmancheBilling(desmancheId, { billingModel: "per_transaction" });
    }

    if (!billing || billing.billingModel !== "per_transaction") return;

    const capAmount = await storage.getSystemSettingNumber("monthlyCapAmount", 200);
    const perTxAmount = await storage.getSystemSettingNumber("perTransactionAmount", 25);

    // Se já atingiu o teto este mês, isento
    if (billing.monthlyAmountPaid >= capAmount) {
      await storage.createBillingTransaction({
        desmancheId,
        negotiationId,
        amount: 0,
        type: "per_transaction",
        description: "Isento — teto mensal atingido",
        status: "exempt",
      });
      return;
    }

    const chargeAmount = Math.min(perTxAmount, capAmount - billing.monthlyAmountPaid);
    let asaasChargeId: string | undefined;
    let paymentLink: string | undefined;

    if (asaas.isAsaasConfigured() && billing.asaasCustomerId) {
      const charge = await asaas.createAsaasCharge({
        customerId: billing.asaasCustomerId,
        value: chargeAmount,
        dueDate: asaas.getDueDateString(3),
        description: `Central dos Desmanches — transação #${negotiationId.slice(0, 8)}`,
        billingType: "PIX",
      });
      if (charge) {
        asaasChargeId = charge.id;
        paymentLink = charge.invoiceUrl || charge.bankSlipUrl;
      }
    }

    const tx = await storage.createBillingTransaction({
      desmancheId,
      negotiationId,
      amount: chargeAmount,
      type: "per_transaction",
      description: `Transação — negociação #${negotiationId.slice(0, 8)}`,
      asaasChargeId,
      paymentLink,
      status: asaas.isAsaasConfigured() ? "pending" : "pending",
    });

    await storage.incrementBillingTransaction(desmancheId, chargeAmount);
    return tx;
  }

  // Run auto-expire on startup and every hour
  runAutoExpire();
  setInterval(runAutoExpire, 60 * 60 * 1000);

  // Seed database
  await storage.seedDatabase();
  console.log("Database seeded successfully");

  // Load Asaas config from DB (overrides env var if set in admin panel)
  const savedApiKey = await storage.getSystemSetting("asaasApiKey");
  const savedEnv = await storage.getSystemSetting("asaasEnvironment");
  if (savedApiKey) {
    asaas.setAsaasConfig(savedApiKey, savedEnv || "sandbox");
    console.log(`Asaas configured from DB (${savedEnv || "sandbox"})`);
  }
}
