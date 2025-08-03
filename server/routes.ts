import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createAgent } from "./services/ai-agents";
import { insertChatSessionSchema, insertMessageSchema, AGENT_TYPES } from "@shared/schema";
import { z } from "zod";

// Request schemas
const createSessionSchema = z.object({
  agentType: z.enum(['research', 'notes', 'documents', 'resume', 'presentations']),
  title: z.string().min(1)
});

const sendMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1)
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get chat sessions for user (mock user for now)
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getChatSessionsByUser("mock-user-id");
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Create new chat session
  app.post("/api/sessions", async (req, res) => {
    try {
      const data = createSessionSchema.parse(req.body);
      
      const session = await storage.createChatSession({
        userId: "mock-user-id", // In real app, get from auth
        agentType: data.agentType,
        title: data.title,
        status: "active"
      });

      res.json(session);
    } catch (error) {
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

      const messages = await storage.getMessagesBySession(id);
      const workflow = await storage.getWorkflowBySession(id);
      const sources = await storage.getSourcesBySession(id);
      const logs = await storage.getLogsBySession(id);

      res.json({
        session,
        messages,
        workflow,
        sources,
        logs
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session details" });
    }
  });

  // Send message and trigger agent
  app.post("/api/chat", async (req, res) => {
    try {
      const data = sendMessageSchema.parse(req.body);
      
      const session = await storage.getChatSession(data.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        sessionId: data.sessionId,
        role: "user",
        content: data.content
      });

      // Start agent processing (async)
      processAgentRequest(session.agentType as any, data.sessionId, data.content)
        .catch(error => {
          console.error("Agent processing error:", error);
        });

      res.json({ message: userMessage, status: "processing" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  // Get workflow status
  app.get("/api/workflows/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const workflow = await storage.getWorkflowBySession(sessionId);
      
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Get sources for session
  app.get("/api/sources/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const sources = await storage.getSourcesBySession(sessionId);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sources" });
    }
  });

  // Get logs for session
  app.get("/api/logs/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const logs = await storage.getLogsBySession(sessionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Export session data
  app.post("/api/export/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { format } = req.body; // 'pdf', 'docx', 'md'
      
      const session = await storage.getChatSession(sessionId);
      const messages = await storage.getMessagesBySession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // For now, return markdown format
      const exportData = generateMarkdownExport(session, messages);
      
      res.json({ 
        format,
        content: exportData,
        filename: `${session.title.replace(/\s+/g, '_')}.md`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to process agent requests asynchronously
async function processAgentRequest(agentType: any, sessionId: string, content: string) {
  try {
    const agent = createAgent(agentType);
    const response = await agent.execute({
      sessionId,
      query: content
    });

    // Save agent response
    await storage.createMessage({
      sessionId,
      role: "assistant", 
      content: response,
      metadata: { agentType }
    });

  } catch (error) {
    // Save error message
    await storage.createMessage({
      sessionId,
      role: "assistant",
      content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: { error: true, agentType }
    });
  }
}

// Helper function to generate markdown export
function generateMarkdownExport(session: any, messages: any[]): string {
  let markdown = `# ${session.title}\n\n`;
  markdown += `**Agent Type:** ${session.agentType}\n`;
  markdown += `**Created:** ${session.createdAt}\n\n`;
  
  markdown += `## Conversation\n\n`;
  
  for (const message of messages) {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    markdown += `### ${role}\n\n${message.content}\n\n`;
  }
  
  return markdown;
}
