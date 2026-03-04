import { Resend } from 'npm:resend@4.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUBJECT = "Your dreams this week — here's what we noticed."

type ProfileRow = {
  id: string
  display_name: string | null
  auto_pattern_insight: string | null
  last_logged_date: string | null
}

type DreamRow = {
  mood_score: number | null
}

const moodLabel = (score: number | null) => {
  switch (score) {
    case 1:
      return 'Restless'
    case 2:
      return 'Melancholy'
    case 3:
      return 'Neutral'
    case 4:
      return 'Peaceful'
    case 5:
      return 'Luminous'
    default:
      return 'Unspecified'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL')

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !resendFrom) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const resend = new Resend(resendApiKey)

    const sinceISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const activeCutoffISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    let page = 1
    let sent = 0
    let scanned = 0

    while (true) {
      const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
      if (usersError) {
        throw usersError
      }

      const users = usersPage?.users ?? []
      if (users.length === 0) break

      for (const user of users) {
        scanned += 1
        const email = user.email
        if (!email) continue

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, display_name, auto_pattern_insight, last_logged_date')
          .eq('id', user.id)
          .single<ProfileRow>()

        if (!profile?.last_logged_date || profile.last_logged_date < activeCutoffISO) {
          continue
        }

        const { data: dreams, count } = await supabase
          .from('dreams')
          .select('mood_score', { count: 'exact' })
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('date_of_dream', sinceISO)

        const weeklyCount = count ?? 0
        if (weeklyCount === 0) {
          continue
        }

        const moodBuckets = new Map<number, number>()
        ;(dreams as DreamRow[] | null)?.forEach((dream) => {
          if (!dream.mood_score) return
          moodBuckets.set(dream.mood_score, (moodBuckets.get(dream.mood_score) ?? 0) + 1)
        })

        let dominantMood: number | null = null
        let dominantCount = 0
        moodBuckets.forEach((value, key) => {
          if (value > dominantCount) {
            dominantMood = key
            dominantCount = value
          }
        })

        const pattern = profile.auto_pattern_insight ?? 'A new personal pattern is forming across your entries.'
        const greetingName = profile.display_name ?? email.split('@')[0]

        const html = `
          <div style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.6; max-width: 620px; margin: 0 auto;">
            <h2 style="font-style: italic; font-weight: 500; margin-bottom: 8px;">Your weekly dream recap</h2>
            <p style="margin-top: 0; color: #444;">Hi ${greetingName}, here's what we noticed this week:</p>
            <ul>
              <li><strong>${weeklyCount}</strong> dreams logged</li>
              <li>Most common mood: <strong>${moodLabel(dominantMood)}</strong></li>
              <li>Pattern: ${pattern}</li>
            </ul>
            <p style="color: #444;">Keep capturing your mornings in Somnia.</p>
          </div>
        `

        const { error: sendError } = await resend.emails.send({
          from: resendFrom,
          to: email,
          subject: SUBJECT,
          html,
        })

        if (!sendError) {
          sent += 1
        }
      }

      page += 1
    }

    return new Response(
      JSON.stringify({ ok: true, scanned, sent }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
