import { getCompanyContext } from '@/lib/server-utils'
import { SettingsTabs } from './settings-tabs'

export const metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const context = await getCompanyContext()
  if (!context) return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company settings and preferences
        </p>
      </div>

      <SettingsTabs 
        company={context.company} 
        user={context.user}
        isOwner={context.isOwner}
      />
    </div>
  )
}
