'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
  type SortingState,
} from '@tanstack/react-table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, getAccountTypeLabel, getAccountSubTypeLabel } from '@/lib/format'
import type { Account, AccountType } from '@/lib/types'
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AccountsTableProps {
  accounts: Account[]
  canEdit: boolean
}

// Build tree structure from flat list
function buildAccountTree(accounts: Account[]): Account[] {
  const accountMap = new Map<string, Account>()
  const roots: Account[] = []

  // First pass: create map and add children array
  accounts.forEach((account) => {
    accountMap.set(account.id, { ...account, children: [], level: 0 })
  })

  // Second pass: build tree
  accounts.forEach((account) => {
    const node = accountMap.get(account.id)!
    if (account.parent_id && accountMap.has(account.parent_id)) {
      const parent = accountMap.get(account.parent_id)!
      node.level = (parent.level || 0) + 1
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort by code
  const sortByCode = (a: Account, b: Account) => a.code.localeCompare(b.code)
  const sortTree = (nodes: Account[]): Account[] => {
    nodes.sort(sortByCode)
    nodes.forEach((node) => {
      if (node.children?.length) {
        sortTree(node.children)
      }
    })
    return nodes
  }

  return sortTree(roots)
}

// Flatten tree for table display
function flattenTree(nodes: Account[], result: Account[] = []): Account[] {
  nodes.forEach((node) => {
    result.push(node)
    if (node.children?.length) {
      flattenTree(node.children, result)
    }
  })
  return result
}

export function AccountsTable({ accounts, canEdit }: AccountsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all')

  // Build tree and flatten
  const treeData = useMemo(() => {
    let filtered = accounts
    if (typeFilter !== 'all') {
      filtered = accounts.filter((a) => a.type === typeFilter)
    }
    return flattenTree(buildAccountTree(filtered))
  }, [accounts, typeFilter])

  const columns: ColumnDef<Account>[] = useMemo(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => {
          const hasChildren = row.original.children && row.original.children.length > 0
          if (!hasChildren) return null
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => row.toggleExpanded()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )
        },
        size: 40,
      },
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2 font-mono text-sm"
            style={{ paddingLeft: `${(row.original.level || 0) * 20}px` }}
          >
            {row.original.code}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Account Name',
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.name}</span>
            {row.original.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline" className={getTypeBadgeColor(row.original.type)}>
              {getAccountTypeLabel(row.original.type)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {getAccountSubTypeLabel(row.original.sub_type)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'current_balance',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-mr-4 ml-auto"
          >
            Balance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatCurrency(row.original.current_balance)}
          </div>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/ledger?account=${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Ledger
                </Link>
              </DropdownMenuItem>
              {canEdit && !row.original.is_system && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/accounts/${row.original.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 50,
      },
    ],
    [canEdit]
  )

  const table = useReactTable({
    data: treeData,
    columns,
    state: {
      expanded,
      sorting,
      globalFilter,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as AccountType | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="asset">Assets</SelectItem>
              <SelectItem value="liability">Liabilities</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      row.original.level && row.original.level > 0 && 'bg-muted/20'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {accounts.length} accounts
        </div>
      </CardContent>
    </Card>
  )
}

function getTypeBadgeColor(type: AccountType): string {
  const colors: Record<AccountType, string> = {
    asset: 'border-chart-1 text-chart-1',
    liability: 'border-chart-5 text-chart-5',
    equity: 'border-chart-3 text-chart-3',
    revenue: 'border-chart-2 text-chart-2',
    expense: 'border-chart-4 text-chart-4',
  }
  return colors[type] || ''
}
