import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import {
  BookOpen,
  Sparkles,
  Shield,
  BarChart3,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
            <Sparkles className="h-4 w-4" />
            AI-Powered Accounting for Indian Businesses
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Bookkeeping made simple with{' '}
            <span className="text-accent">AI assistance</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground text-balance">
            ElevAIte Books combines powerful double-entry accounting with intelligent
            AI to help you manage your finances effortlessly. GST compliant, 
            India-first, and incredibly easy to use.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login?demo=true">View Demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need to manage your books</h2>
            <p className="text-muted-foreground">
              From journal entries to financial reports, all in one place.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="AI-Powered Journal Entries"
              description="Describe your transactions in plain English and let AI create accurate journal entries for you."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Double-Entry Bookkeeping"
              description="Maintain proper accounting records with automated debit/credit balancing and validation."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="GST Compliant"
              description="Built for Indian businesses with GST tracking, TDS support, and regulatory compliance."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Financial Reports"
              description="Generate Trial Balance, Balance Sheet, P&L, and aging reports with one click."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Document OCR"
              description="Upload invoices and bills - AI extracts data and suggests journal entries automatically."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Team Collaboration"
              description="Invite team members with role-based access control. Owner, accountant, and viewer roles."
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <PricingCard
              title="Free"
              price="₹0"
              description="Perfect for getting started"
              features={[
                '100 journal entries/month',
                '10 AI queries/month',
                '1 user',
                'Basic reports',
              ]}
            />
            <PricingCard
              title="Pro"
              price="₹999"
              description="For growing businesses"
              features={[
                'Unlimited journal entries',
                '100 AI queries/month',
                '5 users',
                'All reports + export',
                'Document OCR',
              ]}
              highlighted
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              description="For larger teams"
              features={[
                'Everything in Pro',
                'Unlimited AI queries',
                'Unlimited users',
                'Priority support',
                'API access',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to simplify your accounting?</h2>
          <p className="mb-8 text-primary-foreground/80">
            Join thousands of Indian businesses using ElevAIte Books.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/sign-up">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} ElevAIte Books. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function PricingCard({
  title,
  price,
  description,
  features,
  highlighted,
}: {
  title: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted ? 'border-accent bg-accent/5 ring-2 ring-accent' : 'bg-card'
      }`}
    >
      {highlighted && (
        <div className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="my-4">
        <span className="text-3xl font-bold">{price}</span>
        {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {feature}
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" variant={highlighted ? 'default' : 'outline'} asChild>
        <Link href="/auth/sign-up">{price === 'Custom' ? 'Contact Us' : 'Get Started'}</Link>
      </Button>
    </div>
  )
}
