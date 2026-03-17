'use client'

import { useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Account, AccountType, AccountSubType } from '@/lib/types'

interface AccountFormProps {
  parentAccounts: Account[]
  companyId: string
  account?: Account
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
]

const subTypesByType: Record<AccountType, { value: AccountSubType; label: string }[]> = {
  asset: [
    { value: 'current_asset', label: 'Current Asset' },
    { value: 'fixed_asset', label: 'Fixed Asset' },
    { value: 'other_asset', label: 'Other Asset' },
  ],
  liability: [
    { value: 'current_liability', label: 'Current Liability' },
    { value: 'long_term_liability', label: 'Long-term Liability' },
  ],
  equity: [
    { value: 'owner_equity', label: "Owner's Equity" },
    { value: 'retained_earnings', label: 'Retained Earnings' },
  ],
  revenue: [
    { value: 'operating_revenue', label: 'Operating Revenue' },
    { value: 'other_revenue', label: 'Other Revenue' },
  ],
  expense: [
    { value: 'cost_of_goods', label: 'Cost of Goods Sold' },
    { value: 'operating_expense', label: 'Operating Expense' },
    { value: 'other_expense', label: 'Other Expense' },
  ],
}

export function AccountForm({ parentAccounts, companyId, account }: AccountFormProps) {
  const router = useRouter()
  const isEditing = !!account
  
  const [code, setCode] = useState(account?.code || '')
  const [name, setName] = useState(account?.name || '')
  const [type, setType] = useState<AccountType>(account?.type || 'asset')
  const [subType, setSubType] = useState<AccountSubType>(account?.sub_type || 'current_asset')
  const [parentId, setParentId] = useState<string>(account?.parent_id || '')
  const [description, setDescription] = useState(account?.description || '')
  const [openingBalance, setOpeningBalance] = useState(account?.opening_balance?.toString() || '0')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter parent accounts by type
  const filteredParents = parentAccounts.filter((a) => a.type === type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const accountData = {
        company_id: companyId,
        code,
        name,
        type,
        sub_type: subType,
        parent_id: parentId || null,
        description: description || null,
        opening_balance: parseFloat(openingBalance) || 0,
        current_balance: parseFloat(openingBalance) || 0,
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update(accountData)
          .eq('id', account.id)
        
        if (updateError) throw updateError
        toast.success('Account updated successfully')
      } else {
        const { error: insertError } = await supabase
          .from('accounts')
          .insert(accountData)
        
        if (insertError) throw insertError
        toast.success('Account created successfully')
      }

      router.push('/accounts')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save account'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Account Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., 1001"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cash in Hand"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as AccountType)
                  // Reset subtype to first option of new type
                  setSubType(subTypesByType[value as AccountType][0].value)
                  // Clear parent if type changed
                  setParentId('')
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subType">Sub Type *</Label>
              <Select
                value={subType}
                onValueChange={(value) => setSubType(value as AccountSubType)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subTypesByType[type].map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Account</Label>
              <Select
                value={parentId}
                onValueChange={setParentId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Top Level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {filteredParents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional parent for hierarchical structure
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingBalance">Opening Balance</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Balance as of financial year start
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this account..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Account' : 'Create Account'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
