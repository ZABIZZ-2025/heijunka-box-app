import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { AuthProvider } from '@/components/providers/AuthProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile and department
  const { data: profile } = await supabase
    .from('utenti')
    .select('*, reparto:reparti(*)')
    .eq('id', user.id)
    .single()

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
