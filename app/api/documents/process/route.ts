import { createClient } from '@/lib/supabase/server'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import * as XLSX from 'xlsx'

// Document processing API - extracts data from uploaded files
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const companyId = formData.get('companyId') as string
  const action = formData.get('action') as string || 'extract'

  if (!file || !companyId) {
    return Response.json({ error: 'Missing file or companyId' }, { status: 400 })
  }

  try {
    let extractedData: any = null
    let extractedText = ''

    // Process based on file type
    const fileName = file.name.toLowerCase()
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      // Excel/CSV processing
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      
      extractedData = {
        type: 'spreadsheet',
        sheetName,
        totalRows: jsonData.length,
        columns: jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [],
        sampleRows: jsonData.slice(0, 10),
        allRows: jsonData,
      }
      
      // Convert to text for AI analysis
      extractedText = `Spreadsheet: ${sheetName}\nColumns: ${extractedData.columns.join(', ')}\n\nData:\n`
      for (const row of jsonData.slice(0, 50)) {
        extractedText += JSON.stringify(row) + '\n'
      }
    } else if (fileName.endsWith('.pdf')) {
      // For PDF, we'll use a simple text extraction approach
      // In production, you'd use pdf-parse or a cloud OCR service
      extractedData = {
        type: 'pdf',
        fileName: file.name,
        size: file.size,
        message: 'PDF uploaded. For full text extraction, integrate with Google Document AI or AWS Textract.',
      }
      extractedText = `PDF Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    } else if (fileName.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      // For images, we need OCR
      extractedData = {
        type: 'image',
        fileName: file.name,
        size: file.size,
        message: 'Image uploaded. For text extraction, integrate with Google Vision API or AWS Textract.',
      }
      extractedText = `Image: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    } else {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Store document in database
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        company_id: companyId,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: file.size,
        storage_path: `documents/${companyId}/${Date.now()}_${file.name}`,
        uploaded_by: user.id,
        ocr_status: extractedData.type === 'spreadsheet' ? 'completed' : 'pending',
        ocr_extracted_data: extractedData,
      })
      .select('id')
      .single()

    if (docError) {
      return Response.json({ error: docError.message }, { status: 500 })
    }

    // If spreadsheet with transaction-like data, analyze with AI
    if (extractedData.type === 'spreadsheet' && action === 'analyze') {
      // Get company's accounts for matching
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, code, name, type')
        .eq('company_id', companyId)

      const accountsContext = (accounts || [])
        .map(a => `${a.code}: ${a.name} (${a.type})`)
        .join('\n')

      // Use AI to analyze and suggest journal entries
      const result = await streamText({
        model: 'openai/gpt-4o-mini',
        system: `You are an accounting assistant. Analyze the spreadsheet data and identify potential transactions.
For each transaction, suggest the appropriate journal entry with debit and credit accounts.

Company's Chart of Accounts:
${accountsContext}

Respond with a JSON array of suggested entries in this format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "...",
      "amount": 1000,
      "debitAccount": "account_code",
      "creditAccount": "account_code",
      "confidence": 0.95
    }
  ],
  "summary": "Brief summary of what was found"
}`,
        prompt: `Analyze this spreadsheet data and identify transactions:\n\n${extractedText}`,
      })

      const aiResponse = await result.text

      // Try to parse AI suggestions
      let suggestions = null
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0])
        }
      } catch {
        suggestions = { raw: aiResponse }
      }

      return Response.json({
        success: true,
        documentId: doc.id,
        extractedData,
        suggestions,
      })
    }

    return Response.json({
      success: true,
      documentId: doc.id,
      extractedData,
      message: extractedData.type === 'spreadsheet' 
        ? `Found ${extractedData.totalRows} rows with columns: ${extractedData.columns.join(', ')}`
        : `Document uploaded successfully. ${extractedData.message}`,
    })

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
