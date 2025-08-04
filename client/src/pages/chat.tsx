import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Search, FileText, Code, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/chat/sidebar";
import EnhancedMessage from "@/components/chat/enhanced-message";
import TypingIndicator from "@/components/ui/typing-indicator";
import WorkflowDisplay from "@/components/chat/workflow-display";
import type { Message, ChatSession } from "@shared/schema";

const QUICK_ACTIONS = [
  {
    icon: Search,
    label: "Deep Research",
    description: "Conduct comprehensive research on any topic",
    prompt: "Help me research this topic in depth:"
  },
  {
    icon: Sparkles,
    label: "Creative Writing",
    description: "Generate creative content and ideas",
    prompt: "Help me create something creative about:"
  },
  {
    icon: FileText,
    label: "Document Creation",
    description: "Create professional documents and reports",
    prompt: "Help me create a professional document about:"
  },
  {
    icon: Code,
    label: "Code & Analysis",
    description: "Programming help and code analysis",
    prompt: "Help me with programming and analysis for:"
  }
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { 
    currentSession, 
    messages, 
    createSession, 
    sendMessage 
  } = useChat(currentSessionId);

  // Fetch all sessions
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsTyping(true);

    try {
      if (!currentSessionId) {
        const session = await createSession("research", "New Chat");
        if (session) {
          setCurrentSessionId(session.id);
          await sendMessage(session.id, content);
        }
      } else {
        await sendMessage(currentSessionId, content);
      }
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setInput(action.prompt + " ");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleNewChat = async () => {
    const session = await createSession("research", "New Chat");
    if (session) {
      setCurrentSessionId(session.id);
      setSidebarOpen(false);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // For now, just refresh the sessions
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden header-button"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4 header-icon" />
              </Button>
              <h1 className="text-xl font-semibold header-text">
                {currentSession?.title || "Brevia AI"}
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="header-button"
              onClick={handleNewChat}
            >
              New Chat
            </Button>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-foreground">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground max-w-md">
                  I can help with research, writing, analysis, and more. Choose a quick action or ask me anything.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      className="p-4 text-left border border-border rounded-lg hover:bg-accent/50 transition-colors group bg-card"
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {messages.map((message: Message, index) => (
                <EnhancedMessage
                  key={message.id}
                  message={message}
                  isTyping={index === messages.length - 1 && isTyping}
                  onCopy={(content) => {
                    navigator.clipboard.writeText(content);
                    // You can add a toast notification here
                  }}
                  onRegenerate={(messageId) => {
                    console.log('Regenerate:', messageId);
                    // Implement regeneration logic
                  }}
                  onLike={(messageId) => {
                    console.log('Like:', messageId);
                    // Implement like logic
                  }}
                  onDislike={(messageId) => {
                    console.log('Dislike:', messageId);
                    // Implement dislike logic
                  }}
                />
              ))}

              {/* Show typing indicator when processing */}
              {isTyping && (
                <TypingIndicator 
                  agentType={currentSession?.agentType || 'research'}
                  currentStep="Processing your request"
                />
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-background">
          <div className="max-w-4xl mx-auto p-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Brevia AI..."
                className="min-h-[60px] max-h-[200px] pr-12 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isTyping}
                size="sm"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-black"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick action buttons for input */}
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs h-7 rounded-full border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}