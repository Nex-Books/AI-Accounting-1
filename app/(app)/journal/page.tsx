import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { JournalTable } from './journal-table'
import { JournalHeader } from './journal-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { JournalEntry } from '@/lib/types'

export const metadata = {
  title: 'Journal',
}

interface JournalPageProps {
  searchParams: Promise<{
    status?: string
    from?: string
    to?: string
    search?: string
  }>
}

async function getJournalEntries(
  companyId: string,
  filters: { status?: string; from?: string; to?: string; search?: string }
): Promise<JournalEntry[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('journal_entries')
    .select(`
      *,
      lines:journal_lines(
        *,
        account:accounts(id, code, name, type),
        party:parties(id, name)
      ),
      creator:users(id, full_name, email)
    `)
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (filters.from) {
    query = query.gte('date', filters.from)
  }
  
  if (filters.to) {
    query = query.lte('date', filters.to)
  }
  
  if (filters.search) {
    query = query.or(`reference_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  const { data, error } = await query.limit(100)
  
  if (error) {
    console.error('Error fetching journal entries:', error)
    return []
  }
  
  return data || []
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const context = await getCompanyContext()
  if (!context) return null
  
  const filters = await searchParams
  const entries = await getJournalEntries(context.company.id, filters)

  return (
    <div className="p-6 space-y-6">
      <JournalHeader />
      
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <JournalTable entries={entries} canEdit={context.canEdit} />
      </Suspense>
    </div>
  )
}
