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

  // Admin auth middleware
  function requireAdmin(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = storage.getUserById(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
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

    const now2 = new Date().toISOString();
    const msg = storage.createMessage({
      projectId,
      senderName: user.name,
      senderRole: "client",
      content: content.trim(),
      createdAt: now2,
      isRead: 1,
    });

    // Auto-create admin notification
    storage.createAdminNotification({
      type: "message_received",
      title: `New message from ${user.name}`,
      message: content.trim().slice(0, 100),
      clientName: user.name,
      projectId: projectId,
      relatedId: msg.id,
      isRead: 0,
      priority: "normal",
      createdAt: now2,
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

    // Auto-create admin notification
    const project2 = storage.getProjectById(projectId);
    storage.createAdminNotification({
      type: "ticket_created",
      title: `New support ticket: ${subject}`,
      message: `${user.name} submitted a ticket: "${subject}"`,
      clientName: user.name,
      projectId: projectId,
      relatedId: ticket.id,
      isRead: 0,
      priority: priority === "urgent" ? "urgent" : "high",
      createdAt: now,
    });

    // Auto-create admin task
    storage.createAdminTask({
      projectId: projectId,
      userId: userId,
      title: `Respond to ticket: ${subject}`,
      description: `Client ${user.name} submitted a support ticket. Category: ${category}. Priority: ${priority || "normal"}.`,
      assignedTo: "brandon",
      priority: priority === "urgent" ? "urgent" : "normal",
      status: "todo",
      category: "follow_up",
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      isAutoGenerated: 1,
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

    // Auto-create admin notification if client reply
    if (user.role === "client") {
      const ticket2 = storage.getTicketById(ticketId);
      storage.createAdminNotification({
        type: "ticket_reply",
        title: `New reply on ticket: ${ticket2?.subject || "Support ticket"}`,
        message: `${user.name} replied to ticket "${ticket2?.subject || "Support ticket"}"`,
        clientName: user.name,
        projectId: ticket2?.projectId,
        relatedId: ticketId,
        isRead: 0,
        priority: "normal",
        createdAt: new Date().toISOString(),
      });
    }

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

  // ===== ADMIN ROUTES =====

  // Admin dashboard stats
  app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
    try {
      const stats = storage.getAdminDashboardStats();
      return res.json(stats);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get all clients
  app.get("/api/admin/clients", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      // Enrich with project data
      const enriched = clients.map((client) => {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0] || null;
        let overallProgress = 0;
        if (project) {
          const ms = storage.getMilestonesByProjectId(project.id);
          let totalSubs = 0;
          let completedSubs = 0;
          ms.forEach((m) => {
            const subs = storage.getSubMilestonesByMilestoneId(m.id);
            totalSubs += subs.length;
            completedSubs += subs.filter((s) => s.status === "completed").length;
          });
          overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
        }
        const { accessCode: _, ...safeClient } = client;
        return { ...safeClient, project, overallProgress };
      });
      return res.json(enriched);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Create new client with project and milestones
  app.post("/api/admin/clients", requireAdmin, (req, res) => {
    try {
      const { name, email, brandName, accessCode, serviceType, startDate } = req.body;
      if (!name || !email || !brandName || !accessCode || !serviceType || !startDate) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const result = storage.createClientWithProject({ name, email, brandName, accessCode, serviceType, startDate });
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get single client detail
  app.get("/api/admin/clients/:id", requireAdmin, (req, res) => {
    try {
      const detail = storage.getClientDetail(parseInt(req.params.id));
      const { accessCode: _, ...safeUser } = detail.user;
      return res.json({ ...detail, user: safeUser });
    } catch (e: any) {
      return res.status(404).json({ message: e.message });
    }
  });

  // Update milestone status
  app.patch("/api/admin/milestones/:id", requireAdmin, (req, res) => {
    try {
      const { status, notes } = req.body;
      storage.updateMilestoneStatus(parseInt(req.params.id), status, notes);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Toggle sub-milestone status
  app.patch("/api/admin/sub-milestones/:id", requireAdmin, (req, res) => {
    try {
      const { status } = req.body;
      storage.updateSubMilestoneStatus(parseInt(req.params.id), status);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get all tickets
  app.get("/api/admin/tickets", requireAdmin, (req, res) => {
    try {
      const { status } = req.query;
      const tickets = storage.getAllTickets(status as string | undefined);
      return res.json(tickets);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Update ticket status
  app.patch("/api/admin/tickets/:id", requireAdmin, (req, res) => {
    try {
      const { status } = req.body;
      storage.updateTicketStatus(parseInt(req.params.id), status);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Reply to ticket as admin
  app.post("/api/admin/tickets/:id/reply", requireAdmin, (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const adminUserId = (req.session as any).userId;
      const adminUser = storage.getUserById(adminUserId);
      if (!adminUser) return res.status(401).json({ message: "User not found" });

      const { content, senderName } = req.body;
      if (!content) return res.status(400).json({ message: "Content is required" });

      const reply = storage.createTicketReply({
        ticketId,
        senderName: senderName || adminUser.name,
        senderRole: "admin",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      });

      // Update ticket status to in_progress if it was open
      const ticket = storage.getTicketById(ticketId);
      if (ticket && ticket.status === "open") {
        storage.updateTicketStatus(ticketId, "in_progress");
      }

      return res.json(reply);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get all messages grouped by project
  app.get("/api/admin/messages", requireAdmin, (req, res) => {
    try {
      const msgs = storage.getAllMessages();
      return res.json(msgs);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Send message to client project as admin
  app.post("/api/admin/messages", requireAdmin, (req, res) => {
    try {
      const adminUserId = (req.session as any).userId;
      const adminUser = storage.getUserById(adminUserId);
      if (!adminUser) return res.status(401).json({ message: "User not found" });

      const { projectId, content, senderName } = req.body;
      if (!projectId || !content) {
        return res.status(400).json({ message: "projectId and content are required" });
      }

      const msg = storage.createMessage({
        projectId: parseInt(projectId),
        senderName: senderName || adminUser.name,
        senderRole: "admin",
        content: content.trim(),
        createdAt: new Date().toISOString(),
        isRead: 0,
      });

      return res.json(msg);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get all deliverables grouped by client
  app.get("/api/admin/deliverables", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result = clients.map((client) => {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0] || null;
        const delivs = project ? storage.getDeliverablesByProjectId(project.id) : [];
        const { accessCode: _, ...safeClient } = client;
        return { client: safeClient, project, deliverables: delivs };
      });
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Create deliverable
  app.post("/api/admin/deliverables", requireAdmin, (req, res) => {
    try {
      const { milestoneId, title, fileUrl, fileStatus, version } = req.body;
      if (!milestoneId || !title) {
        return res.status(400).json({ message: "milestoneId and title are required" });
      }
      const deliv = storage.createDeliverable({ milestoneId: parseInt(milestoneId), title, fileUrl, fileStatus, version });
      return res.json(deliv);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Update deliverable
  app.patch("/api/admin/deliverables/:id", requireAdmin, (req, res) => {
    try {
      const { title, fileUrl, fileStatus, version } = req.body;
      storage.updateDeliverable(parseInt(req.params.id), { title, fileUrl, fileStatus, version });
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Get all projects (admin)
  app.get("/api/admin/projects", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result = clients.map((client) => {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0] || null;
        if (!project) return null;
        const ms = storage.getMilestonesByProjectId(project.id);
        let totalSubs = 0;
        let completedSubs = 0;
        const enrichedMs = ms.map((m) => {
          const subs = storage.getSubMilestonesByMilestoneId(m.id);
          totalSubs += subs.length;
          completedSubs += subs.filter((s) => s.status === "completed").length;
          return { ...m, subMilestones: subs };
        });
        const overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
        const { accessCode: _, ...safeClient } = client;
        return { client: safeClient, project, milestones: enrichedMs, overallProgress };
      }).filter(Boolean);
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== NEW FEATURE ROUTES — CLIENT =====

  // Approvals for a project
  app.get("/api/projects/:id/approvals", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const approvs = storage.getApprovalsByProjectId(projectId);
    return res.json(approvs);
  });

  app.patch("/api/approvals/:id", requireAuth, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      const user = storage.getUserById(userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      const { status, notes } = req.body;
      if (!status) return res.status(400).json({ message: "Status is required" });
      const approval = storage.getApprovalById(id);
      storage.updateApprovalStatus(id, status, user.name, notes);

      // Auto-create admin notification if client responded
      if (user.role === "client" && approval) {
        const nowApproval = new Date().toISOString();
        storage.createAdminNotification({
          type: "approval_response",
          title: `Approval ${status}: ${approval.title}`,
          message: `${user.name} ${status === "approved" ? "approved" : "rejected/requested revision for"} "${approval.title}"${notes ? `: ${notes.slice(0, 80)}` : ""}`,
          clientName: user.name,
          projectId: approval.projectId,
          relatedId: id,
          isRead: 0,
          priority: "high",
          createdAt: nowApproval,
        });
      }
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Session Notes
  app.get("/api/milestones/:id/notes", requireAuth, (req, res) => {
    const milestoneId = parseInt(req.params.id);
    const notes = storage.getSessionNotesByMilestoneId(milestoneId);
    return res.json(notes);
  });

  // Hour logs for a project
  app.get("/api/projects/:id/hours", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const logs = storage.getHourLogsByProjectId(projectId);
    return res.json(logs);
  });

  // Styles
  app.get("/api/projects/:id/styles", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const projectStyles = storage.getStylesByProjectId(projectId);
    const enriched = projectStyles.map((s) => ({
      ...s,
      materials: storage.getMaterialsByStyleId(s.id),
      costSheet: storage.getCostSheetByStyleId(s.id) || null,
    }));
    return res.json(enriched);
  });

  // Materials for a project
  app.get("/api/projects/:id/materials", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const mats = storage.getMaterialsByProjectId(projectId);
    return res.json(mats);
  });

  // Legal Documents
  app.get("/api/projects/:id/documents", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const docs = storage.getLegalDocumentsByProjectId(projectId);
    return res.json(docs);
  });

  app.get("/api/documents/:id", requireAuth, (req, res) => {
    const doc = storage.getLegalDocumentById(parseInt(req.params.id));
    if (!doc) return res.status(404).json({ message: "Document not found" });
    return res.json(doc);
  });

  // Sign a document
  app.post("/api/documents/:id/sign", requireAuth, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      const user = storage.getUserById(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const doc = storage.getLegalDocumentById(id);
      if (!doc) return res.status(404).json({ message: "Document not found" });

      const { signatureText } = req.body;
      if (!signatureText || typeof signatureText !== "string" || signatureText.trim().length === 0) {
        return res.status(400).json({ message: "Signature text is required" });
      }

      const signedAt = new Date().toISOString();
      storage.updateLegalDocument(id, {
        status: "signed",
        signedAt,
        signedBy: user.name,
        signatureText: signatureText.trim(),
      });

      // Auto-create admin notification
      storage.createAdminNotification({
        type: "document_signed",
        title: `Document signed: ${doc.title}`,
        message: `${user.name} signed "${doc.title}"`,
        clientName: user.name,
        projectId: doc.projectId,
        relatedId: id,
        isRead: 0,
        priority: "normal",
        createdAt: signedAt,
      });

      // Auto-create admin task to review
      storage.createAdminTask({
        projectId: doc.projectId,
        userId: userId,
        title: `Review signed ${doc.title}`,
        description: `${user.name} has signed "${doc.title}". Please review and file.`,
        assignedTo: "brandon",
        priority: "normal",
        status: "todo",
        category: "legal",
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
        isAutoGenerated: 1,
        createdAt: signedAt,
      });

      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Mark document as viewed
  app.post("/api/documents/:id/view", requireAuth, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doc = storage.getLegalDocumentById(id);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (doc.status === "sent") {
        storage.updateLegalDocument(id, { status: "viewed" });
      }
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== NEW FEATURE ROUTES — ADMIN =====

  // Admin: Get all approvals across all clients
  app.get("/api/admin/approvals", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result: any[] = [];
      for (const client of clients) {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0];
        if (!project) continue;
        const approvs = storage.getApprovalsByProjectId(project.id);
        const { accessCode: _, ...safeClient } = client;
        result.push(...approvs.map((a) => ({ ...a, client: safeClient, project })));
      }
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Create approval
  app.post("/api/admin/approvals", requireAdmin, (req, res) => {
    try {
      const { projectId, milestoneId, deliverableId, type, title, description } = req.body;
      if (!projectId || !type || !title) {
        return res.status(400).json({ message: "projectId, type, and title are required" });
      }
      const approval = storage.createApproval({
        projectId: parseInt(projectId),
        milestoneId: milestoneId ? parseInt(milestoneId) : null,
        deliverableId: deliverableId ? parseInt(deliverableId) : null,
        type,
        title,
        description: description || null,
        status: "pending",
        approvedBy: null,
        approvedAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      });
      return res.json(approval);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Session notes
  app.post("/api/admin/milestones/:id/notes", requireAdmin, (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const adminUserId = (req.session as any).userId;
      const adminUser = storage.getUserById(adminUserId);
      if (!adminUser) return res.status(401).json({ message: "User not found" });

      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Content is required" });

      const note = storage.createSessionNote({
        milestoneId,
        content: content.trim(),
        createdBy: adminUser.name,
        createdAt: new Date().toISOString(),
      });
      return res.json(note);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Hour logs
  app.get("/api/admin/hours", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result: any[] = [];
      for (const client of clients) {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0];
        if (!project) continue;
        const logs = storage.getHourLogsByProjectId(project.id);
        const { accessCode: _, ...safeClient } = client;
        result.push(...logs.map((l) => ({ ...l, client: safeClient, project })));
      }
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/hours", requireAdmin, (req, res) => {
    try {
      const adminUserId = (req.session as any).userId;
      const adminUser = storage.getUserById(adminUserId);
      if (!adminUser) return res.status(401).json({ message: "User not found" });

      const { projectId, milestoneId, hours, description, date } = req.body;
      if (!projectId || !hours || !description || !date) {
        return res.status(400).json({ message: "projectId, hours, description, and date are required" });
      }

      const log = storage.createHourLog({
        projectId: parseInt(projectId),
        milestoneId: milestoneId ? parseInt(milestoneId) : null,
        hours: parseFloat(hours),
        description: description.trim(),
        date,
        loggedBy: adminUser.name,
      });
      return res.json(log);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Styles
  app.get("/api/admin/styles", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result: any[] = [];
      for (const client of clients) {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0];
        if (!project) continue;
        const projectStyles = storage.getStylesByProjectId(project.id);
        const { accessCode: _, ...safeClient } = client;
        result.push(...projectStyles.map((s) => ({ ...s, client: safeClient, project })));
      }
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/styles", requireAdmin, (req, res) => {
    try {
      const { projectId, name, category, description, status } = req.body;
      if (!projectId || !name || !category) {
        return res.status(400).json({ message: "projectId, name, and category are required" });
      }
      const style = storage.createStyle({
        projectId: parseInt(projectId),
        name,
        category,
        description: description || null,
        status: status || "concept",
        imageUrl: null,
        techPackUrl: null,
        patternStatus: "not_started",
        createdAt: new Date().toISOString(),
      });
      return res.json(style);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/styles/:id", requireAdmin, (req, res) => {
    try {
      const { name, category, description, status, patternStatus, techPackUrl } = req.body;
      storage.updateStyle(parseInt(req.params.id), { name, category, description, status, patternStatus, techPackUrl });
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Materials
  app.post("/api/admin/materials", requireAdmin, (req, res) => {
    try {
      const { projectId, styleId, type, name, supplier, costPerUnit, moq, status, notes } = req.body;
      if (!projectId || !type || !name) {
        return res.status(400).json({ message: "projectId, type, and name are required" });
      }
      const material = storage.createMaterial({
        projectId: parseInt(projectId),
        styleId: styleId ? parseInt(styleId) : null,
        type,
        name,
        supplier: supplier || null,
        costPerUnit: costPerUnit || null,
        moq: moq || null,
        status: status || "researching",
        swatchUrl: null,
        notes: notes || null,
        createdAt: new Date().toISOString(),
      });
      return res.json(material);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/materials/:id", requireAdmin, (req, res) => {
    try {
      const data = req.body;
      storage.updateMaterial(parseInt(req.params.id), data);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Document templates
  app.get("/api/admin/document-templates", requireAdmin, (req, res) => {
    try {
      const templates = storage.getAllDocumentTemplates();
      return res.json(templates);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/document-templates", requireAdmin, (req, res) => {
    try {
      const { name, category, content } = req.body;
      if (!name || !category || !content) {
        return res.status(400).json({ message: "name, category, and content are required" });
      }
      const template = storage.createDocumentTemplate({
        name,
        category,
        content,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });
      return res.json(template);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // Admin: Update document template
  app.put("/api/admin/document-templates/:id", requireAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, category, content } = req.body;
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (content !== undefined) updateData.content = content;
      if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No fields to update" });
      storage.updateDocumentTemplate(id, updateData as any);
      return res.json({ success: true, id });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // Admin: Soft-delete document template
  app.delete("/api/admin/document-templates/:id", requireAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      storage.updateDocumentTemplate(id, { isActive: 0 } as any);
      return res.json({ success: true, id });
    } catch (e: any) { return res.status(500).json({ message: e.message }); }
  });

  // Admin: Legal documents — get all, send to client
  app.get("/api/admin/documents", requireAdmin, (req, res) => {
    try {
      const clients = storage.getAllClients();
      const result: any[] = [];
      for (const client of clients) {
        const clientProjects = storage.getProjectsByUserId(client.id);
        const project = clientProjects[0];
        if (!project) continue;
        const docs = storage.getLegalDocumentsByProjectId(project.id);
        const { accessCode: _, ...safeClient } = client;
        result.push(...docs.map((d) => ({ ...d, client: safeClient, project })));
      }
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/documents", requireAdmin, (req, res) => {
    try {
      const { projectId, userId, templateId, title, category, content, dueDate, required } = req.body;
      if (!projectId || !userId || !title || !category || !content) {
        return res.status(400).json({ message: "projectId, userId, title, category, and content are required" });
      }

      const now = new Date().toISOString();
      let templateName = "Custom Document";
      if (templateId) {
        const tmpl = storage.getDocumentTemplateById(parseInt(templateId));
        if (tmpl) templateName = tmpl.name;
      }

      const doc = storage.createLegalDocument({
        projectId: parseInt(projectId),
        userId: parseInt(userId),
        templateName,
        title,
        category,
        content,
        status: "sent",
        sentAt: now,
        signedAt: null,
        signedBy: null,
        signatureText: null,
        dueDate: dueDate || null,
        required: required ? 1 : 0,
        createdAt: now,
      });
      return res.json(doc);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== PHASE A: Admin Notifications Routes =====

  app.get("/api/admin/notifications", requireAdmin, (req, res) => {
    try {
      const { read, type } = req.query;
      const filter: any = {};
      if (read === "unread") filter.isRead = false;
      if (read === "read") filter.isRead = true;
      if (type) filter.type = type as string;
      const notifs = storage.getAdminNotifications(filter);
      return res.json(notifs);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/notifications/:id/read", requireAdmin, (req, res) => {
    try {
      storage.markAdminNotificationRead(parseInt(req.params.id));
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/notifications/read-all", requireAdmin, (req, res) => {
    try {
      storage.markAllAdminNotificationsRead();
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== PHASE A: Admin Tasks Routes =====

  app.get("/api/admin/tasks", requireAdmin, (req, res) => {
    try {
      const { status, assignedTo, clientId, category } = req.query;
      const filter: any = {};
      if (status) filter.status = status as string;
      if (assignedTo) filter.assignedTo = assignedTo as string;
      if (clientId) filter.clientId = parseInt(clientId as string);
      if (category) filter.category = category as string;
      const tasks = storage.getAdminTasks(filter);
      // Enrich with client info
      const enriched = tasks.map((task) => {
        let clientName = null;
        let clientBrandName = null;
        if (task.userId) {
          const u = storage.getUserById(task.userId);
          if (u) { clientName = u.name; clientBrandName = u.brandName; }
        } else if (task.projectId) {
          const proj = storage.getProjectById(task.projectId);
          if (proj) {
            const u = storage.getUserById(proj.userId);
            if (u) { clientName = u.name; clientBrandName = u.brandName; }
          }
        }
        return { ...task, clientName, clientBrandName };
      });
      return res.json(enriched);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/tasks", requireAdmin, (req, res) => {
    try {
      const { projectId, userId, title, description, assignedTo, priority, status, category, dueDate, complianceGate, notes } = req.body;
      if (!title || !category) {
        return res.status(400).json({ message: "title and category are required" });
      }
      const task = storage.createAdminTask({
        projectId: projectId ? parseInt(projectId) : null,
        userId: userId ? parseInt(userId) : null,
        title,
        description: description || null,
        assignedTo: assignedTo || "brandon",
        priority: priority || "normal",
        status: status || "todo",
        category,
        dueDate: dueDate || null,
        isAutoGenerated: 0,
        complianceGate: complianceGate || null,
        notes: notes || null,
        createdAt: new Date().toISOString(),
      });
      return res.json(task);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tasks/:id", requireAdmin, (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, assignedTo, priority, notes, dueDate, title, description, complianceGate } = req.body;
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (priority !== undefined) updateData.priority = priority;
      if (notes !== undefined) updateData.notes = notes;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (complianceGate !== undefined) updateData.complianceGate = complianceGate;
      const updated = storage.updateAdminTask(id, updateData);
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== PHASE A: Smart Admin Dashboard Stats =====

  app.get("/api/admin/dashboard-v2", requireAdmin, (req, res) => {
    try {
      const unreadNotifications = storage.getUnreadAdminNotificationCount();
      const overdueTasks = storage.getOverdueTaskCount();

      // Pending approvals
      const allClients2 = storage.getAllClients();
      let pendingApprovals = 0;
      let unsignedDocuments = 0;
      let totalRevenueMonth = 0;
      let hoursLoggedMonth = 0;
      const today2 = new Date();
      const monthStr = today2.toISOString().slice(0, 7);

      for (const client of allClients2) {
        const clientProjects2 = storage.getProjectsByUserId(client.id);
        const proj = clientProjects2[0];
        if (!proj) continue;
        const approvs = storage.getApprovalsByProjectId(proj.id);
        pendingApprovals += approvs.filter(a => a.status === "pending").length;
        const docs = storage.getLegalDocumentsByProjectId(proj.id);
        unsignedDocuments += docs.filter(d => d.status === "sent" || d.status === "pending" || d.status === "viewed").length;
        const logs = storage.getHourLogsByProjectId(proj.id);
        hoursLoggedMonth += logs.filter(l => l.date.startsWith(monthStr)).reduce((s, l) => s + l.hours, 0);
      }

      // Monthly revenue from payments
      const allPaymentsRaw = allClients2.flatMap(c => storage.getPaymentsByUserId(c.id));
      totalRevenueMonth = allPaymentsRaw.filter(p => p.status === "paid" && p.paidDate && p.paidDate.startsWith(monthStr)).reduce((s, p) => s + p.amount, 0);

      // Today's tasks (due today or overdue, not done)
      const todayStr = today2.toISOString().split("T")[0];
      const allTasks = storage.getAdminTasks();
      const todayTasks = allTasks.filter(t => t.dueDate && t.dueDate <= todayStr && t.status !== "done").slice(0, 10);
      const todayTasksEnriched = todayTasks.map(t => {
        let clientName = null;
        if (t.userId) {
          const u = storage.getUserById(t.userId);
          if (u) clientName = u.name;
        } else if (t.projectId) {
          const proj = storage.getProjectById(t.projectId);
          if (proj) {
            const u = storage.getUserById(proj.userId);
            if (u) clientName = u.name;
          }
        }
        return { ...t, clientName };
      });

      // Recent activity (from admin notifications, last 10)
      const recentActivity = storage.getAdminNotifications({}).slice(0, 10);

      // Client health overview
      const clientHealth = allClients2.map(client => {
        const clientProjects3 = storage.getProjectsByUserId(client.id);
        const proj = clientProjects3[0];
        if (!proj) return null;
        const ms = storage.getMilestonesByProjectId(proj.id);
        let totalSubs = 0; let completedSubs = 0;
        ms.forEach(m => {
          const subs = storage.getSubMilestonesByMilestoneId(m.id);
          totalSubs += subs.length;
          completedSubs += subs.filter(s => s.status === "completed").length;
        });
        const progress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
        const docs = storage.getLegalDocumentsByProjectId(proj.id);
        const pendingDocs = docs.filter(d => d.status === "sent" || d.status === "pending" || d.status === "viewed").length;
        const approvs = storage.getApprovalsByProjectId(proj.id);
        const pendingApprovs = approvs.filter(a => a.status === "pending").length;
        const pendingItems = pendingDocs + pendingApprovs;

        // Last activity from notifications
        const clientNotifs = storage.getAdminNotifications({}).filter(n => n.clientName === client.name);
        const lastActivity = clientNotifs.length > 0 ? clientNotifs[0].createdAt : proj.startDate;

        const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
        const statusColor = pendingItems > 2 || daysSince > 14 ? "red" : daysSince > 7 ? "yellow" : "green";

        const { accessCode: _, ...safeClient } = client;
        return { ...safeClient, project: proj, progress, lastActivity, pendingItems, statusColor, daysSince };
      }).filter(Boolean);

      const activeClients = allClients2.length;
      const openTickets = storage.getAllTickets("open").length + storage.getAllTickets("in_progress").length;

      return res.json({
        unreadNotifications,
        overdueTasks,
        pendingApprovals,
        unsignedDocuments,
        activeClients,
        totalRevenueMonth,
        openTickets,
        hoursLoggedMonth,
        todayTasks: todayTasksEnriched,
        recentActivity,
        clientHealth,
      });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== PHASE A: Enhanced Client Creation with Documents & Tasks =====

  app.post("/api/admin/clients-full", requireAdmin, (req, res) => {
    try {
      const { name, email, brandName, accessCode, serviceType, startDate, documents } = req.body;
      if (!name || !email || !brandName || !accessCode || !serviceType || !startDate) {
        return res.status(400).json({ message: "All client fields are required" });
      }
      const result = storage.createClientWithProject({ name, email, brandName, accessCode, serviceType, startDate });
      const { user, project } = result;
      const now3 = new Date().toISOString();

      // Create legal documents if specified
      if (documents && Array.isArray(documents)) {
        const templates = storage.getAllDocumentTemplates();
        const docConfigs: Record<string, { category: string; title: string }> = {
          nda: { category: "nda", title: "Mutual Non-Disclosure Agreement" },
          service_agreement: { category: "service_agreement", title: `${serviceType} Service Agreement` },
          ip_assignment: { category: "ip_assignment", title: "IP Assignment Agreement" },
          mutual_release: { category: "mutual_release", title: "Mutual Release Agreement" },
        };
        for (const docType of documents) {
          if (!docConfigs[docType]) continue;
          const tmpl = templates.find(t => t.category === docType);
          const docCfg = docConfigs[docType];
          storage.createLegalDocument({
            projectId: project.id,
            userId: user.id,
            templateName: tmpl?.name || docCfg.title,
            title: docCfg.title,
            category: docCfg.category as any,
            content: tmpl?.content || `[${docCfg.title} content — template not found]`,
            status: "sent",
            sentAt: now3,
            signedAt: null,
            signedBy: null,
            signatureText: null,
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
            required: 1,
            createdAt: now3,
          });
        }
      }

      // Auto-create onboarding tasks
      const onboardingTasks = [
        { title: "Send NDA", category: "legal", priority: "urgent", dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
        { title: "Send Service Agreement", category: "legal", priority: "urgent", dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
        { title: "Schedule Session 1", category: "session_prep", priority: "high", dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0] },
        { title: "Set up Google Drive folder", category: "admin", priority: "normal", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0] },
        { title: `Send welcome email to ${name}`, category: "onboarding", priority: "high", dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
      ];

      for (const t of onboardingTasks) {
        storage.createAdminTask({
          projectId: project.id,
          userId: user.id,
          title: t.title,
          description: `Onboarding task for new client: ${name} (${brandName})`,
          assignedTo: "brandon",
          priority: t.priority as any,
          status: "todo",
          category: t.category as any,
          dueDate: t.dueDate,
          isAutoGenerated: 1,
          createdAt: now3,
        });
      }

      // Admin notification for new client
      storage.createAdminNotification({
        type: "onboarding_complete",
        title: `New client onboarded: ${name}`,
        message: `${name} (${brandName}) has been added. Service: ${serviceType}. Onboarding tasks created.`,
        clientName: name,
        projectId: project.id,
        relatedId: user.id,
        isRead: 0,
        priority: "normal",
        createdAt: now3,
      });

      const { accessCode: _, ...safeUser } = user;
      return res.json({ user: safeUser, project });
    } catch (e: any) {
      return res.status(500).json({ message: e.message });
    }
  });

  // ===== END ADMIN ROUTES =====

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

  // ===== ONBOARDING ROUTES =====

  // GET /api/onboarding/status
  app.get("/api/onboarding/status", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const record = storage.getOnboardingByUserId(userId);
    return res.json(record || null);
  });

  // POST /api/onboarding/start
  app.post("/api/onboarding/start", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const existing = storage.getOnboardingByUserId(userId);
    if (existing) {
      return res.json(existing);
    }
    const record = storage.createOnboarding({ userId });
    return res.json(record);
  });


  // POST /api/onboarding/complete-step
  app.post("/api/onboarding/complete-step", requireAuth, (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { step, data } = req.body;
      if (!step) return res.status(400).json({ message: "Step is required" });
      let record = storage.getOnboardingByUserId(userId);
      if (!record) { record = storage.createOnboarding({ userId }); }
      const stepMap = { welcome: 1, brand_profile: 2, how_it_works: 3, portal_tour: 4, key_documents: 5, signoff: 6 };
      const stepNum = typeof step === "number" ? step : stepMap[step] || 0;
      if (stepNum >= 1 && stepNum <= 6) { storage.updateOnboardingStep(userId, stepNum); }
      const updated = storage.getOnboardingByUserId(userId);
      const completedSteps = [];
      const nameMap = ["welcome", "brand_profile", "how_it_works", "portal_tour", "key_documents", "signoff"];
      if (updated) {
        if (updated.step1Viewed) completedSteps.push(nameMap[0]);
        if (updated.step2Viewed) completedSteps.push(nameMap[1]);
        if (updated.step3Viewed) completedSteps.push(nameMap[2]);
        if (updated.step4Viewed) completedSteps.push(nameMap[3]);
        if (updated.step5Viewed) completedSteps.push(nameMap[4]);
        if (updated.step6Completed) completedSteps.push(nameMap[5]);
      }
      return res.json({ ...updated, completedSteps, currentStep: step });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  // PATCH /api/onboarding/step/:step
  app.patch("/api/onboarding/step/:step", requireAuth, (req, res) => {
    const userId = (req.session as any).userId;
    const step = parseInt(req.params.step);
    if (isNaN(step) || step < 1 || step > 6) {
      return res.status(400).json({ message: "Invalid step" });
    }
    storage.updateOnboardingStep(userId, step);
    const record = storage.getOnboardingByUserId(userId);
    return res.json(record);
  });

  // POST /api/onboarding/complete
  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    const userId = (req.session as any).userId;
    const { signatureText } = req.body;
    if (!signatureText || typeof signatureText !== "string" || signatureText.trim().length === 0) {
      return res.status(400).json({ message: "Signature is required" });
    }

    const record = storage.completeOnboarding(userId, signatureText.trim());
    const user = storage.getUserById(userId);

    if (user) {
      // Create legal document record for onboarding acknowledgment
      const projects = storage.getProjectsByUserId(userId);
      const project = projects[0];
      if (project) {
        try {
          storage.createLegalDocument({
            projectId: project.id,
            userId,
            templateName: "portal_onboarding_acknowledgment",
            title: "Portal Onboarding Acknowledgment",
            category: "other",
            content: `PORTAL ONBOARDING ACKNOWLEDGMENT\n\nClient: ${user.name}\nBrand: ${user.brandName}\nDate: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\nBy completing the LEAA Client Portal onboarding, ${user.name} acknowledges that they have:\n\n1. Reviewed and understood how the LEAA Client Portal operates\n2. Been introduced to the LEAA team and communication norms\n3. Reviewed the project development journey and session structure\n4. Familiarized themselves with all portal sections\n5. Understood their responsibilities as a LEAA client\n\nSignature: ${signatureText.trim()}\nSigned At: ${new Date().toISOString()}`,
            status: "signed",
            sentAt: new Date().toISOString(),
            signedAt: new Date().toISOString(),
            signedBy: user.name,
            signatureText: signatureText.trim(),
            required: 0,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          // Non-fatal
        }
      }

      // Create admin notification
      try {
        storage.createAdminNotification({
          type: "onboarding_complete",
          title: "Client Completed Onboarding",
          message: `${user.name} completed portal onboarding`,
          clientName: user.name,
          projectId: projects[0]?.id || null,
          relatedId: record.id,
          isRead: 0,
          priority: "normal",
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // Non-fatal
      }
    }

    return res.json(record);
  });

  // ── CALENDAR EVENTS ───────────────────────────────────────────────────────

  app.get("/api/calendar/events", requireAuth, (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = storage.getUserById(userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const isAdmin = user.role === "admin";

      let monthStr: string;
      const rawMonth = req.query.month as string | undefined;
      if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
        monthStr = rawMonth;
      } else {
        const now = new Date();
        monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      }

      const [year, month] = monthStr.split("-").map(Number);
      const monthStart = `${monthStr}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const monthEnd = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

      function toDateStr(raw: string | null | undefined): string | null {
        if (!raw) return null;
        const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
      }

      function toTimeStr(raw: string | null | undefined): string | undefined {
        if (!raw) return undefined;
        try {
          const d = new Date(raw);
          if (isNaN(d.getTime())) return undefined;
          let hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;
          return `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
        } catch { return undefined; }
      }

      function inMonth(dateStr: string | null): boolean {
        if (!dateStr) return false;
        return dateStr >= monthStart && dateStr <= monthEnd;
      }

      const events: Array<{ id: string; type: string; title: string; date: string; time?: string; clientName?: string; brandName?: string; status?: string; priority?: string }> = [];

      const userCache: Record<number, { name: string; brandName: string } | undefined> = {};
      function getUserInfo(uid: number | null | undefined) {
        if (!uid) return undefined;
        if (!userCache[uid]) {
          const u = storage.getUserById(uid);
          userCache[uid] = u ? { name: u.name, brandName: u.brandName } : undefined;
        }
        return userCache[uid];
      }

      if (isAdmin) {
        const allClients = storage.getAllClients();
        for (const client of allClients) {
          const clientProjects = storage.getProjectsByUserId(client.id);
          for (const project of clientProjects) {
            const projectSessions = storage.getSessionsByProjectId(project.id);
            for (const s of projectSessions) {
              const dateStr = toDateStr(s.scheduledAt);
              if (!inMonth(dateStr)) continue;
              events.push({ id: `session-${s.id}`, type: "session", title: s.title, date: dateStr!, time: toTimeStr(s.scheduledAt), clientName: client.name, brandName: client.brandName, status: s.status });
            }
            const deliverables = storage.getDeliverablesByProjectId(project.id);
            for (const d of deliverables) {
              if (!d.uploadedAt) continue;
              const dateStr = toDateStr(d.uploadedAt);
              if (!inMonth(dateStr)) continue;
              events.push({ id: `deliverable-${d.id}`, type: "deliverable", title: d.title, date: dateStr!, clientName: client.name, brandName: client.brandName, status: d.fileStatus ?? "draft" });
            }
          }
        }
        const allTasks = storage.getAdminTasks();
        for (const t of allTasks) {
          if (!t.dueDate) continue;
          const dateStr = toDateStr(t.dueDate);
          if (!inMonth(dateStr)) continue;
          const isFollowup = t.category === "follow_up" || t.category === "onboarding";
          let clientName: string | undefined;
          let brandName: string | undefined;
          if (t.userId) { const info = getUserInfo(t.userId); clientName = info?.name; brandName = info?.brandName; }
          else if (t.projectId) { const proj = storage.getProjectById(t.projectId); if (proj) { const info = getUserInfo(proj.userId); clientName = info?.name; brandName = info?.brandName; } }
          events.push({ id: `task-${t.id}`, type: isFollowup ? "lead_followup" : "task", title: t.title, date: dateStr!, clientName, brandName, status: t.status, priority: t.priority });
        }
      } else {
        const userProjects = storage.getProjectsByUserId(userId);
        if (userProjects.length === 0) return res.json({ events: [], month: monthStr });
        const project = userProjects[0];
        const projectSessions = storage.getSessionsByProjectId(project.id);
        for (const s of projectSessions) {
          const dateStr = toDateStr(s.scheduledAt);
          if (!inMonth(dateStr)) continue;
          events.push({ id: `session-${s.id}`, type: "session", title: s.title, date: dateStr!, time: toTimeStr(s.scheduledAt), status: s.status });
        }
        const deliverables = storage.getDeliverablesByProjectId(project.id);
        for (const d of deliverables) {
          if (!d.uploadedAt) continue;
          const dateStr = toDateStr(d.uploadedAt);
          if (!inMonth(dateStr)) continue;
          events.push({ id: `deliverable-${d.id}`, type: "deliverable", title: d.title, date: dateStr!, status: d.fileStatus ?? "draft" });
        }
        const allTasks = storage.getAdminTasks({ clientId: userId });
        for (const t of allTasks) {
          if (!t.dueDate) continue;
          const dateStr = toDateStr(t.dueDate);
          if (!inMonth(dateStr)) continue;
          const isFollowup = t.category === "follow_up" || t.category === "onboarding";
          events.push({ id: `task-${t.id}`, type: isFollowup ? "lead_followup" : "task", title: t.title, date: dateStr!, status: t.status, priority: t.priority });
        }
      }

      events.sort((a, b) => a.date.localeCompare(b.date));
      return res.json({ events, month: monthStr });
    } catch (e: any) {
      return res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  // ── PROJECT TRACKER ─────────────────────────────────────────────────────────

  app.get("/api/projects/:id/tracker", requireAuth, (req, res) => {
    const projectId = parseInt(req.params.id);
    const project = storage.getProjectById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = (req.session as any).userId;
    const userObj = storage.getUserById(userId);
    if (!userObj) return res.status(401).json({ message: "User not found" });
    if (userObj.role !== "admin") {
      const userProjects = storage.getProjectsByUserId(userId);
      if (!userProjects.find((p) => p.id === projectId)) return res.status(403).json({ message: "Forbidden" });
    }

    const ms = storage.getMilestonesByProjectId(projectId);
    const enriched = ms.map((m) => ({ ...m, subMilestones: storage.getSubMilestonesByMilestoneId(m.id), deliverables: storage.getDeliverablesByMilestoneId(m.id) }));

    const today = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : today;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const msInDay = 86400000;
    const totalDays = endDate ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / msInDay)) : 60;
    const daysElapsed = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / msInDay));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const percentElapsed = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
    const isOverdue = daysElapsed > totalDays;

    const milestonesCompleted = enriched.filter((m) => m.status === "completed").length;
    const milestonesTotal = enriched.length;
    let totalSubs = 0; let completedSubs = 0; let deliverablesReady = 0; let deliverablesTotal = 0; let pendingApprovals = 0;
    enriched.forEach((m) => {
      totalSubs += m.subMilestones.length;
      completedSubs += m.subMilestones.filter((s) => s.status === "completed").length;
      deliverablesTotal += m.deliverables.length;
      deliverablesReady += m.deliverables.filter((d) => d.fileUrl).length;
    });
    const overallPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
    try { pendingApprovals = storage.getApprovalsByProjectId(projectId).filter((a: any) => a.status === "pending").length; } catch { pendingApprovals = 0; }

    const currentMilestone = enriched.find((m) => m.status === "in_progress");
    const plannedDaysPerPhase = Math.round(totalDays / Math.max(1, milestonesTotal));

    const phases = enriched.map((m) => {
      let daysActual: number | null = null;
      if (m.status === "completed" && m.startedAt && m.completedAt) {
        daysActual = Math.max(1, Math.round((new Date(m.completedAt).getTime() - new Date(m.startedAt).getTime()) / msInDay));
      } else if (m.status === "in_progress" && m.startedAt) {
        daysActual = Math.max(1, Math.round((today.getTime() - new Date(m.startedAt).getTime()) / msInDay));
      }
      return { name: m.title, status: m.status, startedAt: m.startedAt ?? null, completedAt: m.completedAt ?? null, daysPlanned: plannedDaysPerPhase, daysActual };
    });

    const delays = phases.filter((p) => p.daysActual !== null && p.daysActual > p.daysPlanned * 1.25).map((p) => ({
      phase: p.name, plannedDays: p.daysPlanned, actualDays: p.daysActual as number, delayDays: (p.daysActual as number) - p.daysPlanned,
      reason: p.status === "in_progress" ? "In progress — exceeding planned window" : "Completed late",
    }));

    let estimatedCompletion: string | null = null;
    if (overallPercent > 0 && overallPercent < 100) {
      const estDate = new Date(startDate.getTime() + Math.round((daysElapsed / overallPercent) * 100) * msInDay);
      estimatedCompletion = estDate.toISOString().split("T")[0];
    } else if (overallPercent === 100) { estimatedCompletion = today.toISOString().split("T")[0]; }
    else if (endDate) { estimatedCompletion = project.endDate ?? null; }

    return res.json({
      project: { name: project.name, serviceType: project.serviceType, startDate: project.startDate, endDate: project.endDate ?? null, status: project.status },
      timeline: { totalDays, daysElapsed, daysRemaining, percentElapsed, isOverdue, estimatedCompletion },
      progress: { overallPercent, sessionsCompleted: milestonesCompleted, sessionsTotal: milestonesTotal, currentSession: currentMilestone?.title ?? null, milestonesCompleted, milestonesTotal, deliverablesReady, deliverablesTotal, pendingApprovals, pendingDocuments: 0 },
      phases,
      delays,
    });
  });
}

