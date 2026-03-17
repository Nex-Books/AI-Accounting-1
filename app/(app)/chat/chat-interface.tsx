'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat, type UseChatOptions } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { PlanTier } from '@/lib/types'

interface ChatInterfaceProps {
  companyId: string
  userId: string
  plan: PlanTier
  queriesUsed: number
  queriesLimit: number
}

const SUGGESTED_PROMPTS = [
  'Record a cash sale of ₹50,000 for consulting services',
  'Create a journal entry for office rent payment of ₹25,000',
  'What is the current balance in my cash account?',
  'Explain the difference between accounts payable and receivable',
  'How do I record GST on purchases?',
]

export function ChatInterface({ 
  companyId, 
  userId,
  plan,
  queriesUsed,
  queriesLimit 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chatOptions: UseChatOptions = {
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages,
          companyId,
          userId,
        },
      }),
    }),
  }

  const { messages, sendMessage, status, error } = useChat(chatOptions)

  const isLoading = status === 'streaming' || status === 'submitted'
  const remainingQueries = queriesLimit - queriesUsed
  const canSendMessage = remainingQueries > 0 || plan === 'enterprise'

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading || !canSendMessage) return
    
    sendMessage({ text: input })
    setInput('')
  }

  function handleSuggestedPrompt(prompt: string) {
    if (!canSendMessage) return
    sendMessage({ text: prompt })
  }

  function getMessageText(message: UIMessage): string {
    if (!message.parts || !Array.isArray(message.parts)) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Usage indicator */}
      {plan !== 'enterprise' && (
        <div className="px-4 py-2 bg-muted/50 border-b text-sm flex items-center justify-between">
          <span className="text-muted-foreground">
            AI queries: {queriesUsed} / {queriesLimit} used this month
          </span>
          {remainingQueries <= 10 && remainingQueries > 0 && (
            <Badge variant="outline" className="text-warning">
              {remainingQueries} remaining
            </Badge>
          )}
          {remainingQueries <= 0 && (
            <Badge variant="destructive">
              Limit reached - Upgrade to continue
            </Badge>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">AI Accountant</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              I can help you create journal entries, answer accounting questions, 
              and provide financial guidance. Try one of these prompts to get started:
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-left h-auto py-2"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={!canSendMessage}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                getMessageText={getMessageText}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t text-destructive text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          {error.message || 'An error occurred. Please try again.'}
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={canSendMessage 
                ? "Describe a transaction or ask an accounting question..." 
                : "Query limit reached. Please upgrade your plan."
              }
              className="min-h-[44px] max-h-[200px] resize-none"
              disabled={isLoading || !canSendMessage}
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading || !canSendMessage}
            >
              {isLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ 
  message, 
  getMessageText 
}: { 
  message: UIMessage
  getMessageText: (m: UIMessage) => string 
}) {
  const isUser = message.role === 'user'
  const text = getMessageText(message)

  // Check for tool calls in parts
  const toolCalls = message.parts?.filter(p => p.type === 'tool-invocation') || []

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex-1 space-y-2', isUser && 'text-right')}>
        <Card className={cn(
          'inline-block p-3 max-w-[85%]',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap m-0">{text}</p>
          </div>
        </Card>

        {/* Tool results */}
        {toolCalls.map((tool, index) => {
          if (tool.type !== 'tool-invocation') return null
          
          const toolResult = tool.state === 'output-available' ? tool.output : null
          
          if (tool.toolName === 'create_journal_entry' && toolResult) {
            const result = toolResult as { success: boolean; entryNumber?: string; entryId?: string; error?: string; message?: string }
            
            return (
              <Card key={index} className={cn(
                'inline-flex items-center gap-2 p-3 max-w-[85%]',
                result.success ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'
              )}>
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <div className="text-sm">
                      <p>{result.message}</p>
                      {result.entryId && (
                        <Link 
                          href={`/journal/${result.entryId}`}
                          className="text-accent hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View Entry {result.entryNumber}
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm">{result.error}</p>
                  </>
                )}
              </Card>
            )
          }

          if (tool.state === 'input-streaming' || tool.state === 'input-available') {
            return (
              <Card key={index} className="inline-flex items-center gap-2 p-3 max-w-[85%] bg-muted/50">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Processing {tool.toolName}...
                </span>
              </Card>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
