'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'

interface RevenueChartProps {
  data: Array<{
    credit: number
    debit: number
    account: { type: string }
    journal: { date: string }
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Group by month and calculate revenue
    const monthlyRevenue: Record<string, number> = {}
    
    data.forEach((item) => {
      if (item.account.type === 'revenue') {
        const month = item.journal.date.substring(0, 7) // YYYY-MM
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + item.credit - item.debit
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
      revenue: monthlyRevenue[month] || 0,
    }))
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
