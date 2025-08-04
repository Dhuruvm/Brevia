import { db } from './db';
import { users, chatSessions, messages, workflows, documents, sources, agentLogs, knowledgeBase, agentMetrics, plugins } from "@shared/schema";
import type { User, InsertUser, ChatSession, InsertChatSession, Message, InsertMessage, 
  Workflow, InsertWorkflow, Document, InsertDocument, Source, InsertSource, 
  AgentLog, InsertAgentLog, KnowledgeBase, InsertKnowledgeBase, 
  AgentMetrics, InsertAgentMetrics, Plugin, InsertPlugin } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Session management
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  getChatSessions(userId: string): Promise<ChatSession[]>;
  createChatSession(insertSession: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession>;

  // Message management
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(insertMessage: InsertMessage): Promise<Message>;

  // Workflow management
  getWorkflow(workflowId: string): Promise<Workflow | undefined>;
  getWorkflows(sessionId: string): Promise<Workflow[]>;
  createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow>;

  // Document management
  getDocuments(sessionId: string): Promise<Document[]>;
  createDocument(insertDocument: InsertDocument): Promise<Document>;
  
  // Source management
  getSources(workflowId: string): Promise<Source[]>;
  createSource(insertSource: InsertSource): Promise<Source>;

  // Agent logs
  getAgentLogs(workflowId: string): Promise<AgentLog[]>;
  createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog>;

  // Knowledge base
  searchKnowledge(query: string, limit?: number): Promise<KnowledgeBase[]>;
  createKnowledge(insertKnowledge: InsertKnowledgeBase): Promise<KnowledgeBase>;
  
  // Agent metrics
  getAgentMetrics(agentType: string): Promise<AgentMetrics[]>;
  createAgentMetrics(insertMetrics: InsertAgentMetrics): Promise<AgentMetrics>;

  // Plugin management
  getPlugins(): Promise<Plugin[]>;
  getPlugin(name: string): Promise<Plugin | undefined>;
  createPlugin(insertPlugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(pluginId: string, updates: Partial<Plugin>): Promise<Plugin>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Session management
  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session || undefined;
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      console.log('Fetching chat sessions for user:', userId);
      const sessions = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId))
        .orderBy(desc(chatSessions.updatedAt));
      console.log('Found sessions:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      // Return empty array if no sessions exist yet
      return [];
    }
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId))
      .returning();
    return session;
  }

  // Message management
  async getMessages(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Workflow management
  async getWorkflow(workflowId: string): Promise<Workflow | undefined> {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId));
    return workflow || undefined;
  }

  async getWorkflows(sessionId: string): Promise<Workflow[]> {
    return await db
      .select()
      .from(workflows)
      .where(eq(workflows.sessionId, sessionId))
      .orderBy(desc(workflows.startedAt));
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db
      .insert(workflows)
      .values(insertWorkflow)
      .returning();
    return workflow;
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const [workflow] = await db
      .update(workflows)
      .set(updates)
      .where(eq(workflows.id, workflowId))
      .returning();
    return workflow;
  }

  // Document management
  async getDocuments(sessionId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.sessionId, sessionId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  // Source management
  async getSources(workflowId: string): Promise<Source[]> {
    return await db
      .select()
      .from(sources)
      .where(eq(sources.workflowId, workflowId))
      .orderBy(desc(sources.createdAt));
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const [source] = await db
      .insert(sources)
      .values(insertSource)
      .returning();
    return source;
  }

  // Agent logs
  async getAgentLogs(workflowId: string): Promise<AgentLog[]> {
    return await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.workflowId, workflowId))
      .orderBy(asc(agentLogs.timestamp));
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const [log] = await db
      .insert(agentLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // Knowledge base
  async searchKnowledge(query: string, limit: number = 10): Promise<KnowledgeBase[]> {
    // Simple text search for now - can be enhanced with vector search later
    return await db
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.topic, query))
      .limit(limit)
      .orderBy(desc(knowledgeBase.last_used));
  }

  async createKnowledge(insertKnowledge: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [knowledge] = await db
      .insert(knowledgeBase)
      .values(insertKnowledge)
      .returning();
    return knowledge;
  }

  // Agent metrics
  async getAgentMetrics(agentType: string): Promise<AgentMetrics[]> {
    return await db
      .select()
      .from(agentMetrics)
      .where(eq(agentMetrics.agentType, agentType))
      .orderBy(desc(agentMetrics.createdAt));
  }

  async createAgentMetrics(insertMetrics: InsertAgentMetrics): Promise<AgentMetrics> {
    const [metrics] = await db
      .insert(agentMetrics)
      .values(insertMetrics)
      .returning();
    return metrics;
  }

  // Plugin management
  async getPlugins(): Promise<Plugin[]> {
    return await db
      .select()
      .from(plugins)
      .orderBy(asc(plugins.name));
  }

  async getPlugin(name: string): Promise<Plugin | undefined> {
    const [plugin] = await db
      .select()
      .from(plugins)
      .where(eq(plugins.name, name));
    return plugin || undefined;
  }

  async createPlugin(insertPlugin: InsertPlugin): Promise<Plugin> {
    const [plugin] = await db
      .insert(plugins)
      .values(insertPlugin)
      .returning();
    return plugin;
  }

  async updatePlugin(pluginId: string, updates: Partial<Plugin>): Promise<Plugin> {
    const [plugin] = await db
      .update(plugins)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plugins.id, pluginId))
      .returning();
    return plugin;
  }
}

export const storage = new DatabaseStorage();