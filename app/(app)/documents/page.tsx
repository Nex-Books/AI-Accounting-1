import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { DocumentsGrid } from './documents-grid'
import { DocumentsHeader } from './documents-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { Document } from '@/lib/types'

export const metadata = {
  title: 'Documents',
}

async function getDocuments(companyId: string): Promise<Document[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      party:parties(id, name),
      journal_entry:journal_entries(id, entry_number)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }
  
  return data || []
}

export default async function DocumentsPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const documents = await getDocuments(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <DocumentsHeader />
      
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsGrid 
          documents={documents} 
          companyId={context.company.id}
          userId={context.user.id}
        />
      </Suspense>
    </div>
  )
}

function DocumentsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  )
}
