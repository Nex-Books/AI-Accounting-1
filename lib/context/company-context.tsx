"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Company {
  id: string
  name: string
  slug: string
  gst_number: string | null
  pan_number: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  financial_year_start: number
  currency: string
  plan: "free" | "starter" | "professional" | "enterprise"
  plan_limits: {
    max_users: number
    max_journal_entries: number
    max_ai_queries_per_month: number
    max_documents: number
  }
  onboarding_completed: boolean
  created_at: string
}

export interface CompanyUser {
  id: string
  user_id: string
  company_id: string
  role: "owner" | "admin" | "accountant" | "viewer"
  is_active: boolean
  created_at: string
  email: string
  full_name: string | null
}

interface CompanyContextType {
  company: Company | null
  companyUser: CompanyUser | null
  isLoading: boolean
  error: string | null
  refreshCompany: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({
  children,
  initialCompanySlug,
}: {
  children: ReactNode
  initialCompanySlug?: string | null
}) {
  const [company, setCompany] = useState<Company | null>(null)
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCompany(null)
        setCompanyUser(null)
        setIsLoading(false)
        return
      }

      // If we have a slug, fetch that specific company
      if (initialCompanySlug) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("slug", initialCompanySlug)
          .single()

        if (companyError) {
          setError("Company not found")
          setIsLoading(false)
          return
        }

        // Check if user has access to this company
        const { data: userCompany, error: userCompanyError } = await supabase
          .from("company_users")
          .select(`
            *,
            users:user_id (
              email,
              full_name
            )
          `)
          .eq("company_id", companyData.id)
          .eq("user_id", user.id)
          .single()

        if (userCompanyError) {
          setError("You don't have access to this company")
          setIsLoading(false)
          return
        }

        setCompany(companyData)
        setCompanyUser({
          ...userCompany,
          email: userCompany.users?.email || user.email || "",
          full_name: userCompany.users?.full_name || null,
        })
      } else {
        // No slug - get user's primary company
        const { data: userCompanies, error: userCompaniesError } = await supabase
          .from("company_users")
          .select(`
            *,
            companies (*),
            users:user_id (
              email,
              full_name
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1)

        if (userCompaniesError || !userCompanies?.length) {
          // No company yet - user needs onboarding
          setCompany(null)
          setCompanyUser(null)
          setIsLoading(false)
          return
        }

        const firstCompany = userCompanies[0]
        setCompany(firstCompany.companies as unknown as Company)
        setCompanyUser({
          ...firstCompany,
          email: firstCompany.users?.email || user.email || "",
          full_name: firstCompany.users?.full_name || null,
        })
      }

      setIsLoading(false)
    } catch (err) {
      setError("Failed to load company data")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyData()
  }, [initialCompanySlug])

  return (
    <CompanyContext.Provider
      value={{
        company,
        companyUser,
        isLoading,
        error,
        refreshCompany: fetchCompanyData,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
