import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { AccountsTable } from './accounts-table'
import { AccountsHeader } from './accounts-header'
import { Skeleton } from '@/components/ui/skeleton'
import type { Account } from '@/lib/types'

export const metadata = {
  title: 'Chart of Accounts',
}

async function getAccounts(companyId: string): Promise<Account[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', companyId)
    .order('code')
  
  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }
  
  return data || []
}

export default async function AccountsPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const accounts = await getAccounts(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <AccountsHeader />
      
      <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
        <AccountsTable accounts={accounts} canEdit={context.canEdit} />
      </Suspense>
    </div>
  )
}
