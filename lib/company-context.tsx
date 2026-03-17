'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Company, User, CompanyContext as CompanyContextType } from './types'

const CompanyContext = createContext<CompanyContextType | null>(null)

interface CompanyProviderProps {
  children: ReactNode
  company: Company
  user: User
}

export function CompanyProvider({ children, company, user }: CompanyProviderProps) {
  const isOwner = user.role === 'owner'
  const isAccountant = user.role === 'accountant'
  const canEdit = isOwner || isAccountant

  const value: CompanyContextType = {
    company,
    user,
    isOwner,
    isAccountant,
    canEdit,
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany(): CompanyContextType {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export function useCompanyOptional(): CompanyContextType | null {
  return useContext(CompanyContext)
}
