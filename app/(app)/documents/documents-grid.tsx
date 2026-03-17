'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatFileSize, formatDate, getRelativeTime } from '@/lib/format'
import type { Document, DocumentType } from '@/lib/types'
import { 
  Search, 
  FileText, 
  Receipt, 
  FileImage,
  MoreVertical,
  Download,
  Trash2,
  Link as LinkIcon,
  Eye,
  Bot,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DocumentsGridProps {
  documents: Document[]
  companyId: string
  userId: string
}

const documentTypeIcons: Record<DocumentType, typeof FileText> = {
  invoice: FileText,
  receipt: Receipt,
  bill: FileText,
  contract: FileText,
  other: FileImage,
}

const ocrStatusConfig = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
  processing: { icon: Bot, color: 'text-warning', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'text-success', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
}

export function DocumentsGrid({ documents, companyId, userId }: DocumentsGridProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as DocumentType | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="bill">Bills</SelectItem>
            <SelectItem value="contract">Contracts</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              document={doc} 
              onClick={() => setSelectedDocument(doc)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {documents.length === 0
                ? "You haven't uploaded any documents yet. Start by uploading invoices, receipts, or other financial documents."
                : 'No documents match your search criteria.'}
            </p>
            {documents.length === 0 && (
              <Button asChild>
                <Link href="/documents/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <DocumentPreview document={selectedDocument} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocumentCard({ 
  document, 
  onClick 
}: { 
  document: Document
  onClick: () => void 
}) {
  const Icon = documentTypeIcons[document.type] || FileText
  const OcrIcon = ocrStatusConfig[document.ocr_status].icon
  const ocrColor = ocrStatusConfig[document.ocr_status].color

  return (
    <Card 
      className="group cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            'bg-muted group-hover:bg-accent/10 transition-colors'
          )}>
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {document.journal_entry && (
                <DropdownMenuItem asChild>
                  <Link href={`/journal/${document.journal_entry.id}`}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    View Entry
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-medium truncate mb-1" title={document.name}>
          {document.name}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>{formatFileSize(document.file_size)}</span>
          <span>•</span>
          <span>{getRelativeTime(document.created_at)}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs capitalize">
            {document.type}
          </Badge>
          <div className="flex items-center gap-1">
            <OcrIcon className={cn('h-3.5 w-3.5', ocrColor)} />
            <span className={cn('text-xs', ocrColor)}>
              {ocrStatusConfig[document.ocr_status].label}
            </span>
          </div>
        </div>

        {document.party && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            Party: {document.party.name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DocumentPreview({ document }: { document: Document }) {
  const isImage = document.mime_type.startsWith('image/')
  const isPDF = document.mime_type === 'application/pdf'

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="bg-muted rounded-lg p-4 min-h-[300px] flex items-center justify-center">
        {isImage ? (
          <p className="text-muted-foreground">Image preview placeholder</p>
        ) : isPDF ? (
          <p className="text-muted-foreground">PDF preview placeholder</p>
        ) : (
          <FileText className="h-16 w-16 text-muted-foreground/50" />
        )}
      </div>

      {/* Details */}
      <div className="grid gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span className="capitalize">{document.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Size</span>
          <span>{formatFileSize(document.file_size)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uploaded</span>
          <span>{formatDate(document.created_at, 'medium')}</span>
        </div>
        {document.party && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Party</span>
            <span>{document.party.name}</span>
          </div>
        )}
        {document.journal_entry && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Journal Entry</span>
            <Link 
              href={`/journal/${document.journal_entry.id}`}
              className="text-accent hover:underline"
            >
              {document.journal_entry.entry_number}
            </Link>
          </div>
        )}
      </div>

      {/* OCR Data */}
      {document.ocr_status === 'completed' && document.ocr_data && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Extracted Data</h4>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-40">
            {JSON.stringify(document.ocr_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        {!document.journal_entry && (
          <Button className="flex-1">
            <LinkIcon className="mr-2 h-4 w-4" />
            Create Entry
          </Button>
        )}
      </div>
    </div>
  )
}
