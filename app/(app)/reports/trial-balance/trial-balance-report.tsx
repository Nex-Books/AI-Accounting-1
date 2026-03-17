'use client'

import { useMemo } from 'react'
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
import { formatCurrency, formatDate, getAccountTypeLabel } from '@/lib/format'
import type { TrialBalanceRow, AccountType } from '@/lib/types'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrialBalanceReportProps {
  data: TrialBalanceRow[]
  companyName: string
}

export function TrialBalanceReport({ data, companyName }: TrialBalanceReportProps) {
  // Group by account type
  const groupedData = useMemo(() => {
    const groups: Record<AccountType, TrialBalanceRow[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    }
    
    data.forEach((row) => {
      if (groups[row.account_type]) {
        groups[row.account_type].push(row)
      }
    })
    
    return groups
  }, [data])

  // Calculate totals
  const totals = useMemo(() => {
    let totalDebit = 0
    let totalCredit = 0
    
    data.forEach((row) => {
      // Determine if balance should be debit or credit based on account type
      const balance = row.closing_balance
      if (['asset', 'expense'].includes(row.account_type)) {
        if (balance >= 0) totalDebit += balance
        else totalCredit += Math.abs(balance)
      } else {
        if (balance >= 0) totalCredit += balance
        else totalDebit += Math.abs(balance)
      }
    })
    
    return { totalDebit, totalCredit }
  }, [data])

  const isBalanced = Math.abs(totals.totalDebit - totals.totalCredit) < 0.01

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trial Balance</h1>
          <p className="text-muted-foreground">
            As of {formatDate(new Date(), 'long')}
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
          <p className="text-muted-foreground">Trial Balance</p>
          <p className="text-sm text-muted-foreground">
            As of {formatDate(new Date(), 'long')}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map((type) => {
                const rows = groupedData[type]
                if (rows.length === 0) return null
                
                return (
                  <TableRowGroup 
                    key={type} 
                    type={type} 
                    rows={rows} 
                  />
                )
              })}
              
              {/* Totals */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.totalDebit)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(totals.totalCredit)}
                </TableCell>
              </TableRow>

              {/* Balance Check */}
              {!isBalanced && (
                <TableRow className="bg-destructive/10">
                  <TableCell colSpan={2} className="text-destructive">
                    Difference (Out of Balance)
                  </TableCell>
                  <TableCell colSpan={2} className="text-right font-mono text-destructive">
                    {formatCurrency(Math.abs(totals.totalDebit - totals.totalCredit))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status */}
      <div className={cn(
        'text-center p-4 rounded-lg',
        isBalanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      )}>
        {isBalanced 
          ? 'Trial balance is balanced. Debits equal credits.'
          : 'Warning: Trial balance is out of balance. Please review your entries.'}
      </div>
    </div>
  )
}

function TableRowGroup({ 
  type, 
  rows 
}: { 
  type: AccountType
  rows: TrialBalanceRow[] 
}) {
  return (
    <>
      {/* Group Header */}
      <TableRow className="bg-muted/30">
        <TableCell colSpan={4} className="font-semibold">
          {getAccountTypeLabel(type)}
        </TableCell>
      </TableRow>
      
      {/* Rows */}
      {rows.map((row) => {
        const isDebitNormal = ['asset', 'expense'].includes(type)
        const balance = row.closing_balance
        const debit = isDebitNormal 
          ? (balance >= 0 ? balance : 0)
          : (balance < 0 ? Math.abs(balance) : 0)
        const credit = isDebitNormal
          ? (balance < 0 ? Math.abs(balance) : 0)
          : (balance >= 0 ? balance : 0)
        
        return (
          <TableRow key={row.account_id}>
            <TableCell className="font-mono text-sm text-muted-foreground">
              {row.account_code}
            </TableCell>
            <TableCell>{row.account_name}</TableCell>
            <TableCell className="text-right font-mono">
              {debit > 0 ? formatCurrency(debit) : '-'}
            </TableCell>
            <TableCell className="text-right font-mono">
              {credit > 0 ? formatCurrency(credit) : '-'}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
