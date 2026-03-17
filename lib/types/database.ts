// Database types for ElevAIte Books

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense"
export type AccountSubType =
  | "current_asset"
  | "non_current_asset"
  | "current_liability"
  | "non_current_liability"
  | "equity"
  | "revenue"
  | "cost_of_goods_sold"
  | "operating_expense"
  | "other_income"
  | "other_expense"

export type PartyType = "customer" | "vendor" | "both"
export type JournalStatus = "draft" | "posted" | "void"
export type UserRole = "owner" | "admin" | "accountant" | "viewer"
export type PlanType = "free" | "starter" | "professional" | "enterprise"
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled"

export interface Account {
  id: string
  company_id: string
  code: string
  name: string
  account_type: AccountType
  account_sub_type: AccountSubType
  parent_id: string | null
  is_system: boolean
  is_active: boolean
  description: string | null
  opening_balance: number
  created_at: string
  updated_at: string
}

export interface Party {
  id: string
  company_id: string
  party_type: PartyType
  name: string
  email: string | null
  phone: string | null
  gst_number: string | null
  pan_number: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  credit_limit: number | null
  payment_terms: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  company_id: string
  entry_number: string
  entry_date: string
  narration: string | null
  reference: string | null
  status: JournalStatus
  source: string | null
  ai_generated: boolean
  document_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  lines?: JournalLine[]
}

export interface JournalLine {
  id: string
  journal_entry_id: string
  account_id: string
  party_id: string | null
  description: string | null
  debit: number
  credit: number
  created_at: string
  account?: Account
  party?: Party
}

export interface Document {
  id: string
  company_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  ocr_status: "pending" | "processing" | "completed" | "failed"
  ocr_data: Record<string, unknown> | null
  extracted_data: {
    vendor_name?: string
    invoice_number?: string
    invoice_date?: string
    total_amount?: number
    tax_amount?: number
    line_items?: Array<{
      description: string
      quantity?: number
      rate?: number
      amount: number
    }>
  } | null
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  company_id: string
  user_id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  tool_calls: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
    result?: unknown
  }> | null
  document_ids: string[] | null
  created_at: string
}

export interface AuditLog {
  id: string
  company_id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
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
  status: InvitationStatus
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
  debit_total: number
  credit_total: number
  balance: number
}

export interface BalanceSheetRow {
  account_id: string
  account_code: string
  account_name: string
  account_type: AccountType
  account_sub_type: AccountSubType
  balance: number
}

export interface ProfitLossRow {
  account_id: string
  account_code: string
  account_name: string
  account_type: "income" | "expense"
  account_sub_type: AccountSubType
  amount: number
}

export interface AgingRow {
  party_id: string
  party_name: string
  current: number
  days_30: number
  days_60: number
  days_90: number
  over_90: number
  total: number
}

export interface LedgerRow {
  entry_date: string
  entry_number: string
  narration: string | null
  debit: number
  credit: number
  running_balance: number
}

export interface DashboardKPIs {
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_income: number
  total_expenses: number
  net_income: number
  total_receivables: number
  total_payables: number
  cash_balance: number
  journal_entries_count: number
  ai_queries_used: number
}
