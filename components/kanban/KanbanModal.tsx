'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Kanban, KanbanStatus, AttivitaProcesso, Reparto } from '@/types/database'
import { formatDateTime, formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClipboardList,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Play,
  AlertTriangle,
  Lock,
  Edit2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface KanbanModalProps {
  kanban: Kanban
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

type AttivitaWithReparto = AttivitaProcesso & { reparto?: Reparto }

const statusConfig: Record<KanbanStatus, { label: string; variant: any }> = {
  non_avviato: { label: 'Non avviato', variant: 'secondary' },
  in_attesa: { label: 'In attesa', variant: 'waiting' },
  in_corso: { label: 'In corso', variant: 'inProgress' },
  attesa_convergenza: { label: 'Attesa convergenza', variant: 'convergence' },
  completato: { label: 'Completato', variant: 'success' },
  annullato: { label: 'Annullato', variant: 'destructive' },
  completato_parziale: { label: 'Completato parziale', variant: 'secondary' },
}

export function KanbanModal({ kanban, open, onClose, onUpdate }: KanbanModalProps) {
  const supabase = createClient()
  const { profile, reparto, canModifyKanban, isAdmin } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [dataPrevistaFine, setDataPrevistaFine] = useState('')
  const [motivazione, setMotivazione] = useState('')
  const [showMotivazione, setShowMotivazione] = useState<'annulla' | 'parziale' | null>(null)

  // Activities state
  const [allActivities, setAllActivities] = useState<AttivitaWithReparto[]>([])
  const [expectedNextActivities, setExpectedNextActivities] = useState<AttivitaWithReparto[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [editingNextActivities, setEditingNextActivities] = useState(false)
  const [selectedNextActivities, setSelectedNextActivities] = useState<string[]>([])

  const isUserReparto = reparto?.id === kanban.reparto_corrente_id
  const canTakeAction = isUserReparto || isAdmin()
  const canModify = canModifyKanban() || isAdmin()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isDelayed =
    kanban.stato === 'in_corso' &&
    kanban.data_prevista_fine &&
    new Date(kanban.data_prevista_fine) < today

  // Load activities when modal opens
  const loadActivities = useCallback(async () => {
    if (!kanban.processo_id || !open) return

    setLoadingActivities(true)
    try {
      // Load all activities for the process
      const { data: activities } = await supabase
        .from('attivita_processo')
        .select('*, reparto:reparti(*)')
        .eq('processo_id', kanban.processo_id)
        .order('numero_attivita')

      if (activities) {
        setAllActivities(activities as AttivitaWithReparto[])

        // Find current activity and get expected next activities
        const currentActivity = activities.find(a => a.id === kanban.attivita_corrente_id)
        if (currentActivity?.numero_attivita_successive?.length > 0) {
          const nextActs = activities.filter(a =>
            currentActivity.numero_attivita_successive.includes(a.numero_attivita)
          )
          setExpectedNextActivities(nextActs as AttivitaWithReparto[])
          setSelectedNextActivities(nextActs.map(a => a.id))
        } else {
          setExpectedNextActivities([])
          setSelectedNextActivities([])
        }
      }
    } finally {
      setLoadingActivities(false)
    }
  }, [kanban.processo_id, kanban.attivita_corrente_id, open, supabase])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Reset editing state when modal closes
  useEffect(() => {
    if (!open) {
      setEditingNextActivities(false)
      setSelectedNextActivities([])
    }
  }, [open])

  const handleAvvia = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('kanban')
        .update({
          stato: 'in_attesa',
          ultima_modifica: new Date().toISOString(),
          modificato_da: profile?.id,
        })
        .eq('id', kanban.id)

      if (error) throw error
      toast.success('Kanban avviato!')
      onUpdate()
    } catch (error) {
      toast.error('Errore durante l\'avvio')
    } finally {
      setLoading(false)
    }
  }

  const handlePrendiInCarico = async () => {
    if (!dataPrevistaFine) {
      toast.error('Inserisci la data prevista fine')
      return
    }

    setLoading(true)
    try {
      // Get selected next activities
      const nextActivities = allActivities.filter(a => selectedNextActivities.includes(a.id))

      let updateData: any = {
        stato: 'in_corso',
        data_presa_in_carico: new Date().toISOString(),
        data_prevista_fine: dataPrevistaFine,
        ultima_modifica: new Date().toISOString(),
        modificato_da: profile?.id,
        // Reset all next activities
        prossima_attivita_1_id: null,
        descrizione_prossima_attivita_1: null,
        reparto_prossima_attivita_1_id: null,
        prossima_attivita_2_id: null,
        descrizione_prossima_attivita_2: null,
        reparto_prossima_attivita_2_id: null,
        prossima_attivita_3_id: null,
        descrizione_prossima_attivita_3: null,
        reparto_prossima_attivita_3_id: null,
      }

      // Set selected next activities
      if (nextActivities.length > 0) {
        updateData.prossima_attivita_1_id = nextActivities[0]?.id
        updateData.descrizione_prossima_attivita_1 = nextActivities[0]?.descrizione
        updateData.reparto_prossima_attivita_1_id = nextActivities[0]?.reparto_id
      }
      if (nextActivities.length > 1) {
        updateData.prossima_attivita_2_id = nextActivities[1]?.id
        updateData.descrizione_prossima_attivita_2 = nextActivities[1]?.descrizione
        updateData.reparto_prossima_attivita_2_id = nextActivities[1]?.reparto_id
      }
      if (nextActivities.length > 2) {
        updateData.prossima_attivita_3_id = nextActivities[2]?.id
        updateData.descrizione_prossima_attivita_3 = nextActivities[2]?.descrizione
        updateData.reparto_prossima_attivita_3_id = nextActivities[2]?.reparto_id
      }

      const { error } = await supabase
        .from('kanban')
        .update(updateData)
        .eq('id', kanban.id)

      if (error) throw error
      toast.success('Attività presa in carico!')
      onUpdate()
    } catch (error) {
      toast.error('Errore durante la presa in carico')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleta = async () => {
    setLoading(true)
    try {
      // Save to history
      await supabase.from('storico_attivita_kanban').insert({
        kanban_id: kanban.id,
        kanban_numero_display: kanban.numero_display,
        attivita_id: kanban.attivita_corrente_id,
        descrizione_attivita: kanban.descrizione_attivita_corrente || '',
        reparto_id: kanban.reparto_corrente_id,
        descrizione_reparto: kanban.descrizione_reparto_corrente || '',
        data_inizio: kanban.data_presa_in_carico || new Date().toISOString(),
        data_prevista_fine: kanban.data_prevista_fine || new Date().toISOString().split('T')[0],
        data_effettiva_fine: new Date().toISOString(),
        completato_da: profile?.id,
      })

      // Count next activities
      const nextCount = [
        kanban.prossima_attivita_1_id,
        kanban.prossima_attivita_2_id,
        kanban.prossima_attivita_3_id,
      ].filter(Boolean).length

      if (nextCount === 0) {
        // Last activity - complete kanban
        await supabase
          .from('kanban')
          .update({
            stato: 'completato',
            data_effettiva_fine: new Date().toISOString(),
            ultima_modifica: new Date().toISOString(),
            modificato_da: profile?.id,
          })
          .eq('id', kanban.id)

        toast.success('Kanban completato!')
      } else if (nextCount === 1) {
        // Single next activity - transition
        const { data: nextActivity } = await supabase
          .from('attivita_processo')
          .select('*, reparto:reparti(*)')
          .eq('id', kanban.prossima_attivita_1_id)
          .single()

        await supabase
          .from('kanban')
          .update({
            stato: 'in_attesa',
            attivita_corrente_id: kanban.prossima_attivita_1_id,
            descrizione_attivita_corrente: nextActivity?.descrizione,
            reparto_corrente_id: nextActivity?.reparto_id,
            descrizione_reparto_corrente: (nextActivity?.reparto as any)?.nome,
            data_presa_in_carico: null,
            data_prevista_fine: null,
            data_effettiva_fine: null,
            prossima_attivita_1_id: null,
            descrizione_prossima_attivita_1: null,
            reparto_prossima_attivita_1_id: null,
            prossima_attivita_2_id: null,
            descrizione_prossima_attivita_2: null,
            reparto_prossima_attivita_2_id: null,
            prossima_attivita_3_id: null,
            descrizione_prossima_attivita_3: null,
            reparto_prossima_attivita_3_id: null,
            ultima_modifica: new Date().toISOString(),
            modificato_da: profile?.id,
          })
          .eq('id', kanban.id)

        toast.success('Attività completata!')
      } else {
        // Multiple next activities - SPLIT
        const suffixes = ['A', 'B', 'C']
        const nextActivities = [
          { id: kanban.prossima_attivita_1_id, desc: kanban.descrizione_prossima_attivita_1, repartoId: kanban.reparto_prossima_attivita_1_id },
          { id: kanban.prossima_attivita_2_id, desc: kanban.descrizione_prossima_attivita_2, repartoId: kanban.reparto_prossima_attivita_2_id },
          { id: kanban.prossima_attivita_3_id, desc: kanban.descrizione_prossima_attivita_3, repartoId: kanban.reparto_prossima_attivita_3_id },
        ].filter(a => a.id)

        for (let i = 0; i < nextActivities.length; i++) {
          const activity = nextActivities[i]
          const { data: repartoData } = await supabase
            .from('reparti')
            .select('nome')
            .eq('id', activity.repartoId)
            .single()

          await supabase.from('kanban').insert({
            numero: kanban.numero,
            suffisso: suffixes[i],
            modello: kanban.modello,
            cliente: kanban.cliente,
            nome_progetto: kanban.nome_progetto,
            descrizione_progetto: kanban.descrizione_progetto,
            processo_id: kanban.processo_id,
            attivita_corrente_id: activity.id,
            descrizione_attivita_corrente: activity.desc,
            reparto_corrente_id: activity.repartoId,
            descrizione_reparto_corrente: repartoData?.nome,
            stato: 'in_attesa',
            kanban_padre_id: kanban.id,
            is_split: true,
            creato_da: kanban.creato_da,
          })
        }

        // Mark original as partially complete
        await supabase
          .from('kanban')
          .update({
            stato: 'completato_parziale',
            data_effettiva_fine: new Date().toISOString(),
            ultima_modifica: new Date().toISOString(),
            modificato_da: profile?.id,
          })
          .eq('id', kanban.id)

        toast.success(`Kanban diviso in ${nextActivities.length} attività parallele!`)
      }

      onUpdate()
    } catch (error) {
      toast.error('Errore durante il completamento')
    } finally {
      setLoading(false)
    }
  }

  const handleAnnulla = async () => {
    if (!motivazione.trim()) {
      toast.error('Inserisci una motivazione')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('kanban')
        .update({
          stato: 'annullato',
          motivazione_chiusura: motivazione,
          ultima_modifica: new Date().toISOString(),
          modificato_da: profile?.id,
        })
        .eq('id', kanban.id)

      if (error) throw error
      toast.success('Kanban annullato')
      onUpdate()
    } catch (error) {
      toast.error('Errore durante l\'annullamento')
    } finally {
      setLoading(false)
      setShowMotivazione(null)
      setMotivazione('')
    }
  }

  const toggleNextActivity = (activityId: string) => {
    setSelectedNextActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId)
      } else if (prev.length < 3) {
        return [...prev, activityId]
      }
      return prev
    })
  }

  const statusInfo = statusConfig[kanban.stato]

  // Get other activities (not current, not expected)
  const otherActivities = allActivities.filter(a =>
    a.id !== kanban.attivita_corrente_id &&
    !expectedNextActivities.some(e => e.id === a.id)
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Kanban #{kanban.numero_display}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {isDelayed && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                In ritardo
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dati Progetto */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Dati Progetto
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {kanban.modello && (
                <div>
                  <span className="text-muted-foreground">Modello:</span>{' '}
                  <span className="font-medium">{kanban.modello}</span>
                </div>
              )}
              {kanban.cliente && (
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <span className="font-medium">{kanban.cliente}</span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Nome:</span>{' '}
                <span className="font-medium">{kanban.nome_progetto}</span>
              </div>
              {kanban.descrizione_progetto && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Descrizione:</span>{' '}
                  <span>{kanban.descrizione_progetto}</span>
                </div>
              )}
            </div>
          </section>

          {/* Processo */}
          <section>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Attività Corrente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Attività:</span>{' '}
                <span className="font-medium">{kanban.descrizione_attivita_corrente}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reparto:</span>{' '}
                <span className="font-medium">{kanban.descrizione_reparto_corrente}</span>
              </div>
            </div>
          </section>

          {/* Date */}
          {(kanban.data_presa_in_carico || kanban.data_prevista_fine) && (
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {kanban.data_presa_in_carico && (
                  <div>
                    <span className="text-muted-foreground">Presa in carico:</span>{' '}
                    <span className="font-medium">{formatDateTime(kanban.data_presa_in_carico)}</span>
                  </div>
                )}
                {kanban.data_prevista_fine && (
                  <div>
                    <span className="text-muted-foreground">Prevista fine:</span>{' '}
                    <span className={`font-medium ${isDelayed ? 'text-red-600' : ''}`}>
                      {formatDate(kanban.data_prevista_fine)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Prossime attività - Show when in_attesa or in_corso */}
          {['in_attesa', 'in_corso'].includes(kanban.stato) && (
            <section>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Prossime Attività (da processo)
                {canModify && kanban.stato === 'in_attesa' && !editingNextActivities && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNextActivities(true)}
                    className="ml-auto"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifica
                  </Button>
                )}
              </h3>

              {loadingActivities ? (
                <p className="text-sm text-muted-foreground">Caricamento attività...</p>
              ) : editingNextActivities ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seleziona fino a 3 attività successive (quelle previste sono già selezionate):
                  </p>

                  {/* Expected activities */}
                  {expectedNextActivities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Previste dal processo:</p>
                      {expectedNextActivities.map(activity => (
                        <label
                          key={activity.id}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                            selectedNextActivities.includes(activity.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedNextActivities.includes(activity.id)}
                            onChange={() => toggleNextActivity(activity.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {activity.numero_attivita}. {activity.descrizione}
                            <span className="text-muted-foreground ml-1">
                              ({(activity.reparto as any)?.nome})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Other activities */}
                  {otherActivities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Altre attività disponibili:</p>
                      {otherActivities.map(activity => (
                        <label
                          key={activity.id}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                            selectedNextActivities.includes(activity.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedNextActivities.includes(activity.id)}
                            onChange={() => toggleNextActivity(activity.id)}
                            disabled={!selectedNextActivities.includes(activity.id) && selectedNextActivities.length >= 3}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {activity.numero_attivita}. {activity.descrizione}
                            <span className="text-muted-foreground ml-1">
                              ({(activity.reparto as any)?.nome})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingNextActivities(false)
                        setSelectedNextActivities(expectedNextActivities.map(a => a.id))
                      }}
                    >
                      Annulla
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setEditingNextActivities(false)}
                    >
                      Conferma selezione
                    </Button>
                  </div>
                </div>
              ) : expectedNextActivities.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {expectedNextActivities.map((activity, index) => (
                    <li key={activity.id} className={selectedNextActivities.includes(activity.id) ? '' : 'line-through text-muted-foreground'}>
                      {index + 1}. {activity.descrizione}
                      <span className="text-muted-foreground ml-1">({(activity.reparto as any)?.nome})</span>
                    </li>
                  ))}
                  {/* Show manually added activities */}
                  {selectedNextActivities
                    .filter(id => !expectedNextActivities.some(e => e.id === id))
                    .map((id, index) => {
                      const activity = allActivities.find(a => a.id === id)
                      if (!activity) return null
                      return (
                        <li key={id} className="text-blue-600">
                          {expectedNextActivities.length + index + 1}. {activity.descrizione}
                          <span className="ml-1">({(activity.reparto as any)?.nome})</span>
                          <Badge variant="outline" className="ml-2 text-xs">Aggiunta manualmente</Badge>
                        </li>
                      )
                    })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Questa è l'ultima attività del processo
                </p>
              )}
            </section>
          )}

          {/* Show saved next activities when in_corso */}
          {kanban.stato === 'in_corso' && (kanban.prossima_attivita_1_id || kanban.prossima_attivita_2_id || kanban.prossima_attivita_3_id) && (
            <section className="bg-muted/30 rounded-lg p-3">
              <h3 className="font-semibold mb-2 text-sm">Attività successive confermate:</h3>
              <ul className="space-y-1 text-sm">
                {kanban.descrizione_prossima_attivita_1 && (
                  <li>1. {kanban.descrizione_prossima_attivita_1}</li>
                )}
                {kanban.descrizione_prossima_attivita_2 && (
                  <li>2. {kanban.descrizione_prossima_attivita_2}</li>
                )}
                {kanban.descrizione_prossima_attivita_3 && (
                  <li>3. {kanban.descrizione_prossima_attivita_3}</li>
                )}
              </ul>
            </section>
          )}

          {/* Convergence notice */}
          {kanban.stato === 'attesa_convergenza' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Lock className="h-5 w-5" />
                <span className="font-medium">In attesa completamento altre fasi</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Questo kanban sarà disponibile quando tutte le attività parallele saranno completate.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex flex-wrap gap-2">
            {kanban.stato === 'non_avviato' && canTakeAction && (
              <Button onClick={handleAvvia} disabled={loading}>
                <Play className="h-4 w-4 mr-2" />
                Avvia
              </Button>
            )}

            {kanban.stato === 'in_attesa' && canTakeAction && (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="dataPrevista">Data prevista fine</Label>
                    <Input
                      id="dataPrevista"
                      type="date"
                      value={dataPrevistaFine}
                      onChange={(e) => setDataPrevistaFine(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <Button
                    onClick={handlePrendiInCarico}
                    disabled={loading || !dataPrevistaFine}
                  >
                    Prendi in carico
                  </Button>
                </div>
                {selectedNextActivities.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedNextActivities.length} attività successive selezionate
                  </p>
                )}
              </div>
            )}

            {kanban.stato === 'in_corso' && canTakeAction && (
              <Button onClick={handleCompleta} disabled={loading} variant="success">
                <CheckCircle className="h-4 w-4 mr-2" />
                Attività Completata
              </Button>
            )}

            {/* Cancel/Partial complete */}
            {['in_attesa', 'in_corso'].includes(kanban.stato) && canModify && !showMotivazione && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowMotivazione('annulla')}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
              </>
            )}

            {/* Motivazione form */}
            {showMotivazione && (
              <div className="w-full space-y-2">
                <Label>Motivazione {showMotivazione === 'annulla' ? 'annullamento' : 'completamento parziale'}</Label>
                <Textarea
                  value={motivazione}
                  onChange={(e) => setMotivazione(e.target.value)}
                  placeholder="Inserisci la motivazione..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleAnnulla}
                    disabled={loading || !motivazione.trim()}
                  >
                    Conferma {showMotivazione === 'annulla' ? 'Annullamento' : 'Completamento'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMotivazione(null)
                      setMotivazione('')
                    }}
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
