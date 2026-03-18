import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { TrialBalanceReport } from './trial-balance-report'
import type { TrialBalanceRow } from '@/lib/types'

export const metadata = {
  title: 'Trial Balance',
}

async function getTrialBalance(companyId: string): Promise<TrialBalanceRow[]> {
  const supabase = await createClient()
  
  // Get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .order('code')

  if (accountsError || !accounts) {
    return []
  }

  // Get all journal lines to calculate balances
  const { data: lines } = await supabase
    .from('journal_lines')
    .select('account_id, debit, credit')
    .eq('company_id', companyId)

  // Calculate debit and credit totals for each account
  const balanceMap = new Map<string, { debit: number; credit: number }>()
  
  for (const line of (lines || [])) {
    const current = balanceMap.get(line.account_id) || { debit: 0, credit: 0 }
    balanceMap.set(line.account_id, {
      debit: current.debit + (line.debit || 0),
      credit: current.credit + (line.credit || 0),
    })
  }

  // Build trial balance rows
  const rows: TrialBalanceRow[] = accounts.map(account => {
    const balances = balanceMap.get(account.id) || { debit: 0, credit: 0 }
    const netBalance = balances.debit - balances.credit
    
    let debitBalance = 0
    let creditBalance = 0
    
    if (netBalance > 0) {
      debitBalance = netBalance
    } else if (netBalance < 0) {
      creditBalance = Math.abs(netBalance)
    }

    return {
      account_id: account.id,
      account_code: account.code,
      account_name: account.name,
      account_type: account.type,
      debit_balance: debitBalance,
      credit_balance: creditBalance,
    }
  }).filter(row => row.debit_balance > 0.01 || row.credit_balance > 0.01)

  return rows
}

export default async function TrialBalancePage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const data = await getTrialBalance(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <TrialBalanceReport 
        data={data} 
        companyName={context.company.name}
      />
    </div>
  )
}
