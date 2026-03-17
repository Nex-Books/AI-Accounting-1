import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { ARAgingReport } from './ar-aging-report'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Accounts Receivable Aging',
}

async function getARAgingData(companyId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('ar_aging')
    .select('*')
    .eq('company_id', companyId)

  if (error) {
    console.error('Error fetching AR aging:', error)
    return []
  }

  return data || []
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
