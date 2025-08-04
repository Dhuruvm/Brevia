import type { User, InsertUser, ChatSession, InsertChatSession, Message, InsertMessage, 
  Workflow, InsertWorkflow, Document, InsertDocument, Source, InsertSource, 
  AgentLog, InsertAgentLog, KnowledgeBase, InsertKnowledgeBase, 
  AgentMetrics, InsertAgentMetrics, Plugin, InsertPlugin } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private usersByUsername = new Map<string, User>();
  private chatSessions = new Map<string, ChatSession>();
  private messages = new Map<string, Message[]>();
  private workflows = new Map<string, Workflow>();
  private documents = new Map<string, Document[]>();
  private sources = new Map<string, Source[]>();
  private agentLogs = new Map<string, AgentLog[]>();
  private knowledgeBase = new Map<string, KnowledgeBase>();
  private agentMetrics = new Map<string, AgentMetrics[]>();
  private plugins = new Map<string, Plugin>();

  // User management
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: insertUser.id || randomUUID(),
      username: insertUser.username,
      email: insertUser.email || null,
      preferences: insertUser.preferences || null,
      createdAt: insertUser.createdAt || new Date()
    };
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
    return user;
  }

  // Session management
  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const sessions = Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
    return sessions;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const session: ChatSession = {
      id: insertSession.id || randomUUID(),
      userId: insertSession.userId || null,
      title: insertSession.title,
      agentType: insertSession.agentType,
      context: insertSession.context || null,
      createdAt: insertSession.createdAt || new Date(),
      updatedAt: insertSession.updatedAt || new Date()
    };
    this.chatSessions.set(session.id, session);
    return session;
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const session = this.chatSessions.get(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.chatSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  // Message management
  async getMessages(sessionId: string): Promise<Message[]> {
    const sessionMessages = this.messages.get(sessionId) || [];
    return sessionMessages.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: insertMessage.id || randomUUID(),
      sessionId: insertMessage.sessionId || null,
      role: insertMessage.role,
      content: insertMessage.content,
      metadata: insertMessage.metadata || null,
      createdAt: insertMessage.createdAt || new Date()
    };

    const sessionId = message.sessionId!;
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);
    return message;
  }

  // Workflow management
  async getWorkflow(workflowId: string): Promise<Workflow | undefined> {
    return this.workflows.get(workflowId);
  }

  async getWorkflows(sessionId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.sessionId === sessionId)
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
      id: insertWorkflow.id || randomUUID(),
      sessionId: insertWorkflow.sessionId || null,
      agentType: insertWorkflow.agentType,
      task: insertWorkflow.task,
      status: insertWorkflow.status,
      currentStep: insertWorkflow.currentStep || 0,
      steps: insertWorkflow.steps,
      result: insertWorkflow.result || null,
      confidence: insertWorkflow.confidence || null,
      startedAt: insertWorkflow.startedAt || new Date(),
      completedAt: insertWorkflow.completedAt || null
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    const updatedWorkflow = { ...workflow, ...updates };
    this.workflows.set(workflowId, updatedWorkflow);
    return updatedWorkflow;
  }

  // Document management
  async getDocuments(sessionId: string): Promise<Document[]> {
    const sessionDocuments = this.documents.get(sessionId) || [];
    return sessionDocuments.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const document: Document = {
      id: insertDocument.id || randomUUID(),
      sessionId: insertDocument.sessionId || null,
      workflowId: insertDocument.workflowId || null,
      type: insertDocument.type,
      title: insertDocument.title,
      content: insertDocument.content,
      format: insertDocument.format,
      structure: insertDocument.structure || null,
      metadata: insertDocument.metadata || null,
      quality_score: insertDocument.quality_score || null,
      createdAt: insertDocument.createdAt || new Date()
    };

    const sessionId = document.sessionId!;
    const sessionDocuments = this.documents.get(sessionId) || [];
    sessionDocuments.push(document);
    this.documents.set(sessionId, sessionDocuments);
    return document;
  }

  // Source management
  async getSources(workflowId: string): Promise<Source[]> {
    const workflowSources = this.sources.get(workflowId) || [];
    return workflowSources.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const source: Source = {
      id: insertSource.id || randomUUID(),
      workflowId: insertSource.workflowId || null,
      type: insertSource.type,
      url: insertSource.url || null,
      title: insertSource.title || null,
      content: insertSource.content || null,
      summary: insertSource.summary || null,
      embedding: insertSource.embedding || null,
      credibility_score: insertSource.credibility_score || null,
      relevance_score: insertSource.relevance_score || null,
      metadata: insertSource.metadata || null,
      createdAt: insertSource.createdAt || new Date()
    };

    const workflowId = source.workflowId!;
    const workflowSources = this.sources.get(workflowId) || [];
    workflowSources.push(source);
    this.sources.set(workflowId, workflowSources);
    return source;
  }

  // Agent logs
  async getAgentLogs(workflowId: string): Promise<AgentLog[]> {
    const workflowLogs = this.agentLogs.get(workflowId) || [];
    return workflowLogs.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const log: AgentLog = {
      id: insertLog.id || randomUUID(),
      workflowId: insertLog.workflowId || null,
      agentType: insertLog.agentType,
      step: insertLog.step,
      input: insertLog.input || null,
      output: insertLog.output || null,
      model_used: insertLog.model_used || null,
      tokens_used: insertLog.tokens_used || null,
      duration: insertLog.duration || null,
      success: insertLog.success,
      error: insertLog.error || null,
      timestamp: insertLog.timestamp || new Date()
    };

    const workflowId = log.workflowId!;
    const workflowLogs = this.agentLogs.get(workflowId) || [];
    workflowLogs.push(log);
    this.agentLogs.set(workflowId, workflowLogs);
    return log;
  }

  // Knowledge base
  async searchKnowledge(query: string, limit: number = 10): Promise<KnowledgeBase[]> {
    const results = Array.from(this.knowledgeBase.values())
      .filter(kb => kb.topic.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (b.last_used?.getTime() || 0) - (a.last_used?.getTime() || 0))
      .slice(0, limit);
    return results;
  }

  async createKnowledge(insertKnowledge: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const knowledge: KnowledgeBase = {
      id: insertKnowledge.id || randomUUID(),
      topic: insertKnowledge.topic,
      content: insertKnowledge.content,
      embedding: insertKnowledge.embedding || null,
      source_type: insertKnowledge.source_type || null,
      confidence: insertKnowledge.confidence || null,
      usage_count: insertKnowledge.usage_count || 0,
      last_used: insertKnowledge.last_used || null,
      tags: insertKnowledge.tags || null,
      metadata: insertKnowledge.metadata || null,
      createdAt: insertKnowledge.createdAt || new Date(),
      updatedAt: insertKnowledge.updatedAt || new Date()
    };
    this.knowledgeBase.set(knowledge.id, knowledge);
    return knowledge;
  }

  // Agent metrics
  async getAgentMetrics(agentType: string): Promise<AgentMetrics[]> {
    const typeMetrics = this.agentMetrics.get(agentType) || [];
    return typeMetrics.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createAgentMetrics(insertMetrics: InsertAgentMetrics): Promise<AgentMetrics> {
    const metrics: AgentMetrics = {
      id: insertMetrics.id || randomUUID(),
      agentType: insertMetrics.agentType,
      task_type: insertMetrics.task_type || null,
      success_rate: insertMetrics.success_rate || null,
      avg_duration: insertMetrics.avg_duration || null,
      user_satisfaction: insertMetrics.user_satisfaction || null,
      model_performance: insertMetrics.model_performance || null,
      improvement_suggestions: insertMetrics.improvement_suggestions || null,
      period_start: insertMetrics.period_start || null,
      period_end: insertMetrics.period_end || null,
      createdAt: insertMetrics.createdAt || new Date()
    };

    const agentType = metrics.agentType;
    const typeMetrics = this.agentMetrics.get(agentType) || [];
    typeMetrics.push(metrics);
    this.agentMetrics.set(agentType, typeMetrics);
    return metrics;
  }

  // Plugin management
  async getPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getPlugin(name: string): Promise<Plugin | undefined> {
    return Array.from(this.plugins.values()).find(plugin => plugin.name === name);
  }

  async createPlugin(insertPlugin: InsertPlugin): Promise<Plugin> {
    const plugin: Plugin = {
      id: insertPlugin.id || randomUUID(),
      name: insertPlugin.name,
      type: insertPlugin.type,
      provider: insertPlugin.provider || null,
      model_name: insertPlugin.model_name || null,
      config: insertPlugin.config,
      enabled: insertPlugin.enabled !== undefined ? insertPlugin.enabled : true,
      performance_metrics: insertPlugin.performance_metrics || null,
      createdAt: insertPlugin.createdAt || new Date(),
      updatedAt: insertPlugin.updatedAt || new Date()
    };
    this.plugins.set(plugin.id, plugin);
    return plugin;
  }

  async updatePlugin(pluginId: string, updates: Partial<Plugin>): Promise<Plugin> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    const updatedPlugin = { ...plugin, ...updates, updatedAt: new Date() };
    this.plugins.set(pluginId, updatedPlugin);
    return updatedPlugin;
  }
}

export const storage = new MemoryStorage();