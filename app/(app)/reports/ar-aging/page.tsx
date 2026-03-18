import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { ARAgingReport } from './ar-aging-report'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Accounts Receivable Aging',
}

interface AgingRow {
  party_id: string
  party_name: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  over_90: number
  total: number
}

async function getARAgingData(companyId: string): Promise<AgingRow[]> {
  const supabase = await createClient()
  
  // Get all receivable accounts (accounts receivable type)
  const { data: receivableAccounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'asset')
    .ilike('name', '%receivable%')

  if (!receivableAccounts?.length) {
    return []
  }

  const accountIds = receivableAccounts.map(a => a.id)

  // Get all journal lines for receivable accounts with party info
  const { data: lines, error } = await supabase
    .from('journal_lines')
    .select(`
      debit,
      credit,
      party_id,
      party:parties(id, name),
      journal_entry:journal_entries!journal_lines_journal_entry_id_fkey(date)
    `)
    .eq('company_id', companyId)
    .in('account_id', accountIds)
    .not('party_id', 'is', null)

  if (error || !lines?.length) {
    return []
  }

  // Calculate aging buckets per party
  const today = new Date()
  const agingMap = new Map<string, AgingRow>()

  lines.forEach(line => {
    const partyId = line.party_id
    const partyName = (line.party as { name: string } | null)?.name || 'Unknown'
    const entryDate = new Date((line.journal_entry as { date: string } | null)?.date || today)
    const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    const amount = (line.debit || 0) - (line.credit || 0)

    if (!agingMap.has(partyId)) {
      agingMap.set(partyId, {
        party_id: partyId,
        party_name: partyName,
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        over_90: 0,
        total: 0,
      })
    }

    const row = agingMap.get(partyId)!
    row.total += amount

    if (daysDiff <= 0) {
      row.current += amount
    } else if (daysDiff <= 30) {
      row.days_1_30 += amount
    } else if (daysDiff <= 60) {
      row.days_31_60 += amount
    } else if (daysDiff <= 90) {
      row.days_61_90 += amount
    } else {
      row.over_90 += amount
    }
  })

  // Filter out parties with zero balance and sort by total
  return Array.from(agingMap.values())
    .filter(row => Math.abs(row.total) > 0.01)
    .sort((a, b) => b.total - a.total)
}

export default async function ARAgingPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const data = await getARAgingData(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <ARAgingReport 
          data={data} 
          companyName={context.company.name}
        />
      </Suspense>
    </div>
  )
}
