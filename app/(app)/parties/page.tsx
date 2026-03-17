import { Suspense } from 'react'
import Link from 'next/link'
import { getCompanyContext } from '@/lib/server-utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, getPartyTypeLabel } from '@/lib/format'
import type { Party } from '@/lib/types'
import { Plus, Users, Building2, Phone, Mail, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Parties',
}

async function getParties(companyId: string): Promise<Party[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('company_id', companyId)
    .order('name')
  
  if (error) {
    console.error('Error fetching parties:', error)
    return []
  }
  
  return data || []
}

export default async function PartiesPage() {
  const context = await getCompanyContext()
  if (!context) return null
  
  const parties = await getParties(context.company.id)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Parties</h1>
          <p className="text-muted-foreground">
            Manage your customers and vendors
          </p>
        </div>
        <Button asChild>
          <Link href="/parties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Party
          </Link>
        </Button>
      </div>

      <Suspense fallback={<PartiesSkeleton />}>
        {parties.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Parties Yet</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Add your customers and vendors to track receivables and payables.
              </p>
              <Button asChild>
                <Link href="/parties/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Party
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </Suspense>
    </div>
  )
}

function PartyCard({ party }: { party: Party }) {
  const balanceColor = party.current_balance >= 0 ? 'text-success' : 'text-destructive'
  const balanceLabel = party.type === 'customer' 
    ? (party.current_balance >= 0 ? 'To Receive' : 'To Pay')
    : (party.current_balance >= 0 ? 'To Pay' : 'To Receive')

  return (
    <Link href={`/parties/${party.id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">{party.name}</h3>
                <Badge variant="outline" className="text-xs mt-1">
                  {getPartyTypeLabel(party.type)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {party.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{party.email}</span>
              </div>
            )}
            {party.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{party.phone}</span>
              </div>
            )}
            {party.city && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{party.city}{party.state ? `, ${party.state}` : ''}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{balanceLabel}</span>
            <span className={`font-mono font-medium ${balanceColor}`}>
              {formatCurrency(Math.abs(party.current_balance))}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PartiesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  )
}
