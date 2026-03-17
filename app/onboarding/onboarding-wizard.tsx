'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import { AlertCircle, Building2, Calendar, ChevronRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingWizardProps {
  userId: string
  userEmail: string
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
]

export function OnboardingWizard({ userId, userEmail }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [companyName, setCompanyName] = useState('')
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [financialYearStart, setFinancialYearStart] = useState('04-01')

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
  }

  async function handleSubmit() {
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const slug = generateSlug(companyName)

      // Check if slug is unique
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single()

      const finalSlug = existingCompany 
        ? `${slug}-${Date.now().toString(36)}`
        : slug

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug: finalSlug,
          gstin: gstin || null,
          pan: pan || null,
          state: state || null,
          city: city || null,
          financial_year_start: financialYearStart,
          plan: 'free',
          ai_queries_limit: 50,
        })
        .select('id')
        .single()

      if (companyError) throw companyError

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          company_id: company.id,
          email: userEmail,
          role: 'owner',
        })

      if (userError) throw userError

      // Seed default chart of accounts
      // This would typically be done via a database function or trigger
      // For now, we'll insert some basic accounts
      const defaultAccounts = [
        { code: '1000', name: 'Cash in Hand', type: 'asset', sub_type: 'current_asset' },
        { code: '1010', name: 'Bank Account', type: 'asset', sub_type: 'current_asset' },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', sub_type: 'current_asset' },
        { code: '2000', name: 'Accounts Payable', type: 'liability', sub_type: 'current_liability' },
        { code: '2100', name: 'GST Payable', type: 'liability', sub_type: 'current_liability' },
        { code: '3000', name: "Owner's Capital", type: 'equity', sub_type: 'owner_equity' },
        { code: '4000', name: 'Sales Revenue', type: 'revenue', sub_type: 'operating_revenue' },
        { code: '4100', name: 'Service Revenue', type: 'revenue', sub_type: 'operating_revenue' },
        { code: '5000', name: 'Purchases', type: 'expense', sub_type: 'cost_of_goods' },
        { code: '6000', name: 'Rent Expense', type: 'expense', sub_type: 'operating_expense' },
        { code: '6100', name: 'Salary Expense', type: 'expense', sub_type: 'operating_expense' },
        { code: '6200', name: 'Utilities Expense', type: 'expense', sub_type: 'operating_expense' },
      ]

      await supabase.from('accounts').insert(
        defaultAccounts.map(acc => ({
          ...acc,
          company_id: company.id,
          is_system: true,
        }))
      )

      toast.success('Company created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create company'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle>Welcome to ElevAIte Books</CardTitle>
        <CardDescription>
          {step === 1 
            ? "Let's set up your company to get started"
            : 'Just a few more details'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Business Name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pan">PAN (Optional)</Label>
              <Input
                id="pan"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AAAAA0000A"
                maxLength={10}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={() => setStep(2)}
              disabled={!companyName.trim()}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fyStart">Financial Year Start</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={financialYearStart} onValueChange={setFinancialYearStart}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="04-01">April 1 (Standard for India)</SelectItem>
                    <SelectItem value="01-01">January 1</SelectItem>
                    <SelectItem value="07-01">July 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">AI-Powered Setup</p>
                <p className="text-muted-foreground">
                  {"We'll create a standard Indian chart of accounts and configure GST settings for you."}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Company'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-muted'}`} />
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-muted'}`} />
        </div>
      </CardContent>
    </Card>
  )
}
