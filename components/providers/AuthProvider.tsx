'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Reparto, Utente } from '@/types/database'

interface SimpleUser {
  id: string
  email: string
}

interface AuthProviderProps {
  children: React.ReactNode
  user: SimpleUser | null
  profile: Utente | null
  reparto: Reparto | null
}

export function AuthProvider({ children, user, profile, reparto }: AuthProviderProps) {
  const { setUser, setProfile, setReparto } = useAuthStore()

  useEffect(() => {
    setUser(user as any)
    setProfile(profile)
    setReparto(reparto)
  }, [user, profile, reparto, setUser, setProfile, setReparto])

  return <>{children}</>
}
