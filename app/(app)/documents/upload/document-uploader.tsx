'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Upload, X, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/format'
import type { DocumentType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DocumentUploaderProps {
  companyId: string
  userId: string
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function DocumentUploader({ companyId, userId }: DocumentUploaderProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('invoice')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload a PDF, JPEG, PNG, or WebP file.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 10MB.'
    }
    return null
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const validationError = validateFile(droppedFile)
      if (validationError) {
        setError(validationError)
        return
      }
      setFile(droppedFile)
    }
  }, [validateFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }
      setFile(selectedFile)
    }
  }, [validateFile])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const supabase = createClient()

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const filePath = `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      setUploadProgress(20)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setUploadProgress(60)

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          type: documentType,
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          ocr_status: 'pending',
          uploaded_by: userId,
        })

      if (dbError) {
        // Clean up uploaded file
        await supabase.storage.from('documents').remove([filePath])
        throw new Error(dbError.message)
      }

      setUploadProgress(100)
      toast.success('Document uploaded successfully')
      
      // Redirect to documents page
      setTimeout(() => {
        router.push('/documents')
        router.refresh()
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop Zone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          dragActive && 'border-accent bg-accent/5',
          file && 'border-success bg-success/5'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          {file ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {uploading && uploadProgress === 100 && (
                <CheckCircle2 className="h-6 w-6 text-success" />
              )}
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-1">
                Drop your document here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <Input
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: PDF, JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Type */}
      <div className="space-y-2">
        <Label>Document Type</Label>
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as DocumentType)}
          disabled={uploading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="bill">Bill</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Spinner className="mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={uploading}
        >
          Cancel
        </Button>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Your document will be securely stored</li>
            <li>2. AI will extract relevant information (amounts, dates, parties)</li>
            <li>3. You can link the document to journal entries</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
