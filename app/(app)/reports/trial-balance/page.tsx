'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'

interface TrialRow {
  code: string
  name: string
  type: string
  debit: number
  credit: number
}

export default function TrialBalancePage() {
  const [rows, setRows] = useState<TrialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    // Get user's company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: userData } = await supabase
      .from('users')
      .select('company_id, company:companies(id, name)')
      .eq('id', user.id)
      .single()
    
    if (!userData?.company_id) return
    const companyId = userData.company_id
    setCompanyName((userData.company as any)?.name || '')

    // Fetch all accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, type')
      .eq('company_id', companyId)
      .order('code')

    // Fetch all journal lines
    const { data: lines } = await supabase
      .from('journal_lines')
      .select('account_id, debit, credit')
      .eq('company_id', companyId)

    // Calculate totals per account
    const balanceMap = new Map<string, { debit: number; credit: number }>()
    for (const line of (lines || [])) {
      const curr = balanceMap.get(line.account_id) || { debit: 0, credit: 0 }
      balanceMap.set(line.account_id, {
        debit: curr.debit + (line.debit || 0),
        credit: curr.credit + (line.credit || 0),
      })
    }

    // Build trial balance rows
    const data: TrialRow[] = (accounts || [])
      .map(acc => {
        const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
        const net = bal.debit - bal.credit
        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          debit: net > 0 ? net : 0,
          credit: net < 0 ? Math.abs(net) : 0,
        }
      })
      .filter(r => r.debit > 0.01 || r.credit > 0.01)

    setRows(data)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0)
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions recorded yet. Create journal entries to see the trial balance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Code</th>
                    <th className="text-left py-3 px-4 font-medium">Account Name</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-right py-3 px-4 font-medium">Debit</th>
                    <th className="text-right py-3 px-4 font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.code} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{row.code}</td>
                      <td className="py-3 px-4">{row.name}</td>
                      <td className="py-3 px-4 capitalize text-muted-foreground">{row.type}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(row.debit)}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(row.credit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-muted/50">
                    <td colSpan={3} className="py-3 px-4">Total</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(totalDebit)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
              {Math.abs(totalDebit - totalCredit) > 0.01 && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  Warning: Trial balance is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
