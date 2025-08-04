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
import { usePersistentWorkflow } from "@/hooks/use-persistent-workflow";
import { queryClient } from "@/lib/queryClient";
import { AgentService, AGENT_CONFIGS } from "@/lib/ai-agents";
import { RealTimeWorkflow } from "@/components/chat/real-time-workflow";
import TypingIndicator from "@/components/ui/typing-indicator";
import { Send, Bot, FileText, Loader2, ChevronLeft, Sparkles, Activity, MessageSquare, Zap } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { ResearchWorkflow } from "@/components/research/research-workflow";
import type { Message } from "@shared/schema";
import { AgentMessage } from "@/components/chat/agent-message";
import { MessageCounter } from "@/components/chat/message-counter";
import { WorkflowAnimation } from "@/components/chat/workflow-animation";

interface ChatSession {
  id: string;
  agentType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
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
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const [activeResearch, setActiveResearch] = useState<string>("");
  const [researchActive, setResearchActive] = useState(false);
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

  // Fetch messages for current session with reduced polling
  const { data: messages = [], refetch: refetchMessages } = useQuery<SimpleMessage[]>({
    queryKey: ['/api/sessions', sessionId, 'messages'],
    enabled: !!sessionId,
    refetchInterval: 4000, // Reduced from 2000ms to 4000ms
    staleTime: 2000 // Add stale time to prevent flickering
  });

  // Fetch session details
  const { data: session } = useQuery<ChatSession>({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId
  });

  // Fetch active workflows with smart polling
  const { data: activeWorkflows = [] } = useQuery<WorkflowData[]>({
    queryKey: ['/api/workflows/active'],
    refetchInterval: (data) => {
      // Stop polling if no active workflows
      if (!data || !Array.isArray(data) || data.length === 0) return false;
      // Reduce polling frequency for completed workflows
      const hasRunning = data.some((w: WorkflowData) => w.status === 'running');
      return hasRunning ? 5000 : false; // 5s for active, stop for completed
    },
    refetchIntervalInBackground: false,
    staleTime: 3000 // Prevent unnecessary refetches
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

  // Update action count based on workflows and agent activities
  useEffect(() => {
    const count = (Array.isArray(messages) ? messages.filter(m => m.role === 'assistant').length : 0) + 
                  (Array.isArray(activeWorkflows) ? activeWorkflows.length : 0) + 
                  (Array.isArray(documents) ? documents.length : 0);
    setActionCount(count);
  }, [messages, activeWorkflows, documents]);

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

  // Use persistent workflow hook to prevent flickering
  const { workflows: persistedWorkflows } = usePersistentWorkflow(Array.isArray(activeWorkflows) ? activeWorkflows : []);
  
  const currentActiveWorkflow = persistedWorkflows.find((w: WorkflowData) => 
    w.session?.id === sessionId || w.sessionId === sessionId
  );

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Starting Brevia AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background dark">
      {/* Header with Message Counter */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
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
              <span className="text-lg">🔍</span>
              <h1 className="font-semibold">Brevia Research Agent</h1>
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

        {/* Message Counter Header */}
        <MessageCounter
          messageCount={Array.isArray(messages) ? messages.length : 0}
          actionCount={actionCount}
          isExpanded={isHeaderExpanded}
          onToggle={() => setIsHeaderExpanded(!isHeaderExpanded)}
          subtitle={researchActive ? `Researching: ${activeResearch.substring(0, 50)}...` : `Real-time web search capabilities`}
        />
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

              {Array.isArray(messages) && messages.map((msg: SimpleMessage, index) => (
                <AgentMessage
                  key={msg.id}
                  message={msg}
                  messageIndex={index}
                  totalMessages={messages.length}
                  actionCount={actionCount}
                />
              ))}

              {/* Active Research Workflow */}
              {researchActive && activeResearch && (
                <ResearchWorkflow
                  query={activeResearch.replace(/^(Search the web for|Analyze in detail|Create research report on):\s*/, '')}
                  isActive={researchActive}
                  onComplete={(results) => {
                    setResearchActive(false);
                    console.log('Research completed:', results);
                  }}
                />
              )}
              
              {sendMessageMutation.isPending && (
                <RealTimeWorkflow
                  workflowId="temp-workflow"
                  agentType={detectedAgentType || 'AI'}
                  task={message}
                  status="running"
                  isVisible={true}
                />
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

      {/* ChatGPT-like Input Area */}
      <ChatInput
        value={message}
        onChange={setMessage}
        onSubmit={(msg, agentType) => {
          if (agentType) {
            setDetectedAgentType(agentType);
            // Start research workflow for search actions
            if (agentType === 'search') {
              setActiveResearch(msg);
              setResearchActive(true);
            }
          }
          // The message is already set via onChange, so we just trigger send
          handleSendMessage({ preventDefault: () => {} } as any);
        }}
        isLoading={sendMessageMutation.isPending}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}