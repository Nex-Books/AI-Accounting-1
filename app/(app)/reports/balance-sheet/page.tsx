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

async function getBalanceSheetData(companyId: string, asOfDate: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('balance_sheet')
    .select('*')
    .eq('company_id', companyId)
    .lte('date', asOfDate)

  if (error) {
    console.error('Error fetching balance sheet:', error)
    return []
  }

  // Group by account type
  const assets = data.filter(row => row.type === 'asset')
  const liabilities = data.filter(row => row.type === 'liability')
  const equity = data.filter(row => row.type === 'equity')

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
