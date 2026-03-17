import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { TrialBalanceReport } from './trial-balance-report'
import type { TrialBalanceRow } from '@/lib/types'

export const metadata = {
  title: 'Trial Balance',
}

async function getTrialBalance(companyId: string): Promise<TrialBalanceRow[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('trial_balance')
    .select('*')
    .eq('company_id', companyId)
    .order('account_code')
  
  if (error) {
    console.error('Error fetching trial balance:', error)
    return []
  }
  
  return data || []
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
