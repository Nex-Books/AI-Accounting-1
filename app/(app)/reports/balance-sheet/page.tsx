'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Download, Printer, IndianRupee } from 'lucide-react'
import Link from 'next/link'

interface BalanceRow {
  code: string
  name: string
  type: string
  balance: number
}

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  const [assets, setAssets] = useState<BalanceRow[]>([])
  const [liabilities, setLiabilities] = useState<BalanceRow[]>([])
  const [equity, setEquity] = useState<BalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    loadData()
  }, [asOfDate])

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

    // Fetch accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code, name, type')
      .eq('company_id', companyId)
      .in('type', ['asset', 'liability', 'equity'])
      .order('code')

    // Fetch journal lines with date filter
    const { data: lines } = await supabase
      .from('journal_lines')
      .select('account_id, debit, credit, journal_entry:journal_entries!inner(date)')
      .eq('company_id', companyId)

    // Filter lines by date and calculate balances
    const balanceMap = new Map<string, number>()
    for (const line of (lines || [])) {
      const entryDate = (line.journal_entry as any)?.date
      if (entryDate && entryDate <= asOfDate) {
        const current = balanceMap.get(line.account_id) || 0
        balanceMap.set(line.account_id, current + (line.debit || 0) - (line.credit || 0))
      }
    }

    // Build rows
    const rows: BalanceRow[] = (accounts || [])
      .map(acc => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: balanceMap.get(acc.id) || 0,
      }))
      .filter(r => Math.abs(r.balance) > 0.01)

    setAssets(rows.filter(r => r.type === 'asset'))
    setLiabilities(rows.filter(r => r.type === 'liability'))
    setEquity(rows.filter(r => r.type === 'equity'))
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const totalAssets = assets.reduce((sum, r) => sum + r.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, r) => sum + Math.abs(r.balance), 0)
  const totalEquity = equity.reduce((sum, r) => sum + Math.abs(r.balance), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground">{companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Assets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No asset accounts with balances</p>
              ) : (
                <div className="space-y-2">
                  {assets.map((row) => (
                    <div key={row.code} className="flex justify-between text-sm">
                      <span>{row.code} - {row.name}</span>
                      <span className="font-mono">{formatCurrency(row.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                <span>Total Assets</span>
                <span className="font-mono">{formatCurrency(totalAssets)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Liabilities</CardTitle>
              </CardHeader>
              <CardContent>
                {liabilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No liability accounts with balances</p>
                ) : (
                  <div className="space-y-2">
                    {liabilities.map((row) => (
                      <div key={row.code} className="flex justify-between text-sm">
                        <span>{row.code} - {row.name}</span>
                        <span className="font-mono">{formatCurrency(row.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                  <span>Total Liabilities</span>
                  <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Equity</CardTitle>
              </CardHeader>
              <CardContent>
                {equity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No equity accounts with balances</p>
                ) : (
                  <div className="space-y-2">
                    {equity.map((row) => (
                      <div key={row.code} className="flex justify-between text-sm">
                        <span>{row.code} - {row.name}</span>
                        <span className="font-mono">{formatCurrency(row.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                  <span>Total Equity</span>
                  <span className="font-mono">{formatCurrency(totalEquity)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-accent/50">
              <CardContent className="pt-6">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Liabilities + Equity</span>
                  <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
