import { getCompanyContext } from '@/lib/server-utils'
import { ChatInterface } from './chat-interface'

export const metadata = {
  title: 'AI Assistant',
  description: 'Your intelligent AI accountant that records transactions and manages your books',
}

export default async function ChatPage() {
  const context = await getCompanyContext()
  if (!context) return null

  return (
    <div className="flex flex-col h-full">
      <ChatInterface 
        companyId={context.company.id} 
        userId={context.user.id}
        plan={context.company.plan}
        queriesUsed={context.company.ai_queries_used || 0}
        queriesLimit={context.company.ai_queries_limit || 100}
      />
    </div>
  )
}
