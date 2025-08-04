import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Search, FileText, Code, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/chat/sidebar";
import EnhancedMessage from "@/components/chat/enhanced-message";
import TypingIndicator from "@/components/ui/typing-indicator";
import type { Message, ChatSession } from "@shared/schema";

const QUICK_ACTIONS = [
  {
    icon: Search,
    label: "Deep Research",
    description: "Comprehensive multi-source research and analysis",
    prompt: "Research this topic comprehensively:"
  },
  {
    icon: Sparkles,
    label: "Market Analysis",
    description: "Industry trends and market research",
    prompt: "Analyze market trends and data for:"
  },
  {
    icon: FileText,
    label: "Academic Research",
    description: "Scientific and academic source investigation",
    prompt: "Find academic research and peer-reviewed studies on:"
  },
  {
    icon: Code,
    label: "Technical Analysis",
    description: "Technology research and technical deep-dive",
    prompt: "Provide technical research and analysis on:"
  }
];

export default function ChatEnhanced() {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    currentSession, 
    messages, 
    createSession, 
    sendMessage 
  } = useChat(currentSessionId);

  // Fetch all sessions
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 5000,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setInput(action.prompt + " ");
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setSidebarOpen(false);
  };

  const handleNewChat = async () => {
    try {
      const session = await createSession("research", "New Chat");
      if (session) {
        setCurrentSessionId(session.id);
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat session.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Implement session deletion logic
      console.log("Delete session:", sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

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
        <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold">
                {currentSession?.title || "Brevia Research Agent"}
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleNewChat}
            >
              New Chat
            </Button>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-4">
                <div className="space-y-4">
                  <h2 className="text-3xl font-semibold text-foreground">
                    I am Brevia, your Research Agent
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    I exist solely to explore, analyze, and master complex subjects through intelligent automation and source-driven research. Choose a research focus or ask me to investigate any topic.
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
                        className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group bg-card"
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
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {messages.map((message: Message, index: number) => (
                  <EnhancedMessage
                    key={message.id}
                    message={message}
                    isTyping={index === messages.length - 1 && isTyping}
                    onCopy={(content) => {
                      navigator.clipboard.writeText(content);
                      toast({
                        title: "Copied",
                        description: "Message copied to clipboard",
                      });
                    }}
                    onRegenerate={(messageId) => {
                      console.log('Regenerate:', messageId);
                      toast({
                        title: "Regenerate",
                        description: "Feature coming soon",
                      });
                    }}
                    onLike={(messageId) => {
                      console.log('Like:', messageId);
                      toast({
                        title: "Liked",
                        description: "Thank you for your feedback",
                      });
                    }}
                    onDislike={(messageId) => {
                      console.log('Dislike:', messageId);
                      toast({
                        title: "Disliked",
                        description: "Thank you for your feedback",
                      });
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
              <form onSubmit={handleSubmit} className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Brevia to research any topic..."
                  className="min-h-[60px] max-h-[200px] pr-12 resize-none rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  size="sm"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
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
    </div>
  );
}