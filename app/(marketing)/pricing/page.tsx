'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  X, 
  Sparkles, 
  FileText, 
  Brain, 
  Users, 
  Shield, 
  Zap,
  IndianRupee,
  FileSpreadsheet,
  Image as ImageIcon,
  FileType,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for freelancers and small businesses getting started',
    popular: false,
    features: [
      { text: '50 AI queries/month', included: true },
      { text: '10 document uploads/month', included: true },
      { text: 'Excel, CSV file analysis', included: true },
      { text: 'Basic journal entries', included: true },
      { text: 'GST calculations', included: true },
      { text: 'Single user', included: true },
      { text: 'PDF/Image OCR processing', included: false },
      { text: 'Bank statement analysis', included: false },
      { text: 'AI document organization', included: false },
      { text: 'Priority support', included: false },
    ],
    limits: {
      queries: 50,
      documents: 10,
      storage: '100 MB',
      users: 1,
    },
    cta: 'Get Started Free',
    href: '/auth/sign-up',
  },
  {
    name: 'Pro',
    price: 4999,
    description: 'For growing businesses that need advanced AI capabilities',
    popular: true,
    features: [
      { text: '500 AI queries/month', included: true },
      { text: '100 document uploads/month', included: true },
      { text: 'Excel, CSV, PDF analysis', included: true },
      { text: 'PNG/JPEG OCR extraction', included: true },
      { text: 'Bank statement auto-import', included: true },
      { text: 'AI document organization', included: true },
      { text: 'Smart transaction matching', included: true },
      { text: 'Up to 3 team members', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom integrations', included: false },
    ],
    limits: {
      queries: 500,
      documents: 100,
      storage: '5 GB',
      users: 3,
    },
    cta: 'Start Pro Trial',
    href: '/auth/sign-up?plan=pro',
  },
  {
    name: 'Enterprise',
    price: 12999,
    description: 'Unlimited power for large businesses and accounting firms',
    popular: false,
    features: [
      { text: 'Unlimited AI queries', included: true },
      { text: 'Unlimited document uploads', included: true },
      { text: 'All file types supported', included: true },
      { text: 'Advanced OCR with AI verification', included: true },
      { text: 'Multi-bank reconciliation', included: true },
      { text: 'AI document categorization', included: true },
      { text: 'Bulk transaction processing', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Priority phone support', included: true },
      { text: 'Custom integrations & API', included: true },
    ],
    limits: {
      queries: -1,
      documents: -1,
      storage: '50 GB',
      users: -1,
    },
    cta: 'Contact Sales',
    href: '/contact',
  },
]

const fileTypes = [
  { icon: FileSpreadsheet, name: 'Excel', formats: '.xlsx, .xls', description: 'Transaction sheets, trial balances' },
  { icon: FileText, name: 'PDF', formats: '.pdf', description: 'Bank statements, invoices' },
  { icon: ImageIcon, name: 'Images', formats: '.png, .jpg', description: 'Receipts, bills, vouchers' },
  { icon: FileType, name: 'CSV', formats: '.csv', description: 'Exported data, bulk entries' },
]

const aiCapabilities = [
  { 
    icon: Brain, 
    title: 'Smart Transaction Extraction',
    description: 'AI reads your bank statements and Excel sheets, automatically extracting and categorizing transactions'
  },
  { 
    icon: Sparkles, 
    title: 'Instant Journal Entries',
    description: 'Just describe a transaction in plain language - "Paid rent 25000" - and watch entries appear instantly'
  },
  { 
    icon: FileText, 
    title: 'Document Intelligence',
    description: 'Upload invoices, receipts, or bills. AI extracts amounts, dates, parties and creates entries automatically'
  },
  { 
    icon: Zap, 
    title: 'Correlation Engine',
    description: 'AI matches uploaded documents with transactions, organizing everything in perfect order'
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ElevAIte Books</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Accounting
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your business. Upgrade or downgrade anytime.
            All plans include our powerful AI assistant.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-accent shadow-lg shadow-accent/10'
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <IndianRupee className="w-6 h-6" />
                      <span className="text-4xl font-bold">{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>

                {/* Limits summary */}
                <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-2xl font-bold">{plan.limits.queries === -1 ? '∞' : plan.limits.queries}</p>
                    <p className="text-xs text-muted-foreground">AI queries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{plan.limits.documents === -1 ? '∞' : plan.limits.documents}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{plan.limits.storage}</p>
                    <p className="text-xs text-muted-foreground">Storage</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{plan.limits.users === -1 ? '∞' : plan.limits.users}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm',
                        !feature.included && 'text-muted-foreground'
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Supported File Types */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            Upload Any Document
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Our AI understands and processes various file formats
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fileTypes.map((type) => (
              <Card key={type.name} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <type.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{type.formats}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="max-w-5xl mx-auto mb-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            AI That Actually Understands Accounting
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Not just a chatbot - a full-fledged AI accountant that works 24/7
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {aiCapabilities.map((cap) => (
              <Card key={cap.title}>
                <CardContent className="flex gap-4 pt-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
                    <cap.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{cap.title}</h3>
                    <p className="text-sm text-muted-foreground">{cap.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cost Transparency */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className="text-3xl font-bold mb-4">Fair, Sustainable Pricing</h2>
          <p className="text-muted-foreground mb-8">
            We process your documents using advanced AI models. Our pricing is designed to 
            give you incredible value while ensuring we can keep improving the platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Secure Processing</h3>
                <p className="text-sm text-muted-foreground">Your data never leaves our secure servers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Indian Support</h3>
                <p className="text-sm text-muted-foreground">Built for Indian businesses, GST compliant</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Always Improving</h3>
                <p className="text-sm text-muted-foreground">New AI features added monthly</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to transform your accounting?</h2>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Start Free Today
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial on Pro
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ElevAIte Books. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
