'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'

interface APAgingRow {
  party_name: string
  current_amount: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  days_over_90: number
  total_outstanding: number
}

interface APAgingReportProps {
  data: APAgingRow[]
  companyName: string
}

export function APAgingReport({ data, companyName }: APAgingReportProps) {
  const totals = data.reduce(
    (acc, row) => ({
      current: acc.current + row.current_amount,
      days_1_30: acc.days_1_30 + row.days_1_30,
      days_31_60: acc.days_31_60 + row.days_31_60,
      days_61_90: acc.days_61_90 + row.days_61_90,
      over_90: acc.over_90 + row.days_over_90,
      total: acc.total + row.total_outstanding,
    }),
    { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0 }
  )

  function handleExport(format: 'pdf' | 'excel') {
    console.log(`Exporting as ${format}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Accounts Payable Aging</h1>
            <p className="text-muted-foreground">
              Outstanding vendor bills by age
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current (0-30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totals.current + totals.days_1_30)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue (31-90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totals.days_31_60 + totals.days_61_90)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Severely Overdue (90+ days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totals.over_90)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl">{companyName}</CardTitle>
          <p className="text-lg font-medium">Accounts Payable Aging Report</p>
          <p className="text-sm text-muted-foreground">
            As of {new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">1-30 Days</TableHead>
                <TableHead className="text-right">31-60 Days</TableHead>
                <TableHead className="text-right">61-90 Days</TableHead>
                <TableHead className="text-right">90+ Days</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No outstanding payables
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.party_name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.current_amount > 0 ? formatCurrency(row.current_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.days_1_30 > 0 ? formatCurrency(row.days_1_30) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-warning">
                        {row.days_31_60 > 0 ? formatCurrency(row.days_31_60) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-warning">
                        {row.days_61_90 > 0 ? formatCurrency(row.days_61_90) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {row.days_over_90 > 0 ? formatCurrency(row.days_over_90) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(row.total_outstanding)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.current)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.days_1_30)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.days_31_60)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.days_61_90)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.over_90)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.total)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
