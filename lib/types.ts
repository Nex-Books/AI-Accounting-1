// Database types for ElevAIte Books

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type AccountSubType = 
  | 'current_asset' | 'fixed_asset' | 'other_asset'
  | 'current_liability' | 'long_term_liability'
  | 'owner_equity' | 'retained_earnings'
  | 'operating_revenue' | 'other_revenue'
  | 'cost_of_goods' | 'operating_expense' | 'other_expense'

export type UserRole = 'owner' | 'accountant' | 'viewer'
export type PlanTier = 'essentials' | 'professional' | 'enterprise'
export type JournalStatus = 'draft' | 'posted' | 'voided'
export type PartyType = 'customer' | 'vendor' | 'both'
export type DocumentType = 'invoice' | 'receipt' | 'bill' | 'contract' | 'other'

export interface Company {
  id: string
  name: string
  slug: string
  gstin: string | null
  pan: string | null
  address: string | null
  business_type: string | null
  fiscal_year_start: string | null
  base_currency: string
  plan: PlanTier
  plan_status: string | null
  razorpay_subscription_id: string | null
  ai_queries_used_month: number
  ai_transactions_used_month: number
  docs_uploaded_month: number
  storage_used_bytes: number
  created_at: string
}

export interface User {
  id: string
  company_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  company_id: string
  code: string
  name: string
  type: AccountType
  sub_type: AccountSubType
  parent_id: string | null
  description: string | null
  is_active: boolean
  is_system: boolean
  opening_balance: number
  current_balance: number
  created_at: string
  updated_at: string
  // Computed for tree view
  children?: Account[]
  level?: number
}

export interface JournalEntry {
  id: string
  company_id: string
  reference_number: string | null
  date: string
  description: string | null
  document_id: string | null
  is_opening_balance: boolean
  created_by_ai: boolean
  created_by: string
  created_at: string
  // Relations
  lines?: JournalLine[]
  creator?: User
}

export interface JournalLine {
  id: string
  journal_entry_id: string
  company_id: string
  account_id: string
  party_id: string | null
  debit: number
  credit: number
  narration: string | null
  created_at: string
  // Relations
  account?: Account
  party?: Party
}

export interface Party {
  id: string
  company_id: string
  type: PartyType
  name: string
  gstin: string | null
  pan: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  opening_balance: number
  current_balance: number
  credit_limit: number | null
  credit_days: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  company_id: string
  file_name: string
  file_type: string | null
  file_size_bytes: number
  storage_path: string
  journal_entry_id: string | null
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed' | null
  ocr_extracted_data: Record<string, unknown> | null
  uploaded_by: string
  uploaded_at: string
  // Relations
  journal_entry?: JournalEntry
}

export interface ChatMessage {
  id: string
  company_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string
  user_id: string | null
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Invitation {
  id: string
  company_id: string
  email: string
  role: UserRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// View types
export interface TrialBalanceRow {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  opening_balance: number
  total_debit: number
  total_credit: number
  closing_balance: number
}

export interface LedgerRow {
  date: string
  entry_number: string
  narration: string | null
  debit: number
  credit: number
  running_balance: number
  journal_entry_id: string
}

export interface BalanceSheetRow {
  category: string
  account_type: AccountType
  account_name: string
  amount: number
}

export interface ProfitLossRow {
  category: 'revenue' | 'expense'
  account_name: string
  amount: number
}

export interface AgingRow {
  party_id: string
  party_name: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  over_90: number
  total: number
}

export interface DashboardKPIs {
  total_revenue: number
  total_expenses: number
  net_income: number
  total_receivables: number
  total_payables: number
  cash_balance: number
  revenue_growth: number
  expense_growth: number
}

// Form types
export interface JournalEntryForm {
  date: string
  reference?: string
  narration?: string
  lines: {
    account_id: string
    party_id?: string
    debit: number
    credit: number
    description?: string
  }[]
}

export interface AccountForm {
  code: string
  name: string
  type: AccountType
  sub_type: AccountSubType
  parent_id?: string
  description?: string
  opening_balance?: number
}

export interface PartyForm {
  type: PartyType
  name: string
  gstin?: string
  pan?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  opening_balance?: number
  credit_limit?: number
  credit_days?: number
}

// Company context
export interface CompanyContext {
  company: Company
  user: User
  isOwner: boolean
  isAccountant: boolean
  canEdit: boolean
}

// Plan limits configuration
export const PLAN_LIMITS: Record<PlanTier, {
  transactions: number   // AI transactions per month
  queries: number        // AI chat queries per month
  documents: number      // Document uploads per month
  storageBytes: number   // Storage in bytes
  users: number          // Team members
  price: number          // Monthly price in INR
  name: string           // Display name
}> = {
  essentials: {
    transactions: 200,
    queries: 50,
    documents: 50,
    storageBytes: 1073741824, // 1 GB
    users: 2,
    price: 2999,
    name: 'Essentials',
  },
  professional: {
    transactions: 1000,
    queries: 200,
    documents: 300,
    storageBytes: 5368709120, // 5 GB
    users: 5,
    price: 6999,
    name: 'Professional',
  },
  enterprise: {
    transactions: 3000,
    queries: 500,
    documents: 1000,
    storageBytes: 26843545600, // 25 GB
    users: 15,
    price: 13999,
    name: 'Enterprise',
  },
}
