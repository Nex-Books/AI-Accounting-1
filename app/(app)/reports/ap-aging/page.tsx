import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { APAgingReport } from './ap-aging-report'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Accounts Payable Aging',
}

async function getAPAgingData(companyId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ap_aging')
    .select('*')
    .eq('company_id', companyId)

  if (error) {
    console.error('Error fetching AP aging:', error)
    return []
  }

  return data || []
}

export default async function APAgingPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const data = await getAPAgingData(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <APAgingReport 
          data={data} 
          companyName={context.company.name}
        />
      </Suspense>
    </div>
  )
}
