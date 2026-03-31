import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  brandName: text("brand_name").notNull(),
  accessCode: text("access_code").notNull(),
  role: text("role", { enum: ["client", "admin"] }).notNull().default("client"),
  onboardingStatus: text("onboarding_status", {
    enum: ["not_started", "in_progress", "completed"],
  }).notNull().default("not_started"),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status", { enum: ["active", "completed", "paused"] }).notNull().default("active"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
});

export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  sessionNumber: integer("session_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  hours: real("hours").notNull(),
  cost: real("cost").notNull(),
  status: text("status", { enum: ["not_started", "in_progress", "completed"] }).notNull().default("not_started"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
});

export const subMilestones = sqliteTable("sub_milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  milestoneId: integer("milestone_id").notNull(),
  title: text("title").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).notNull().default("pending"),
  order: integer("order").notNull(),
});

export const deliverables = sqliteTable("deliverables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  milestoneId: integer("milestone_id").notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url"),
  uploadedAt: text("uploaded_at"),
  fileStatus: text("file_status", { enum: ["draft", "under_review", "approved", "final"] }).default("draft"),
  version: integer("version").default(1),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role", { enum: ["admin", "client"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  isRead: integer("is_read").default(1),
});

// NEW TABLES

export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  category: text("category", {
    enum: ["general", "revision", "scheduling", "deliverable", "billing", "feedback", "other"],
  }).notNull(),
  priority: text("priority", { enum: ["normal", "urgent"] }).notNull().default("normal"),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  attachmentRef: text("attachment_ref"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const ticketReplies = sqliteTable("ticket_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role", { enum: ["admin", "client"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["getting_started", "session_prep", "faq", "brand_resources"],
  }).notNull(),
  iconName: text("icon_name").notNull(),
  order: integer("order").notNull().default(0),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: ["deliverable", "ticket", "session", "message", "billing"],
  }).notNull(),
  isRead: integer("is_read").default(0),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["paid", "pending", "overdue"] }).notNull(),
  dueDate: text("due_date").notNull(),
  paidDate: text("paid_date"),
});

export const sessions = sqliteTable("sessions_schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  notes: text("notes"),
  prepChecklist: text("prep_checklist"), // JSON string array
  status: text("status", { enum: ["upcoming", "completed", "cancelled"] }).notNull().default("upcoming"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true });
export const insertSubMilestoneSchema = createInsertSchema(subMilestones).omit({ id: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true });
export const insertTicketReplySchema = createInsertSchema(ticketReplies).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  accessCode: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type SubMilestone = typeof subMilestones.$inferSelect;
export type InsertSubMilestone = z.infer<typeof insertSubMilestoneSchema>;
export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SessionSchedule = typeof sessions.$inferSelect;
export type InsertSessionSchedule = z.infer<typeof insertSessionSchema>;

// ===== UPGRADE 1: Enhanced Concept Development =====

export const approvals = sqliteTable("approvals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  deliverableId: integer("deliverable_id"),
  milestoneId: integer("milestone_id"),
  type: text("type", { enum: ["deliverable_approval", "phase_signoff", "legal_document", "design_approval", "material_approval", "sample_approval"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "approved", "rejected", "revision_requested"] }).notNull().default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const sessionNotes = sqliteTable("session_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  milestoneId: integer("milestone_id").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const hourLogs = sqliteTable("hour_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  milestoneId: integer("milestone_id"),
  hours: real("hours").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  loggedBy: text("logged_by").notNull(),
});

// ===== UPGRADE 2: Design & Sourcing Pipeline =====

export const styles = sqliteTable("styles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  category: text("category", { enum: ["top", "bottom", "outerwear", "dress", "accessory", "activewear", "other"] }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["concept", "sketched", "tech_pack", "pattern", "sample", "approved", "production"] }).notNull().default("concept"),
  imageUrl: text("image_url"),
  techPackUrl: text("tech_pack_url"),
  patternStatus: text("pattern_status", { enum: ["not_started", "first_pattern", "fitting", "revised", "graded", "approved"] }).default("not_started"),
  createdAt: text("created_at").notNull(),
});

export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  styleId: integer("style_id"),
  type: text("type", { enum: ["fabric", "trim", "label", "thread", "zipper", "button", "other"] }).notNull(),
  name: text("name").notNull(),
  supplier: text("supplier"),
  costPerUnit: text("cost_per_unit"),
  moq: text("moq"),
  status: text("status", { enum: ["researching", "sampled", "approved", "ordered", "received"] }).notNull().default("researching"),
  swatchUrl: text("swatch_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const costSheets = sqliteTable("cost_sheets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  styleId: integer("style_id").notNull(),
  fabricCost: real("fabric_cost"),
  trimCost: real("trim_cost"),
  laborCost: real("labor_cost"),
  otherCost: real("other_cost"),
  totalCostPerUnit: real("total_cost_per_unit"),
  suggestedRetail: real("suggested_retail"),
  margin: real("margin"),
  updatedAt: text("updated_at").notNull(),
});

// ===== UPGRADE 3: Legal & Compliance Document Vault =====

export const legalDocuments = sqliteTable("legal_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  templateName: text("template_name").notNull(),
  title: text("title").notNull(),
  category: text("category", { enum: ["nda", "service_agreement", "mutual_release", "phase_signoff", "design_approval", "ip_assignment", "other"] }).notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "sent", "viewed", "signed", "expired"] }).notNull().default("pending"),
  sentAt: text("sent_at"),
  signedAt: text("signed_at"),
  signedBy: text("signed_by"),
  signatureText: text("signature_text"),
  dueDate: text("due_date"),
  required: integer("required").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const documentTemplates = sqliteTable("document_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

// Insert schemas for new tables
export const insertApprovalSchema = createInsertSchema(approvals).omit({ id: true });
export const insertSessionNoteSchema = createInsertSchema(sessionNotes).omit({ id: true });
export const insertHourLogSchema = createInsertSchema(hourLogs).omit({ id: true });
export const insertStyleSchema = createInsertSchema(styles).omit({ id: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true });
export const insertCostSheetSchema = createInsertSchema(costSheets).omit({ id: true });
export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({ id: true });
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({ id: true });

// Types for new tables
export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = z.infer<typeof insertSessionNoteSchema>;
export type HourLog = typeof hourLogs.$inferSelect;
export type InsertHourLog = z.infer<typeof insertHourLogSchema>;
export type Style = typeof styles.$inferSelect;
export type InsertStyle = z.infer<typeof insertStyleSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type CostSheet = typeof costSheets.$inferSelect;
export type InsertCostSheet = z.infer<typeof insertCostSheetSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

// ===== ONBOARDING =====

export const clientOnboarding = sqliteTable("client_onboarding", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  completedAt: text("completed_at"),
  signatureText: text("signature_text"),
  signedAt: text("signed_at"),
  step1Viewed: integer("step1_viewed").notNull().default(0),
  step2Viewed: integer("step2_viewed").notNull().default(0),
  step3Viewed: integer("step3_viewed").notNull().default(0),
  step4Viewed: integer("step4_viewed").notNull().default(0),
  step5Viewed: integer("step5_viewed").notNull().default(0),
  step6Completed: integer("step6_completed").notNull().default(0),
});

export const insertClientOnboardingSchema = createInsertSchema(clientOnboarding).omit({ id: true });
export type ClientOnboarding = typeof clientOnboarding.$inferSelect;
export type InsertClientOnboarding = z.infer<typeof insertClientOnboardingSchema>;

export const onboardingProgress = sqliteTable("onboarding_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  step: text("step").notNull(),
  completedAt: text("completed_at").notNull(),
  data: text("data"),
});

export const ONBOARDING_STEPS = [
  "welcome",
  "brand_profile",
  "how_it_works",
  "portal_tour",
  "key_documents",
  "signoff",
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const insertOnboardingProgressSchema = createInsertSchema(
  onboardingProgress
).omit({ id: true });

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<
  typeof insertOnboardingProgressSchema
>;

// ===== PHASE A: Admin Operations =====

export const adminNotifications = sqliteTable("admin_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["ticket_created", "ticket_reply", "document_signed", "document_viewed", "approval_response", "message_received", "payment_received", "payment_overdue", "milestone_completed", "onboarding_complete"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  clientName: text("client_name"),
  projectId: integer("project_id"),
  relatedId: integer("related_id"),
  isRead: integer("is_read").notNull().default(0),
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
  createdAt: text("created_at").notNull(),
});

export const adminTasks = sqliteTable("admin_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id"),
  userId: integer("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to", { enum: ["brandon", "dale", "both"] }).notNull().default("brandon"),
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
  status: text("status", { enum: ["todo", "in_progress", "blocked", "done"] }).notNull().default("todo"),
  category: text("category", { enum: ["onboarding", "session_prep", "deliverable", "follow_up", "legal", "billing", "sourcing", "design", "admin"] }).notNull(),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  isAutoGenerated: integer("is_auto_generated").notNull().default(0),
  complianceGate: text("compliance_gate"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ id: true });
export const insertAdminTaskSchema = createInsertSchema(adminTasks).omit({ id: true });

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type AdminTask = typeof adminTasks.$inferSelect;
export type InsertAdminTask = z.infer<typeof insertAdminTaskSchema>;

