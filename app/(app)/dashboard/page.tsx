import { Suspense } from 'react'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { KPICards } from './kpi-cards'
import { RevenueChart } from './revenue-chart'
import { ExpenseChart } from './expense-chart'
import { RecentJournals } from './recent-journals'
import { QuickActions } from './quick-actions'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Dashboard',
}

async function getDashboardData(companyId: string) {
  const supabase = await createClient()
  
  // Get recent journal entries
  const { data: recentJournals } = await supabase
    .from('journal_entries')
    .select(`
      *,
      lines:journal_lines(*, account:accounts(code, name)),
      creator:users(full_name, email)
    `)
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(5)
  
  // Get monthly data for charts (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: journalLines } = await supabase
    .from('journal_lines')
    .select(`
      credit,
      debit,
      account:accounts!inner(type),
      journal:journal_entries!inner(date, company_id)
    `)
    .eq('company_id', companyId)
    .gte('journal.date', sixMonthsAgo.toISOString().split('T')[0])
  
  // Calculate KPIs from journal lines
  let totalRevenue = 0
  let totalExpenses = 0
  let totalReceivables = 0
  let totalPayables = 0
  let cashBalance = 0
  
  for (const line of journalLines || []) {
    const account = line.account as { type: string } | null
    if (!account) continue
    
    const netAmount = (line.debit || 0) - (line.credit || 0)
    
    switch (account.type) {
      case 'income':
        totalRevenue += line.credit || 0
        break
      case 'expense':
        totalExpenses += line.debit || 0
        break
      case 'asset':
        if (netAmount > 0) totalReceivables += netAmount
        cashBalance += netAmount
        break
      case 'liability':
        if (netAmount < 0) totalPayables += Math.abs(netAmount)
        break
    }
  }
  
  return {
    kpis: {
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_income: totalRevenue - totalExpenses,
      total_receivables: totalReceivables,
      total_payables: totalPayables,
      cash_balance: cashBalance,
      revenue_growth: 0,
      expense_growth: 0,
    },
    recentJournals: recentJournals || [],
    monthlyData: journalLines || [],
  }
}

export default async function DashboardPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const { kpis, recentJournals, monthlyData } = await getDashboardData(context.company.id)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {context.user.full_name?.split(' ')[0] || 'there'}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<KPICardsSkeleton />}>
        <KPICards kpis={kpis} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={monthlyData} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ExpenseChart data={monthlyData} />
        </Suspense>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<TableSkeleton />}>
            <RecentJournals journals={recentJournals} />
          </Suspense>
        </div>
        <div>
          {/* Placeholder for additional widget */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Your AI assistant is ready to help with bookkeeping tasks. 
              Click the chat icon in the sidebar to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-80 rounded-xl" />
}

function TableSkeleton() {
  return <Skeleton className="h-96 rounded-xl" />
}
