import { redirect } from 'next/navigation'
import { getCompanyContext } from '@/lib/server-utils'
import { CompanyProvider } from '@/lib/company-context'
import { AppSidebar } from '@/components/app-sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const context = await getCompanyContext()

  if (!context) {
    // Check if user is logged in but has no company
    redirect('/onboarding')
  }

  return (
    <CompanyProvider company={context.company} user={context.user}>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </CompanyProvider>
  )
}
