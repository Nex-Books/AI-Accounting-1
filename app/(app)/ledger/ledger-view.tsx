'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, getAccountTypeLabel } from '@/lib/format'
import type { Account, LedgerRow } from '@/lib/types'
import { Download, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LedgerViewProps {
  accounts: Account[]
  ledgerData: LedgerRow[]
  selectedAccount?: Account
  initialFrom?: string
  initialTo?: string
}

export function LedgerView({ 
  accounts, 
  ledgerData, 
  selectedAccount,
  initialFrom,
  initialTo 
}: LedgerViewProps) {
  const router = useRouter()
  const [accountId, setAccountId] = useState(selectedAccount?.id || '')
  const [fromDate, setFromDate] = useState(initialFrom || '')
  const [toDate, setToDate] = useState(initialTo || '')

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type
    if (!acc[type]) acc[type] = []
    acc[type].push(account)
    return acc
  }, {} as Record<string, Account[]>)

  function handleSearch() {
    const params = new URLSearchParams()
    if (accountId) params.set('account', accountId)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    router.push(`/ledger?${params.toString()}`)
  }

  // Calculate totals
  const totalDebit = ledgerData.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = ledgerData.reduce((sum, row) => sum + row.credit, 0)
  const closingBalance = ledgerData.length > 0 
    ? ledgerData[ledgerData.length - 1].running_balance 
    : selectedAccount?.current_balance || 0

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedAccounts).map(([type, accts]) => (
                    <div key={type}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {getAccountTypeLabel(type)}
                      </div>
                      {accts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="font-mono text-xs mr-2">{a.code}</span>
                          {a.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              View Ledger
            </Button>

            {selectedAccount && (
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {selectedAccount && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  <span className="font-mono text-muted-foreground mr-2">
                    {selectedAccount.code}
                  </span>
                  {selectedAccount.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getAccountTypeLabel(selectedAccount.type)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={cn(
                  "text-2xl font-semibold font-mono",
                  closingBalance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(closingBalance)}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Ledger Table */}
      {selectedAccount ? (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={3} className="font-medium">
                      Opening Balance
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(selectedAccount.opening_balance)}
                    </TableCell>
                  </TableRow>

                  {ledgerData.length > 0 ? (
                    ledgerData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(row.date, 'short')}</TableCell>
                        <TableCell>
                          <Link 
                            href={`/journal/${row.journal_entry_id}`}
                            className="font-mono text-accent hover:underline"
                          >
                            {row.entry_number}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {row.narration || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono font-medium",
                          row.running_balance < 0 && "text-destructive"
                        )}>
                          {formatCurrency(row.running_balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No transactions found for this period
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Totals Row */}
                  {ledgerData.length > 0 && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell colSpan={3}>Period Totals</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        closingBalance < 0 && "text-destructive"
                      )}>
                        {formatCurrency(closingBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select an Account</h3>
            <p className="text-muted-foreground max-w-md">
              Choose an account from the dropdown above to view its ledger with running balance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
