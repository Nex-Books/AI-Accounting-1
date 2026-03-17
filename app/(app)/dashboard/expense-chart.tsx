'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

interface ExpenseChartProps {
  data: Array<{
    credit: number
    debit: number
    account: { type: string }
    journal: { date: string }
  }>
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    // Group by month and calculate expenses
    const monthlyExpenses: Record<string, number> = {}
    
    data.forEach((item) => {
      if (item.account.type === 'expense') {
        const month = item.journal.date.substring(0, 7) // YYYY-MM
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + item.debit - item.credit
      }
    })
    
    // Get last 6 months
    const months: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(date.toISOString().substring(0, 7))
    }
    
    return months.map((month) => ({
      month: new Date(month + '-01').toLocaleDateString('en-IN', { 
        month: 'short',
        year: '2-digit'
      }),
      expenses: monthlyExpenses[month] || 0,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, { compact: true, showSymbol: false })}
                className="fill-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <p className="text-sm font-medium">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="expenses"
                fill="hsl(var(--chart-5))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
