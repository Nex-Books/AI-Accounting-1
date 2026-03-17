import { getCompanyContext } from '@/lib/server-utils'
import { redirect } from 'next/navigation'
import { DocumentUploader } from './document-uploader'

export const metadata = {
  title: 'Upload Document',
}

export default async function UploadDocumentPage() {
  const context = await getCompanyContext()
  if (!context) redirect('/auth/login')

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Upload Document</h1>
        <p className="text-muted-foreground">
          Upload invoices, receipts, or other financial documents for processing
        </p>
      </div>
      
      <DocumentUploader 
        companyId={context.company.id} 
        userId={context.user.id}
      />
    </div>
  )
}
