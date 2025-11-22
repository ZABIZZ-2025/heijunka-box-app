'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutGrid,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Heijunka', href: '/heijunka', icon: LayoutGrid },
  { name: 'Kanban', href: '/kanban', icon: ClipboardList },
  { name: 'Report', href: '/report', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Admin', href: '/admin', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, reparto, reset, isAdmin } = useAuthStore()

  // Show admin menu if user is admin or has no profile yet (initial setup)
  const showAdminMenu = isAdmin() || !profile

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    toast.success('Logout effettuato')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-lg text-white font-bold">H</span>
          </div>
          <span className="text-lg font-semibold">Heijunka Box</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {showAdminMenu && (
          <>
            <div className="pt-4 pb-2">
              <div className="border-t" />
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <User className="h-5 w-5" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {profile?.nome_completo || 'Utente'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {reparto?.nome || 'Nessun reparto'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {profile?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
