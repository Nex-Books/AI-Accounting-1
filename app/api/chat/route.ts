import { streamText, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

// System prompt for the AI Accountant
const SYSTEM_PROMPT = `You are an expert AI accountant assistant for ElevAIte Books, an Indian accounting platform. You help users with:

1. **Bookkeeping Questions**: Explain accounting concepts, double-entry principles, GST rules, TDS, and Indian financial regulations.

2. **Journal Entry Creation**: When users describe a transaction, you can create journal entries using the create_journal_entry tool. Always confirm the accounts and amounts before creating.

3. **Financial Analysis**: Help interpret financial statements, suggest improvements, and explain financial ratios.

4. **GST Compliance**: Advise on GST rates, input tax credit, filing requirements, and compliance.

Guidelines:
- Always use Indian Rupees (₹) for currency
- Follow Indian accounting standards (Ind AS)
- Be concise but thorough
- Ask clarifying questions when transaction details are ambiguous
- Explain your reasoning for journal entry suggestions
- Format currency amounts properly (e.g., ₹1,00,000 for lakhs)

When creating journal entries:
- Ensure debits equal credits
- Use appropriate accounts from the company's chart of accounts
- Include meaningful narrations
- Consider GST implications where applicable`

export async function POST(request: Request) {
  const { messages, companyId, userId } = await request.json()

  if (!companyId || !userId) {
    return new Response('Missing company or user context', { status: 400 })
  }

  const supabase = await createClient()

  // Get company's chart of accounts for context
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('code')

  // Get recent journal entries for context
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('entry_number, date, narration, total_debit')
    .eq('company_id', companyId)
    .eq('status', 'posted')
    .order('date', { ascending: false })
    .limit(5)

  // Build context about the company's accounts
  const accountsContext = accounts?.map(a => `${a.code}: ${a.name} (${a.type})`).join('\n') || 'No accounts found'
  const recentContext = recentEntries?.map(e => 
    `${e.entry_number} - ${e.date}: ${e.narration || 'No narration'} (₹${e.total_debit})`
  ).join('\n') || 'No recent entries'

  const contextMessage = `
Company's Chart of Accounts:
${accountsContext}

Recent Journal Entries:
${recentContext}
`

  try {
    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: SYSTEM_PROMPT + '\n\n' + contextMessage,
      messages: await convertToModelMessages(messages),
      tools: {
        create_journal_entry: tool({
          description: 'Create a new journal entry with debit and credit lines. Use this when the user wants to record a transaction.',
          inputSchema: z.object({
            date: z.string().describe('Date in YYYY-MM-DD format'),
            narration: z.string().describe('Description of the transaction'),
            reference: z.string().optional().describe('Optional reference number'),
            lines: z.array(z.object({
              account_code: z.string().describe('Account code from the chart of accounts'),
              debit: z.number().describe('Debit amount (0 if credit)'),
              credit: z.number().describe('Credit amount (0 if debit)'),
              description: z.string().optional().describe('Optional line description'),
            })).min(2).describe('At least 2 lines with matching debits and credits'),
          }),
          execute: async ({ date, narration, reference, lines }) => {
            // Validate that debits equal credits
            const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0)
            const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0)
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
              return { 
                success: false, 
                error: `Debits (₹${totalDebit}) must equal credits (₹${totalCredit})` 
              }
            }

            // Map account codes to IDs
            const accountMap = new Map(accounts?.map(a => [a.code, a.id]) || [])
            const mappedLines = lines.map(l => ({
              account_id: accountMap.get(l.account_code),
              debit: l.debit,
              credit: l.credit,
              description: l.description,
            }))

            // Check if all accounts exist
            const missingAccounts = lines.filter(l => !accountMap.has(l.account_code))
            if (missingAccounts.length > 0) {
              return {
                success: false,
                error: `Account codes not found: ${missingAccounts.map(l => l.account_code).join(', ')}`
              }
            }

            // Generate entry number
            const { data: lastEntry } = await supabase
              .from('journal_entries')
              .select('entry_number')
              .eq('company_id', companyId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            const lastNumber = lastEntry 
              ? parseInt(lastEntry.entry_number.replace('JE-', ''), 10)
              : 0
            const entryNumber = `JE-${(lastNumber + 1).toString().padStart(4, '0')}`

            // Create the journal entry
            const { data: newEntry, error: entryError } = await supabase
              .from('journal_entries')
              .insert({
                company_id: companyId,
                entry_number: entryNumber,
                date,
                narration,
                reference,
                status: 'draft', // AI creates as draft for user review
                total_debit: totalDebit,
                total_credit: totalCredit,
                created_by: userId,
              })
              .select('id')
              .single()

            if (entryError) {
              return { success: false, error: entryError.message }
            }

            // Create the lines
            const { error: linesError } = await supabase
              .from('journal_lines')
              .insert(mappedLines.map(l => ({
                journal_entry_id: newEntry.id,
                account_id: l.account_id,
                debit: l.debit,
                credit: l.credit,
                description: l.description,
              })))

            if (linesError) {
              // Rollback entry
              await supabase.from('journal_entries').delete().eq('id', newEntry.id)
              return { success: false, error: linesError.message }
            }

            return {
              success: true,
              entryNumber,
              entryId: newEntry.id,
              message: `Created journal entry ${entryNumber} with total ₹${totalDebit.toLocaleString('en-IN')}. The entry is saved as draft - please review and post it.`,
            }
          },
        }),

        get_account_balance: tool({
          description: 'Get the current balance of a specific account',
          inputSchema: z.object({
            account_code: z.string().describe('Account code to check'),
          }),
          execute: async ({ account_code }) => {
            const account = accounts?.find(a => a.code === account_code)
            if (!account) {
              return { error: `Account ${account_code} not found` }
            }

            const { data } = await supabase
              .from('accounts')
              .select('current_balance, name, type')
              .eq('id', account.id)
              .single()

            return {
              account_code,
              account_name: data?.name,
              type: data?.type,
              balance: data?.current_balance || 0,
            }
          },
        }),

        get_trial_balance: tool({
          description: 'Get the current trial balance summary',
          inputSchema: z.object({}),
          execute: async () => {
            const { data } = await supabase
              .from('trial_balance')
              .select('*')
              .eq('company_id', companyId)

            if (!data || data.length === 0) {
              return { message: 'No trial balance data available yet.' }
            }

            const summary = {
              totalDebit: data.reduce((sum, row) => sum + (row.closing_balance > 0 ? row.closing_balance : 0), 0),
              totalCredit: data.reduce((sum, row) => sum + (row.closing_balance < 0 ? Math.abs(row.closing_balance) : 0), 0),
              accountCount: data.length,
            }

            return summary
          },
        }),
      },
      maxSteps: 5,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    // Return mock response when API key is not configured
    return new Response(
      JSON.stringify({ 
        error: 'AI service not configured. Please add OPENAI_API_KEY to use the AI assistant.',
        mock: true 
      }), 
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
