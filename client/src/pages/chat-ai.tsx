import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useMobile } from "@/hooks/use-mobile";
import { queryClient } from "@/lib/queryClient";
import { AgentService, AGENT_CONFIGS } from "@/lib/ai-agents";
import { Send, Bot, FileText, Loader2, ChevronLeft, Sparkles, Activity } from "lucide-react";
import type { Message } from "@shared/schema";

interface ChatSession {
  id: string;
  agentType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SimpleMessage {
  id: string;
  role: string;
  content: string;
  metadata?: any;
  createdAt: string;
}

interface WorkflowData {
  id: string;
  sessionId?: string;
  session?: { id: string };
  agentType: string;
  task?: string;
  status: string;
  currentStep?: number;
  steps?: any[];
}

interface DocumentData {
  id: string;
  type: string;
  title: string;
  format: string;
  createdAt: string;
  quality_score?: number;
}

export default function ChatAI() {
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [detectedAgentType, setDetectedAgentType] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  // Get session ID from URL hash or create new session
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setSessionId(hash);
    } else {
      // Create a new session for general chat
      createSessionMutation.mutate({
        agentType: 'research',
        title: 'New AI Agent Session'
      });
    }
  }, []);

  // Fetch messages for current session
  const { data: messages = [], refetch: refetchMessages } = useQuery<SimpleMessage[]>({
    queryKey: ['/api/sessions', sessionId, 'messages'],
    enabled: !!sessionId,
    refetchInterval: 2000
  });

  // Fetch session details
  const { data: session } = useQuery<ChatSession>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId
  });

  // Fetch active workflows
  const { data: activeWorkflows = [] } = useQuery<WorkflowData[]>({
    queryKey: ['/api/workflows/active'],
    refetchInterval: 3000
  });

  // Fetch documents for current session
  const { data: documents = [] } = useQuery<DocumentData[]>({
    queryKey: ['/api/sessions', sessionId, 'documents'],
    enabled: !!sessionId
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { agentType: string; title: string }) => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (session) => {
      setSessionId(session.id);
      window.location.hash = session.id;
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
  });

  // Send message mutation - uses the new agent system
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const result = await AgentService.executeAgent({
        task: content,
        sessionId: sessionId
      });
      return result;
    },
    onSuccess: (result: any) => {
      setMessage("");
      setDetectedAgentType(result.agentType || '');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'documents'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // Add error message to chat
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: 'assistant', 
          content: `Error: ${error.message}`,
          metadata: { error: true }
        })
      }).then(() => refetchMessages());
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !sessionId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const agentTypeDisplay = detectedAgentType || session?.agentType || 'research';
  const agentConfig = AGENT_CONFIGS[agentTypeDisplay as keyof typeof AGENT_CONFIGS] || {
    name: 'AI Agent',
    icon: '🤖',
    color: 'blue',
    description: 'AI Assistant',
    capabilities: []
  };

  const currentActiveWorkflow = activeWorkflows.find((w: WorkflowData) => 
    w.session?.id === sessionId || w.sessionId === sessionId
  );

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Starting Brevia AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{agentConfig.icon}</span>
            <h1 className="font-semibold">{agentConfig.name}</h1>
          </div>
          {detectedAgentType && (
            <Badge variant="secondary" className="text-xs">
              Auto-detected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentActiveWorkflow && (
            <Badge variant="secondary" className="text-xs animate-pulse flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Processing...
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            New Session
          </Button>
        </div>
      </div>

      {/* Workflow Status */}
      {currentActiveWorkflow && (
        <div className="border-b bg-muted/50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Workflow: {currentActiveWorkflow.task?.substring(0, 80)}...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Step {currentActiveWorkflow.currentStep || 1} of {currentActiveWorkflow.steps?.length || 1}</span>
              <span>•</span>
              <span>{currentActiveWorkflow.status}</span>
            </div>
            {currentActiveWorkflow.steps && currentActiveWorkflow.steps.length > 0 && (
              <Progress 
                value={((currentActiveWorkflow.currentStep || 0) / currentActiveWorkflow.steps.length) * 100} 
                className="mt-2" 
              />
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {Array.isArray(messages) && messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Brevia AI</h2>
                  <p className="text-muted-foreground mb-6">
                    Your autonomous AI assistant with specialized agents for research, notes, documents, and more.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {Object.entries(AGENT_CONFIGS).slice(0, 4).map(([key, config]) => (
                      <Card key={key} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="text-2xl mb-2">{config.icon}</div>
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(messages) && messages.map((msg: SimpleMessage) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {msg.metadata?.error ? (
                      <div className="text-red-500">{msg.content}</div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    
                    {msg.metadata && !msg.metadata.error && (
                      <div className="mt-2 text-xs opacity-70">
                        {msg.metadata.agentType && (
                          <Badge variant="outline" className="mr-2">
                            {msg.metadata.agentType}
                          </Badge>
                        )}
                        {msg.metadata.confidence && (
                          <span>Confidence: {Math.round(msg.metadata.confidence * 100)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {sendMessageMutation.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI agent is working on your request...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Documents Sidebar - Desktop only */}
        {!isMobile && Array.isArray(documents) && documents.length > 0 && (
          <div className="w-80 border-l bg-card">
            <div className="p-4 border-b">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generated Documents ({documents.length})
              </h3>
            </div>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {Array.isArray(documents) && documents.map((doc: DocumentData) => (
                  <Card key={doc.id} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {doc.type === 'research' ? '🔍' : 
                         doc.type === 'note' ? '📝' : 
                         doc.type === 'document' ? '📄' : '📊'}
                      </span>
                      <h4 className="font-medium text-sm">{doc.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {doc.format} • {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.quality_score && (
                      <div className="flex items-center gap-2 text-xs">
                        <span>Quality:</span>
                        <Progress value={doc.quality_score * 100} className="flex-1 h-1" />
                        <span>{Math.round(doc.quality_score * 100)}%</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me to research, take notes, create documents, or help with any task..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Brevia AI will automatically detect the best agent for your task
          </p>
        </form>
      </div>
    </div>
  );
}