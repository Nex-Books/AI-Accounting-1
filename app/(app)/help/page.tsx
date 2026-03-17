import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BookOpen,
  MessageSquare,
  Mail,
  ExternalLink,
  HelpCircle,
  FileText,
  Sparkles,
  Calculator,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Help & Support',
}

const faqs = [
  {
    question: 'How do I create a journal entry?',
    answer: 'Navigate to Journal from the sidebar and click "New Entry". Fill in the date, narration, and add debit/credit lines. Make sure debits equal credits before saving. You can also use the AI Assistant to create entries using natural language.',
  },
  {
    question: 'How does the AI Assistant work?',
    answer: 'The AI Assistant can help you create journal entries from plain English descriptions, answer accounting questions, and provide guidance on GST compliance. Simply describe your transaction like "Record a cash sale of ₹50,000" and the AI will create the proper journal entry.',
  },
  {
    question: 'What are the different account types?',
    answer: 'There are 5 main account types: Assets (what you own), Liabilities (what you owe), Equity (owner\'s capital), Revenue (income), and Expenses (costs). Each type has sub-categories for better organization.',
  },
  {
    question: 'How do I track GST?',
    answer: 'ElevAIte Books has pre-configured GST accounts (CGST, SGST, IGST Payable). When recording taxable transactions, create separate lines for the tax amounts. The AI Assistant can help calculate and record GST automatically.',
  },
  {
    question: 'Can I void or edit a posted entry?',
    answer: 'Posted entries cannot be edited to maintain audit trail integrity. To correct a mistake, you can void the entry (which creates a reversal) and create a new correct entry. Draft entries can be freely edited.',
  },
  {
    question: 'How do I generate reports?',
    answer: 'Go to Reports from the sidebar to access Trial Balance, Profit & Loss, Balance Sheet, and aging reports. You can filter by date range and export to PDF or Excel.',
  },
  {
    question: 'What is the financial year setting?',
    answer: 'Most Indian businesses use April 1 as the financial year start (April to March). This affects how reports are generated and organized. You can change this in Settings.',
  },
  {
    question: 'How do I invite team members?',
    answer: 'Go to Settings > Team and click "Invite Team Member". You can assign roles: Owner (full access), Accountant (can create/edit entries), or Viewer (read-only access).',
  },
]

const guides = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of ElevAIte Books',
    icon: BookOpen,
    href: '#',
  },
  {
    title: 'Double-Entry Accounting',
    description: 'Understanding debits and credits',
    icon: Calculator,
    href: '#',
  },
  {
    title: 'GST Compliance',
    description: 'Recording GST transactions correctly',
    icon: FileText,
    href: '#',
  },
  {
    title: 'Using AI Assistant',
    description: 'Get the most from AI-powered features',
    icon: Sparkles,
    href: '#',
  },
]

export default function HelpPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers, guides, and get in touch with support
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-base">AI Assistant</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get instant help with accounting questions
            </p>
            <Button asChild size="sm">
              <Link href="/chat">Open Chat</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Email Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Contact our support team directly
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@elevaite.app">
                Send Email
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <HelpCircle className="h-5 w-5 text-success" />
              </div>
              <CardTitle className="text-base">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our detailed documentation
            </p>
            <Button variant="outline" size="sm">
              View Docs
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Guides */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Guides</CardTitle>
          <CardDescription>
            Step-by-step tutorials to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <guide.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{guide.title}</p>
                  <p className="text-xs text-muted-foreground">{guide.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions about using ElevAIte Books
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available Monday to Friday, 9 AM to 6 PM IST
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <a href="mailto:support@elevaite.app">
                  <Mail className="mr-2 h-4 w-4" />
                  support@elevaite.app
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
