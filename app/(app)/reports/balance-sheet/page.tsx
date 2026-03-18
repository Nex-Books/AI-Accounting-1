import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { BalanceSheetReport } from './balance-sheet-report'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Balance Sheet',
}

interface BalanceSheetPageProps {
  searchParams: Promise<{
    date?: string
  }>
}

interface BalanceSheetRow {
  account_code: string
  account_name: string
  type: string
  sub_type: string | null
  closing_balance: number
}

async function getBalanceSheetData(companyId: string, asOfDate: string) {
  const supabase = await createClient()
  
  // Get all accounts with their balances calculated from journal_lines
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, code, name, type, sub_type')
    .eq('company_id', companyId)
    .in('type', ['asset', 'liability', 'equity'])
    .order('code')

  if (accountsError || !accounts) {
    return { assets: [], liabilities: [], equity: [], asOfDate }
  }

  // Get journal lines up to the as-of date
  const { data: lines } = await supabase
    .from('journal_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(date)
    `)
    .eq('company_id', companyId)
    .lte('journal_entry.date', asOfDate)

  // Calculate balances for each account
  const balanceMap = new Map<string, number>()
  
  for (const line of (lines || [])) {
    const current = balanceMap.get(line.account_id) || 0
    balanceMap.set(line.account_id, current + (line.debit || 0) - (line.credit || 0))
  }

  // Build the balance sheet rows
  const rows: BalanceSheetRow[] = accounts.map(account => ({
    account_code: account.code,
    account_name: account.name,
    type: account.type,
    sub_type: account.sub_type,
    closing_balance: balanceMap.get(account.id) || 0,
  })).filter(row => Math.abs(row.closing_balance) > 0.01)

  // Group by account type
  const assets = rows.filter(row => row.type === 'asset')
  const liabilities = rows.filter(row => row.type === 'liability')
  const equity = rows.filter(row => row.type === 'equity')

  return { assets, liabilities, equity, asOfDate }
}

export default async function BalanceSheetPage({ searchParams }: BalanceSheetPageProps) {
  const context = await getCompanyContext()
  if (!context) return null
  
  const params = await searchParams
  const asOfDate = params.date || new Date().toISOString().split('T')[0]
  const data = await getBalanceSheetData(context.company.id, asOfDate)

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <BalanceSheetReport 
          data={data} 
          companyName={context.company.name}
        />
      </Suspense>
    </div>
  )
}
