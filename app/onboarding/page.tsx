import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata = {
  title: 'Setup Your Company',
  description: 'Complete your company setup to start using ElevAIte Books',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user already has a company
  const { data: existingUser } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.company_id) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8">
      <OnboardingWizard userId={user.id} userEmail={user.email || ''} />
    </div>
  )
}
