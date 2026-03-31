import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc, sum, count, ne } from "drizzle-orm";
import {
  users, projects, milestones, subMilestones, deliverables, messages,
  supportTickets, ticketReplies, resources, notifications, payments, sessions,
  approvals, sessionNotes, hourLogs, styles, materials, costSheets, legalDocuments, documentTemplates,
  adminNotifications, adminTasks,
  clientOnboarding, onboardingProgress,
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
  type Approval, type InsertApproval,
  type SessionNote, type InsertSessionNote,
  type HourLog, type InsertHourLog,
  type Style, type InsertStyle,
  type Material, type InsertMaterial,
  type CostSheet, type InsertCostSheet,
  type LegalDocument, type InsertLegalDocument,
  type DocumentTemplate, type InsertDocumentTemplate,
  type AdminNotification, type InsertAdminNotification,
  type AdminTask, type InsertAdminTask,
  type ClientOnboarding, type InsertClientOnboarding,
  type OnboardingProgress,
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

  // Approvals
  getApprovalsByProjectId(projectId: number): Approval[];
  getApprovalById(id: number): Approval | undefined;
  createApproval(data: InsertApproval): Approval;
  updateApprovalStatus(id: number, status: string, approvedBy?: string, notes?: string): void;

  // Session Notes
  getSessionNotesByMilestoneId(milestoneId: number): SessionNote[];
  createSessionNote(data: InsertSessionNote): SessionNote;

  // Hour Logs
  getHourLogsByProjectId(projectId: number): HourLog[];
  createHourLog(data: InsertHourLog): HourLog;

  // Styles
  getStylesByProjectId(projectId: number): Style[];
  getStyleById(id: number): Style | undefined;
  createStyle(data: InsertStyle): Style;
  updateStyle(id: number, data: Partial<InsertStyle>): void;

  // Materials
  getMaterialsByProjectId(projectId: number): Material[];
  getMaterialsByStyleId(styleId: number): Material[];
  createMaterial(data: InsertMaterial): Material;
  updateMaterial(id: number, data: Partial<InsertMaterial>): void;

  // Cost Sheets
  getCostSheetByStyleId(styleId: number): CostSheet | undefined;
  createCostSheet(data: InsertCostSheet): CostSheet;
  updateCostSheet(id: number, data: Partial<InsertCostSheet>): void;

  // Legal Documents
  getLegalDocumentsByProjectId(projectId: number): LegalDocument[];
  getLegalDocumentById(id: number): LegalDocument | undefined;
  createLegalDocument(data: InsertLegalDocument): LegalDocument;
  updateLegalDocument(id: number, data: Partial<InsertLegalDocument>): void;

  // Document Templates
  getAllDocumentTemplates(): DocumentTemplate[];
  getDocumentTemplateById(id: number): DocumentTemplate | undefined;
  createDocumentTemplate(data: InsertDocumentTemplate): DocumentTemplate;

  // Admin Notifications
  getAdminNotifications(filter?: { isRead?: boolean; type?: string }): AdminNotification[];
  createAdminNotification(data: InsertAdminNotification): AdminNotification;
  markAdminNotificationRead(id: number): void;
  markAllAdminNotificationsRead(): void;
  getUnreadAdminNotificationCount(): number;

  // Admin Tasks
  getAdminTasks(filter?: { status?: string; assignedTo?: string; clientId?: number; category?: string }): AdminTask[];
  createAdminTask(data: InsertAdminTask): AdminTask;
  updateAdminTask(id: number, data: Partial<InsertAdminTask>): AdminTask;
  getOverdueTaskCount(): number;

  // Onboarding (client_onboarding legacy)
  getOnboardingByUserId(userId: number): ClientOnboarding | undefined;
  createOnboarding(data: InsertClientOnboarding): ClientOnboarding;
  updateOnboardingStep(userId: number, step: number): void;
  completeOnboarding(userId: number, signatureText: string): ClientOnboarding;

  // Onboarding Progress (new)
  getOnboardingProgress(userId: number): OnboardingProgress[];
  completeOnboardingStep(userId: number, step: string, data?: string): OnboardingProgress;
  getOnboardingStatusForUser(userId: number): {
    status: "not_started" | "in_progress" | "completed";
    completedSteps: string[];
    currentStep: string;
  };

  // ===== ADMIN METHODS =====
  getAllClients(): User[];
  createClientWithProject(data: {
    name: string;
    email: string;
    brandName: string;
    accessCode: string;
    serviceType: string;
    startDate: string;
  }): { user: User; project: Project };
  getClientDetail(userId: number): {
    user: User;
    project: Project | null;
    milestones: any[];
    deliverables: any[];
  };
  updateMilestoneStatus(id: number, status: string, notes?: string): void;
  updateSubMilestoneStatus(id: number, status: string): void;
  getAllTickets(status?: string): any[];
  getAllMessages(): any[];
  createDeliverable(data: {
    milestoneId: number;
    title: string;
    fileUrl?: string;
    fileStatus?: string;
    version?: number;
  }): Deliverable;
  updateDeliverable(id: number, data: Partial<{
    title: string;
    fileUrl: string;
    fileStatus: string;
    version: number;
  }>): void;
  getAdminDashboardStats(): {
    totalActiveClients: number;
    openTickets: number;
    projectsInProgress: number;
    totalRevenue: number;
    recentActivity: any[];
  };
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

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    deliverable_id INTEGER,
    milestone_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by TEXT,
    approved_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hour_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    milestone_id INTEGER,
    hours REAL NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    logged_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS styles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'concept',
    image_url TEXT,
    tech_pack_url TEXT,
    pattern_status TEXT DEFAULT 'not_started',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    style_id INTEGER,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    supplier TEXT,
    cost_per_unit TEXT,
    moq TEXT,
    status TEXT NOT NULL DEFAULT 'researching',
    swatch_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cost_sheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    style_id INTEGER NOT NULL,
    fabric_cost REAL,
    trim_cost REAL,
    labor_cost REAL,
    other_cost REAL,
    total_cost_per_unit REAL,
    suggested_retail REAL,
    margin REAL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS legal_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TEXT,
    signed_at TEXT,
    signed_by TEXT,
    signature_text TEXT,
    due_date TEXT,
    required INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    client_name TEXT,
    project_id INTEGER,
    related_id INTEGER,
    is_read INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT NOT NULL DEFAULT 'brandon',
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'todo',
    category TEXT NOT NULL,
    due_date TEXT,
    completed_at TEXT,
    is_auto_generated INTEGER NOT NULL DEFAULT 0,
    compliance_gate TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS client_onboarding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    completed_at TEXT,
    signature_text TEXT,
    signed_at TEXT,
    step1_viewed INTEGER NOT NULL DEFAULT 0,
    step2_viewed INTEGER NOT NULL DEFAULT 0,
    step3_viewed INTEGER NOT NULL DEFAULT 0,
    step4_viewed INTEGER NOT NULL DEFAULT 0,
    step5_viewed INTEGER NOT NULL DEFAULT 0,
    step6_completed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS onboarding_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    step TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    data TEXT
  );
`);

// Add onboarding_status column to users — idempotent
try {
  sqlite.exec(`ALTER TABLE users ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'not_started'`);
} catch {
  // Column already exists — ignore
}

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

  // ===== NEW FEATURE METHODS =====

  // Approvals
  getApprovalsByProjectId(projectId: number): Approval[] {
    return db.select().from(approvals).where(eq(approvals.projectId, projectId)).orderBy(desc(approvals.createdAt)).all();
  }

  getApprovalById(id: number): Approval | undefined {
    return db.select().from(approvals).where(eq(approvals.id, id)).get();
  }

  createApproval(data: InsertApproval): Approval {
    return db.insert(approvals).values(data).returning().get();
  }

  updateApprovalStatus(id: number, status: string, approvedBy?: string, notes?: string): void {
    const updateData: any = { status: status as any };
    if (approvedBy) updateData.approvedBy = approvedBy;
    if (notes) updateData.notes = notes;
    if (status === "approved") updateData.approvedAt = new Date().toISOString();
    db.update(approvals).set(updateData).where(eq(approvals.id, id)).run();
  }

  // Session Notes
  getSessionNotesByMilestoneId(milestoneId: number): SessionNote[] {
    return db.select().from(sessionNotes).where(eq(sessionNotes.milestoneId, milestoneId)).orderBy(sessionNotes.createdAt).all();
  }

  createSessionNote(data: InsertSessionNote): SessionNote {
    return db.insert(sessionNotes).values(data).returning().get();
  }

  // Hour Logs
  getHourLogsByProjectId(projectId: number): HourLog[] {
    return db.select().from(hourLogs).where(eq(hourLogs.projectId, projectId)).orderBy(desc(hourLogs.date)).all();
  }

  createHourLog(data: InsertHourLog): HourLog {
    return db.insert(hourLogs).values(data).returning().get();
  }

  // Styles
  getStylesByProjectId(projectId: number): Style[] {
    return db.select().from(styles).where(eq(styles.projectId, projectId)).all();
  }

  getStyleById(id: number): Style | undefined {
    return db.select().from(styles).where(eq(styles.id, id)).get();
  }

  createStyle(data: InsertStyle): Style {
    return db.insert(styles).values(data).returning().get();
  }

  updateStyle(id: number, data: Partial<InsertStyle>): void {
    db.update(styles).set(data as any).where(eq(styles.id, id)).run();
  }

  // Materials
  getMaterialsByProjectId(projectId: number): Material[] {
    return db.select().from(materials).where(eq(materials.projectId, projectId)).all();
  }

  getMaterialsByStyleId(styleId: number): Material[] {
    return db.select().from(materials).where(eq(materials.styleId, styleId)).all();
  }

  createMaterial(data: InsertMaterial): Material {
    return db.insert(materials).values(data).returning().get();
  }

  updateMaterial(id: number, data: Partial<InsertMaterial>): void {
    db.update(materials).set(data as any).where(eq(materials.id, id)).run();
  }

  // Cost Sheets
  getCostSheetByStyleId(styleId: number): CostSheet | undefined {
    return db.select().from(costSheets).where(eq(costSheets.styleId, styleId)).get();
  }

  createCostSheet(data: InsertCostSheet): CostSheet {
    return db.insert(costSheets).values(data).returning().get();
  }

  updateCostSheet(id: number, data: Partial<InsertCostSheet>): void {
    db.update(costSheets).set(data as any).where(eq(costSheets.id, id)).run();
  }

  // Legal Documents
  getLegalDocumentsByProjectId(projectId: number): LegalDocument[] {
    return db.select().from(legalDocuments).where(eq(legalDocuments.projectId, projectId)).orderBy(desc(legalDocuments.createdAt)).all();
  }

  getLegalDocumentById(id: number): LegalDocument | undefined {
    return db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).get();
  }

  createLegalDocument(data: InsertLegalDocument): LegalDocument {
    return db.insert(legalDocuments).values(data).returning().get();
  }

  updateLegalDocument(id: number, data: Partial<InsertLegalDocument>): void {
    db.update(legalDocuments).set(data as any).where(eq(legalDocuments.id, id)).run();
  }

  // Document Templates
  getAllDocumentTemplates(): DocumentTemplate[] {
    return db.select().from(documentTemplates).where(eq(documentTemplates.isActive, 1)).all();
  }

  getDocumentTemplateById(id: number): DocumentTemplate | undefined {
    return db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).get();
  }

  createDocumentTemplate(data: InsertDocumentTemplate): DocumentTemplate {
    return db.insert(documentTemplates).values(data).returning().get();
  }

  // Admin Notifications
  getAdminNotifications(filter?: { isRead?: boolean; type?: string }): AdminNotification[] {
    let result = db.select().from(adminNotifications).orderBy(desc(adminNotifications.createdAt)).all();
    if (filter?.isRead !== undefined) {
      result = result.filter(n => Boolean(n.isRead) === filter.isRead);
    }
    if (filter?.type) {
      result = result.filter(n => n.type === filter.type);
    }
    return result;
  }

  createAdminNotification(data: InsertAdminNotification): AdminNotification {
    return db.insert(adminNotifications).values(data).returning().get();
  }

  markAdminNotificationRead(id: number): void {
    db.update(adminNotifications).set({ isRead: 1 }).where(eq(adminNotifications.id, id)).run();
  }

  markAllAdminNotificationsRead(): void {
    db.update(adminNotifications).set({ isRead: 1 }).where(eq(adminNotifications.isRead, 0)).run();
  }

  getUnreadAdminNotificationCount(): number {
    return db.select().from(adminNotifications).where(eq(adminNotifications.isRead, 0)).all().length;
  }

  // Admin Tasks
  getAdminTasks(filter?: { status?: string; assignedTo?: string; clientId?: number; category?: string }): AdminTask[] {
    let result = db.select().from(adminTasks).orderBy(desc(adminTasks.createdAt)).all();
    if (filter?.status && filter.status !== "all") {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter?.assignedTo && filter.assignedTo !== "all") {
      result = result.filter(t => t.assignedTo === filter.assignedTo);
    }
    if (filter?.clientId) {
      const clientProjects = db.select().from(projects).where(eq(projects.userId, filter.clientId)).all();
      const projectIds = clientProjects.map(p => p.id);
      result = result.filter(t => t.projectId != null && projectIds.includes(t.projectId));
    }
    if (filter?.category && filter.category !== "all") {
      result = result.filter(t => t.category === filter.category);
    }
    return result;
  }

  createAdminTask(data: InsertAdminTask): AdminTask {
    return db.insert(adminTasks).values(data).returning().get();
  }

  updateAdminTask(id: number, data: Partial<InsertAdminTask>): AdminTask {
    const updateData: any = { ...data };
    if (data.status === "done" && !data.completedAt) {
      updateData.completedAt = new Date().toISOString();
    }
    db.update(adminTasks).set(updateData).where(eq(adminTasks.id, id)).run();
    return db.select().from(adminTasks).where(eq(adminTasks.id, id)).get()!;
  }

  getOverdueTaskCount(): number {
    const today = new Date().toISOString().split("T")[0];
    const tasks = db.select().from(adminTasks).all();
    return tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done").length;
  }

  // ===== ONBOARDING METHODS =====

  getOnboardingByUserId(userId: number): ClientOnboarding | undefined {
    return db.select().from(clientOnboarding).where(eq(clientOnboarding.userId, userId)).get();
  }

  createOnboarding(data: InsertClientOnboarding): ClientOnboarding {
    return db.insert(clientOnboarding).values(data).returning().get();
  }

  updateOnboardingStep(userId: number, step: number): void {
    const updateData: any = {};
    if (step === 1) updateData.step1Viewed = 1;
    else if (step === 2) updateData.step2Viewed = 1;
    else if (step === 3) updateData.step3Viewed = 1;
    else if (step === 4) updateData.step4Viewed = 1;
    else if (step === 5) updateData.step5Viewed = 1;
    else if (step === 6) updateData.step6Completed = 1;
    db.update(clientOnboarding).set(updateData).where(eq(clientOnboarding.userId, userId)).run();
  }

  completeOnboarding(userId: number, signatureText: string): ClientOnboarding {
    const now = new Date().toISOString();

    // Update legacy client_onboarding record
    const record = db
      .update(clientOnboarding)
      .set({
        completedAt: now,
        signatureText,
        signedAt: now,
        step6Completed: 1,
      })
      .where(eq(clientOnboarding.userId, userId))
      .returning()
      .get();

    // Set onboarding_status = "completed" on users table
    db.update(users)
      .set({ onboardingStatus: "completed" })
      .where(eq(users.id, userId))
      .run();

    // Create admin notification for completed onboarding
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (user) {
      db.insert(adminNotifications)
        .values({
          type: "onboarding_complete",
          title: `Client onboarding complete: ${user.name}`,
          message: `${user.name} (${user.brandName}) has completed the portal onboarding walkthrough and provided their digital sign-off.`,
          clientName: user.name,
          projectId: null,
          relatedId: userId,
          isRead: 0,
          priority: "normal",
          createdAt: now,
        })
        .run();
    }

    return record;
  }

  getOnboardingProgress(userId: number): OnboardingProgress[] {
    return db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId))
      .all();
  }

  completeOnboardingStep(
    userId: number,
    step: string,
    data?: string
  ): OnboardingProgress {
    const now = new Date().toISOString();

    // Upsert: delete existing record for this step first (idempotent)
    db.delete(onboardingProgress)
      .where(
        and(
          eq(onboardingProgress.userId, userId),
          eq(onboardingProgress.step, step)
        )
      )
      .run();

    const record = db
      .insert(onboardingProgress)
      .values({ userId, step, completedAt: now, data: data ?? null })
      .returning()
      .get();

    // Advance user onboarding_status to "in_progress" if not already completed
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (user && user.onboardingStatus === "not_started") {
      db.update(users)
        .set({ onboardingStatus: "in_progress" })
        .where(eq(users.id, userId))
        .run();
    }

    // Also mark the legacy step flag on client_onboarding
    const STEP_ORDER = [
      "welcome",
      "brand_profile",
      "how_it_works",
      "portal_tour",
      "key_documents",
      "signoff",
    ];
    const stepIndex = STEP_ORDER.indexOf(step) + 1; // 1-based
    if (stepIndex > 0) {
      this.updateOnboardingStep(userId, stepIndex);
    }

    return record;
  }

  getOnboardingStatusForUser(userId: number): {
    status: "not_started" | "in_progress" | "completed";
    completedSteps: string[];
    currentStep: string;
  } {
    const STEP_ORDER = [
      "welcome",
      "brand_profile",
      "how_it_works",
      "portal_tour",
      "key_documents",
      "signoff",
    ];

    const user = db.select().from(users).where(eq(users.id, userId)).get();
    const status = (user?.onboardingStatus ?? "not_started") as
      | "not_started"
      | "in_progress"
      | "completed";

    const progressRows = db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId))
      .all();

    const completedSteps = progressRows.map((r) => r.step);

    // currentStep = first step not yet in completedSteps
    const currentStep =
      STEP_ORDER.find((s) => !completedSteps.includes(s)) ?? "signoff";

    return { status, completedSteps, currentStep };
  }

  // ===== ADMIN METHODS =====

  getAllClients(): User[] {
    return db.select().from(users).where(eq(users.role, "client")).all();
  }

  createClientWithProject(data: {
    name: string;
    email: string;
    brandName: string;
    accessCode: string;
    serviceType: string;
    startDate: string;
  }): { user: User; project: Project } {
    const user = db.insert(users).values({
      name: data.name,
      email: data.email.toLowerCase(),
      brandName: data.brandName,
      accessCode: data.accessCode,
      role: "client",
    }).returning().get();

    const project = db.insert(projects).values({
      userId: user.id,
      name: `${data.brandName} — ${data.serviceType}`,
      serviceType: data.serviceType,
      status: "active",
      startDate: data.startDate,
    }).returning().get();

    // Auto-populate milestones based on service type
    const isConceptDev = data.serviceType.toLowerCase().includes("concept");
    const isRetainer5 = data.serviceType.includes("5hr") || data.serviceType.includes("5 hr");
    const isRetainer10 = data.serviceType.includes("10hr") || data.serviceType.includes("10 hr");
    const isRetainer20 = data.serviceType.includes("20hr") || data.serviceType.includes("20 hr");

    if (isConceptDev) {
      // 4 Concept Dev sessions
      const conceptSessions = [
        {
          sessionNumber: 1,
          title: "Understanding the Vision",
          description: "Consultation & planning phase — deep dive into your brand story, target market, and creative vision for the collection.",
          hours: 6,
          cost: 450,
          subs: [
            "Initial brand consultation call",
            "Market research & competitor scan",
            "Brand brief document creation",
            "Mood board framework development",
            "Vision alignment review",
            "Session 1 wrap-up & handoff",
          ],
        },
        {
          sessionNumber: 2,
          title: "Customer Profile Development",
          description: "Deep customer research and persona building — sessions diving into your ideal customer, market positioning, and competitive landscape.",
          hours: 16,
          cost: 1200,
          subs: [
            "Week 1: Customer Demographics Deep Dive",
            "Week 2: Psychographic Profiling",
            "Week 3: Shopping Behavior Analysis",
            "Week 4: Competitive Landscape Mapping",
            "Week 5: Customer Journey Mapping",
            "Week 6: Persona Development Workshop",
            "Week 7: Market Positioning Strategy",
            "Week 8: Final Persona Presentation",
          ],
        },
        {
          sessionNumber: 3,
          title: "Design & Fabric Selection",
          description: "Feedback & refinement phase — translating research into tangible design decisions, fabric choices, and color palette finalization.",
          hours: 8,
          cost: 600,
          subs: [
            "Design direction refinement",
            "Fabric sourcing & swatching",
            "Color palette finalization",
            "Silhouette development",
            "Design review session",
            "Final fabric & design sign-off",
          ],
        },
        {
          sessionNumber: 4,
          title: "Design Development",
          description: "Final presentation & documentation — comprehensive tech packs, final design presentation, and LEAA Client Pathway proposal.",
          hours: 6,
          cost: 450,
          subs: [
            "Tech pack development",
            "Final design compilation",
            "Production specifications",
            "Cost sheet preparation",
            "Final presentation creation",
            "LEAA Client Pathway proposal",
          ],
        },
      ];

      for (const sess of conceptSessions) {
        const m = db.insert(milestones).values({
          projectId: project.id,
          sessionNumber: sess.sessionNumber,
          title: sess.title,
          description: sess.description,
          hours: sess.hours,
          cost: sess.cost,
          status: "not_started",
        }).returning().get();

        sess.subs.forEach((title, i) => {
          db.insert(subMilestones).values({
            milestoneId: m.id,
            title,
            status: "pending",
            order: i + 1,
          }).run();
        });
      }
    } else {
      // Monthly retainer milestones
      const hours = isRetainer20 ? 20 : isRetainer10 ? 10 : 5;
      const cost = isRetainer20 ? 1200 : isRetainer10 ? 700 : 400;
      const retainerSubs = [
        "Session planning & agenda",
        "Research & preparation",
        "Active session work",
        "Deliverable creation",
        "Review & revisions",
        "Month-end summary",
      ];

      for (let month = 1; month <= 3; month++) {
        const m = db.insert(milestones).values({
          projectId: project.id,
          sessionNumber: month,
          title: `Month ${month} Retainer`,
          description: `Monthly retainer work — ${hours} hours of dedicated brand development and design services.`,
          hours,
          cost,
          status: "not_started",
        }).returning().get();

        retainerSubs.forEach((title, i) => {
          db.insert(subMilestones).values({
            milestoneId: m.id,
            title,
            status: "pending",
            order: i + 1,
          }).run();
        });
      }
    }

    return { user, project };
  }

  getClientDetail(userId: number): {
    user: User;
    project: Project | null;
    milestones: any[];
    deliverables: any[];
  } {
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw new Error("User not found");

    const userProjects = db.select().from(projects).where(eq(projects.userId, userId)).all();
    const project = userProjects[0] || null;

    if (!project) return { user, project: null, milestones: [], deliverables: [] };

    const ms = db.select().from(milestones).where(eq(milestones.projectId, project.id)).all();
    const enrichedMs = ms.map((m) => ({
      ...m,
      subMilestones: db.select().from(subMilestones).where(eq(subMilestones.milestoneId, m.id)).all(),
      deliverables: db.select().from(deliverables).where(eq(deliverables.milestoneId, m.id)).all(),
    }));

    const allDeliverables: any[] = [];
    for (const m of enrichedMs) {
      allDeliverables.push(...m.deliverables.map((d: any) => ({ ...d, milestoneTitle: m.title })));
    }

    return { user, project, milestones: enrichedMs, deliverables: allDeliverables };
  }

  updateMilestoneStatus(id: number, status: string, notes?: string): void {
    const updateData: any = { status: status as any };
    if (status === "in_progress" && !updateData.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }
    if (status === "completed") {
      updateData.completedAt = new Date().toISOString();
    }
    db.update(milestones).set(updateData).where(eq(milestones.id, id)).run();
  }

  updateSubMilestoneStatus(id: number, status: string): void {
    db.update(subMilestones).set({ status: status as any }).where(eq(subMilestones.id, id)).run();
  }

  getAllTickets(status?: string): any[] {
    const allTickets = db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).all();
    const filtered = status && status !== "all" ? allTickets.filter((t) => t.status === status) : allTickets;

    return filtered.map((ticket) => {
      const user = db.select().from(users).where(eq(users.id, ticket.userId)).get();
      const replies = db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticket.id)).all();
      return { ...ticket, user, replies };
    });
  }

  getAllMessages(): any[] {
    const allProjects = db.select().from(projects).all();
    return allProjects.map((project) => {
      const user = db.select().from(users).where(eq(users.id, project.userId)).get();
      const msgs = db.select().from(messages).where(eq(messages.projectId, project.id)).orderBy(desc(messages.createdAt)).all();
      return { project, user, messages: msgs, lastMessage: msgs[0] || null };
    }).filter((p) => p.user && p.user.role === "client");
  }

  createDeliverable(data: {
    milestoneId: number;
    title: string;
    fileUrl?: string;
    fileStatus?: string;
    version?: number;
  }): Deliverable {
    return db.insert(deliverables).values({
      milestoneId: data.milestoneId,
      title: data.title,
      fileUrl: data.fileUrl || null,
      uploadedAt: new Date().toISOString(),
      fileStatus: (data.fileStatus || "draft") as any,
      version: data.version || 1,
    }).returning().get();
  }

  updateDeliverable(id: number, data: Partial<{
    title: string;
    fileUrl: string;
    fileStatus: string;
    version: number;
  }>): void {
    db.update(deliverables).set(data as any).where(eq(deliverables.id, id)).run();
  }

  getAdminDashboardStats(): {
    totalActiveClients: number;
    openTickets: number;
    projectsInProgress: number;
    totalRevenue: number;
    recentActivity: any[];
  } {
    const allClients = db.select().from(users).where(eq(users.role, "client")).all();
    const totalActiveClients = allClients.length;

    const allTickets = db.select().from(supportTickets).all();
    const openTickets = allTickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

    const allProjects = db.select().from(projects).all();
    const projectsInProgress = allProjects.filter((p) => p.status === "active").length;

    const allPayments = db.select().from(payments).all();
    const totalRevenue = allPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    // Recent activity: tickets + messages
    const recentTickets = db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).all().slice(0, 5);
    const recentMessages = db.select().from(messages).orderBy(desc(messages.createdAt)).all().slice(0, 5);

    const recentActivity = [
      ...recentTickets.map((t) => {
        const u = db.select().from(users).where(eq(users.id, t.userId)).get();
        return {
          type: "ticket",
          id: t.id,
          subject: t.subject,
          status: t.status,
          createdAt: t.createdAt,
          userName: u?.name || "Unknown",
        };
      }),
      ...recentMessages.map((m) => {
        const proj = db.select().from(projects).where(eq(projects.id, m.projectId)).get();
        const u = proj ? db.select().from(users).where(eq(users.id, proj.userId)).get() : null;
        return {
          type: "message",
          id: m.id,
          content: m.content.slice(0, 80),
          senderName: m.senderName,
          senderRole: m.senderRole,
          createdAt: m.createdAt,
          clientName: u?.name || "Unknown",
        };
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return { totalActiveClients, openTickets, projectsInProgress, totalRevenue, recentActivity };
  }
}

export const storage = new DatabaseStorage();

// Seed admin accounts
function seedAdminAccounts() {
  const brandonExists = storage.getUserByEmail("brandon@theleaagency.com");
  if (!brandonExists) {
    storage.createUser({
      email: "brandon@theleaagency.com",
      name: "Brandon Ellis",
      brandName: "LEAA Admin",
      accessCode: "ADMIN2026",
      role: "admin",
    });
  }

  const daleExists = storage.getUserByEmail("dale@theleaagency.com");
  if (!daleExists) {
    storage.createUser({
      email: "dale@theleaagency.com",
      name: "Dale Lane",
      brandName: "LEAA Admin",
      accessCode: "ADMIN2026",
      role: "admin",
    });
  }
}

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

  // ===== NEW SEED DATA =====

  // Styles for Erin Op Basics
  const style1 = db.insert(styles).values({
    projectId: project.id,
    name: "Essential Tank",
    category: "top",
    description: "Minimalist ribbed tank in organic cotton blend. Versatile base layer for the collection.",
    status: "tech_pack",
    imageUrl: null,
    techPackUrl: "#",
    patternStatus: "first_pattern",
    createdAt: "2026-02-20T00:00:00Z",
  }).returning().get();

  const style2 = db.insert(styles).values({
    projectId: project.id,
    name: "Performance Legging",
    category: "activewear",
    description: "High-waist compression legging with moisture-wicking 4-way stretch fabric.",
    status: "sketched",
    imageUrl: null,
    techPackUrl: null,
    patternStatus: "not_started",
    createdAt: "2026-02-25T00:00:00Z",
  }).returning().get();

  const style3 = db.insert(styles).values({
    projectId: project.id,
    name: "Oversized Hoodie",
    category: "top",
    description: "Relaxed-fit pullover hoodie with kangaroo pocket. Premium French terry construction.",
    status: "concept",
    imageUrl: null,
    techPackUrl: null,
    patternStatus: "not_started",
    createdAt: "2026-03-01T00:00:00Z",
  }).returning().get();

  // Materials
  db.insert(materials).values([
    {
      projectId: project.id,
      styleId: style1.id,
      type: "fabric",
      name: "GOTS Organic Cotton Rib 2x2",
      supplier: "Piana Nonwovens",
      costPerUnit: "$8.50/yd",
      moq: "50 yards",
      status: "approved",
      swatchUrl: null,
      notes: "GOTS certified. Available in 12 colorways. Lead time 4 weeks.",
      createdAt: "2026-02-22T00:00:00Z",
    },
    {
      projectId: project.id,
      styleId: style2.id,
      type: "fabric",
      name: "Performance Stretch Jersey (88/12)",
      supplier: "Repreve Fabrics",
      costPerUnit: "$12.00/yd",
      moq: "100 yards",
      status: "sampled",
      swatchUrl: null,
      notes: "Made from recycled plastic bottles. 4-way stretch. Moisture wicking.",
      createdAt: "2026-03-01T00:00:00Z",
    },
    {
      projectId: project.id,
      styleId: style1.id,
      type: "trim",
      name: "Flat Elastic Waistband — 1.5in",
      supplier: "Stretchline Holdings",
      costPerUnit: "$0.45/unit",
      moq: "500 units",
      status: "approved",
      swatchUrl: null,
      notes: "Soft-touch finish. Pre-shrunk.",
      createdAt: "2026-02-28T00:00:00Z",
    },
    {
      projectId: project.id,
      styleId: style3.id,
      type: "zipper",
      name: "YKK #5 Coil Zipper — 10in",
      supplier: "YKK USA",
      costPerUnit: "$1.20/unit",
      moq: "200 units",
      status: "researching",
      swatchUrl: null,
      notes: "Standard front pocket zipper. Multiple finish options.",
      createdAt: "2026-03-05T00:00:00Z",
    },
    {
      projectId: project.id,
      styleId: null,
      type: "label",
      name: "Woven Care Label — LEAA Standard",
      supplier: "Rapid Tag & Label",
      costPerUnit: "$0.28/unit",
      moq: "1000 units",
      status: "ordered",
      swatchUrl: null,
      notes: "All styles use same care label. Ordered for initial run.",
      createdAt: "2026-03-10T00:00:00Z",
    },
  ]).run();

  // Cost Sheet for Essential Tank
  db.insert(costSheets).values({
    styleId: style1.id,
    fabricCost: 4.25,
    trimCost: 0.85,
    laborCost: 6.50,
    otherCost: 1.10,
    totalCostPerUnit: 12.70,
    suggestedRetail: 48.00,
    margin: 73.5,
    updatedAt: "2026-03-15T00:00:00Z",
  }).run();

  // Legal Documents
  const ndaDoc = db.insert(legalDocuments).values({
    projectId: project.id,
    userId: user.id,
    templateName: "LEAA Mutual NDA",
    title: "Mutual Non-Disclosure Agreement",
    category: "nda",
    content: `MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Mutual Non-Disclosure Agreement ("Agreement") is entered into as of February 1, 2026, by and between Lane Ellis Apparel Agency LLC ("LEAA") and Erin Okoye d/b/a Erin Op Basics ("Client").\n\n1. PURPOSE\nThe parties wish to explore a potential business relationship in connection with apparel design and development services ("Purpose"). In connection with the Purpose, each party may disclose to the other certain confidential information.\n\n2. DEFINITION OF CONFIDENTIAL INFORMATION\n"Confidential Information" means any information disclosed by one party to the other, either directly or indirectly, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.\n\n3. OBLIGATIONS\nEach party agrees to hold the other party's Confidential Information in strict confidence, to use such information solely for the Purpose, and not to disclose such information to any third party without the prior written consent of the disclosing party.\n\n4. TERM\nThis Agreement shall remain in effect for a period of three (3) years from the date first written above.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by the laws of the State of Texas.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.`,
    status: "signed",
    sentAt: "2026-01-28T00:00:00Z",
    signedAt: "2026-01-31T00:00:00Z",
    signedBy: "Erin Okoye",
    signatureText: "Erin Okoye",
    dueDate: "2026-02-01",
    required: 1,
    createdAt: "2026-01-28T00:00:00Z",
  }).returning().get();

  db.insert(legalDocuments).values({
    projectId: project.id,
    userId: user.id,
    templateName: "LEAA Service Agreement",
    title: "Concept Development Service Agreement",
    category: "service_agreement",
    content: `SERVICE AGREEMENT\n\nThis Service Agreement ("Agreement") is entered into as of February 1, 2026, by and between Lane Ellis Apparel Agency LLC ("LEAA") and Erin Okoye d/b/a Erin Op Basics ("Client").\n\n1. SERVICES\nLEAA agrees to provide the following services to Client: 60-Day Concept Development Program, consisting of four structured sessions totaling 36 hours of dedicated apparel development consulting.\n\n2. COMPENSATION\nClient agrees to pay LEAA a total fee of $2,700, payable as follows: 50% deposit ($1,350) due upon signing, and 50% balance ($1,350) due upon completion of Session 3.\n\n3. DELIVERABLES\nLEAA will provide the following deliverables upon completion: Brand Brief, Mood Board, Customer Persona Deck, Competitive Landscape Analysis, Design Direction Document, Fabric & Color Palette Selections, Tech Packs (up to 5 styles), and LEAA Client Pathway Proposal.\n\n4. INTELLECTUAL PROPERTY\nUpon receipt of full payment, all deliverables created specifically for Client shall become the property of Client. LEAA retains the right to use general methodologies and processes in future engagements.\n\n5. REVISION POLICY\nEach deliverable includes one round of revisions. Additional revisions are available at $125/hour.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement.`,
    status: "signed",
    sentAt: "2026-02-01T00:00:00Z",
    signedAt: "2026-02-01T00:00:00Z",
    signedBy: "Erin Okoye",
    signatureText: "Erin Okoye",
    dueDate: "2026-02-01",
    required: 1,
    createdAt: "2026-02-01T00:00:00Z",
  }).run();

  db.insert(legalDocuments).values({
    projectId: project.id,
    userId: user.id,
    templateName: "LEAA Phase Sign-Off",
    title: "Phase 1 Completion Sign-Off",
    category: "phase_signoff",
    content: `PHASE 1 COMPLETION SIGN-OFF\n\nProject: Erin Op Basics — Concept Development 60-Day\nPhase: Session 1 — Understanding the Vision\nCompletion Date: February 8, 2026\n\nI, Erin Okoye, hereby acknowledge and confirm that:\n\n1. Session 1 (Understanding the Vision) has been completed to my satisfaction.\n2. I have received and reviewed all Phase 1 deliverables, including: Brand Brief — Erin Op Basics (v2), Concept Direction Deck (v1), and Mood Board Framework (PDF).\n3. I approve these deliverables and authorize LEAA to proceed to Session 2: Customer Profile Development.\n4. I understand that proceeding to Session 2 constitutes my agreement that Phase 1 work is complete and accepted.\n\nThis sign-off authorizes LEAA to begin scheduling Session 2 sessions and associated work.`,
    status: "signed",
    sentAt: "2026-02-08T00:00:00Z",
    signedAt: "2026-02-10T00:00:00Z",
    signedBy: "Erin Okoye",
    signatureText: "Erin Okoye",
    dueDate: "2026-02-12",
    required: 1,
    createdAt: "2026-02-08T00:00:00Z",
  }).run();

  db.insert(legalDocuments).values({
    projectId: project.id,
    userId: user.id,
    templateName: "LEAA Phase Sign-Off",
    title: "Phase 2 Midpoint Sign-Off",
    category: "phase_signoff",
    content: `PHASE 2 MIDPOINT SIGN-OFF\n\nProject: Erin Op Basics — Concept Development 60-Day\nPhase: Session 2 — Customer Profile Development (Weeks 1–4)\nMidpoint Date: March 15, 2026\n\nI, Erin Okoye, hereby acknowledge and confirm that:\n\n1. The first four weeks of Session 2 (Customer Profile Development) have been completed.\n2. I have received and reviewed all mid-phase deliverables, including: Customer Demographics Report and Psychographic Profile Summary.\n3. I approve these deliverables and authorize LEAA to continue with Session 2 Weeks 5–8.\n4. I understand the remaining balance of $1,350 is due upon completion of Session 3.\n\nPlease review the documents above, then type your name and date below to sign.`,
    status: "sent",
    sentAt: "2026-03-16T00:00:00Z",
    signedAt: null,
    signedBy: null,
    signatureText: null,
    dueDate: "2026-04-01",
    required: 1,
    createdAt: "2026-03-16T00:00:00Z",
  }).run();

  // Approvals
  db.insert(approvals).values([
    {
      projectId: project.id,
      deliverableId: null,
      milestoneId: m1.id,
      type: "deliverable_approval",
      title: "Brand Brief — Erin Op Basics v2",
      description: "Please review and approve the final brand brief before Session 2 begins.",
      status: "approved",
      approvedBy: "Erin Okoye",
      approvedAt: "2026-02-10T00:00:00Z",
      notes: "Looks great! The brand positioning is exactly right.",
      createdAt: "2026-02-08T00:00:00Z",
    },
    {
      projectId: project.id,
      deliverableId: null,
      milestoneId: m1.id,
      type: "deliverable_approval",
      title: "Mood Board Framework",
      description: "Approve the mood board direction to lock in the visual language for the collection.",
      status: "approved",
      approvedBy: "Erin Okoye",
      approvedAt: "2026-02-12T00:00:00Z",
      notes: "Love the earthy tones and clean aesthetic direction.",
      createdAt: "2026-02-08T00:00:00Z",
    },
    {
      projectId: project.id,
      deliverableId: null,
      milestoneId: m2.id,
      type: "deliverable_approval",
      title: "Psychographic Profile Summary v2",
      description: "Please review the updated psychographic profile and approve before we move into shopping behavior analysis.",
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      notes: null,
      createdAt: "2026-03-01T00:00:00Z",
    },
  ]).run();

  // Hour Logs
  db.insert(hourLogs).values([
    {
      projectId: project.id,
      milestoneId: m1.id,
      hours: 2.0,
      description: "Initial brand consultation call — brand story, target market, creative vision",
      date: "2026-02-01",
      loggedBy: "Dale Lane",
    },
    {
      projectId: project.id,
      milestoneId: m1.id,
      hours: 1.5,
      description: "Market research & competitor scan — sustainable basics landscape",
      date: "2026-02-03",
      loggedBy: "Brandon Ellis",
    },
    {
      projectId: project.id,
      milestoneId: m1.id,
      hours: 2.5,
      description: "Brand brief creation, mood board framework, vision alignment review",
      date: "2026-02-06",
      loggedBy: "Dale Lane",
    },
    {
      projectId: project.id,
      milestoneId: m2.id,
      hours: 2.0,
      description: "Week 1: Customer demographics deep dive session",
      date: "2026-02-15",
      loggedBy: "Dale Lane",
    },
    {
      projectId: project.id,
      milestoneId: m2.id,
      hours: 2.0,
      description: "Week 2: Psychographic profiling session — sustainability values & lifestyle",
      date: "2026-02-22",
      loggedBy: "Brandon Ellis",
    },
  ]).run();

  // Session Notes
  db.insert(sessionNotes).values([
    {
      milestoneId: m1.id,
      content: "Excellent kickoff session. Erin has a very clear vision for a sustainable basics line targeting modern professional women ages 28-42. Key insight: she wants pieces that transition from work to weekend without sacrificing sustainability. Core aesthetic: clean, minimal, earthy — think Everlane meets Patagonia at a contemporary price point ($45-$95). Her hero customer: city-based, eco-conscious, values quality over quantity. Strong starting point for the brand brief.",
      createdBy: "Dale Lane",
      createdAt: "2026-02-01T16:00:00Z",
    },
    {
      milestoneId: m2.id,
      content: "Strong Week 2 session on psychographic profiling. We identified that the core customer is driven by sustainability as a lifestyle (not just trend), shops intentionally, and is willing to pay premium for certified materials. Shopping behavior: prefers DTC brands, influenced by editorial content more than social media advertising. This will inform our go-to-market and design briefs significantly. Key personality traits: intentional, quality-focused, minimalist aesthetics, career-oriented.",
      createdBy: "Brandon Ellis",
      createdAt: "2026-02-22T16:00:00Z",
    },
  ]).run();

  // Document Templates
  db.insert(documentTemplates).values([
    {
      name: "LEAA Mutual NDA",
      category: "nda",
      content: `MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE], by and between Lane Ellis Apparel Agency LLC ("LEAA") and [CLIENT NAME] d/b/a [BRAND NAME] ("Client").\n\n1. PURPOSE\nThe parties wish to explore a potential business relationship in connection with apparel design and development services ("Purpose").\n\n2. DEFINITION OF CONFIDENTIAL INFORMATION\n"Confidential Information" means any information disclosed by one party to the other that is designated as confidential or that reasonably should be understood to be confidential.\n\n3. OBLIGATIONS\nEach party agrees to hold the other party's Confidential Information in strict confidence and not to disclose such information to any third party without prior written consent.\n\n4. TERM\nThis Agreement shall remain in effect for three (3) years from the date first written above.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by the laws of the State of Texas.`,
      isActive: 1,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      name: "LEAA Mutual Release",
      category: "mutual_release",
      content: `MUTUAL RELEASE\n\nThis Mutual Release ("Release") is entered into as of [DATE], by and between Lane Ellis Apparel Agency LLC ("LEAA") and [CLIENT NAME] ("Client").\n\n1. RELEASE OF CLAIMS\nEach party, on behalf of itself and its successors and assigns, hereby releases and forever discharges the other party from any and all claims, demands, actions, causes of action, damages, and liabilities of any kind arising out of or relating to the services provided under the Service Agreement dated [SERVICE AGREEMENT DATE].\n\n2. CONSIDERATION\nThis Release is given in consideration of the mutual releases herein and other good and valuable consideration, the receipt of which is hereby acknowledged.\n\n3. ENTIRE AGREEMENT\nThis Release constitutes the entire agreement between the parties with respect to its subject matter.`,
      isActive: 1,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      name: "LEAA Phase Sign-Off",
      category: "phase_signoff",
      content: `PHASE COMPLETION SIGN-OFF\n\nProject: [PROJECT NAME]\nPhase: [PHASE NAME]\nCompletion Date: [DATE]\n\nI, [CLIENT NAME], hereby acknowledge and confirm that:\n\n1. [PHASE NAME] has been completed to my satisfaction.\n2. I have received and reviewed all phase deliverables.\n3. I approve these deliverables and authorize LEAA to proceed to the next phase.\n4. I understand that proceeding constitutes my agreement that this phase work is complete and accepted.\n\nThis sign-off authorizes LEAA to begin scheduling the next phase and associated work.`,
      isActive: 1,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ]).run();
}

seedAdminAccounts();
seedDemoData();

function seedPhaseAData() {
  // Check if already seeded
  const existing = db.select().from(adminNotifications).all();
  if (existing.length > 0) return;

  // Get demo client for references
  const demoUser = storage.getUserByEmail("demo@leaa.com");
  if (!demoUser) return;
  const demoProjects = storage.getProjectsByUserId(demoUser.id);
  const demoProject = demoProjects[0];

  const now = new Date();
  const day = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  // ===== 8 Admin Notifications (mix of read/unread) =====
  const notifData = [
    {
      type: "ticket_created" as const,
      title: "New support ticket: Need to reschedule Session 2 Week 5",
      message: "Erin Okoye submitted a ticket: 'Need to reschedule Session 2 Week 5'",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: 3,
      isRead: 0,
      priority: "high" as const,
      createdAt: day(0),
    },
    {
      type: "approval_response" as const,
      title: "Approval response: Psychographic Profile Summary v2",
      message: "Erin Okoye has a pending approval for 'Psychographic Profile Summary v2' — awaiting response",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: null,
      isRead: 0,
      priority: "high" as const,
      createdAt: day(1),
    },
    {
      type: "document_signed" as const,
      title: "Document signed: Phase 2 Midpoint Sign-Off",
      message: "Erin Okoye viewed 'Phase 2 Midpoint Sign-Off' but has not yet signed",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: null,
      isRead: 0,
      priority: "normal" as const,
      createdAt: day(2),
    },
    {
      type: "ticket_reply" as const,
      title: "New reply on ticket: Revision request for mood board colors",
      message: "Erin Okoye replied: 'I'd love to adjust the palette — could we swap out coral for dusty rose?'",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: 2,
      isRead: 0,
      priority: "normal" as const,
      createdAt: day(3),
    },
    {
      type: "message_received" as const,
      title: "New message from Erin Okoye",
      message: "Erin sent a message about the upcoming session prep checklist",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: null,
      isRead: 1,
      priority: "normal" as const,
      createdAt: day(5),
    },
    {
      type: "document_signed" as const,
      title: "Document signed: Phase 1 Completion Sign-Off",
      message: "Erin Okoye signed 'Phase 1 Completion Sign-Off' on Feb 10",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: null,
      isRead: 1,
      priority: "normal" as const,
      createdAt: day(50),
    },
    {
      type: "onboarding_complete" as const,
      title: "New client onboarded: Erin Okoye",
      message: "Erin Okoye (Erin Op Basics) was onboarded. Service: Concept Development 60-Day",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: demoUser.id,
      isRead: 1,
      priority: "normal" as const,
      createdAt: day(62),
    },
    {
      type: "payment_received" as const,
      title: "Payment received: Concept Development Deposit (50%)",
      message: "Erin Okoye paid $1,350 — Concept Development Deposit (50%)",
      clientName: "Erin Okoye",
      projectId: demoProject?.id ?? null,
      relatedId: null,
      isRead: 1,
      priority: "low" as const,
      createdAt: day(30),
    },
  ];

  notifData.forEach((n) => db.insert(adminNotifications).values(n).run());

  // ===== 12 Admin Tasks =====
  const taskData = [
    // TODO (3)
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Respond to ticket: Need to reschedule Session 2 Week 5",
      description: "Client Erin Okoye submitted a scheduling ticket. Propose new time options.",
      assignedTo: "brandon" as const,
      priority: "high" as const,
      status: "todo" as const,
      category: "follow_up" as const,
      dueDate: new Date(now.getTime() - 86400000).toISOString().split("T")[0], // yesterday — overdue
      isAutoGenerated: 1,
      complianceGate: null,
      notes: null,
      createdAt: day(1),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Send Phase 2 Midpoint Sign-Off for review",
      description: "Follow up with Erin on Phase 2 Midpoint Sign-Off — document is sent but not signed.",
      assignedTo: "dale" as const,
      priority: "urgent" as const,
      status: "todo" as const,
      category: "legal" as const,
      dueDate: new Date().toISOString().split("T")[0], // due today
      isAutoGenerated: 1,
      complianceGate: null,
      notes: null,
      createdAt: day(2),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Review Psychographic Profile approval request",
      description: "Erin has a pending approval for Psychographic Profile Summary v2. Admin review needed.",
      assignedTo: "brandon" as const,
      priority: "normal" as const,
      status: "todo" as const,
      category: "deliverable" as const,
      dueDate: new Date(now.getTime() + 86400000 * 2).toISOString().split("T")[0],
      isAutoGenerated: 0,
      complianceGate: null,
      notes: null,
      createdAt: day(1),
    },
    // IN PROGRESS (2)
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Prepare Session 2 Week 5 materials",
      description: "Customer Journey Mapping session prep — worksheets, research framework, and examples.",
      assignedTo: "dale" as const,
      priority: "high" as const,
      status: "in_progress" as const,
      category: "session_prep" as const,
      dueDate: new Date(now.getTime() + 86400000 * 3).toISOString().split("T")[0],
      isAutoGenerated: 0,
      complianceGate: null,
      notes: "Created worksheet framework. Need to add 3 case study examples.",
      createdAt: day(3),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Fabric swatch card preparation for Session 3",
      description: "Source 6-8 organic cotton swatch options for Erin to review. Include GOTS-certified.",
      assignedTo: "brandon" as const,
      priority: "normal" as const,
      status: "in_progress" as const,
      category: "sourcing" as const,
      dueDate: new Date(now.getTime() + 86400000 * 7).toISOString().split("T")[0],
      isAutoGenerated: 0,
      complianceGate: null,
      notes: "Contacted Piana. Waiting on samples from 2 other suppliers.",
      createdAt: day(5),
    },
    // BLOCKED (1)
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Schedule Session 3: Design & Fabric Selection",
      description: "Cannot schedule Session 3 until Phase 2 Midpoint Sign-Off is completed by client.",
      assignedTo: "brandon" as const,
      priority: "high" as const,
      status: "blocked" as const,
      category: "session_prep" as const,
      dueDate: new Date(now.getTime() + 86400000 * 14).toISOString().split("T")[0],
      isAutoGenerated: 1,
      complianceGate: "Phase 2 Midpoint Sign-Off must be signed",
      notes: "Waiting on Erin to sign Phase 2 Midpoint document before scheduling.",
      createdAt: day(3),
    },
    // DONE (6)
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Send NDA to Erin Okoye",
      description: "Onboarding: Send Mutual NDA to Erin Okoye.",
      assignedTo: "brandon" as const,
      priority: "urgent" as const,
      status: "done" as const,
      category: "legal" as const,
      dueDate: day(61).split("T")[0],
      completedAt: day(61),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Sent via client portal. Signed within 3 days.",
      createdAt: day(63),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Send Service Agreement to Erin Okoye",
      description: "Onboarding: Send Concept Development Service Agreement.",
      assignedTo: "brandon" as const,
      priority: "urgent" as const,
      status: "done" as const,
      category: "legal" as const,
      dueDate: day(60).split("T")[0],
      completedAt: day(60),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Signed same day.",
      createdAt: day(63),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Set up Google Drive folder for Erin Op Basics",
      description: "Create shared folder structure for the project.",
      assignedTo: "dale" as const,
      priority: "normal" as const,
      status: "done" as const,
      category: "admin" as const,
      dueDate: day(61).split("T")[0],
      completedAt: day(61),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Folder created and shared with client.",
      createdAt: day(63),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Send welcome email to Erin Okoye",
      description: "Onboarding welcome email with portal login info.",
      assignedTo: "brandon" as const,
      priority: "high" as const,
      status: "done" as const,
      category: "onboarding" as const,
      dueDate: day(62).split("T")[0],
      completedAt: day(62),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Welcomed via email and added a portal intro message.",
      createdAt: day(63),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Prepare Session 1 recap",
      description: "Write up Session 1 recap notes for brand brief.",
      assignedTo: "dale" as const,
      priority: "high" as const,
      status: "done" as const,
      category: "session_prep" as const,
      dueDate: day(52).split("T")[0],
      completedAt: day(52),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Recap included in brand brief document.",
      createdAt: day(53),
    },
    {
      projectId: demoProject?.id ?? null,
      userId: demoUser.id,
      title: "Review signed Phase 1 Completion Sign-Off",
      description: "Client signed Phase 1 Completion Sign-Off. Review and file.",
      assignedTo: "brandon" as const,
      priority: "normal" as const,
      status: "done" as const,
      category: "legal" as const,
      dueDate: day(48).split("T")[0],
      completedAt: day(48),
      isAutoGenerated: 1,
      complianceGate: null,
      notes: "Filed. Session 2 scheduling authorized.",
      createdAt: day(50),
    },
  ];

  taskData.forEach((t) => db.insert(adminTasks).values(t).run());
}

seedPhaseAData();

