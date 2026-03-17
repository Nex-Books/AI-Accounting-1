import { SignUpForm } from './sign-up-form'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Sign Up',
  description: 'Create your ElevAIte Books account and start your free trial',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent/30" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center justify-between">
            <Logo variant="light" />
            <Link 
              href="/" 
              className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-balance">
              Start Your 14-Day Free Trial
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              No credit card required. Get instant access to all features and 
              see how AI can transform your accounting workflow.
            </p>
            <ul className="space-y-3 text-primary-foreground/90">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">✓</span>
                Unlimited journal entries
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">✓</span>
                AI-powered bookkeeping assistant
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">✓</span>
                GST compliant reports
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">✓</span>
                Invite up to 3 team members
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-8 text-sm text-primary-foreground/60">
            <span>14-day trial</span>
            <span>No credit card</span>
            <span>Cancel anytime</span>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/5" />
      </div>

      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <Logo />
            <Link 
              href="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">
              Get started with your free 14-day trial
            </p>
          </div>

          <SignUpForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
