import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Reparto, Utente } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Utente | null
  reparto: Reparto | null
  setUser: (user: User | null) => void
  setProfile: (profile: Utente | null) => void
  setReparto: (reparto: Reparto | null) => void
  reset: () => void
  // Computed permissions
  canViewAll: () => boolean
  canCreateProjects: () => boolean
  canModifyKanban: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  reparto: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setReparto: (reparto) => set({ reparto }),
  reset: () => set({ user: null, profile: null, reparto: null }),
  canViewAll: () => get().reparto?.vedere_tutto ?? false,
  canCreateProjects: () => get().reparto?.creare_progetti ?? false,
  canModifyKanban: () => get().reparto?.modificare_kanban ?? false,
  isAdmin: () => get().reparto?.ruolo_amministratore ?? false,
}))
