import { 
  type User, 
  type InsertUser, 
  type ChatSession, 
  type InsertChatSession,
  type Message,
  type InsertMessage,
  type AgentWorkflow,
  type InsertAgentWorkflow,
  type Document,
  type InsertDocument,
  type Source,
  type InsertSource,
  type AgentLog,
  type InsertAgentLog,
  type AgentType
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat Sessions
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;

  // Messages
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Agent Workflows
  getWorkflowBySession(sessionId: string): Promise<AgentWorkflow | undefined>;
  createWorkflow(workflow: InsertAgentWorkflow): Promise<AgentWorkflow>;
  updateWorkflow(id: string, updates: Partial<AgentWorkflow>): Promise<AgentWorkflow | undefined>;

  // Documents
  getDocumentsBySession(sessionId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Sources
  getSourcesBySession(sessionId: string): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;

  // Agent Logs
  getLogsBySession(sessionId: string): Promise<AgentLog[]>;
  createLog(log: InsertAgentLog): Promise<AgentLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private chatSessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, Message> = new Map();
  private agentWorkflows: Map<string, AgentWorkflow> = new Map();
  private documents: Map<string, Document> = new Map();
  private sources: Map<string, Source> = new Map();
  private agentLogs: Map<string, AgentLog> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Chat Sessions
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date() };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Messages
  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  // Agent Workflows
  async getWorkflowBySession(sessionId: string): Promise<AgentWorkflow | undefined> {
    return Array.from(this.agentWorkflows.values())
      .find(workflow => workflow.sessionId === sessionId);
  }

  async createWorkflow(insertWorkflow: InsertAgentWorkflow): Promise<AgentWorkflow> {
    const id = randomUUID();
    const workflow: AgentWorkflow = {
      ...insertWorkflow,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.agentWorkflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<AgentWorkflow>): Promise<AgentWorkflow | undefined> {
    const workflow = this.agentWorkflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { ...workflow, ...updates };
    if (updates.status === 'completed' && !updatedWorkflow.completedAt) {
      updatedWorkflow.completedAt = new Date();
    }
    this.agentWorkflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  // Documents
  async getDocumentsBySession(sessionId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.sessionId === sessionId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  // Sources
  async getSourcesBySession(sessionId: string): Promise<Source[]> {
    return Array.from(this.sources.values())
      .filter(source => source.sessionId === sessionId)
      .sort((a, b) => (b.addedAt?.getTime() || 0) - (a.addedAt?.getTime() || 0));
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const id = randomUUID();
    const source: Source = {
      ...insertSource,
      id,
      addedAt: new Date()
    };
    this.sources.set(id, source);
    return source;
  }

  // Agent Logs
  async getLogsBySession(sessionId: string): Promise<AgentLog[]> {
    return Array.from(this.agentLogs.values())
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async createLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const id = randomUUID();
    const log: AgentLog = {
      ...insertLog,
      id,
      timestamp: new Date()
    };
    this.agentLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
