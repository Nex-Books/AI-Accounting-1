'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, BookOpen, Upload, Users, FileText } from 'lucide-react'

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Quick Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/journal/new" className="cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            Journal Entry
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/documents/upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/parties/new" className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            Add Party
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/accounts/new" className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
