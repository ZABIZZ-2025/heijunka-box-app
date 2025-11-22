import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData, defaultSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    session.userId = defaultSession.userId
    session.email = defaultSession.email
    session.username = defaultSession.username
    session.isLoggedIn = false
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Errore durante il logout' },
      { status: 500 }
    )
  }
}
