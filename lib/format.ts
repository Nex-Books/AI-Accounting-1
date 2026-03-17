// Formatting utilities for ElevAIte Books

/**
 * Format a number as Indian currency (INR)
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean
    showSign?: boolean
    compact?: boolean
  }
): string {
  const { showSymbol = true, showSign = false, compact = false } = options || {}
  
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : (showSign && amount > 0 ? '+' : '')
  
  let formatted: string
  
  if (compact && absAmount >= 10000000) {
    // Crores
    formatted = (absAmount / 10000000).toFixed(2) + ' Cr'
  } else if (compact && absAmount >= 100000) {
    // Lakhs
    formatted = (absAmount / 100000).toFixed(2) + ' L'
  } else if (compact && absAmount >= 1000) {
    // Thousands
    formatted = (absAmount / 1000).toFixed(1) + 'K'
  } else {
    // Indian number formatting
    formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount)
  }
  
  const symbol = showSymbol ? '₹' : ''
  return `${sign}${symbol}${formatted}`
}

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'medium' | 'long' | 'iso' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    case 'medium':
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    case 'long':
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    case 'iso':
      return d.toISOString().split('T')[0]
    default:
      return d.toLocaleDateString('en-IN')
  }
}

/**
 * Format a datetime for display
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  options?: { decimals?: number; showSign?: boolean }
): string {
  const { decimals = 1, showSign = false } = options || {}
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get account type display name
 */
export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expenses',
  }
  return labels[type] || type
}

/**
 * Get account sub-type display name
 */
export function getAccountSubTypeLabel(subType: string): string {
  const labels: Record<string, string> = {
    current_asset: 'Current Assets',
    fixed_asset: 'Fixed Assets',
    other_asset: 'Other Assets',
    current_liability: 'Current Liabilities',
    long_term_liability: 'Long-term Liabilities',
    owner_equity: "Owner's Equity",
    retained_earnings: 'Retained Earnings',
    operating_revenue: 'Operating Revenue',
    other_revenue: 'Other Revenue',
    cost_of_goods: 'Cost of Goods Sold',
    operating_expense: 'Operating Expenses',
    other_expense: 'Other Expenses',
  }
  return labels[subType] || subType
}

/**
 * Get journal status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-warning/10 text-warning',
    posted: 'bg-success/10 text-success',
    voided: 'bg-destructive/10 text-destructive',
  }
  return colors[status] || 'bg-muted text-muted-foreground'
}

/**
 * Get party type label
 */
export function getPartyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    customer: 'Customer',
    vendor: 'Vendor',
    both: 'Customer & Vendor',
  }
  return labels[type] || type
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length - 3) + '...'
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d, 'short')
}
