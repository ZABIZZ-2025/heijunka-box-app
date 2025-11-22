'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Stats {
  totale: number
  inCorso: number
  completati: number
  inRitardo: number
}

export default function ReportPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totale: 0,
    inCorso: 0,
    completati: 0,
    inRitardo: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        // Total kanbans
        const { count: totale } = await supabase
          .from('kanban')
          .select('*', { count: 'exact', head: true })

        // In corso
        const { count: inCorso } = await supabase
          .from('kanban')
          .select('*', { count: 'exact', head: true })
          .in('stato', ['in_attesa', 'in_corso', 'attesa_convergenza'])

        // Completati (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { count: completati } = await supabase
          .from('kanban')
          .select('*', { count: 'exact', head: true })
          .eq('stato', 'completato')
          .gte('data_effettiva_fine', thirtyDaysAgo.toISOString())

        // In ritardo
        const today = new Date().toISOString().split('T')[0]
        const { count: inRitardo } = await supabase
          .from('kanban')
          .select('*', { count: 'exact', head: true })
          .eq('stato', 'in_corso')
          .lt('data_prevista_fine', today)

        setStats({
          totale: totale || 0,
          inCorso: inCorso || 0,
          completati: completati || 0,
          inRitardo: inRitardo || 0,
        })
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [supabase])

  const kpiCards = [
    {
      title: 'Progetti Totali',
      value: stats.totale,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'In Corso',
      value: stats.inCorso,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Completati',
      value: stats.completati,
      subtitle: 'Ultimi 30 giorni',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'In Ritardo',
      value: stats.inRitardo,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Report e Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? '...' : card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for future charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tempo Medio per Attività</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              I grafici dettagliati saranno disponibili nella Fase 3
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance per Reparto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              I grafici dettagliati saranno disponibili nella Fase 3
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
