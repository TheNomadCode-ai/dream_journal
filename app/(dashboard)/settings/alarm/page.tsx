/* eslint-disable @typescript-eslint/no-explicit-any */
import AlarmSettingsClient from '@/components/settings/AlarmSettingsClient'
import { createClient } from '@/lib/supabase/server'

export default async function AlarmSettingsPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: alarm } = await supabase
    .from('alarms')
    .select('alarm_time, enabled, days_of_week, snooze_seconds')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('timezone, wake_timezone, push_enabled')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <AlarmSettingsClient
      initialAlarm={alarm}
      initialTimezone={profile?.timezone || profile?.wake_timezone || 'UTC'}
      initialPushEnabled={profile?.push_enabled ?? false}
    />
  )
}
