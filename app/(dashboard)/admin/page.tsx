'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileSpreadsheet } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin } = useAuthStore()

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/heijunka')
    }
  }, [isAdmin, router])

  const adminCards = [
    {
      title: 'Reparti',
      description: 'Gestisci i reparti aziendali e i relativi permessi',
      href: '/admin/reparti',
      icon: Building2,
    },
    {
      title: 'Utenti',
      description: 'Gestisci gli utenti e le assegnazioni ai reparti',
      href: '/admin/utenti',
      icon: Users,
    },
    {
      title: 'Processi',
      description: 'Carica e gestisci i processi da file Excel',
      href: '/admin/processi',
      icon: FileSpreadsheet,
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Amministrazione</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
