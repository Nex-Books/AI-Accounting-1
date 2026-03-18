import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { AccountForm } from '../account-form'
import { redirect } from 'next/navigation'
import type { Account } from '@/lib/types'

export const metadata = {
  title: 'New Account',
}

async function getParentAccounts(companyId: string): Promise<Account[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')
  
  return (data as Account[]) || []
}

export default async function NewAccountPage() {
  const context = await getCompanyContext()
  if (!context) redirect('/auth/login')
  
  if (!context.canEdit) {
    redirect('/accounts')
  }

  const parentAccounts = await getParentAccounts(context.company.id)

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Account</h1>
        <p className="text-muted-foreground">
          Add a new account to your chart of accounts
        </p>
      </div>
      
      <AccountForm parentAccounts={parentAccounts} companyId={context.company.id} />
    </div>
  )
}
