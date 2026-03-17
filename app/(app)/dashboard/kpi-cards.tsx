'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/format'
import type { DashboardKPIs } from '@/lib/types'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardsProps {
  kpis: DashboardKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      title: 'Revenue',
      value: kpis.total_revenue,
      change: kpis.revenue_growth,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Expenses',
      value: kpis.total_expenses,
      change: kpis.expense_growth,
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      invertChange: true,
    },
    {
      title: 'Net Income',
      value: kpis.net_income,
      icon: DollarSign,
      color: kpis.net_income >= 0 ? 'text-success' : 'text-destructive',
      bgColor: kpis.net_income >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      title: 'Receivables',
      value: kpis.total_receivables,
      icon: Receipt,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Payables',
      value: kpis.total_payables,
      icon: Wallet,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Cash Balance',
      value: kpis.cash_balance,
      icon: Banknote,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(card.value, { compact: true })}
                </p>
              </div>
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
            
            {card.change !== undefined && (
              <div className="mt-3 flex items-center gap-1 text-xs">
                {card.change >= 0 ? (
                  <ArrowUpRight className={cn(
                    'h-3 w-3',
                    card.invertChange ? 'text-destructive' : 'text-success'
                  )} />
                ) : (
                  <ArrowDownRight className={cn(
                    'h-3 w-3',
                    card.invertChange ? 'text-success' : 'text-destructive'
                  )} />
                )}
                <span className={cn(
                  card.change >= 0
                    ? card.invertChange ? 'text-destructive' : 'text-success'
                    : card.invertChange ? 'text-success' : 'text-destructive'
                )}>
                  {formatPercentage(Math.abs(card.change))}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
