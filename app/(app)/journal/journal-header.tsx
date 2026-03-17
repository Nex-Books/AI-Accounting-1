'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload } from 'lucide-react'

export function JournalHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Journal</h1>
        <p className="text-muted-foreground">
          Record and manage your journal entries
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button asChild>
          <Link href="/journal/new">
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Link>
        </Button>
      </div>
    </div>
  )
}
