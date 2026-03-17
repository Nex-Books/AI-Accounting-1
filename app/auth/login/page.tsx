import { LoginForm } from './login-form'
import { Logo } from '@/components/logo'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your ElevAIte Books account',
}

export default function LoginPage() {
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
              AI-Powered Accounting for Modern Indian Businesses
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Streamline your bookkeeping with intelligent automation. GST compliant, 
              effortless journal entries, and real-time financial insights.
            </p>
          </div>
          <div className="flex items-center gap-8 text-sm text-primary-foreground/60">
            <span>GST Compliant</span>
            <span>Bank-Grade Security</span>
            <span>AI Assistant</span>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/5" />
      </div>

      {/* Right side - Login Form */}
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
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/auth/sign-up" className="text-accent hover:underline font-medium">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
