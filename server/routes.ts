import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentOrchestrator } from "./core/agent-orchestrator";
import { pluginManager } from "./core/plugin-manager";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { validateSchema, sanitizeInput, errorHandler, auditLogger } from "./middleware/security";
import { z } from "zod";

// Request schemas
const createSessionSchema = z.object({
  agentType: z.enum(['research', 'notes', 'documents', 'resume', 'presentation']),
  title: z.string().min(1)
});

const sendMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1)
});

const executeAgentSchema = z.object({
  task: z.string().min(1),
  agentType: z.enum(['research', 'notes', 'documents', 'resume', 'presentation']).optional(),
  sessionId: z.string()
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply security middleware to all routes
  app.use(auditLogger);
  app.use(sanitizeInput);
  
  // Initialize orchestrator when routes are loaded
  agentOrchestrator.initialize().catch(console.error);
  
  // Get chat sessions for user (mock user for now)
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getChatSessions("mock-user-id");
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Create new chat session
  app.post("/api/sessions", validateSchema(createSessionSchema), async (req, res) => {
    try {
      const data = createSessionSchema.parse(req.body);
      
      const session = await storage.createChatSession({
        userId: "mock-user-id", // In real app, get from auth
        agentType: data.agentType,
        title: data.title
      });

      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });

  // Get session details with messages
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const session = await storage.getChatSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const messages = await storage.getMessages(id);
      const workflows = await storage.getWorkflows(id);
      const documents = await storage.getDocuments(id);

      res.json({
        session,
        messages,
        workflows,
        documents
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Get messages for a session
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Add a message to a session
  app.post("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validatedData,
        sessionId,
      });
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Execute AI agent task - CORE ENDPOINT
  app.post("/api/agents/execute", async (req, res) => {
    try {
      const data = executeAgentSchema.parse(req.body);
      
      console.log(`🤖 Executing agent for task: ${data.task.substring(0, 100)}...`);

      // Auto-detect agent type if not provided
      const finalAgentType = data.agentType || await agentOrchestrator.detectAgentType(data.task);
      
      // Store user message
      await storage.createMessage({
        sessionId: data.sessionId,
        role: 'user',
        content: data.task
      });

      // Execute the agent task
      const result = await agentOrchestrator.executeTask({
        task: data.task,
        agentType: finalAgentType,
        sessionId: data.sessionId,
        userId: "mock-user-id"
      });

      // Store assistant response
      await storage.createMessage({
        sessionId: data.sessionId,
        role: 'assistant',
        content: result.content,
        metadata: {
          workflowId: result.workflowId,
          agentType: finalAgentType,
          success: result.success,
          confidence: result.metadata?.confidence,
          sources: result.metadata?.sources?.length || 0
        }
      });

      res.json({
        success: result.success,
        content: result.content,
        agentType: finalAgentType,
        workflowId: result.workflowId,
        metadata: result.metadata,
        error: result.error
      });

    } catch (error) {
      console.error("Error executing agent:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false,
          error: "Invalid request data",
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : "Agent execution failed" 
        });
      }
    }
  });

  // Get workflow status
  app.get("/api/workflows/:workflowId/status", async (req, res) => {
    try {
      const { workflowId } = req.params;
      const status = await agentOrchestrator.getWorkflowStatus(workflowId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching workflow status:", error);
      res.status(500).json({ error: "Failed to fetch workflow status" });
    }
  });

  // Get active workflows
  app.get("/api/workflows/active", async (req, res) => {
    try {
      const workflows = await agentOrchestrator.getActiveWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching active workflows:", error);
      res.status(500).json({ error: "Failed to fetch active workflows" });
    }
  });

  // Cancel a workflow
  app.post("/api/workflows/:workflowId/cancel", async (req, res) => {
    try {
      const { workflowId } = req.params;
      const cancelled = await agentOrchestrator.cancelWorkflow(workflowId);
      res.json({ success: cancelled });
    } catch (error) {
      console.error("Error cancelling workflow:", error);
      res.status(500).json({ error: "Failed to cancel workflow" });
    }
  });

  // Get documents for a session
  app.get("/api/sessions/:sessionId/documents", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const documents = await storage.getDocuments(sessionId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get agent performance metrics
  app.get("/api/agents/:agentType/metrics", async (req, res) => {
    try {
      const { agentType } = req.params;
      const metrics = await storage.getAgentMetrics(agentType);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching agent metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get available plugins
  app.get("/api/plugins", async (req, res) => {
    try {
      const plugins = await storage.getPlugins();
      const pluginStatus = await Promise.all(
        plugins.map(async (plugin) => {
          const pluginInstance = await pluginManager.getPlugin(plugin.name);
          return {
            ...plugin,
            loaded: !!pluginInstance,
            metrics: pluginInstance?.getPerformanceMetrics() || null
          };
        })
      );
      res.json(pluginStatus);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ error: "Failed to fetch plugins" });
    }
  });

  // Auto-detect agent type for a task
  app.post("/api/agents/detect", async (req, res) => {
    try {
      const { task } = req.body;
      if (!task) {
        return res.status(400).json({ error: "Task is required" });
      }
      
      const agentType = await agentOrchestrator.detectAgentType(task);
      res.json({ agentType });
    } catch (error) {
      console.error("Error detecting agent type:", error);
      res.status(500).json({ error: "Failed to detect agent type" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const activeWorkflows = await agentOrchestrator.getActiveWorkflows();
      const plugins = await storage.getPlugins();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        activeWorkflows: activeWorkflows.length,
        availablePlugins: plugins.filter(p => p.enabled).length,
        database: "connected"
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}