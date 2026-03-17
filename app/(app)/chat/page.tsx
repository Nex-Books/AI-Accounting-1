import { getCompanyContext } from '@/lib/server-utils'
import { ChatInterface } from './chat-interface'

export const metadata = {
  title: 'AI Assistant',
}

export default async function ChatPage() {
  const context = await getCompanyContext()
  if (!context) return null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-card p-4">
        <h1 className="text-xl font-semibold">AI Accountant</h1>
        <p className="text-sm text-muted-foreground">
          Your intelligent bookkeeping assistant
        </p>
      </div>
      
      <ChatInterface 
        companyId={context.company.id} 
        userId={context.user.id}
        plan={context.company.plan}
        queriesUsed={context.company.ai_queries_used}
        queriesLimit={context.company.ai_queries_limit}
      />
    </div>
  )
}
