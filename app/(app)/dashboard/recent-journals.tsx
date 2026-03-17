'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/format'
import type { JournalEntry } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

interface RecentJournalsProps {
  journals: JournalEntry[]
}

export function RecentJournals({ journals }: RecentJournalsProps) {
  if (journals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No journal entries yet. Create your first entry to get started.
            </p>
            <Button asChild>
              <Link href="/journal/new">Create Entry</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Journal Entries</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {journals.map((journal) => (
            <Link
              key={journal.id}
              href={`/journal/${journal.id}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {journal.entry_number}
                  </span>
                  <Badge variant="outline" className={getStatusColor(journal.status)}>
                    {journal.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {journal.narration || 'No narration'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(journal.total_debit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(journal.date, 'short')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
