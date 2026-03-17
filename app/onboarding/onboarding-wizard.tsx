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
import { 
  AlertCircle, 
  ArrowLeft, 
  Building2, 
  Calendar, 
  ChevronRight, 
  DollarSign,
  Home,
  Sparkles 
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface OnboardingWizardProps {
  userId: string
  userEmail: string
  userName?: string
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
]

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'trust', label: 'Trust / Society / NGO' },
  { value: 'other', label: 'Other' },
]

export function OnboardingWizard({ userId, userEmail, userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1: Company details
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  
  // Step 2: Location and fiscal year
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [fiscalYearStart, setFiscalYearStart] = useState('04-01')
  
  // Step 3: Initial financial details
  const [openingCash, setOpeningCash] = useState('')
  const [openingBank, setOpeningBank] = useState('')
  const [openingReceivables, setOpeningReceivables] = useState('')
  const [openingPayables, setOpeningPayables] = useState('')

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
        .maybeSingle()

      const finalSlug = existingCompany 
        ? `${slug}-${Date.now().toString(36)}`
        : slug

      // Build address string
      const fullAddress = [address, state].filter(Boolean).join(', ')

      // Create company - use only columns that exist in schema
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          slug: finalSlug,
          gstin: gstin || null,
          pan: pan || null,
          business_type: businessType || null,
          address: fullAddress || null,
          fiscal_year_start: fiscalYearStart,
          base_currency: 'INR',
          plan: 'free',
          plan_status: 'active',
        })
        .select('id')
        .single()

      if (companyError) {
        console.log('[v0] Company creation error:', companyError)
        throw companyError
      }

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          company_id: company.id,
          email: userEmail,
          full_name: userName || userEmail.split('@')[0],
          role: 'owner',
        })

      if (userError) {
        console.log('[v0] User creation error:', userError)
        throw userError
      }

      // Seed default chart of accounts
      const defaultAccounts = [
        { code: '1000', name: 'Cash in Hand', type: 'asset', sub_type: 'current_asset', opening_balance: parseFloat(openingCash) || 0 },
        { code: '1010', name: 'Bank Account', type: 'asset', sub_type: 'current_asset', opening_balance: parseFloat(openingBank) || 0 },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', sub_type: 'current_asset', opening_balance: parseFloat(openingReceivables) || 0 },
        { code: '1200', name: 'Inventory', type: 'asset', sub_type: 'current_asset' },
        { code: '1500', name: 'Fixed Assets', type: 'asset', sub_type: 'fixed_asset' },
        { code: '2000', name: 'Accounts Payable', type: 'liability', sub_type: 'current_liability', opening_balance: parseFloat(openingPayables) || 0 },
        { code: '2100', name: 'GST Payable - CGST', type: 'liability', sub_type: 'current_liability' },
        { code: '2110', name: 'GST Payable - SGST', type: 'liability', sub_type: 'current_liability' },
        { code: '2120', name: 'GST Payable - IGST', type: 'liability', sub_type: 'current_liability' },
        { code: '2200', name: 'TDS Payable', type: 'liability', sub_type: 'current_liability' },
        { code: '3000', name: "Owner's Capital", type: 'equity', sub_type: 'owner_equity' },
        { code: '3100', name: 'Retained Earnings', type: 'equity', sub_type: 'retained_earnings' },
        { code: '4000', name: 'Sales Revenue', type: 'revenue', sub_type: 'operating_revenue' },
        { code: '4100', name: 'Service Revenue', type: 'revenue', sub_type: 'operating_revenue' },
        { code: '4200', name: 'Other Income', type: 'revenue', sub_type: 'other_income' },
        { code: '5000', name: 'Purchases', type: 'expense', sub_type: 'cost_of_goods' },
        { code: '5100', name: 'Direct Expenses', type: 'expense', sub_type: 'cost_of_goods' },
        { code: '6000', name: 'Rent Expense', type: 'expense', sub_type: 'operating_expense' },
        { code: '6100', name: 'Salary & Wages', type: 'expense', sub_type: 'operating_expense' },
        { code: '6200', name: 'Utilities', type: 'expense', sub_type: 'operating_expense' },
        { code: '6300', name: 'Office Expenses', type: 'expense', sub_type: 'operating_expense' },
        { code: '6400', name: 'Professional Fees', type: 'expense', sub_type: 'operating_expense' },
        { code: '6500', name: 'Bank Charges', type: 'expense', sub_type: 'operating_expense' },
        { code: '6600', name: 'Depreciation', type: 'expense', sub_type: 'operating_expense' },
      ]

      const { error: accountsError } = await supabase.from('accounts').insert(
        defaultAccounts.map(acc => ({
          ...acc,
          company_id: company.id,
          is_system: true,
          is_active: true,
          opening_balance: acc.opening_balance || 0,
        }))
      )

      if (accountsError) {
        console.log('[v0] Accounts creation error:', accountsError)
        // Don't throw - accounts are not critical for initial setup
      }

      toast.success('Company created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create company'
      setError(message)
      console.log('[v0] Onboarding error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 3

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header with back to home */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                {step === 1 && <Building2 className="h-6 w-6 text-accent" />}
                {step === 2 && <Calendar className="h-6 w-6 text-accent" />}
                {step === 3 && <DollarSign className="h-6 w-6 text-accent" />}
              </div>
            </div>
            <CardTitle className="text-xl">
              {step === 1 && 'Company Details'}
              {step === 2 && 'Location & Fiscal Year'}
              {step === 3 && 'Opening Balances'}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's set up your company to get started"}
              {step === 2 && 'Where is your business located?'}
              {step === 3 && 'Enter your initial financial position (optional)'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Company Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Business Name"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    <Input
                      id="pan"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="AAAAA0000A"
                      maxLength={10}
                    />
                  </div>
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

            {/* Step 2: Location & Fiscal Year */}
            {step === 2 && (
              <div className="space-y-4">
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
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fyStart">Financial Year Start</Label>
                  <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="04-01">April 1 (Standard for India)</SelectItem>
                      <SelectItem value="01-01">January 1</SelectItem>
                      <SelectItem value="07-01">July 1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Most Indian businesses use April 1 - March 31
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Opening Balances */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Quick Start</p>
                    <p className="text-muted-foreground">
                      Enter your current balances to start with accurate financials. You can skip this and add them later.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openingCash">Cash in Hand</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="openingCash"
                        type="number"
                        value={openingCash}
                        onChange={(e) => setOpeningCash(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openingBank">Bank Balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="openingBank"
                        type="number"
                        value={openingBank}
                        onChange={(e) => setOpeningBank(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openingReceivables">Accounts Receivable</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="openingReceivables"
                        type="number"
                        value={openingReceivables}
                        onChange={(e) => setOpeningReceivables(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Amount customers owe you</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openingPayables">Accounts Payable</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="openingPayables"
                        type="number"
                        value={openingPayables}
                        onChange={(e) => setOpeningPayables(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Amount you owe suppliers</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
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
            <div className="flex justify-center items-center gap-2 pt-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i + 1 < step) setStep(i + 1)
                  }}
                  disabled={i + 1 > step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step > i ? 'bg-accent' : 'bg-muted'
                  } ${i + 1 < step ? 'cursor-pointer hover:bg-accent/80' : ''}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                Step {step} of {totalSteps}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
