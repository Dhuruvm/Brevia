import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  agentType: text("agent_type").notNull(), // 'research', 'notes', 'documents', 'resume', 'presentations'
  title: text("title").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'paused'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For storing source citations, workflow steps, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentWorkflows = pgTable("agent_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  agentType: text("agent_type").notNull(),
  status: text("status").notNull().default("planning"), // 'planning', 'searching', 'analyzing', 'generating', 'completed', 'error'
  currentStep: text("current_step"),
  steps: jsonb("steps"), // Array of workflow steps with status
  progress: integer("progress").default(0), // 0-100
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  url: text("url"),
  title: text("title").notNull(),
  content: text("content"),
  sourceType: text("source_type").notNull(), // 'pdf', 'web', 'youtube', 'research_paper'
  metadata: jsonb("metadata"), // Citations, timestamps, etc.
  addedAt: timestamp("added_at").defaultNow(),
});

export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  level: text("level").notNull(), // 'info', 'debug', 'warning', 'error'
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertAgentWorkflowSchema = createInsertSchema(agentWorkflows).omit({ id: true, startedAt: true, completedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true, addedAt: true });
export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type AgentWorkflow = typeof agentWorkflows.$inferSelect;
export type InsertAgentWorkflow = z.infer<typeof insertAgentWorkflowSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;

// Agent types
export const AGENT_TYPES = {
  RESEARCH: 'research',
  NOTES: 'notes', 
  DOCUMENTS: 'documents',
  RESUME: 'resume',
  PRESENTATIONS: 'presentations'
} as const;

export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES];

// Workflow status types
export const WORKFLOW_STATUS = {
  PLANNING: 'planning',
  SEARCHING: 'searching', 
  ANALYZING: 'analyzing',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];
