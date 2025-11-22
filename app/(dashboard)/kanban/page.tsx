'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Kanban, KanbanStatus } from '@/types/database'
import { KanbanModal } from '@/components/kanban/KanbanModal'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const statusConfig: Record<KanbanStatus, { label: string; variant: any }> = {
  non_avviato: { label: 'Non avviato', variant: 'secondary' },
  in_attesa: { label: 'In attesa', variant: 'waiting' },
  in_corso: { label: 'In corso', variant: 'inProgress' },
  attesa_convergenza: { label: 'Attesa convergenza', variant: 'convergence' },
  completato: { label: 'Completato', variant: 'success' },
  annullato: { label: 'Annullato', variant: 'destructive' },
  completato_parziale: { label: 'Completato parziale', variant: 'secondary' },
}

export default function KanbanListPage() {
  const supabase = createClient()
  const { canViewAll, reparto } = useAuthStore()

  const [kanbans, setKanbans] = useState<Kanban[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKanban, setSelectedKanban] = useState<Kanban | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadKanbans = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('kanban')
        .select('*')
        .order('numero', { ascending: false })

      // Apply permission filter
      if (!canViewAll() && reparto) {
        query = query.eq('reparto_corrente_id', reparto.id)
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('stato', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setKanbans(data || [])
    } catch (error) {
      toast.error('Errore nel caricamento')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, canViewAll, reparto, statusFilter])

  useEffect(() => {
    loadKanbans()
  }, [loadKanbans])

  // Filter by search
  const filteredKanbans = kanbans.filter((k) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      k.numero_display.toLowerCase().includes(searchLower) ||
      k.nome_progetto.toLowerCase().includes(searchLower) ||
      k.cliente?.toLowerCase().includes(searchLower) ||
      k.modello?.toLowerCase().includes(searchLower)
    )
  })

  const handleKanbanUpdate = () => {
    loadKanbans()
    setSelectedKanban(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Lista Kanban</h1>
        <Button variant="outline" onClick={loadKanbans} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero, progetto, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="non_avviato">Non avviato</SelectItem>
            <SelectItem value="in_attesa">In attesa</SelectItem>
            <SelectItem value="in_corso">In corso</SelectItem>
            <SelectItem value="attesa_convergenza">Attesa convergenza</SelectItem>
            <SelectItem value="completato">Completato</SelectItem>
            <SelectItem value="annullato">Annullato</SelectItem>
            <SelectItem value="completato_parziale">Completato parziale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Progetto</TableHead>
              <TableHead>Attività</TableHead>
              <TableHead>Reparto</TableHead>
              <TableHead>Data Prevista</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : filteredKanbans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nessun kanban trovato
                </TableCell>
              </TableRow>
            ) : (
              filteredKanbans.map((kanban) => {
                const status = statusConfig[kanban.stato]
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isDelayed =
                  kanban.stato === 'in_corso' &&
                  kanban.data_prevista_fine &&
                  new Date(kanban.data_prevista_fine) < today

                return (
                  <TableRow
                    key={kanban.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedKanban(kanban)}
                  >
                    <TableCell className="font-medium">{kanban.numero_display}</TableCell>
                    <TableCell>{kanban.cliente || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {kanban.nome_progetto}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {kanban.descrizione_attivita_corrente}
                    </TableCell>
                    <TableCell>{kanban.descrizione_reparto_corrente}</TableCell>
                    <TableCell>
                      {kanban.data_prevista_fine ? (
                        <span className={isDelayed ? 'text-red-600 font-medium' : ''}>
                          {formatDate(kanban.data_prevista_fine)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                      {isDelayed && (
                        <Badge variant="destructive" className="ml-1">
                          Ritardo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredKanbans.length} di {kanbans.length} kanban
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
    </div>
  )
}
