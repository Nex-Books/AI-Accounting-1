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
  Zap,
  Calculator,
  Search,
  BarChart3,
  IndianRupee,
  Paperclip,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { PlanTier } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface ChatInterfaceProps {
  companyId: string
  userId: string
  plan: PlanTier
  queriesUsed: number
  queriesLimit: number
}

interface AttachedFile {
  file: File
  preview?: string
  uploading: boolean
  uploaded: boolean
  storagePath?: string
  error?: string
}

const QUICK_ACTIONS = [
  { icon: Zap, label: 'Record payment', prompt: 'I paid' },
  { icon: IndianRupee, label: 'Record sale', prompt: 'Received payment of' },
  { icon: Calculator, label: 'Calculate GST', prompt: 'Calculate 18% GST on' },
  { icon: Search, label: 'Search transactions', prompt: 'Show me transactions for' },
  { icon: BarChart3, label: 'Financial summary', prompt: 'Give me a financial summary' },
]

const EXAMPLE_PROMPTS = [
  'Paid office rent ₹25,000 via bank transfer',
  'Received ₹1,50,000 from ABC Corp for consulting',
  'Bought laptop for ₹85,000 cash',
  'Calculate GST on ₹50,000 at 18%',
  'Show my cash position',
  'What are my biggest expenses?',
]

const SUPPORTED_FILE_TYPES = [
  '.xlsx', '.xls', '.csv', // Spreadsheets
  '.pdf', // Documents
  '.png', '.jpg', '.jpeg', // Images
]

function getFileIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop()
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return FileSpreadsheet
  if (['png', 'jpg', 'jpeg'].includes(ext || '')) return ImageIcon
  if (ext === 'pdf') return FileText
  return File
}

export function ChatInterface({ 
  companyId, 
  userId,
  plan,
  queriesUsed,
  queriesLimit 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const chatOptions: UseChatOptions = {
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { 
          messages, 
          companyId, 
          userId,
          attachments: attachedFiles
            .filter(f => f.uploaded && f.storagePath)
            .map(f => ({
              fileName: f.file.name,
              fileType: f.file.type,
              storagePath: f.storagePath,
            }))
        },
      }),
    }),
  }

  const { messages, sendMessage, status, error } = useChat(chatOptions)

  const isLoading = status === 'streaming' || status === 'submitted'
  const remainingQueries = queriesLimit - queriesUsed
  const canSendMessage = remainingQueries > 0 || plan === 'enterprise'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!SUPPORTED_FILE_TYPES.includes(ext)) {
        continue // Skip unsupported files
      }

      const attachedFile: AttachedFile = {
        file,
        uploading: true,
        uploaded: false,
      }

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        attachedFile.preview = URL.createObjectURL(file)
      }

      newFiles.push(attachedFile)
    }

    setAttachedFiles(prev => [...prev, ...newFiles])

    // Upload files to Supabase storage
    const supabase = createClient()
    
    for (const attachedFile of newFiles) {
      try {
        const fileName = `${Date.now()}-${attachedFile.file.name}`
        const filePath = `${companyId}/${userId}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, attachedFile.file)

        if (uploadError) throw uploadError

        setAttachedFiles(prev => prev.map(f => 
          f.file === attachedFile.file 
            ? { ...f, uploading: false, uploaded: true, storagePath: filePath }
            : f
        ))
      } catch (err) {
        setAttachedFiles(prev => prev.map(f => 
          f.file === attachedFile.file 
            ? { ...f, uploading: false, error: 'Upload failed' }
            : f
        ))
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeFile(file: File) {
    setAttachedFiles(prev => {
      const toRemove = prev.find(f => f.file === file)
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview)
      }
      return prev.filter(f => f.file !== file)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading || !canSendMessage) return
    
    const hasUploadingFiles = attachedFiles.some(f => f.uploading)
    if (hasUploadingFiles) return

    const fileContext = attachedFiles.length > 0
      ? `\n\n[Attached files: ${attachedFiles.map(f => f.file.name).join(', ')}]`
      : ''
    
    sendMessage({ text: input + fileContext })
    setInput('')
    setAttachedFiles([])
  }

  function handleQuickAction(prompt: string) {
    if (!canSendMessage) return
    setInput(prompt + ' ')
    textareaRef.current?.focus()
  }

  function handleExamplePrompt(prompt: string) {
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
      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">ElevAIte Assistant</h2>
            <p className="text-muted-foreground max-w-lg mb-4">
              I&apos;m your AI accountant. Tell me about transactions and I&apos;ll record them instantly. 
              Upload documents and I&apos;ll extract the data automatically.
            </p>
            
            {/* File upload info */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <Badge variant="outline" className="gap-1">
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </Badge>
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" /> PDF
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ImageIcon className="w-3 h-3" /> Images
              </Badge>
              <Badge variant="outline" className="gap-1">
                <File className="w-3 h-3" /> CSV
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={!canSendMessage}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Example Prompts */}
            <div className="w-full max-w-2xl">
              <p className="text-sm text-muted-foreground mb-3">Try saying:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto py-3 px-4 text-left font-normal hover:bg-accent/10"
                    onClick={() => handleExamplePrompt(prompt)}
                    disabled={!canSendMessage}
                  >
                    <span className="text-muted-foreground">&ldquo;</span>
                    {prompt}
                    <span className="text-muted-foreground">&rdquo;</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
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
                  <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
                  <Spinner className="h-4 w-4" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-destructive/10 border-t text-destructive text-sm flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error.message || 'An error occurred. Please try again.'}</span>
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {attachedFiles.map((attached, index) => {
              const FileIcon = getFileIcon(attached.file.name)
              return (
                <div 
                  key={index}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border bg-card',
                    attached.error && 'border-destructive bg-destructive/5'
                  )}
                >
                  {attached.preview ? (
                    <img 
                      src={attached.preview} 
                      alt={attached.file.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm max-w-[120px] truncate">
                    {attached.file.name}
                  </span>
                  {attached.uploading && <Spinner className="w-4 h-4" />}
                  {attached.uploaded && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {attached.error && <XCircle className="w-4 h-4 text-destructive" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeFile(attached.file)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Usage indicator */}
          {plan !== 'enterprise' && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{queriesUsed} / {queriesLimit} queries used</span>
              {remainingQueries <= 10 && remainingQueries > 0 && (
                <Badge variant="outline" className="text-warning text-xs">
                  {remainingQueries} left
                </Badge>
              )}
              {remainingQueries <= 0 && (
                <Badge variant="destructive" className="text-xs">Limit reached</Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={SUPPORTED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-[52px] w-[52px] shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !canSendMessage}
              title="Attach files (Excel, PDF, Images, CSV)"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

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
                ? "Tell me about a transaction or ask anything..." 
                : "Query limit reached. Upgrade to continue."
              }
              className="min-h-[52px] max-h-[200px] resize-none text-base"
              disabled={isLoading || !canSendMessage}
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              className="h-[52px] w-[52px] shrink-0"
              disabled={!input.trim() || isLoading || !canSendMessage || attachedFiles.some(f => f.uploading)}
            >
              {isLoading ? <Spinner className="h-5 w-5" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line • Click <Paperclip className="inline w-3 h-3" /> to attach files
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
  const toolCalls = message.parts?.filter(p => p.type === 'tool-invocation') || []

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gradient-to-br from-accent to-primary text-white'
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn('flex-1 space-y-2 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        {text && (
          <Card className={cn(
            'inline-block p-3',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap m-0">{text}</p>
            </div>
          </Card>
        )}

        {/* Tool Results */}
        {toolCalls.map((tool, index) => {
          if (tool.type !== 'tool-invocation') return null
          
          const toolResult = tool.state === 'output-available' ? tool.output : null
          
          // Journal Entry Creation
          if (tool.toolName === 'create_journal_entry' && toolResult) {
            const result = toolResult as { success: boolean; referenceNumber?: string; entryId?: string; error?: string; message?: string; amount?: number }
            
            return (
              <Card key={index} className={cn(
                'p-4',
                result.success ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-destructive/10 border-destructive/20'
              )}>
                {result.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Entry Created</span>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">{result.message}</p>
                    {result.entryId && (
                      <Link 
                        href={`/journal/${result.entryId}`}
                        className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Entry
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-destructive">
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{result.error}</p>
                  </div>
                )}
              </Card>
            )
          }

          // Document Analysis
          if (tool.toolName === 'analyze_document' && toolResult) {
            const result = toolResult as { success: boolean; summary?: string; extractedData?: Record<string, unknown>; suggestedEntry?: unknown; error?: string }
            
            return (
              <Card key={index} className={cn(
                'p-4',
                result.success ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' : 'bg-destructive/10 border-destructive/20'
              )}>
                {result.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <FileText className="h-5 w-5" />
                      <span className="font-semibold">Document Analyzed</span>
                    </div>
                    {result.summary && (
                      <p className="text-sm text-blue-600 dark:text-blue-300">{result.summary}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-destructive">
                    <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{result.error}</p>
                  </div>
                )}
              </Card>
            )
          }

          // Financial Summary
          if (tool.toolName === 'get_financial_summary' && toolResult) {
            const result = toolResult as { formatted?: { assets: string; liabilities: string; netWorth: string; income: string; expenses: string; netProfit: string }; message?: string }
            
            if (result.message) {
              return <Card key={index} className="p-3 text-sm text-muted-foreground">{result.message}</Card>
            }
            
            if (result.formatted) {
              return (
                <Card key={index} className="p-4 bg-accent/5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    <span className="font-semibold">Financial Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Assets</p>
                      <p className="font-semibold text-lg">{result.formatted.assets}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Liabilities</p>
                      <p className="font-semibold text-lg">{result.formatted.liabilities}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Worth</p>
                      <p className="font-semibold text-lg text-accent">{result.formatted.netWorth}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Profit</p>
                      <p className="font-semibold text-lg text-emerald-600">{result.formatted.netProfit}</p>
                    </div>
                  </div>
                </Card>
              )
            }
          }

          // GST Calculation
          if (tool.toolName === 'calculate_gst' && toolResult) {
            const result = toolResult as { gstRate: string; formatted: { base: string; gst: string; total: string }; cgst: number; sgst: number }
            
            return (
              <Card key={index} className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">GST Calculation ({result.gstRate})</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Amount</span>
                    <span>{result.formatted.base}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST ({Number(result.gstRate.replace('%', '')) / 2}%)</span>
                    <span>₹{result.cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST ({Number(result.gstRate.replace('%', '')) / 2}%)</span>
                    <span>₹{result.sgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>{result.formatted.total}</span>
                  </div>
                </div>
              </Card>
            )
          }

          // Loading state
          if (tool.state === 'input-streaming' || tool.state === 'input-available') {
            return (
              <Card key={index} className="inline-flex items-center gap-2 p-3 bg-muted/50">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {tool.toolName === 'create_journal_entry' ? 'Creating entry...' : 
                   tool.toolName === 'get_financial_summary' ? 'Analyzing finances...' :
                   tool.toolName === 'calculate_gst' ? 'Calculating...' :
                   tool.toolName === 'analyze_document' ? 'Analyzing document...' :
                   'Processing...'}
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
