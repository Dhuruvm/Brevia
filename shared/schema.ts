import { pgTable, uuid, text, timestamp, jsonb, varchar, integer, boolean, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }),
  preferences: jsonb("preferences"), // Agent preferences, model choices, etc.
  createdAt: timestamp("created_at").defaultNow()
});

// Chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // research, notes, documents, resume, presentation
  context: jsonb("context"), // Session context and memory
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Messages in chat sessions
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional data like sources, citations, etc.
  createdAt: timestamp("created_at").defaultNow()
});

// Agent workflows and execution logs
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  task: text("task").notNull(), // Original user task
  status: varchar("status", { length: 20 }).notNull(), // pending, running, completed, failed
  currentStep: integer("current_step").default(0),
  steps: jsonb("steps").notNull(), // Array of workflow steps with status
  result: jsonb("result"), // Final output
  confidence: real("confidence"), // AI confidence score
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Generated documents and outputs
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => chatSessions.id),
  workflowId: uuid("workflow_id").references(() => workflows.id),
  type: varchar("type", { length: 50 }).notNull(), // note, document, resume, presentation
  title: text("title").notNull(),
  content: text("content").notNull(),
  format: varchar("format", { length: 20 }).notNull(), // markdown, html, pdf, docx
  structure: jsonb("structure"), // Document outline, sections, etc.
  metadata: jsonb("metadata"), // Tags, categories, etc.
  quality_score: real("quality_score"), // AI-assessed quality
  createdAt: timestamp("created_at").defaultNow()
});

// Sources and references used in generation
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").references(() => workflows.id),
  type: varchar("type", { length: 50 }).notNull(), // url, pdf, video, audio, text, file
  url: text("url"),
  title: text("title"),
  content: text("content"),
  summary: text("summary"),
  embedding: jsonb("embedding"), // Vector embedding for similarity search
  credibility_score: real("credibility_score"), // Source reliability
  relevance_score: real("relevance_score"), // Relevance to task
  metadata: jsonb("metadata"), // Author, date, domain, etc.
  createdAt: timestamp("created_at").defaultNow()
});

// Agent execution logs for learning and debugging
export const agentLogs = pgTable("agent_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workflowId: uuid("workflow_id").references(() => workflows.id),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  step: varchar("step", { length: 100 }).notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  model_used: varchar("model_used", { length: 100 }),
  tokens_used: integer("tokens_used"),
  duration: integer("duration"), // milliseconds
  success: boolean("success").notNull(),
  error: text("error"),
  timestamp: timestamp("timestamp").defaultNow()
});

// Knowledge base for persistent learning
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic: varchar("topic", { length: 200 }).notNull(),
  content: text("content").notNull(),
  embedding: jsonb("embedding"), // Vector embedding
  source_type: varchar("source_type", { length: 50 }),
  confidence: real("confidence"),
  usage_count: integer("usage_count").default(0),
  last_used: timestamp("last_used"),
  tags: text("tags").array(), // Array of tags
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Agent performance metrics for self-learning
export const agentMetrics = pgTable("agent_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentType: varchar("agent_type", { length: 50 }).notNull(),
  task_type: varchar("task_type", { length: 100 }),
  success_rate: real("success_rate"),
  avg_duration: real("avg_duration"),
  user_satisfaction: real("user_satisfaction"), // Based on feedback
  model_performance: jsonb("model_performance"), // Per-model stats
  improvement_suggestions: text("improvement_suggestions").array(),
  period_start: timestamp("period_start"),
  period_end: timestamp("period_end"),
  createdAt: timestamp("created_at").defaultNow()
});

// Plugin configurations and tools
export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // llm, embedding, tool, parser
  provider: varchar("provider", { length: 100 }), // huggingface, openai, local
  model_name: varchar("model_name", { length: 200 }),
  config: jsonb("config").notNull(), // Model/tool configuration
  enabled: boolean("enabled").default(true),
  performance_metrics: jsonb("performance_metrics"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(chatSessions)
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id]
  }),
  messages: many(messages),
  workflows: many(workflows),
  documents: many(documents)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id]
  })
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  session: one(chatSessions, {
    fields: [workflows.sessionId],
    references: [chatSessions.id]
  }),
  documents: many(documents),
  sources: many(sources),
  logs: many(agentLogs)
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  session: one(chatSessions, {
    fields: [documents.sessionId],
    references: [chatSessions.id]
  }),
  workflow: one(workflows, {
    fields: [documents.workflowId],
    references: [workflows.id]
  })
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  workflow: one(workflows, {
    fields: [sources.workflowId],
    references: [workflows.id]
  })
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  workflow: one(workflows, {
    fields: [agentLogs.workflowId],
    references: [workflows.id]
  })
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const selectChatSessionSchema = createSelectSchema(chatSessions);
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const insertWorkflowSchema = createInsertSchema(workflows);
export const selectWorkflowSchema = createSelectSchema(workflows);
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const insertSourceSchema = createInsertSchema(sources);
export const selectSourceSchema = createSelectSchema(sources);
export type Source = typeof sources.$inferSelect;
export type InsertSource = typeof sources.$inferInsert;

export const insertAgentLogSchema = createInsertSchema(agentLogs);
export const selectAgentLogSchema = createSelectSchema(agentLogs);
export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase);
export const selectKnowledgeBaseSchema = createSelectSchema(knowledgeBase);
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

export const insertAgentMetricsSchema = createInsertSchema(agentMetrics);
export const selectAgentMetricsSchema = createSelectSchema(agentMetrics);
export type AgentMetrics = typeof agentMetrics.$inferSelect;
export type InsertAgentMetrics = typeof agentMetrics.$inferInsert;

export const insertPluginSchema = createInsertSchema(plugins);
export const selectPluginSchema = createSelectSchema(plugins);
export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = typeof plugins.$inferInsert;