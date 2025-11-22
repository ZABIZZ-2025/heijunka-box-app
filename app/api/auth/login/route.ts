import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { sessionOptions, SessionData } from '@/lib/auth/session'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Find user by username or email
    const { data: user, error } = await supabase
      .from('utenti')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .eq('attivo', true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Update last connection
    await supabase
      .from('utenti')
      .update({ ultima_connessione: new Date().toISOString() })
      .eq('id', user.id)

    // Create session
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

    session.userId = user.id
    session.email = user.email
    session.username = user.username
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nome_completo: user.nome_completo,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
}
