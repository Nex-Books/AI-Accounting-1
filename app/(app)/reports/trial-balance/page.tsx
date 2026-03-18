// Trial Balance Report - v0.5.0 - Queries accounts and journal_lines directly
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { TrialBalanceReport } from './trial-balance-report'
import type { TrialBalanceRow } from '@/lib/types'

export const metadata = { title: 'Trial Balance' }

export default async function TrialBalancePage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const companyId = context.company.id
  const supabase = await createClient()

  // Fetch all accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .order('code')

  // Fetch all journal lines
  const { data: lines } = await supabase
    .from('journal_lines')
    .select('account_id, debit, credit')
    .eq('company_id', companyId)

  // Calculate totals per account
  const balanceMap = new Map<string, { debit: number; credit: number }>()
  for (const line of (lines || [])) {
    const curr = balanceMap.get(line.account_id) || { debit: 0, credit: 0 }
    balanceMap.set(line.account_id, {
      debit: curr.debit + (line.debit || 0),
      credit: curr.credit + (line.credit || 0),
    })
  }

  // Build trial balance rows
  const data: TrialBalanceRow[] = (accounts || [])
    .map(acc => {
      const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
      const net = bal.debit - bal.credit
      return {
        account_id: acc.id,
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.type,
        debit_balance: net > 0 ? net : 0,
        credit_balance: net < 0 ? Math.abs(net) : 0,
      }
    })
    .filter(r => r.debit_balance > 0.01 || r.credit_balance > 0.01)

  return (
    <div className="p-6 space-y-6">
      <TrialBalanceReport data={data} companyName={context.company.name} />
    </div>
  )
}
