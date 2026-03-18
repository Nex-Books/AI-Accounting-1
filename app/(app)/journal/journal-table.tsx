'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatCurrency, formatDate } from '@/lib/format'
import type { JournalEntry } from '@/lib/types'
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  ArrowUpDown,
  ChevronLeft,
  Bot,
} from 'lucide-react'
import Link from 'next/link'

interface JournalTableProps {
  entries: JournalEntry[]
  canEdit: boolean
}

export function JournalTable({ entries, canEdit }: JournalTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState(searchParams.get('search') || '')

  // Calculate totals from lines for each entry
  const entriesWithTotals = useMemo(() => {
    return entries.map(entry => {
      const totalDebit = entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0
      const totalCredit = entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0
      return { ...entry, totalDebit, totalCredit }
    })
  }, [entries])

  const columns: ColumnDef<typeof entriesWithTotals[0]>[] = useMemo(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => (
          <CollapsibleTrigger asChild>
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
          </CollapsibleTrigger>
        ),
        size: 40,
      },
      {
        accessorKey: 'reference_number',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Reference
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium">{row.original.reference_number || '-'}</span>
            {row.original.created_by_ai && (
              <Badge variant="outline" className="text-xs gap-1 py-0">
                <Bot className="h-3 w-3" />
                AI
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.date, 'medium'),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="line-clamp-1">{row.original.description || '-'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'totalDebit',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatCurrency(row.original.totalDebit)}
          </div>
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
                <Link href={`/journal/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/journal/${row.original.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 50,
      },
    ],
    [canEdit]
  )

  const table = useReactTable({
    data: entriesWithTotals,
    columns,
    state: {
      expanded,
      sorting,
      globalFilter,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  // Update URL when filters change
  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/journal?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)
                updateFilters('search', e.target.value)
              }}
              className="pl-9"
            />
          </div>
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
                  <Collapsible key={row.id} asChild open={row.getIsExpanded()}>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={columns.length} className="p-0">
                            <JournalLinesDetail entry={row.original} />
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No journal entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {entries.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JournalLinesDetail({ entry }: { entry: JournalEntry & { totalDebit: number; totalCredit: number } }) {
  if (!entry.lines || entry.lines.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No line items
      </div>
    )
  }

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pb-2">Account</th>
            <th className="text-left font-medium pb-2">Party</th>
            <th className="text-left font-medium pb-2">Narration</th>
            <th className="text-right font-medium pb-2">Debit</th>
            <th className="text-right font-medium pb-2">Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((line) => (
            <tr key={line.id} className="border-t border-border/50">
              <td className="py-2">
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {line.account?.code}
                </span>
                {line.account?.name}
              </td>
              <td className="py-2 text-muted-foreground">
                {line.party?.name || '-'}
              </td>
              <td className="py-2 text-muted-foreground">
                {line.narration || '-'}
              </td>
              <td className="py-2 text-right font-mono">
                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
              </td>
              <td className="py-2 text-right font-mono">
                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border font-medium">
            <td colSpan={3} className="py-2">Total</td>
            <td className="py-2 text-right font-mono">
              {formatCurrency(entry.totalDebit)}
            </td>
            <td className="py-2 text-right font-mono">
              {formatCurrency(entry.totalCredit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
