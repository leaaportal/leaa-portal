import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";
import {
  users, projects, milestones, subMilestones, deliverables, messages,
  supportTickets, ticketReplies, resources, notifications, payments, sessions,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Milestone, type InsertMilestone,
  type SubMilestone, type InsertSubMilestone,
  type Deliverable, type InsertDeliverable,
  type Message, type InsertMessage,
  type SupportTicket, type InsertSupportTicket,
  type TicketReply, type InsertTicketReply,
  type Resource, type InsertResource,
  type Notification, type InsertNotification,
  type Payment, type InsertPayment,
  type SessionSchedule, type InsertSessionSchedule,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  createUser(user: InsertUser): User;

  // Projects
  getProjectsByUserId(userId: number): Project[];
  getProjectById(id: number): Project | undefined;

  // Milestones
  getMilestonesByProjectId(projectId: number): Milestone[];
  getMilestoneById(id: number): Milestone | undefined;

  // Sub-milestones
  getSubMilestonesByMilestoneId(milestoneId: number): SubMilestone[];

  // Deliverables
  getDeliverablesByMilestoneId(milestoneId: number): Deliverable[];
  getDeliverablesByProjectId(projectId: number): Deliverable[];

  // Messages
  getMessagesByProjectId(projectId: number): Message[];
  createMessage(message: InsertMessage): Message;

  // Support Tickets
  getTicketsByUserId(userId: number): SupportTicket[];
  getTicketById(id: number): SupportTicket | undefined;
  createTicket(ticket: InsertSupportTicket): SupportTicket;
  updateTicketStatus(id: number, status: string): void;

  // Ticket Replies
  getRepliesByTicketId(ticketId: number): TicketReply[];
  createTicketReply(reply: InsertTicketReply): TicketReply;

  // Resources
  getAllResources(): Resource[];

  // Notifications
  getNotificationsByUserId(userId: number): Notification[];
  markNotificationRead(id: number): void;
  markAllNotificationsRead(userId: number): void;

  // Payments
  getPaymentsByUserId(userId: number): Payment[];

  // Sessions
  getSessionsByProjectId(projectId: number): SessionSchedule[];
}

const sqlite = new Database("leaa.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    access_code TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client'
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT NOT NULL,
    end_date TEXT
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    session_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hours REAL NOT NULL,
    cost REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TEXT,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sub_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deliverables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    uploaded_at TEXT,
    file_status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_read INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'open',
    attachment_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ticket_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    due_date TEXT NOT NULL,
    paid_date TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    notes TEXT,
    prep_checklist TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming'
  );
`);

export class DatabaseStorage implements IStorage {
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  createUser(user: InsertUser): User {
    return db.insert(users).values(user).returning().get();
  }

  getProjectsByUserId(userId: number): Project[] {
    return db.select().from(projects).where(eq(projects.userId, userId)).all();
  }

  getProjectById(id: number): Project | undefined {
    return db.select().from(projects).where(eq(projects.id, id)).get();
  }

  getMilestonesByProjectId(projectId: number): Milestone[] {
    return db.select().from(milestones).where(eq(milestones.projectId, projectId)).all();
  }

  getMilestoneById(id: number): Milestone | undefined {
    return db.select().from(milestones).where(eq(milestones.id, id)).get();
  }

  getSubMilestonesByMilestoneId(milestoneId: number): SubMilestone[] {
    return db.select().from(subMilestones).where(eq(subMilestones.milestoneId, milestoneId)).all();
  }

  getDeliverablesByMilestoneId(milestoneId: number): Deliverable[] {
    return db.select().from(deliverables).where(eq(deliverables.milestoneId, milestoneId)).all();
  }

  getDeliverablesByProjectId(projectId: number): Deliverable[] {
    const projectMilestones = db.select().from(milestones).where(eq(milestones.projectId, projectId)).all();
    const allDeliverables: Deliverable[] = [];
    for (const m of projectMilestones) {
      const mDeliverables = db.select().from(deliverables).where(eq(deliverables.milestoneId, m.id)).all();
      allDeliverables.push(...mDeliverables);
    }
    return allDeliverables;
  }

  getMessagesByProjectId(projectId: number): Message[] {
    return db.select().from(messages).where(eq(messages.projectId, projectId)).orderBy(desc(messages.createdAt)).all();
  }

  createMessage(message: InsertMessage): Message {
    return db.insert(messages).values(message).returning().get();
  }

  // Support Tickets
  getTicketsByUserId(userId: number): SupportTicket[] {
    return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).all();
  }

  getTicketById(id: number): SupportTicket | undefined {
    return db.select().from(supportTickets).where(eq(supportTickets.id, id)).get();
  }

  createTicket(ticket: InsertSupportTicket): SupportTicket {
    return db.insert(supportTickets).values(ticket).returning().get();
  }

  updateTicketStatus(id: number, status: string): void {
    db.update(supportTickets)
      .set({ status: status as any, updatedAt: new Date().toISOString() })
      .where(eq(supportTickets.id, id))
      .run();
  }

  // Ticket Replies
  getRepliesByTicketId(ticketId: number): TicketReply[] {
    return db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId)).orderBy(ticketReplies.createdAt).all();
  }

  createTicketReply(reply: InsertTicketReply): TicketReply {
    return db.insert(ticketReplies).values(reply).returning().get();
  }

  // Resources
  getAllResources(): Resource[] {
    return db.select().from(resources).orderBy(resources.order).all();
  }

  // Notifications
  getNotificationsByUserId(userId: number): Notification[] {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).all();
  }

  markNotificationRead(id: number): void {
    db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id)).run();
  }

  markAllNotificationsRead(userId: number): void {
    db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, userId)).run();
  }

  // Payments
  getPaymentsByUserId(userId: number): Payment[] {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.dueDate)).all();
  }

  // Sessions
  getSessionsByProjectId(projectId: number): SessionSchedule[] {
    return db.select().from(sessions).where(eq(sessions.projectId, projectId)).orderBy(sessions.scheduledAt).all();
  }
}

export const storage = new DatabaseStorage();

// Seed demo data
function seedDemoData() {
  const existingUser = storage.getUserByEmail("demo@leaa.com");
  if (existingUser) return; // Already seeded

  // Create demo client
  const user = storage.createUser({
    email: "demo@leaa.com",
    name: "Erin Okoye",
    brandName: "Erin Op Basics",
    accessCode: "LEAA2026",
    role: "client",
  });

  // Create project
  const project = db.insert(projects).values({
    userId: user.id,
    name: "Erin Op Basics — Concept Development",
    serviceType: "Concept Development 60-Day",
    status: "active",
    startDate: "2026-02-01",
    endDate: "2026-04-01",
  }).returning().get();

  // Session 1: Understanding the Vision — COMPLETED
  const m1 = db.insert(milestones).values({
    projectId: project.id,
    sessionNumber: 1,
    title: "Understanding the Vision",
    description: "Consultation & planning phase — deep dive into your brand story, target market, and creative vision for the collection.",
    hours: 6,
    cost: 450,
    status: "completed",
    startedAt: "2026-02-01",
    completedAt: "2026-02-08",
  }).returning().get();

  // Session 1 sub-milestones
  const s1Subs = [
    "Initial brand consultation call",
    "Market research & competitor scan",
    "Brand brief document creation",
    "Mood board framework development",
    "Vision alignment review",
    "Session 1 wrap-up & handoff",
  ];
  s1Subs.forEach((title, i) => {
    db.insert(subMilestones).values({
      milestoneId: m1.id,
      title,
      status: "completed",
      order: i + 1,
    }).run();
  });

  // Session 1 deliverables (with file status & version)
  db.insert(deliverables).values([
    { milestoneId: m1.id, title: "Brand Brief — Erin Op Basics", fileUrl: "#", uploadedAt: "2026-02-06", fileStatus: "final" as const, version: 2 },
    { milestoneId: m1.id, title: "Concept Direction Deck", fileUrl: "#", uploadedAt: "2026-02-07", fileStatus: "final" as const, version: 1 },
    { milestoneId: m1.id, title: "Mood Board Framework (PDF)", fileUrl: "#", uploadedAt: "2026-02-08", fileStatus: "approved" as const, version: 1 },
  ]).run();

  // Session 2: Customer Profile Development — IN PROGRESS (4 of 8 complete)
  const m2 = db.insert(milestones).values({
    projectId: project.id,
    sessionNumber: 2,
    title: "Customer Profile Development",
    description: "Deep customer research and persona building — 8 weekly 2-hour sessions diving into your ideal customer, market positioning, and competitive landscape.",
    hours: 16,
    cost: 1200,
    status: "in_progress",
    startedAt: "2026-02-15",
    completedAt: null,
  }).returning().get();

  // Session 2 sub-milestones (8 sessions, 4 complete)
  const s2Subs = [
    "Week 1: Customer Demographics Deep Dive",
    "Week 2: Psychographic Profiling",
    "Week 3: Shopping Behavior Analysis",
    "Week 4: Competitive Landscape Mapping",
    "Week 5: Customer Journey Mapping",
    "Week 6: Persona Development Workshop",
    "Week 7: Market Positioning Strategy",
    "Week 8: Final Persona Presentation",
  ];
  s2Subs.forEach((title, i) => {
    db.insert(subMilestones).values({
      milestoneId: m2.id,
      title,
      status: i < 4 ? "completed" : i === 4 ? "in_progress" : "pending",
      order: i + 1,
    }).run();
  });

  // Session 2 partial deliverables
  db.insert(deliverables).values([
    { milestoneId: m2.id, title: "Customer Demographics Report", fileUrl: "#", uploadedAt: "2026-02-22", fileStatus: "final" as const, version: 1 },
    { milestoneId: m2.id, title: "Psychographic Profile Summary", fileUrl: "#", uploadedAt: "2026-03-01", fileStatus: "under_review" as const, version: 2 },
  ]).run();

  // Session 3: Design & Fabric Selection — NOT STARTED
  const m3 = db.insert(milestones).values({
    projectId: project.id,
    sessionNumber: 3,
    title: "Design & Fabric Selection",
    description: "Feedback & refinement phase — translating research into tangible design decisions, fabric choices, and color palette finalization.",
    hours: 8,
    cost: 600,
    status: "not_started",
    startedAt: null,
    completedAt: null,
  }).returning().get();

  const s3Subs = [
    "Design direction refinement",
    "Fabric sourcing & swatching",
    "Color palette finalization",
    "Silhouette development",
    "Design review session",
    "Final fabric & design sign-off",
  ];
  s3Subs.forEach((title, i) => {
    db.insert(subMilestones).values({
      milestoneId: m3.id,
      title,
      status: "pending",
      order: i + 1,
    }).run();
  });

  // Session 4: Design Development — NOT STARTED
  const m4 = db.insert(milestones).values({
    projectId: project.id,
    sessionNumber: 4,
    title: "Design Development",
    description: "Final presentation & documentation — comprehensive tech packs, final design presentation, and LEAA Client Pathway proposal for collection development.",
    hours: 6,
    cost: 450,
    status: "not_started",
    startedAt: null,
    completedAt: null,
  }).returning().get();

  const s4Subs = [
    "Tech pack development",
    "Final design compilation",
    "Production specifications",
    "Cost sheet preparation",
    "Final presentation creation",
    "LEAA Client Pathway proposal",
  ];
  s4Subs.forEach((title, i) => {
    db.insert(subMilestones).values({
      milestoneId: m4.id,
      title,
      status: "pending",
      order: i + 1,
    }).run();
  });

  // Seed messages
  const msgs = [
    {
      projectId: project.id,
      senderName: "Dale Lane",
      senderRole: "admin" as const,
      content: "Welcome to the LEAA Client Portal, Erin! We're excited to partner with you on Erin Op Basics. Your brand brief from Session 1 is now available in Deliverables. Looking forward to our next session!",
      createdAt: "2026-02-08T14:00:00Z",
      isRead: 1,
    },
    {
      projectId: project.id,
      senderName: "Brandon Ellis",
      senderRole: "admin" as const,
      content: "Hi Erin — just uploaded the Psychographic Profile Summary from our Week 2 session. Great insights coming through on your target customer. We're really dialing in on the modern professional woman who values sustainability without sacrificing style.",
      createdAt: "2026-03-01T11:30:00Z",
      isRead: 1,
    },
    {
      projectId: project.id,
      senderName: "Dale Lane",
      senderRole: "admin" as const,
      content: "Erin, quick heads up — our Week 5 session on Customer Journey Mapping is scheduled for this Thursday at 2pm CST. I'll send a prep sheet before then. We're making great progress!",
      createdAt: "2026-03-22T09:15:00Z",
      isRead: 1,
    },
    {
      projectId: project.id,
      senderName: "Brandon Ellis",
      senderRole: "admin" as const,
      content: "The competitive landscape mapping is looking really strong. I've identified some key white space opportunities in the sustainable basics market. Let's discuss during our next session.",
      createdAt: "2026-03-15T16:45:00Z",
      isRead: 0,
    },
    {
      projectId: project.id,
      senderName: "Dale Lane",
      senderRole: "admin" as const,
      content: "Just a reminder that your Concept Development program is 42% complete. We're right on track with our 60-day timeline. The customer profile work is really setting a strong foundation for the design phase ahead.",
      createdAt: "2026-03-20T10:00:00Z",
      isRead: 1,
    },
  ];

  msgs.forEach((msg) => {
    db.insert(messages).values(msg).run();
  });

  // ===== NEW SEED DATA =====

  // Support Tickets
  const ticket1 = db.insert(supportTickets).values({
    projectId: project.id,
    userId: user.id,
    subject: "Question about fabric swatch options",
    category: "general",
    priority: "normal",
    status: "resolved",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-07T14:00:00Z",
  }).returning().get();

  db.insert(ticketReplies).values([
    {
      ticketId: ticket1.id,
      senderName: "Erin Okoye",
      senderRole: "client" as const,
      content: "Hi! I was wondering what fabric swatch options are available for the sustainable cotton blends. Do you have organic options from any of your suppliers?",
      createdAt: "2026-03-05T10:00:00Z",
    },
    {
      ticketId: ticket1.id,
      senderName: "Dale Lane",
      senderRole: "admin" as const,
      content: "Great question, Erin! Yes, we have several organic cotton blend options from our suppliers. I'll prepare a swatch card with 6–8 options for you to review at our next session. We have GOTS-certified options that would be perfect for Erin Op Basics.",
      createdAt: "2026-03-07T14:00:00Z",
    },
  ]).run();

  const ticket2 = db.insert(supportTickets).values({
    projectId: project.id,
    userId: user.id,
    subject: "Revision request for mood board colors",
    category: "revision",
    priority: "normal",
    status: "in_progress",
    createdAt: "2026-03-18T15:30:00Z",
    updatedAt: "2026-03-19T09:00:00Z",
  }).returning().get();

  db.insert(ticketReplies).values([
    {
      ticketId: ticket2.id,
      senderName: "Erin Okoye",
      senderRole: "client" as const,
      content: "I'd love to adjust the mood board palette — could we swap out the coral accent for more of a dusty rose? I think it better aligns with the softer, minimalist direction we discussed.",
      createdAt: "2026-03-18T15:30:00Z",
    },
  ]).run();

  db.insert(supportTickets).values({
    projectId: project.id,
    userId: user.id,
    subject: "Need to reschedule Session 2 Week 5",
    category: "scheduling",
    priority: "normal",
    status: "open",
    createdAt: "2026-03-25T08:00:00Z",
    updatedAt: "2026-03-25T08:00:00Z",
  }).run();

  // Resources
  const resourcesData = [
    { title: "Welcome to Your Client Portal", description: "Learn how to navigate your portal, view deliverables, track milestones, and communicate with the LEAA team.", category: "getting_started" as const, iconName: "Compass", order: 1 },
    { title: "How the 60-Day Concept Development Program Works", description: "A complete overview of the 4-session structure, timelines, deliverables, and what to expect at each stage.", category: "getting_started" as const, iconName: "BookOpen", order: 2 },
    { title: "Preparing for Session 1: Understanding the Vision", description: "Gather your brand story, inspiration images, target market ideas, and any existing materials before your first session.", category: "session_prep" as const, iconName: "Lightbulb", order: 3 },
    { title: "Preparing for Session 2: Customer Profile Development", description: "Research your ideal customer demographics, shopping habits, and lifestyle — we'll build detailed personas together.", category: "session_prep" as const, iconName: "Users", order: 4 },
    { title: "Preparing for Session 3: Design & Fabric Selection", description: "Review your mood boards and start thinking about silhouettes, fabric preferences, and color palettes you're drawn to.", category: "session_prep" as const, iconName: "Palette", order: 5 },
    { title: "Preparing for Session 4: Design Development", description: "Compile all feedback from previous sessions. We'll finalize designs, create tech packs, and prepare your development proposal.", category: "session_prep" as const, iconName: "PenTool", order: 6 },
    { title: "Frequently Asked Questions", description: "Answers to common questions about timelines, revision policies, payment schedules, deliverable formats, and next steps after the program.", category: "faq" as const, iconName: "HelpCircle", order: 7 },
    { title: "Understanding Tech Packs", description: "What tech packs are, why they matter, and how LEAA creates detailed technical packages ready for manufacturing.", category: "brand_resources" as const, iconName: "FileText", order: 8 },
    { title: "Working with Fabric Swatches", description: "How to evaluate fabric swatches, request samples, and make informed decisions about materials for your collection.", category: "brand_resources" as const, iconName: "Scissors", order: 9 },
    { title: "What Is a Mood Board and Why It Matters", description: "How mood boards guide the creative direction of your collection — from color palettes to textures to overall brand aesthetic.", category: "brand_resources" as const, iconName: "Image", order: 10 },
  ];

  resourcesData.forEach((r) => {
    db.insert(resources).values(r).run();
  });

  // Notifications
  const notificationsData = [
    { userId: user.id, title: "Brand Brief v1 uploaded", message: "Brand Brief v1 uploaded to Session 1 deliverables", type: "deliverable" as const, isRead: 1, createdAt: "2026-02-06T12:00:00Z" },
    { userId: user.id, title: "Revision request received", message: "Your revision request for mood board colors has been received", type: "ticket" as const, isRead: 1, createdAt: "2026-03-19T09:00:00Z" },
    { userId: user.id, title: "Session 2, Week 4 completed", message: "Session 2, Week 4 — Competitive Landscape Mapping — has been completed", type: "session" as const, isRead: 1, createdAt: "2026-03-15T17:00:00Z" },
    { userId: user.id, title: "New message from Brandon Ellis", message: "Brandon Ellis sent you a new message about competitive landscape opportunities", type: "message" as const, isRead: 0, createdAt: "2026-03-15T16:45:00Z" },
    { userId: user.id, title: "Payment received — thank you", message: "Payment of $1,350 received for Concept Development Deposit (50%)", type: "billing" as const, isRead: 1, createdAt: "2026-03-01T08:00:00Z" },
  ];

  notificationsData.forEach((n) => {
    db.insert(notifications).values(n).run();
  });

  // Payments
  db.insert(payments).values([
    {
      userId: user.id,
      projectId: project.id,
      description: "Concept Development Deposit (50%)",
      amount: 1350,
      status: "paid" as const,
      dueDate: "2026-03-01",
      paidDate: "2026-03-01",
    },
    {
      userId: user.id,
      projectId: project.id,
      description: "Concept Development Balance (50%)",
      amount: 1350,
      status: "pending" as const,
      dueDate: "2026-04-15",
      paidDate: null,
    },
  ]).run();

  // Session Schedule
  const sessionsData = [
    {
      projectId: project.id,
      title: "Session 2, Week 5: Customer Journey Mapping",
      scheduledAt: "2026-04-03T14:00:00Z",
      notes: "Focus on mapping the complete customer journey from awareness to purchase. Bring any customer feedback or survey data you have.",
      prepChecklist: JSON.stringify([
        "Review competitive landscape mapping deliverable",
        "Gather any customer feedback or survey data",
        "Think about your ideal customer's shopping journey",
        "Note any pain points in the buying process",
      ]),
      status: "upcoming" as const,
    },
    {
      projectId: project.id,
      title: "Session 1: Understanding the Vision",
      scheduledAt: "2026-02-01T14:00:00Z",
      notes: "Covered brand story, target market deep dive, and creative vision. Excellent foundation session.",
      prepChecklist: JSON.stringify([]),
      status: "completed" as const,
    },
    {
      projectId: project.id,
      title: "Session 2, Week 1: Customer Demographics",
      scheduledAt: "2026-02-15T14:00:00Z",
      notes: "Deep dive into customer demographics. Identified key age groups and income brackets.",
      prepChecklist: JSON.stringify([]),
      status: "completed" as const,
    },
    {
      projectId: project.id,
      title: "Session 2, Week 2: Psychographic Profiling",
      scheduledAt: "2026-02-22T14:00:00Z",
      notes: "Built psychographic profiles. Focused on sustainability values and lifestyle.",
      prepChecklist: JSON.stringify([]),
      status: "completed" as const,
    },
    {
      projectId: project.id,
      title: "Session 2, Week 3: Shopping Behavior Analysis",
      scheduledAt: "2026-03-01T14:00:00Z",
      notes: "Analyzed shopping behaviors and purchase patterns of target customer.",
      prepChecklist: JSON.stringify([]),
      status: "completed" as const,
    },
    {
      projectId: project.id,
      title: "Session 2, Week 4: Competitive Landscape Mapping",
      scheduledAt: "2026-03-08T14:00:00Z",
      notes: "Mapped competitive landscape. Identified key white space opportunities in sustainable basics.",
      prepChecklist: JSON.stringify([]),
      status: "completed" as const,
    },
  ];

  sessionsData.forEach((s) => {
    db.insert(sessions).values(s).run();
  });
}

seedDemoData();
