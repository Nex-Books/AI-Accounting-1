import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const companyId = formData.get('companyId') as string
  const documentId = formData.get('documentId') as string | null

  if (!file || !companyId) {
    return Response.json({ error: 'Missing file or companyId' }, { status: 400 })
  }

  try {
    const fileName = file.name.toLowerCase()
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let extractedData: Record<string, unknown> | null = null

    // Excel/CSV processing
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      
      extractedData = {
        type: 'spreadsheet',
        sheetName,
        totalRows: jsonData.length,
        columns: jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [],
        rows: jsonData,
      }
    }
    // PDF and Image processing with OpenAI Vision
    else if (fileName.endsWith('.pdf') || fileName.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      const base64 = fileBuffer.toString('base64')
      
      let mediaType = 'image/png'
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mediaType = 'image/jpeg'
      else if (fileName.endsWith('.gif')) mediaType = 'image/gif'
      else if (fileName.endsWith('.webp')) mediaType = 'image/webp'
      else if (fileName.endsWith('.pdf')) mediaType = 'application/pdf'

      const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      try {
        const ocrResponse = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mediaType};base64,${base64}` }
              },
              {
                type: 'text',
                text: `Extract from this invoice or receipt. Return ONLY a valid JSON object with keys: vendor (string), date (YYYY-MM-DD string), invoice_number (string or null), total (number), subtotal (number or null), tax (number or null), tax_rate (string or null), currency (default INR), line_items (array of objects with description, quantity, unit_price, amount), payment_mode (string or null). Use null for any field not found.`
              }
            ]
          }]
        })

        const content = ocrResponse.choices[0]?.message?.content || '{}'
        
        // Parse the JSON response
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0])
          } else {
            extractedData = { raw: content, parseError: true }
          }
        } catch {
          extractedData = { raw: content, parseError: true }
        }

        // Update document status if documentId provided
        if (documentId) {
          await supabase
            .from('documents')
            .update({ 
              ocr_extracted_data: extractedData, 
              ocr_status: 'completed' 
            })
            .eq('id', documentId)
            .eq('company_id', companyId)
        }
      } catch (ocrError: unknown) {
        const errorMessage = ocrError instanceof Error ? ocrError.message : 'OCR failed'
        
        if (documentId) {
          await supabase
            .from('documents')
            .update({ ocr_status: 'failed' })
            .eq('id', documentId)
            .eq('company_id', companyId)
        }
        
        return Response.json({ error: errorMessage, ocrFailed: true }, { status: 500 })
      }
    } else {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Store document if not already stored
    if (!documentId) {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          storage_path: `documents/${companyId}/${Date.now()}_${file.name}`,
          uploaded_by: user.id,
          ocr_status: extractedData ? 'completed' : 'pending',
          ocr_extracted_data: extractedData,
        })
        .select('id')
        .single()

      if (docError) {
        return Response.json({ error: docError.message }, { status: 500 })
      }

      return Response.json({
        success: true,
        documentId: doc.id,
        extractedData,
      })
    }

    return Response.json({
      success: true,
      documentId,
      extractedData,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
