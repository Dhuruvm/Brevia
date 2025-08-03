import { User, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TypingIndicator from "@/components/ui/typing-indicator";
import type { Message } from "@shared/schema";

interface MessageProps {
  message: Message;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs text-gray-500 border-gray-700">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-2xl ${isUser ? "ml-12" : "mr-12"}`}>
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-medium">
              {message.metadata?.agentType ? 
                `${message.metadata.agentType.charAt(0).toUpperCase() + message.metadata.agentType.slice(1)} Agent` :
                'Assistant'
              }
            </span>
            {message.metadata?.error && (
              <Badge variant="destructive" className="text-xs">
                Error
              </Badge>
            )}
          </div>
        )}
        
        <Card className={`p-4 ${
          isUser 
            ? "bg-primary/10 border-primary/20" 
            : "bg-gray-800/20 border-gray-700/30"
        }`}>
          {isUser ? (
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="text-sm">{message.content}</p>
              </div>
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-gray-200" />
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              
              {/* Show typing indicator for incomplete responses */}
              {message.content.length < 50 && !message.metadata?.error && (
                <div className="mt-3">
                  <TypingIndicator />
                </div>
              )}
            </div>
          )}
        </Card>
        
        <div className="mt-1 text-xs text-gray-500 text-right">
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Now'}
        </div>
      </div>
    </div>
  );
}
