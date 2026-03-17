'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/format'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfitLossReportProps {
  data: {
    revenues: Array<{ account_name: string; amount: number }>
    expenses: Array<{ account_name: string; amount: number }>
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }
  companyName: string
}

export function ProfitLossReport({ data, companyName }: ProfitLossReportProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">
            For the period ending {formatDate(new Date(), 'long')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Report */}
      <Card>
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl">{companyName}</CardTitle>
          <p className="text-muted-foreground">Profit & Loss Statement</p>
          <p className="text-sm text-muted-foreground">
            For the period ending {formatDate(new Date(), 'long')}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-success">Revenue</h3>
              <div className="space-y-2">
                {data.revenues.length > 0 ? (
                  data.revenues.map((item, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span className="text-muted-foreground">{item.account_name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No revenue recorded</p>
                )}
              </div>
              <div className="flex justify-between py-2 mt-2 border-t font-semibold">
                <span>Total Revenue</span>
                <span className="font-mono text-success">
                  {formatCurrency(data.totalRevenue)}
                </span>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-destructive">Expenses</h3>
              <div className="space-y-2">
                {data.expenses.length > 0 ? (
                  data.expenses.map((item, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span className="text-muted-foreground">{item.account_name}</span>
                      <span className="font-mono">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No expenses recorded</p>
                )}
              </div>
              <div className="flex justify-between py-2 mt-2 border-t font-semibold">
                <span>Total Expenses</span>
                <span className="font-mono text-destructive">
                  {formatCurrency(data.totalExpenses)}
                </span>
              </div>
            </div>

            {/* Net Income */}
            <div className={cn(
              'flex justify-between p-4 rounded-lg font-semibold text-lg',
              data.netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              <span>Net {data.netIncome >= 0 ? 'Income' : 'Loss'}</span>
              <span className={cn(
                'font-mono',
                data.netIncome >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {formatCurrency(Math.abs(data.netIncome))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
