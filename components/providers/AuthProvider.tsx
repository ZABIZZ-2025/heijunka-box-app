'use client'

import { useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuthStore } from '@/store/authStore'
import { Reparto, Utente } from '@/types/database'

interface AuthProviderProps {
  children: React.ReactNode
  user: User | null
  profile: Utente | null
  reparto: Reparto | null
}

export function AuthProvider({ children, user, profile, reparto }: AuthProviderProps) {
  const { setUser, setProfile, setReparto } = useAuthStore()

  useEffect(() => {
    setUser(user)
    setProfile(profile)
    setReparto(reparto)
  }, [user, profile, reparto, setUser, setProfile, setReparto])

  return <>{children}</>
}
