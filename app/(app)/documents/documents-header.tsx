'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Grid3X3, List } from 'lucide-react'

export function DocumentsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-muted-foreground">
          Upload and manage invoices, receipts, and other documents
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/documents/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>
    </div>
  )
}
