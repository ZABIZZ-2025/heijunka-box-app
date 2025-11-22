import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, SessionData } from '@/lib/auth/session'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ user: null, profile: null, reparto: null })
    }

    // Fetch user profile with reparto
    const { data: profile, error } = await supabase
      .from('utenti')
      .select('*, reparto:reparti(*)')
      .eq('id', session.userId)
      .eq('attivo', true)
      .single()

    if (error || !profile) {
      return NextResponse.json({ user: null, profile: null, reparto: null })
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
      },
      profile: profile,
      reparto: profile.reparto || null,
    })
  } catch (error: any) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null, profile: null, reparto: null })
  }
}
