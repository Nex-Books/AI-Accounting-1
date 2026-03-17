import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { LedgerView } from './ledger-view'
import { Skeleton } from '@/components/ui/skeleton'
import type { Account, LedgerRow } from '@/lib/types'

export const metadata = {
  title: 'Ledger',
}

interface LedgerPageProps {
  searchParams: Promise<{
    account?: string
    from?: string
    to?: string
  }>
}

async function getAccounts(companyId: string): Promise<Account[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('accounts')
    .select('id, code, name, type, current_balance, opening_balance')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')
  
  return data || []
}

async function getLedgerData(
  companyId: string,
  accountId: string,
  from?: string,
  to?: string
): Promise<LedgerRow[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_ledger_with_running_balance', {
    p_company_id: companyId,
    p_account_id: accountId,
    p_from_date: from || null,
    p_to_date: to || null,
  })
  
  if (error) {
    console.error('Error fetching ledger:', error)
    return []
  }
  
  return data || []
}

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const context = await getCompanyContext()
  if (!context) return null
  
  const { account: accountId, from, to } = await searchParams
  const accounts = await getAccounts(context.company.id)
  
  let ledgerData: LedgerRow[] = []
  let selectedAccount: Account | undefined
  
  if (accountId) {
    selectedAccount = accounts.find(a => a.id === accountId)
    if (selectedAccount) {
      ledgerData = await getLedgerData(context.company.id, accountId, from, to)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ledger</h1>
        <p className="text-muted-foreground">
          View account transactions with running balance
        </p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <LedgerView 
          accounts={accounts}
          ledgerData={ledgerData}
          selectedAccount={selectedAccount}
          initialFrom={from}
          initialTo={to}
        />
      </Suspense>
    </div>
  )
}
