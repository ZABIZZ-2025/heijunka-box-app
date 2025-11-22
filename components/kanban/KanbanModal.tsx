'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Kanban, KanbanStatus } from '@/types/database'
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
  ClipboardList,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Play,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface KanbanModalProps {
  kanban: Kanban
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

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

  const isUserReparto = reparto?.id === kanban.reparto_corrente_id
  const canTakeAction = isUserReparto || isAdmin()
  const canModify = canModifyKanban() || isAdmin()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isDelayed =
    kanban.stato === 'in_corso' &&
    kanban.data_prevista_fine &&
    new Date(kanban.data_prevista_fine) < today

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
      // Get next activities from process
      const { data: attivitaCorrente } = await supabase
        .from('attivita_processo')
        .select('*')
        .eq('id', kanban.attivita_corrente_id)
        .single()

      let updateData: any = {
        stato: 'in_corso',
        data_presa_in_carico: new Date().toISOString(),
        data_prevista_fine: dataPrevistaFine,
        ultima_modifica: new Date().toISOString(),
        modificato_da: profile?.id,
      }

      // Set next activities if available
      if (attivitaCorrente?.numero_attivita_successive?.length > 0) {
        const { data: nextActivities } = await supabase
          .from('attivita_processo')
          .select('*, reparto:reparti(*)')
          .eq('processo_id', kanban.processo_id)
          .in('numero_attivita', attivitaCorrente.numero_attivita_successive)

        if (nextActivities && nextActivities.length > 0) {
          updateData.prossima_attivita_1_id = nextActivities[0]?.id || null
          updateData.descrizione_prossima_attivita_1 = nextActivities[0]?.descrizione || null
          updateData.reparto_prossima_attivita_1_id = nextActivities[0]?.reparto_id || null

          if (nextActivities.length > 1) {
            updateData.prossima_attivita_2_id = nextActivities[1]?.id || null
            updateData.descrizione_prossima_attivita_2 = nextActivities[1]?.descrizione || null
            updateData.reparto_prossima_attivita_2_id = nextActivities[1]?.reparto_id || null
          }

          if (nextActivities.length > 2) {
            updateData.prossima_attivita_3_id = nextActivities[2]?.id || null
            updateData.descrizione_prossima_attivita_3 = nextActivities[2]?.descrizione || null
            updateData.reparto_prossima_attivita_3_id = nextActivities[2]?.reparto_id || null
          }
        }
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

  const statusInfo = statusConfig[kanban.stato]

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
              Processo
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

          {/* Prossime attività */}
          {(kanban.prossima_attivita_1_id || kanban.prossima_attivita_2_id || kanban.prossima_attivita_3_id) && (
            <section>
              <h3 className="font-semibold mb-2">Prossime Attività</h3>
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
              <div className="flex items-center gap-2 w-full">
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
                  className="mt-6"
                >
                  Prendi in carico
                </Button>
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
