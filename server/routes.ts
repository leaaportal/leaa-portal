import type { Express } from "express";
import type { Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";

const SessionStore = MemoryStore(session);

export async function registerRoutes(server: Server, app: Express) {
  // Session middleware
  app.use(
    session({
      secret: "leaa-portal-secret-2026",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 86400000 }, // 24 hours
    })
  );

  // Auth middleware
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  // Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, accessCode } = loginSchema.parse(req.body);
      const user = storage.getUserByEmail(email.toLowerCase());
      
      if (!user || user.accessCode !== accessCode) {
        return res.status(401).json({ message: "Invalid email or access code" });
      }

      (req.session as any).userId = user.id;
      const { accessCode: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (e: any) {
      return res.status(400).json({ message: e.message || "Invalid request" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    return res.json({ ok: true });
  });

  // Current user
  app.get("/api/auth/me", (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    
    const { accessCode: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // Projects
  app.get("/api/projects", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const userProjects = storage.getProjectsByUserId(userId);
    return res.json(userProjects);
  });

  app.get("/api/projects/:id", requireAuth, (req, res) => {
    const project = storage.getProjectById(parseInt(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.json(project);
  });

  // Milestones
  app.get("/api/projects/:id/milestones", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const ms = storage.getMilestonesByProjectId(projectId);
    
    // Enrich with sub-milestones and deliverables
    const enriched = ms.map((m) => ({
      ...m,
      subMilestones: storage.getSubMilestonesByMilestoneId(m.id),
      deliverables: storage.getDeliverablesByMilestoneId(m.id),
    }));
    
    return res.json(enriched);
  });

  // Deliverables for a project
  app.get("/api/projects/:id/deliverables", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const ms = storage.getMilestonesByProjectId(projectId);
    
    const grouped = ms.map((m) => ({
      milestone: m,
      deliverables: storage.getDeliverablesByMilestoneId(m.id),
    }));
    
    return res.json(grouped);
  });

  // Messages
  app.get("/api/projects/:id/messages", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const msgs = storage.getMessagesByProjectId(projectId);
    return res.json(msgs);
  });

  // Send a message (client can send now)
  app.post("/api/projects/:id/messages", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const userId = (req.session as any).userId;
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const msg = storage.createMessage({
      projectId,
      senderName: user.name,
      senderRole: "client",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: 1,
    });

    return res.json(msg);
  });

  // Support Tickets
  app.get("/api/tickets", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const tickets = storage.getTicketsByUserId(userId);
    return res.json(tickets);
  });

  app.get("/api/tickets/:id", requireAuth, (req, res) => {
    const ticket = storage.getTicketById(parseInt(req.params.id));
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    const replies = storage.getRepliesByTicketId(ticket.id);
    return res.json({ ticket, replies });
  });

  app.post("/api/tickets", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const userProjects = storage.getProjectsByUserId(userId);
    const projectId = userProjects[0]?.id;
    if (!projectId) return res.status(400).json({ message: "No project found" });

    const { subject, category, priority, description, attachmentRef } = req.body;
    if (!subject || !category || !description) {
      return res.status(400).json({ message: "Subject, category, and description are required" });
    }

    const now = new Date().toISOString();
    const ticket = storage.createTicket({
      projectId,
      userId,
      subject,
      category,
      priority: priority || "normal",
      status: "open",
      attachmentRef: attachmentRef || null,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial reply from description
    storage.createTicketReply({
      ticketId: ticket.id,
      senderName: user.name,
      senderRole: "client",
      content: description,
      createdAt: now,
    });

    return res.json(ticket);
  });

  app.post("/api/tickets/:id/replies", requireAuth, (req, res) => {
    const ticketId = parseInt(req.params.id);
    const userId = (req.session as any).userId;
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const ticket = storage.getTicketById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    const reply = storage.createTicketReply({
      ticketId,
      senderName: user.name,
      senderRole: "client",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });

    return res.json(reply);
  });

  // Resources
  app.get("/api/resources", requireAuth, (req, res) => {
    const allResources = storage.getAllResources();
    return res.json(allResources);
  });

  // Notifications
  app.get("/api/notifications", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const notifs = storage.getNotificationsByUserId(userId);
    return res.json(notifs);
  });

  app.post("/api/notifications/:id/read", requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    storage.markNotificationRead(id);
    return res.json({ ok: true });
  });

  app.post("/api/notifications/read-all", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    storage.markAllNotificationsRead(userId);
    return res.json({ ok: true });
  });

  // Payments
  app.get("/api/payments", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const pmts = storage.getPaymentsByUserId(userId);
    return res.json(pmts);
  });

  // Sessions Schedule
  app.get("/api/projects/:id/sessions", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const sess = storage.getSessionsByProjectId(projectId);
    return res.json(sess);
  });

  // Dashboard summary (enhanced)
  app.get("/api/dashboard", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const user = storage.getUserById(userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const userProjects = storage.getProjectsByUserId(userId);
    const project = userProjects[0]; // Primary project

    if (!project) {
      return res.json({
        user: { name: user.name, brandName: user.brandName },
        project: null,
        milestones: [],
        recentMessages: [],
        overallProgress: 0,
        unreadNotifications: 0,
        openTickets: 0,
        nextSession: null,
      });
    }

    const ms = storage.getMilestonesByProjectId(project.id);
    const enrichedMs = ms.map((m) => {
      const subs = storage.getSubMilestonesByMilestoneId(m.id);
      const deliv = storage.getDeliverablesByMilestoneId(m.id);
      return { ...m, subMilestones: subs, deliverables: deliv };
    });

    // Calculate overall progress
    let totalSubs = 0;
    let completedSubs = 0;
    enrichedMs.forEach((m) => {
      totalSubs += m.subMilestones.length;
      completedSubs += m.subMilestones.filter((s) => s.status === "completed").length;
    });
    const overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    const msgs = storage.getMessagesByProjectId(project.id);

    // Get notification count
    const notifs = storage.getNotificationsByUserId(userId);
    const unreadNotifications = notifs.filter((n) => !n.isRead).length;

    // Get open tickets count
    const tickets = storage.getTicketsByUserId(userId);
    const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

    // Get next session
    const allSessions = storage.getSessionsByProjectId(project.id);
    const nextSession = allSessions.find((s) => s.status === "upcoming") || null;

    const { accessCode: _, ...safeUser } = user;

    return res.json({
      user: safeUser,
      project,
      milestones: enrichedMs,
      recentMessages: msgs.slice(0, 5),
      overallProgress,
      unreadNotifications,
      openTickets,
      nextSession,
    });
  });
}
