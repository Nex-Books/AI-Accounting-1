'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  DollarSign,
  FileSpreadsheet,
  Home,
  Sparkles,
  Upload,
  X,
  CheckCircle2,
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

type UploadedFile = { file: File; type: 'transactions' | 'bank_statement' }

export function OnboardingWizard({ userId, userEmail, userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null)

  // Step 1: Company details
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')

  // Step 2: Location and fiscal year
  const [state, setState] = useState('')
  const [address, setAddress] = useState('')
  const [fiscalYearStart, setFiscalYearStart] = useState('04-01')

  // Step 3: Opening balances
  const [openingCash, setOpeningCash] = useState('')
  const [openingBank, setOpeningBank] = useState('')
  const [openingReceivables, setOpeningReceivables] = useState('')
  const [openingPayables, setOpeningPayables] = useState('')

  // Step 4: File uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const transactionInputRef = useRef<HTMLInputElement>(null)
  const bankInputRef = useRef<HTMLInputElement>(null)

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
  }

  async function handleCreateCompany() {
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const slug = generateSlug(companyName)

      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug
      const fullAddress = [address, state].filter(Boolean).join(', ')

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

      if (companyError) throw new Error(companyError.message)

      // Upsert user — trigger may have already created the row without company_id
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          company_id: company.id,
          email: userEmail,
          full_name: userName || userEmail.split('@')[0],
          role: 'owner',
        }, { onConflict: 'id' })

      if (userError) throw new Error(userError.message)

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

      await supabase.from('accounts').insert(
        defaultAccounts.map(acc => ({
          ...acc,
          company_id: company.id,
          is_system: true,
          is_active: true,
          opening_balance: acc.opening_balance ?? 0,
        }))
      )

      setCreatedCompanyId(company.id)
      toast.success('Company created! Now upload your transaction data.')
      setStep(4)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create company'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function addFile(file: File, type: 'transactions' | 'bank_statement') {
    const allowed = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/pdf',
      'application/octet-stream',
    ]
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv', 'pdf'].includes(ext || '')) {
      toast.error('Only Excel (.xlsx, .xls), CSV, and PDF files are supported')
      return
    }
    setUploadedFiles(prev => {
      const filtered = prev.filter(f => f.type !== type)
      return [...filtered, { file, type }]
    })
  }

  function handleDrop(e: React.DragEvent, type: 'transactions' | 'bank_statement') {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) addFile(file, type)
  }

  async function handleUploadAndFinish() {
    if (uploadedFiles.length === 0) {
      // Skip upload, go to dashboard
      router.push('/dashboard')
      return
    }

    setUploadingFiles(true)
    try {
      const supabase = createClient()

      for (const { file, type } of uploadedFiles) {
        const path = `${createdCompanyId}/${type}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file)

        if (!uploadError) {
          await supabase.from('documents').insert({
            company_id: createdCompanyId,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size_bytes: file.size,
            storage_path: path,
            uploaded_by: userId,
            ocr_status: 'pending',
          })
        }
      }

      toast.success('Files uploaded! AI will analyse them shortly.')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Upload failed, but your company is created. You can upload files later.')
      router.push('/dashboard')
    } finally {
      setUploadingFiles(false)
    }
  }

  const totalSteps = 4

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
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
                {step === 4 && <FileSpreadsheet className="h-6 w-6 text-accent" />}
              </div>
            </div>
            <CardTitle className="text-xl">
              {step === 1 && 'Company Details'}
              {step === 2 && 'Location & Fiscal Year'}
              {step === 3 && 'Opening Balances'}
              {step === 4 && 'Import Your Data'}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's set up your company to get started"}
              {step === 2 && 'Where is your business located?'}
              {step === 3 && 'Enter your initial financial position (optional)'}
              {step === 4 && 'Upload your existing transactions for AI analysis (optional)'}
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
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input id="gstin" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    <Input id="pan" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="AAAAA0000A" maxLength={10} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setError(null); setStep(2) }} disabled={!companyName.trim()}>
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Location & Fiscal Year */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address, city" />
                </div>
                <div className="space-y-2">
                  <Label>Financial Year Start</Label>
                  <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="04-01">April 1 (Standard for India)</SelectItem>
                      <SelectItem value="01-01">January 1</SelectItem>
                      <SelectItem value="07-01">July 1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Most Indian businesses use April 1 - March 31</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button className="flex-1" onClick={() => { setError(null); setStep(3) }}>Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {/* Step 3: Opening Balances */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-lg p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Quick Start</p>
                    <p className="text-muted-foreground">Enter your current balances for accurate financials. You can skip and add later.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: 'openingCash', label: 'Cash in Hand', value: openingCash, set: setOpeningCash },
                    { id: 'openingBank', label: 'Bank Balance', value: openingBank, set: setOpeningBank },
                    { id: 'openingReceivables', label: 'Accounts Receivable', value: openingReceivables, set: setOpeningReceivables, hint: 'Amount customers owe you' },
                    { id: 'openingPayables', label: 'Accounts Payable', value: openingPayables, set: setOpeningPayables, hint: 'Amount you owe suppliers' },
                  ].map(f => (
                    <div key={f.id} className="space-y-1">
                      <Label htmlFor={f.id}>{f.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                        <Input id={f.id} type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder="0.00" className="pl-7" min="0" step="0.01" />
                      </div>
                      {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={isLoading}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                  <Button className="flex-1" onClick={handleCreateCompany} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Company'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Import Data */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">Company created successfully!</p>
                    <p className="text-muted-foreground mt-1">
                      Optionally upload your transaction history. Our AI will analyse it and create journal entries automatically.
                    </p>
                  </div>
                </div>

                {/* Transaction file upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Transaction History
                    <span className="text-xs text-muted-foreground font-normal">(Excel, CSV)</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => handleDrop(e, 'transactions')}
                    onClick={() => transactionInputRef.current?.click()}
                  >
                    {uploadedFiles.find(f => f.type === 'transactions') ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{uploadedFiles.find(f => f.type === 'transactions')?.file.name}</span>
                        <button onClick={e => { e.stopPropagation(); setUploadedFiles(p => p.filter(f => f.type !== 'transactions')) }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Drop your Excel/CSV file here or click to browse</p>
                        <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv</p>
                      </div>
                    )}
                    <input ref={transactionInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) addFile(e.target.files[0], 'transactions') }} />
                  </div>
                </div>

                {/* Bank statement upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Bank Statement
                    <span className="text-xs text-muted-foreground font-normal">(PDF, Excel, CSV — optional)</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => handleDrop(e, 'bank_statement')}
                    onClick={() => bankInputRef.current?.click()}
                  >
                    {uploadedFiles.find(f => f.type === 'bank_statement') ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{uploadedFiles.find(f => f.type === 'bank_statement')?.file.name}</span>
                        <button onClick={e => { e.stopPropagation(); setUploadedFiles(p => p.filter(f => f.type !== 'bank_statement')) }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Drop your bank statement here or click to browse</p>
                        <p className="text-xs text-muted-foreground">Supports .pdf, .xlsx, .csv</p>
                      </div>
                    )}
                    <input ref={bankInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) addFile(e.target.files[0], 'bank_statement') }} />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')} disabled={uploadingFiles}>
                    Skip for now
                  </Button>
                  <Button className="flex-1" onClick={handleUploadAndFinish} disabled={uploadingFiles}>
                    {uploadingFiles ? 'Uploading...' : uploadedFiles.length > 0 ? `Upload & Continue` : 'Go to Dashboard'}
                  </Button>
                </div>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${i + 1 === step ? 'w-6 bg-accent' : i + 1 < step ? 'w-2 bg-accent/50' : 'w-2 bg-muted-foreground/20'}`}
                />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">Step {step} of {totalSteps}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
