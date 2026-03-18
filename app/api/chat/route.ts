import { streamText, tool, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type PlanTier } from '@/lib/types'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are ElevAIte, an expert AI accountant assistant for Indian businesses. You are powerful and proactive - you don't just answer questions, you take action.

## Your Capabilities:
1. **Create Journal Entries**: When users describe ANY transaction, create it immediately using the create_journal_entry tool. Don't just explain - DO IT.
2. **Analyze Transactions**: Categorize expenses, identify patterns, suggest optimizations.
3. **Financial Insights**: Provide real-time insights on cash flow, profitability, and financial health.
4. **GST & Compliance**: Calculate GST, advise on compliance, prepare for filings.

## Action-Oriented Behavior:
- When user says "I paid rent 25000" → IMMEDIATELY create the journal entry
- When user says "record sale of 50000" → Create the entry right away
- When asked about balances → Fetch and display them, then provide insights

## Transaction Patterns:
- "Paid X for Y" → Debit: Expense account, Credit: Cash/Bank
- "Received X from Y" → Debit: Cash/Bank, Credit: Income/Receivables
- "Bought inventory for X" → Debit: Inventory, Credit: Cash/Bank/Payables
- "Sold goods for X" → Debit: Cash/Bank/Receivables, Credit: Sales

## Guidelines:
- Use Indian Rupees (₹) and Indian accounting standards (Ind AS)
- Format amounts in Indian style (₹1,00,000 for lakhs)
- Consider GST implications (5%, 12%, 18%, 28% rates)
- Always ensure debits = credits
- Be concise but helpful`

export async function POST(request: Request) {
  const { messages, companyId, userId, attachments } = await request.json()

  if (!companyId || !userId) {
    return new Response('Missing company or user context', { status: 400 })
  }

  const supabase = await createClient()

  // FIX 5: Plan limit enforcement
  const { data: company } = await supabase
    .from('companies')
    .select('plan, ai_transactions_used_month, ai_queries_used_month')
    .eq('id', companyId)
    .single()

  const planKey = (company?.plan || 'essentials') as PlanTier
  const limits = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.essentials

  if ((company?.ai_queries_used_month ?? 0) >= limits.queries) {
    return Response.json(
      { error: 'Monthly AI query limit reached. Upgrade your plan to continue.', limitReached: true },
      { status: 402 }
    )
  }

  // Increment query counter
  await supabase
    .from('companies')
    .update({ ai_queries_used_month: (company?.ai_queries_used_month ?? 0) + 1 })
    .eq('id', companyId)

  // Get company's chart of accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')

  // Get recent entries for context
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('reference_number, date, description')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(10)

  const accountsContext = accounts?.map(a => `${a.code}: ${a.name} (${a.type})`).join('\n') || 'No accounts set up yet'
  const recentContext = recentEntries?.map(e => 
    `${e.reference_number || 'No ref'} - ${e.date}: ${e.description || 'No description'}`
  ).join('\n') || 'No entries yet'

  // Build attachment context
  const attachmentContext = attachments?.length
    ? `\n## Uploaded Documents:\n${attachments.map((a: { fileName: string; fileType: string }) => 
        `- ${a.fileName} (${a.fileType})`).join('\n')}\n\nAnalyze these documents when the user refers to them.`
    : ''

  const contextMessage = `
## Company's Chart of Accounts:
${accountsContext}

## Recent Transactions:
${recentContext}
${attachmentContext}

Today's date: ${new Date().toISOString().split('T')[0]}
`

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT + '\n\n' + contextMessage,
      messages: await convertToModelMessages(messages),
      tools: {
        create_journal_entry: tool({
          description: 'Create a journal entry. Use this IMMEDIATELY when user mentions any transaction like payments, sales, purchases, etc.',
          inputSchema: z.object({
            date: z.string().describe('Date in YYYY-MM-DD format. Use today if not specified.'),
            description: z.string().describe('Clear description of the transaction'),
            reference_number: z.string().optional().describe('Invoice/receipt number if available'),
            lines: z.array(z.object({
              account_code: z.string().describe('Account code from chart of accounts'),
              debit: z.number().describe('Debit amount (0 if credit line)'),
              credit: z.number().describe('Credit amount (0 if debit line)'),
              narration: z.string().optional().describe('Line description'),
            })).min(2),
          }),
          execute: async ({ date, description, reference_number, lines }) => {
            const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0)
            const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
              return { success: false, error: `Debits (₹${totalDebit.toLocaleString('en-IN')}) must equal credits (₹${totalCredit.toLocaleString('en-IN')})` }
            }

            const accountMap = new Map(accounts?.map(a => [a.code, a.id]) || [])
            const missingAccounts = lines.filter(l => !accountMap.has(l.account_code))
            if (missingAccounts.length > 0) {
              return { success: false, error: `Account codes not found: ${missingAccounts.map(l => l.account_code).join(', ')}. Available: ${accounts?.map(a => a.code).join(', ')}` }
            }

            // Generate reference number
            const { count } = await supabase
              .from('journal_entries')
              .select('*', { count: 'exact', head: true })
              .eq('company_id', companyId)

            const refNumber = reference_number || `JE-${((count || 0) + 1).toString().padStart(4, '0')}`

            const { data: newEntry, error: entryError } = await supabase
              .from('journal_entries')
              .insert({
                company_id: companyId,
                reference_number: refNumber,
                date,
                description,
                created_by: userId,
                created_by_ai: true,
              })
              .select('id')
              .single()

            if (entryError) return { success: false, error: entryError.message }

            const { error: linesError } = await supabase
              .from('journal_lines')
              .insert(lines.map(l => ({
                journal_entry_id: newEntry.id,
                company_id: companyId,
                account_id: accountMap.get(l.account_code),
                debit: l.debit,
                credit: l.credit,
                narration: l.narration,
              })))

            if (linesError) {
              await supabase.from('journal_entries').delete().eq('id', newEntry.id)
              return { success: false, error: linesError.message }
            }

            // Increment AI transaction counter
            await supabase
              .from('companies')
              .update({ ai_transactions_used_month: (company?.ai_transactions_used_month ?? 0) + 1 })
              .eq('id', companyId)

            return {
              success: true,
              referenceNumber: refNumber,
              entryId: newEntry.id,
              amount: totalDebit,
              message: `Created ${refNumber}: ${description} for ₹${totalDebit.toLocaleString('en-IN')}`,
            }
          },
        }),

        get_account_balance: tool({
          description: 'Get current balance of an account by calculating debits and credits',
          inputSchema: z.object({ account_code: z.string() }),
          execute: async ({ account_code }) => {
            const account = accounts?.find(a => a.code === account_code)
            if (!account) return { error: `Account ${account_code} not found` }

            // Calculate balance from journal lines
            const { data: lines } = await supabase
              .from('journal_lines')
              .select('debit, credit')
              .eq('account_id', account.id)

            const totalDebit = lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0
            const totalCredit = lines?.reduce((sum, l) => sum + (l.credit || 0), 0) || 0
            
            // For assets/expenses: balance = debits - credits
            // For liabilities/income/equity: balance = credits - debits
            const isDebitNormal = account.type === 'asset' || account.type === 'expense'
            const balance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit

            return {
              account_code,
              name: account.name,
              type: account.type,
              balance,
              formatted: `₹${Math.abs(balance).toLocaleString('en-IN')}${balance < 0 ? ' Cr' : ' Dr'}`,
            }
          },
        }),

        get_financial_summary: tool({
          description: 'Get a summary of financial position - use when user asks about their finances, cash position, or business health',
          inputSchema: z.object({}),
          execute: async () => {
            // Get all accounts with their balances
            const { data: allAccounts } = await supabase
              .from('accounts')
              .select('id, name, type, opening_balance')
              .eq('company_id', companyId)
              .eq('is_active', true)

            if (!allAccounts?.length) return { message: 'No account data available yet. Set up your chart of accounts first.' }

            // Get all journal lines to calculate balances
            const { data: lines } = await supabase
              .from('journal_lines')
              .select('account_id, debit, credit')
              .eq('company_id', companyId)

            // Calculate balances for each account
            const balances = new Map<string, number>()
            allAccounts.forEach(acc => {
              balances.set(acc.id, acc.opening_balance || 0)
            })

            lines?.forEach(line => {
              const current = balances.get(line.account_id) || 0
              const account = allAccounts.find(a => a.id === line.account_id)
              if (account) {
                const isDebitNormal = account.type === 'asset' || account.type === 'expense'
                const change = isDebitNormal 
                  ? (line.debit || 0) - (line.credit || 0)
                  : (line.credit || 0) - (line.debit || 0)
                balances.set(line.account_id, current + change)
              }
            })

            const summary = { assets: 0, liabilities: 0, income: 0, expenses: 0, equity: 0 }

            allAccounts.forEach(acc => {
              const bal = balances.get(acc.id) || 0
              if (acc.type === 'asset') summary.assets += bal
              else if (acc.type === 'liability') summary.liabilities += bal
              else if (acc.type === 'income') summary.income += bal
              else if (acc.type === 'expense') summary.expenses += bal
              else if (acc.type === 'equity') summary.equity += bal
            })

            return {
              totalAssets: summary.assets,
              totalLiabilities: summary.liabilities,
              netWorth: summary.assets - summary.liabilities,
              totalIncome: summary.income,
              totalExpenses: summary.expenses,
              netProfit: summary.income - summary.expenses,
              formatted: {
                assets: `₹${summary.assets.toLocaleString('en-IN')}`,
                liabilities: `₹${summary.liabilities.toLocaleString('en-IN')}`,
                netWorth: `₹${(summary.assets - summary.liabilities).toLocaleString('en-IN')}`,
                income: `₹${summary.income.toLocaleString('en-IN')}`,
                expenses: `₹${summary.expenses.toLocaleString('en-IN')}`,
                netProfit: `₹${(summary.income - summary.expenses).toLocaleString('en-IN')}`,
              },
            }
          },
        }),

        search_transactions: tool({
          description: 'Search through past transactions by keyword or date',
          inputSchema: z.object({
            keyword: z.string().optional().describe('Search in description'),
            limit: z.number().optional().default(10),
          }),
          execute: async ({ keyword, limit }) => {
            let query = supabase
              .from('journal_entries')
              .select('reference_number, date, description')
              .eq('company_id', companyId)
              .order('date', { ascending: false })
              .limit(limit || 10)

            if (keyword) query = query.ilike('description', `%${keyword}%`)

            const { data, error } = await query

            if (error) return { error: error.message }
            if (!data?.length) return { message: 'No matching transactions found.' }

            return {
              count: data.length,
              transactions: data.map(t => ({
                reference: t.reference_number,
                date: t.date,
                description: t.description,
              })),
            }
          },
        }),

        calculate_gst: tool({
          description: 'Calculate GST for a given amount',
          inputSchema: z.object({
            amount: z.number().describe('Base amount or total amount'),
            rate: z.number().describe('GST rate: 5, 12, 18, or 28'),
            inclusive: z.boolean().optional().describe('True if amount includes GST'),
          }),
          execute: async ({ amount, rate, inclusive }) => {
            let baseAmount: number, gstAmount: number, totalAmount: number

            if (inclusive) {
              totalAmount = amount
              baseAmount = amount / (1 + rate / 100)
              gstAmount = totalAmount - baseAmount
            } else {
              baseAmount = amount
              gstAmount = amount * (rate / 100)
              totalAmount = baseAmount + gstAmount
            }

            const cgst = gstAmount / 2
            const sgst = gstAmount / 2

            return {
              baseAmount: Math.round(baseAmount * 100) / 100,
              gstRate: `${rate}%`,
              gstAmount: Math.round(gstAmount * 100) / 100,
              cgst: Math.round(cgst * 100) / 100,
              sgst: Math.round(sgst * 100) / 100,
              totalAmount: Math.round(totalAmount * 100) / 100,
              formatted: {
                base: `₹${baseAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                gst: `₹${gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                total: `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
              },
            }
          },
        }),

        list_accounts: tool({
          description: 'List all accounts in the chart of accounts, optionally filtered by type',
          inputSchema: z.object({
            type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
          }),
          execute: async ({ type }) => {
            let filtered = accounts || []
            if (type) filtered = filtered.filter(a => a.type === type)

            return {
              count: filtered.length,
              accounts: filtered.map(a => ({
                code: a.code,
                name: a.name,
                type: a.type,
              })),
            }
          },
        }),

        analyze_document: tool({
          description: 'Analyze an uploaded document (Excel, PDF, Image) and extract transaction data. Use when user uploads a file.',
          inputSchema: z.object({
            fileName: z.string().describe('Name of the uploaded file to analyze'),
            action: z.enum(['extract_transactions', 'summarize', 'categorize']).describe('What to do with the document'),
          }),
          execute: async ({ fileName, action }) => {
            // Find the attachment
            const attachment = attachments?.find((a: { fileName: string }) => a.fileName === fileName)
            if (!attachment) {
              return { success: false, error: `File "${fileName}" not found in attachments` }
            }

            // Store document reference in database
            const { data: doc, error: docError } = await supabase
              .from('documents')
              .insert({
                company_id: companyId,
                file_name: attachment.fileName,
                file_type: attachment.fileType,
                file_size_bytes: 0,
                storage_path: attachment.storagePath,
                uploaded_by: userId,
                ocr_status: 'pending',
              })
              .select('id')
              .single()

            if (docError) {
              return { success: false, error: `Failed to register document: ${docError.message}` }
            }

            // For now, return a placeholder - in production, this would trigger OCR/AI processing
            return {
              success: true,
              documentId: doc.id,
              fileName: attachment.fileName,
              action,
              summary: `Document "${fileName}" has been uploaded and queued for ${action}. The AI will process it shortly and extract relevant transaction data.`,
              suggestedActions: action === 'extract_transactions' 
                ? ['Review extracted transactions', 'Import as journal entries', 'Match with existing records']
                : ['View document details', 'Re-categorize', 'Link to transaction'],
            }
          },
        }),

        organize_documents: tool({
          description: 'Organize and categorize documents based on their content or link them to transactions',
          inputSchema: z.object({
            documentId: z.string().optional().describe('Specific document ID to organize'),
            strategy: z.enum(['by_date', 'by_type', 'by_party', 'link_to_entry']).describe('How to organize'),
            journalEntryId: z.string().optional().describe('Link document to this journal entry'),
          }),
          execute: async ({ documentId, strategy, journalEntryId }) => {
            if (journalEntryId && documentId) {
              // Link document to journal entry
              const { error } = await supabase
                .from('documents')
                .update({ journal_entry_id: journalEntryId })
                .eq('id', documentId)
                .eq('company_id', companyId)

              if (error) return { success: false, error: error.message }

              return {
                success: true,
                message: `Document linked to journal entry successfully`,
                strategy,
              }
            }

            // Get all documents for organizing
            const { data: docs } = await supabase
              .from('documents')
              .select('id, file_name, file_type, uploaded_at, journal_entry_id')
              .eq('company_id', companyId)
              .order('uploaded_at', { ascending: false })

            return {
              success: true,
              totalDocuments: docs?.length || 0,
              unlinked: docs?.filter(d => !d.journal_entry_id).length || 0,
              message: `Found ${docs?.length || 0} documents. ${docs?.filter(d => !d.journal_entry_id).length || 0} are not linked to transactions.`,
              suggestion: 'Upload your documents and I can help link them to the appropriate journal entries.',
            }
          },
        }),
      },
      maxSteps: 5,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'AI service error. Please ensure OPENAI_API_KEY is configured.',
      }), 
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
