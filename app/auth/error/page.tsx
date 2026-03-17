import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Authentication Error',
  description: 'There was a problem with authentication',
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <div className="w-full max-w-md text-center space-y-8">
        <Logo className="justify-center" />
        
        <div className="bg-card rounded-xl p-8 shadow-sm border space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Authentication Error</h1>
            <p className="text-muted-foreground">
              {message || 'There was a problem signing you in. Please try again.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/auth/login">
                Try again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          If this problem persists,{' '}
          <Link href="/support" className="text-accent hover:underline">
            contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
