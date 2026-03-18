'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, getInitials } from '@/lib/format'
import type { Company, User } from '@/lib/types'
import { Building2, Users, CreditCard, Shield, Sparkles, Check } from 'lucide-react'

interface SettingsTabsProps {
  company: Company
  user: User
  isOwner: boolean
}

const plans = [
  {
    name: 'Essentials',
    price: 2999,
    features: [
      '200 AI transactions/month',
      '50 AI queries/month',
      '50 document uploads/month',
      '1 GB storage',
      '2 user seats',
      'All accounting reports',
      'Balance Sheet and P&L',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 6999,
    features: [
      '1,000 AI transactions/month',
      '200 AI queries/month',
      '300 document uploads/month',
      '5 GB storage',
      '5 user seats',
      'Cash flow forecast',
      'Scheduled report emails',
      'Custom chart of accounts',
      'Email and chat support',
    ],
  },
  {
    name: 'Enterprise',
    price: 13999,
    features: [
      '3,000 AI transactions/month',
      '500 AI queries/month',
      '1,000 document uploads/month',
      '25 GB storage',
      '15 user seats',
      'Up to 5 company workspaces',
      'Custom report builder',
      'API access',
      'Dedicated account manager',
    ],
  },
]

export function SettingsTabs({ company, user, isOwner }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="company" className="space-y-6">
      <TabsList>
        <TabsTrigger value="company" className="gap-2">
          <Building2 className="h-4 w-4" />
          Company
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          Team
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <CompanySettings company={company} isOwner={isOwner} />
      </TabsContent>

      <TabsContent value="team">
        <TeamSettings company={company} user={user} isOwner={isOwner} />
      </TabsContent>

      <TabsContent value="billing">
        <BillingSettings company={company} isOwner={isOwner} />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings user={user} />
      </TabsContent>
    </Tabs>
  )
}

function CompanySettings({ company, isOwner }: { company: Company; isOwner: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>
          Update your company information and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input defaultValue={company.name} disabled={!isOwner} />
          </div>
          <div className="space-y-2">
            <Label>Company Slug</Label>
            <Input defaultValue={company.slug} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input defaultValue={company.gstin || ''} placeholder="Not set" disabled={!isOwner} />
          </div>
          <div className="space-y-2">
            <Label>PAN</Label>
            <Input defaultValue={company.pan || ''} placeholder="Not set" disabled={!isOwner} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Business Type</Label>
            <Input defaultValue={company.business_type || ''} placeholder="Not set" disabled={!isOwner} />
          </div>
          <div className="space-y-2">
            <Label>Base Currency</Label>
            <Input defaultValue={company.base_currency || 'INR'} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fiscal Year Start</Label>
          <Select defaultValue={company.fiscal_year_start || '04-01'} disabled={!isOwner}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="04-01">April 1</SelectItem>
              <SelectItem value="01-01">January 1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isOwner && (
          <Button>Save Changes</Button>
        )}
      </CardContent>
    </Card>
  )
}

function TeamSettings({ company, user, isOwner }: { company: Company; user: User; isOwner: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage who has access to this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current user */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(user.full_name || user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.full_name || 'You'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
            </div>
          </div>

          {isOwner && (
            <Button variant="outline" className="mt-4">
              Invite Team Member
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BillingSettings({ company, isOwner }: { company: Company; isOwner: boolean }) {
  const currentPlan = plans.find(p => p.name.toLowerCase() === company.plan) || plans[0]

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-accent" />
              <div>
                <p className="font-semibold text-lg">{currentPlan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {company.ai_queries_used_month ?? 0} AI queries used this month
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currentPlan.price === 0 ? 'Free' : formatCurrency(currentPlan.price)}
              </p>
              {currentPlan.price > 0 && (
                <p className="text-sm text-muted-foreground">/month</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Plans */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Upgrade to unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-4 rounded-lg border-2 ${
                    plan.name.toLowerCase() === company.plan
                      ? 'border-accent bg-accent/5'
                      : 'border-border'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-4">
                    {plan.price === 0 ? 'Free' : `${formatCurrency(plan.price)}/mo`}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.name.toLowerCase() === company.plan ? (
                    <Badge className="mt-4 w-full justify-center">Current Plan</Badge>
                  ) : (
                    <Button 
                      variant={plan.price > 0 ? 'default' : 'outline'} 
                      className="mt-4 w-full"
                    >
                      {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SecuritySettings({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Manage your account security settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>

        <div className="space-y-2">
          <Label>Password</Label>
          <div className="flex gap-2">
            <Input type="password" value="********" disabled className="flex-1" />
            <Button variant="outline">Change Password</Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add an extra layer of security to your account
          </p>
          <Button variant="outline">Enable 2FA</Button>
        </div>
      </CardContent>
    </Card>
  )
}
