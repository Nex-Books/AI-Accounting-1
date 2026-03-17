'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Plus, Trash2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import type { Account, Party, JournalEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

interface JournalEntryFormProps {
  accounts: Account[]
  parties: Party[]
  companyId: string
  userId: string
  nextEntryNumber: string
  entry?: JournalEntry
}

interface JournalLineInput {
  id: string
  account_id: string
  party_id: string
  debit: string
  credit: string
  description: string
}

const emptyLine = (): JournalLineInput => ({
  id: crypto.randomUUID(),
  account_id: '',
  party_id: '',
  debit: '',
  credit: '',
  description: '',
})

export function JournalEntryForm({ 
  accounts, 
  parties, 
  companyId, 
  userId,
  nextEntryNumber,
  entry 
}: JournalEntryFormProps) {
  const router = useRouter()
  const isEditing = !!entry
  
  const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState(entry?.reference || '')
  const [narration, setNarration] = useState(entry?.narration || '')
  const [lines, setLines] = useState<JournalLineInput[]>(
    entry?.lines?.map(l => ({
      id: l.id,
      account_id: l.account_id,
      party_id: l.party_id || '',
      debit: l.debit > 0 ? l.debit.toString() : '',
      credit: l.credit > 0 ? l.credit.toString() : '',
      description: l.description || '',
    })) || [emptyLine(), emptyLine()]
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate totals
  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const addLine = useCallback(() => {
    setLines(prev => [...prev, emptyLine()])
  }, [])

  const removeLine = useCallback((id: string) => {
    setLines(prev => prev.filter(l => l.id !== id))
  }, [])

  const updateLine = useCallback((id: string, field: keyof JournalLineInput, value: string) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l
      
      // If entering debit, clear credit and vice versa
      if (field === 'debit' && value) {
        return { ...l, debit: value, credit: '' }
      }
      if (field === 'credit' && value) {
        return { ...l, credit: value, debit: '' }
      }
      
      return { ...l, [field]: value }
    }))
  }, [])

  async function handleSubmit(status: 'draft' | 'posted') {
    setError(null)
    
    // Validation
    if (!date) {
      setError('Date is required')
      return
    }
    
    const validLines = lines.filter(l => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
    if (validLines.length < 2) {
      setError('At least two line items are required')
      return
    }
    
    if (!isBalanced) {
      setError('Debits must equal credits')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Create/update journal entry
      const entryData = {
        company_id: companyId,
        entry_number: isEditing ? entry.entry_number : nextEntryNumber,
        date,
        reference: reference || null,
        narration: narration || null,
        status,
        total_debit: totalDebit,
        total_credit: totalCredit,
        created_by: userId,
      }

      let entryId = entry?.id

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', entry.id)
        
        if (updateError) throw updateError

        // Delete existing lines
        await supabase
          .from('journal_lines')
          .delete()
          .eq('journal_entry_id', entry.id)
      } else {
        const { data: newEntry, error: insertError } = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select('id')
          .single()
        
        if (insertError) throw insertError
        entryId = newEntry.id
      }

      // Insert lines
      const linesData = validLines.map(l => ({
        journal_entry_id: entryId,
        account_id: l.account_id,
        party_id: l.party_id || null,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description || null,
      }))

      const { error: linesError } = await supabase
        .from('journal_lines')
        .insert(linesData)
      
      if (linesError) throw linesError

      toast.success(
        status === 'posted' 
          ? 'Journal entry posted successfully' 
          : 'Journal entry saved as draft'
      )
      
      router.push('/journal')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save journal entry'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Group accounts by type for better UX
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type
    if (!acc[type]) acc[type] = []
    acc[type].push(account)
    return acc
  }, {} as Record<string, Account[]>)

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="entryNumber">Entry Number</Label>
              <Input
                id="entryNumber"
                value={isEditing ? entry.entry_number : nextEntryNumber}
                disabled
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Invoice #, Bill #, etc."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Description of this transaction..."
              rows={2}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
              <div className="col-span-3">Account</div>
              <div className="col-span-2">Party</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
            </div>

            {/* Lines */}
            {lines.map((line, index) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <Select
                    value={line.account_id}
                    onValueChange={(value) => updateLine(line.id, 'account_id', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedAccounts).map(([type, accts]) => (
                        <div key={type}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                            {type}
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

                <div className="col-span-2">
                  <Select
                    value={line.party_id}
                    onValueChange={(value) => updateLine(line.id, 'party_id', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {parties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    placeholder="Line description"
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.debit}
                    onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                    placeholder="0.00"
                    className="text-right font-mono"
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.credit}
                    onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                    placeholder="0.00"
                    className="text-right font-mono flex-1"
                    disabled={isLoading}
                  />
                  {lines.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeLine(line.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="grid grid-cols-12 gap-2 pt-3 border-t mt-4">
              <div className="col-span-8 text-right font-medium">Totals:</div>
              <div className={cn(
                "col-span-2 text-right font-mono font-medium",
                !isBalanced && "text-destructive"
              )}>
                {formatCurrency(totalDebit)}
              </div>
              <div className={cn(
                "col-span-2 text-right font-mono font-medium",
                !isBalanced && "text-destructive"
              )}>
                {formatCurrency(totalCredit)}
              </div>
            </div>

            {!isBalanced && totalDebit > 0 && (
              <p className="text-sm text-destructive text-right">
                Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleSubmit('draft')}
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit('posted')}
          disabled={isLoading || !isBalanced}
        >
          {isLoading ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
          Post Entry
        </Button>
      </div>
    </div>
  )
}
