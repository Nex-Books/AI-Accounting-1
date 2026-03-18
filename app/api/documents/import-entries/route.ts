import { createClient } from '@/lib/supabase/server'

// Import suggested transactions as journal entries
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { companyId, documentId, transactions } = await request.json()

  if (!companyId || !transactions || !Array.isArray(transactions)) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Get accounts map
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, code')
      .eq('company_id', companyId)

    const accountMap = new Map((accounts || []).map(a => [a.code, a.id]))

    const created: string[] = []
    const errors: string[] = []

    for (const tx of transactions) {
      const debitAccountId = accountMap.get(tx.debitAccount)
      const creditAccountId = accountMap.get(tx.creditAccount)

      if (!debitAccountId || !creditAccountId) {
        errors.push(`Skipped: ${tx.description} - Invalid account codes`)
        continue
      }

      // Create journal entry
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          company_id: companyId,
          date: tx.date || new Date().toISOString().split('T')[0],
          description: tx.description,
          reference_number: `IMP-${Date.now().toString(36).toUpperCase()}`,
          document_id: documentId || null,
          created_by: user.id,
          created_by_ai: true,
        })
        .select('id')
        .single()

      if (entryError) {
        errors.push(`Failed: ${tx.description} - ${entryError.message}`)
        continue
      }

      // Create journal lines
      const amount = Math.abs(tx.amount)
      const { error: linesError } = await supabase
        .from('journal_lines')
        .insert([
          {
            journal_entry_id: entry.id,
            company_id: companyId,
            account_id: debitAccountId,
            debit: amount,
            credit: 0,
            narration: tx.description,
          },
          {
            journal_entry_id: entry.id,
            company_id: companyId,
            account_id: creditAccountId,
            debit: 0,
            credit: amount,
            narration: tx.description,
          },
        ])

      if (linesError) {
        errors.push(`Lines failed: ${tx.description} - ${linesError.message}`)
        continue
      }

      created.push(entry.id)
    }

    // Update document status
    if (documentId) {
      await supabase
        .from('documents')
        .update({ 
          journal_entry_id: created[0] || null,
          ocr_status: 'completed',
        })
        .eq('id', documentId)
    }

    return Response.json({
      success: true,
      created: created.length,
      errors: errors.length,
      errorDetails: errors,
      entryIds: created,
    })

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
