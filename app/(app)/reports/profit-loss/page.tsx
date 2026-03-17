import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { ProfitLossReport } from './profit-loss-report'

export const metadata = {
  title: 'Profit & Loss',
}

interface ProfitLossData {
  revenues: Array<{ account_name: string; amount: number }>
  expenses: Array<{ account_name: string; amount: number }>
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

async function getProfitLossData(companyId: string): Promise<ProfitLossData> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('profit_loss')
    .select('*')
    .eq('company_id', companyId)
  
  const revenues: Array<{ account_name: string; amount: number }> = []
  const expenses: Array<{ account_name: string; amount: number }> = []
  let totalRevenue = 0
  let totalExpenses = 0
  
  data?.forEach((row) => {
    if (row.category === 'revenue') {
      revenues.push({ account_name: row.account_name, amount: row.amount })
      totalRevenue += row.amount
    } else {
      expenses.push({ account_name: row.account_name, amount: row.amount })
      totalExpenses += row.amount
    }
  })
  
  return {
    revenues,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  }
}

export default async function ProfitLossPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const data = await getProfitLossData(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <ProfitLossReport 
        data={data} 
        companyName={context.company.name}
      />
    </div>
  )
}
