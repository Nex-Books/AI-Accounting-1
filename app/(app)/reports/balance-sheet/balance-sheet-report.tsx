'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/format'

interface BalanceSheetRow {
  account_code: string
  account_name: string
  type: string
  sub_type: string | null
  closing_balance: number
}

interface BalanceSheetData {
  assets: BalanceSheetRow[]
  liabilities: BalanceSheetRow[]
  equity: BalanceSheetRow[]
  asOfDate: string
}

interface BalanceSheetReportProps {
  data: BalanceSheetData
  companyName: string
}

export function BalanceSheetReport({ data, companyName }: BalanceSheetReportProps) {
  const router = useRouter()
  const [asOfDate, setAsOfDate] = useState(data.asOfDate)

  const totalAssets = data.assets.reduce((sum, row) => sum + row.closing_balance, 0)
  const totalLiabilities = data.liabilities.reduce((sum, row) => sum + Math.abs(row.closing_balance), 0)
  const totalEquity = data.equity.reduce((sum, row) => sum + Math.abs(row.closing_balance), 0)

  function handleDateChange() {
    router.push(`/reports/balance-sheet?date=${asOfDate}`)
  }

  function handleExport(format: 'pdf' | 'excel') {
    // Export logic would go here
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
            <h1 className="text-2xl font-semibold">Balance Sheet</h1>
            <p className="text-muted-foreground">
              As of {new Date(data.asOfDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="asOfDate">As of Date</Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={handleDateChange}>Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl">{companyName}</CardTitle>
          <p className="text-lg font-medium">Balance Sheet</p>
          <p className="text-sm text-muted-foreground">
            As at {new Date(data.asOfDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Assets */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Assets</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No assets recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {data.assets.map((row) => (
                        <TableRow key={row.account_code}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {row.account_code}
                              </Badge>
                              {row.account_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.closing_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totalAssets)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-8">
              {/* Liabilities */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Liabilities</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.liabilities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No liabilities recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {data.liabilities.map((row) => (
                          <TableRow key={row.account_code}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {row.account_code}
                                </Badge>
                                {row.account_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Math.abs(row.closing_balance))}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell>Total Liabilities</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(totalLiabilities)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Equity */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Equity</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.equity.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No equity recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {data.equity.map((row) => (
                          <TableRow key={row.account_code}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {row.account_code}
                                </Badge>
                                {row.account_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Math.abs(row.closing_balance))}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell>Total Equity</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(totalEquity)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Total Liabilities + Equity */}
              <div className="border-t-2 pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Liabilities + Equity</span>
                  <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center">
            {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? (
              <p className="text-success font-medium">
                ✓ Balance Sheet is balanced
              </p>
            ) : (
              <p className="text-destructive font-medium">
                ⚠ Balance Sheet is out of balance by {formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
