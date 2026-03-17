import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Check Your Email',
  description: 'Verify your email to complete signup',
}

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <div className="w-full max-w-md text-center space-y-8">
        <Logo className="justify-center" />
        
        <div className="bg-card rounded-xl p-8 shadow-sm border space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="text-muted-foreground">
              {"We've sent you a confirmation link. Click the link in your email to activate your account."}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              {"Didn't receive the email? Check your spam folder or "}
              <button className="text-accent hover:underline">
                click here to resend
              </button>
            </p>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Need help?{' '}
          <Link href="/support" className="text-accent hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
