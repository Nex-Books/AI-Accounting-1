"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useCompany } from "@/lib/context/company-context"
import { Badge } from "@/components/ui/badge"

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "AI Accountant",
  "/journal": "Journal",
  "/journal/new": "New Entry",
  "/ledger": "Ledger",
  "/accounts": "Chart of Accounts",
  "/parties": "Parties",
  "/documents": "Documents",
  "/reports/trial-balance": "Trial Balance",
  "/reports/balance-sheet": "Balance Sheet",
  "/reports/profit-loss": "Profit & Loss",
  "/reports/ar-aging": "AR Aging",
  "/reports/ap-aging": "AP Aging",
  "/settings": "Settings",
  "/settings/company": "Company Settings",
  "/settings/profile": "Profile",
  "/settings/team": "Team",
  "/settings/billing": "Billing",
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = []

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1

    // Skip IDs in breadcrumbs
    if (segment.match(/^[0-9a-f-]{36}$/i)) {
      return
    }

    const label = routeTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath, isLast })
  })

  return breadcrumbs
}

export function AppHeader() {
  const pathname = usePathname()
  const { company } = useCompany()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-4">
        {company && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="capitalize">
              {company.plan}
            </Badge>
            {company.plan === "free" && (
              <span className="text-muted-foreground">
                {company.plan_limits.max_ai_queries_per_month - 0} AI queries left
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
