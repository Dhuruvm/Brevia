import { useState, useEffect } from 'react';
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, ExternalLink, User, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Source {
  id?: string;
  title?: string;
  url?: string;
  summary?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    sources?: Source[];
    workflowId?: string;
    agentType?: string;
  };
  createdAt: string;
}

interface EnhancedMessageProps {
  message: Message;
  isTyping?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
}

export default function EnhancedMessage({
  message,
  isTyping = false,
  onCopy,
  onRegenerate,
  onLike,
  onDislike
}: EnhancedMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  // Typing animation effect for AI messages
  useEffect(() => {
    if (message.role === 'assistant' && isTyping) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= message.content.length) {
          setDisplayedContent(message.content.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 30); // Adjust speed here

      return () => clearInterval(typingInterval);
    } else {
      setDisplayedContent(message.content);
    }
  }, [message.content, isTyping, message.role]);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(message.content);
    }
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsDisliked(false);
    if (onLike) onLike(message.id);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    setIsLiked(false);
    if (onDislike) onDislike(message.id);
  };

  const sources = message.metadata?.sources || [];

  return (
    <div 
      className={cn(
        "message-fade-in group w-full px-4 py-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/20",
        message.role === 'user' 
          ? "bg-[var(--user-message-bg)]" 
          : "bg-[var(--ai-message-bg)]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          message.role === 'user' 
            ? "bg-gray-600 text-white" 
            : "bg-green-600 text-white"
        )}>
          {message.role === 'user' ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Agent Type Badge for AI messages */}
          {message.role === 'assistant' && message.metadata?.agentType && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {message.metadata.agentType} agent
              </span>
            </div>
          )}

          {/* Message Text */}
          <div className={cn(
            "prose prose-sm max-w-none",
            message.role === 'user' 
              ? "text-[var(--user-message-text)]" 
              : "text-[var(--ai-message-text)]"
          )}>
            <div className="whitespace-pre-wrap">
              {displayedContent}
              {isTyping && message.role === 'assistant' && (
                <span className="inline-block w-1 h-4 bg-gray-600 dark:bg-gray-400 animate-pulse ml-1" />
              )}
            </div>
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sources:</h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, index) => (
                  <a
                    key={source.id || index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{source.title || `Source ${index + 1}`}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons for AI messages */}
          {message.role === 'assistant' && (
            <div className={cn(
              "flex items-center gap-1 mt-3 transition-opacity duration-200",
              showActions ? "opacity-100" : "opacity-0 md:opacity-0"
            )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="action-button"
                title="Copy message"
              >
                <Copy className="w-4 h-4" />
              </Button>
              
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(message.id)}
                  className="action-button"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  "action-button",
                  isLiked && "text-green-600 dark:text-green-400"
                )}
                title="Like this response"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                className={cn(
                  "action-button",
                  isDisliked && "text-red-600 dark:text-red-400"
                )}
                title="Dislike this response"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}