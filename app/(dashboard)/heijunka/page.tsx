'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { HeijunkaGrid } from '@/components/heijunka/HeijunkaGrid'
import { HeijunkaFilters } from '@/components/heijunka/HeijunkaFilters'
import { KanbanModal } from '@/components/kanban/KanbanModal'
import { NewKanbanDialog } from '@/components/kanban/NewKanbanDialog'
import { Button } from '@/components/ui/button'
import { Kanban, Reparto, Processo } from '@/types/database'
import { Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export interface HeijunkaFiltersState {
  reparto: string | null
  cliente: string | null
  modello: string | null
  processo: string | null
  soloRitardi: boolean
}

export default function HeijunkaPage() {
  const supabase = createClient()
  const { canCreateProjects, canViewAll, isAdmin, reparto: userReparto, profile } = useAuthStore()

  // Allow creating kanbans if user has permission, is admin, or has no profile yet (initial setup)
  const canCreate = canCreateProjects() || isAdmin() || !profile

  const [kanbans, setKanbans] = useState<Kanban[]>([])
  const [reparti, setReparti] = useState<Reparto[]>([])
  const [processi, setProcessi] = useState<Processo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKanban, setSelectedKanban] = useState<Kanban | null>(null)
  const [showNewKanbanDialog, setShowNewKanbanDialog] = useState(false)

  const [filters, setFilters] = useState<HeijunkaFiltersState>({
    reparto: null,
    cliente: null,
    modello: null,
    processo: null,
    soloRitardi: false,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load departments
      const { data: repartiData } = await supabase
        .from('reparti')
        .select('*')
        .eq('attivo', true)
        .order('ordine_visualizzazione')

      if (repartiData) setReparti(repartiData)

      // Load processes
      const { data: processiData } = await supabase
        .from('processi')
        .select('*')
        .eq('attivo', true)
        .order('descrizione')

      if (processiData) setProcessi(processiData)

      // Load active kanbans
      let query = supabase
        .from('kanban')
        .select('*')
        .in('stato', ['in_attesa', 'in_corso', 'attesa_convergenza'])

      // Apply permission filter
      if (!canViewAll() && userReparto) {
        query = query.eq('reparto_corrente_id', userReparto.id)
      }

      const { data: kanbansData, error } = await query

      if (error) {
        toast.error('Errore nel caricamento dati')
        console.error(error)
      } else if (kanbansData) {
        setKanbans(kanbansData)
      }
    } catch (error) {
      toast.error('Errore nel caricamento dati')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, canViewAll, userReparto])

  useEffect(() => {
    loadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Filter kanbans
  const filteredKanbans = kanbans.filter((kanban) => {
    if (filters.reparto && kanban.reparto_corrente_id !== filters.reparto) return false
    if (filters.cliente && kanban.cliente !== filters.cliente) return false
    if (filters.modello && kanban.modello !== filters.modello) return false
    if (filters.processo && kanban.processo_id !== filters.processo) return false
    if (filters.soloRitardi) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dataPrevista = kanban.data_prevista_fine ? new Date(kanban.data_prevista_fine) : null
      if (!dataPrevista || dataPrevista >= today || kanban.stato !== 'in_corso') return false
    }
    return true
  })

  // Get unique values for filters
  const clienti = Array.from(new Set(kanbans.map(k => k.cliente).filter(Boolean))) as string[]
  const modelli = Array.from(new Set(kanbans.map(k => k.modello).filter(Boolean))) as string[]

  const handleKanbanClick = (kanban: Kanban) => {
    setSelectedKanban(kanban)
  }

  const handleKanbanUpdate = () => {
    loadData()
    setSelectedKanban(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-2xl font-semibold">Heijunka Box</h1>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={() => setShowNewKanbanDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Kanban
            </Button>
          )}
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Filters */}
      <HeijunkaFilters
        filters={filters}
        onFiltersChange={setFilters}
        reparti={reparti}
        clienti={clienti}
        modelli={modelli}
        processi={processi}
        totalKanbans={kanbans.length}
        filteredKanbans={filteredKanbans.length}
      />

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        <HeijunkaGrid
          kanbans={filteredKanbans}
          reparti={reparti}
          onKanbanClick={handleKanbanClick}
          loading={loading}
        />
      </div>

      {/* Kanban Modal */}
      {selectedKanban && (
        <KanbanModal
          kanban={selectedKanban}
          open={!!selectedKanban}
          onClose={() => setSelectedKanban(null)}
          onUpdate={handleKanbanUpdate}
        />
      )}

      {/* New Kanban Dialog */}
      <NewKanbanDialog
        open={showNewKanbanDialog}
        onClose={() => setShowNewKanbanDialog(false)}
        onCreated={loadData}
        processi={processi}
      />
    </div>
  )
}
