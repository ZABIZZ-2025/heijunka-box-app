import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, nome_completo, reparto_id } = body

    if (!email || !password || !username || !nome_completo) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const { data: existing } = await supabaseAdmin
      .from('utenti')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Username o email già esistente' },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Generate UUID for the user
    const userId = uuidv4()

    // Create user profile in utenti table
    const { data: newUser, error: profileError } = await supabaseAdmin
      .from('utenti')
      .insert({
        id: userId,
        email,
        username,
        password_hash: passwordHash,
        nome_completo,
        reparto_id: reparto_id || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
    })
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Errore server' },
      { status: 500 }
    )
  }
}
