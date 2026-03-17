import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Scale, 
  TrendingUp, 
  Receipt,
  Users,
  Calendar,
  ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'Reports',
}

const reports = [
  {
    title: 'Trial Balance',
    description: 'View all account balances with debits and credits',
    href: '/reports/trial-balance',
    icon: Scale,
  },
  {
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity as of a date',
    href: '/reports/balance-sheet',
    icon: FileText,
  },
  {
    title: 'Profit & Loss',
    description: 'Income statement showing revenue and expenses',
    href: '/reports/profit-loss',
    icon: TrendingUp,
  },
  {
    title: 'Accounts Receivable Aging',
    description: 'Outstanding customer invoices by age',
    href: '/reports/ar-aging',
    icon: Users,
  },
  {
    title: 'Accounts Payable Aging',
    description: 'Outstanding vendor bills by age',
    href: '/reports/ap-aging',
    icon: Receipt,
  },
  {
    title: 'General Ledger',
    description: 'Complete transaction history by account',
    href: '/ledger',
    icon: Calendar,
  },
]

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Generate financial reports and statements
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full hover:shadow-md transition-shadow group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <report.icon className="h-5 w-5 text-accent" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
