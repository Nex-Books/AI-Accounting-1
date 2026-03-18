import { getCompanyContext, getNextReferenceNumber } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { JournalEntryForm } from '../journal-entry-form'
import { redirect } from 'next/navigation'
import type { Account, Party } from '@/lib/types'

export const metadata = {
  title: 'New Journal Entry',
}

async function getFormData(companyId: string) {
  const supabase = await createClient()
  
  const [accountsResult, partiesResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, code, name, type')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('code'),
    supabase
      .from('parties')
      .select('id, name, type')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name'),
  ])
  
  return {
    accounts: (accountsResult.data || []) as Account[],
    parties: (partiesResult.data || []) as Party[],
  }
}

export default async function NewJournalEntryPage() {
  const context = await getCompanyContext()
  if (!context) redirect('/auth/login')
  
  if (!context.canEdit) {
    redirect('/journal')
  }

  const { accounts, parties } = await getFormData(context.company.id)
  const nextEntryNumber = await getNextReferenceNumber(context.company.id)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Journal Entry</h1>
        <p className="text-muted-foreground">
          Create a new journal entry with debit and credit lines
        </p>
      </div>
      
      <JournalEntryForm 
        accounts={accounts} 
        parties={parties} 
        companyId={context.company.id}
        userId={context.user.id}
        nextEntryNumber={nextEntryNumber}
      />
    </div>
  )
}
