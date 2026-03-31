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
