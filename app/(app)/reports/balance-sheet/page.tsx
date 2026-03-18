// Balance Sheet Report - v0.5.0 - Queries accounts and journal_lines directly
import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { BalanceSheetReport } from './balance-sheet-report'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Balance Sheet' }

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

interface BalanceSheetRow {
  account_code: string
  account_name: string
  type: string
  sub_type: string | null
  closing_balance: number
}

export default async function BalanceSheetPage({ searchParams }: PageProps) {
  const context = await getCompanyContext()
  if (!context) return null
  
  const params = await searchParams
  const asOfDate = params.date || new Date().toISOString().split('T')[0]
  const companyId = context.company.id
  const supabase = await createClient()

  // Fetch accounts (asset, liability, equity only)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, name, type, sub_type')
    .eq('company_id', companyId)
    .in('type', ['asset', 'liability', 'equity'])
    .order('code')

  // Fetch journal lines up to the as-of date
  const { data: lines } = await supabase
    .from('journal_lines')
    .select('account_id, debit, credit, journal_entry:journal_entries!inner(date)')
    .eq('company_id', companyId)
    .lte('journal_entry.date', asOfDate)

  // Calculate balances
  const balanceMap = new Map<string, number>()
  for (const line of (lines || [])) {
    const current = balanceMap.get(line.account_id) || 0
    balanceMap.set(line.account_id, current + (line.debit || 0) - (line.credit || 0))
  }

  // Build rows with non-zero balances
  const rows: BalanceSheetRow[] = (accounts || [])
    .map(acc => ({
      account_code: acc.code,
      account_name: acc.name,
      type: acc.type,
      sub_type: acc.sub_type,
      closing_balance: balanceMap.get(acc.id) || 0,
    }))
    .filter(r => Math.abs(r.closing_balance) > 0.01)

  const data = {
    assets: rows.filter(r => r.type === 'asset'),
    liabilities: rows.filter(r => r.type === 'liability'),
    equity: rows.filter(r => r.type === 'equity'),
    asOfDate,
  }

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <BalanceSheetReport data={data} companyName={context.company.name} />
      </Suspense>
    </div>
  )
}
