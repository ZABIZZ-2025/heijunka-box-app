import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { createClient } from '@supabase/supabase-js'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { sessionOptions, SessionData } from '@/lib/auth/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn || !session.userId) {
    redirect('/login')
  }

  // Fetch user profile and department
  const { data: profile } = await supabase
    .from('utenti')
    .select('*, reparto:reparti(*)')
    .eq('id', session.userId)
    .eq('attivo', true)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const user = {
    id: profile.id,
    email: profile.email,
  }

  return (
    <AuthProvider
      user={user}
      profile={profile}
      reparto={profile?.reparto || null}
    >
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
