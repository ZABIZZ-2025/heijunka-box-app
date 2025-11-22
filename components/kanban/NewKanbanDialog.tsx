'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Processo, AttivitaProcesso, Reparto } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import toast from 'react-hot-toast'

interface NewKanbanDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  processi: Processo[]
}

export function NewKanbanDialog({ open, onClose, onCreated, processi }: NewKanbanDialogProps) {
  const supabase = createClient()
  const { profile } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [loadingAttivita, setLoadingAttivita] = useState(false)
  const [formData, setFormData] = useState({
    modello: '',
    cliente: '',
    nome_progetto: '',
    descrizione_progetto: '',
    processo_id: '',
  })
  const [attivita, setAttivita] = useState<(AttivitaProcesso & { reparto?: Reparto })[]>([])

  // Load activities when process changes
  useEffect(() => {
    const loadAttivita = async () => {
      if (!formData.processo_id) {
        setAttivita([])
        return
      }

      setLoadingAttivita(true)
      const { data } = await supabase
        .from('attivita_processo')
        .select('*, reparto:reparti(*)')
        .eq('processo_id', formData.processo_id)
        .order('numero_attivita')

      if (data) setAttivita(data as any)
      setLoadingAttivita(false)
    }

    loadAttivita()
  }, [formData.processo_id, supabase])

  const primaAttivita = attivita.find(a => a.is_prima_attivita)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome_progetto.trim()) {
      toast.error('Inserisci il nome del progetto')
      return
    }

    if (!formData.processo_id) {
      toast.error('Seleziona un processo')
      return
    }

    if (!primaAttivita) {
      toast.error('Attendi il caricamento delle attività del processo')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('kanban')
        .insert({
          modello: formData.modello || null,
          cliente: formData.cliente || null,
          nome_progetto: formData.nome_progetto,
          descrizione_progetto: formData.descrizione_progetto || null,
          processo_id: formData.processo_id,
          attivita_corrente_id: primaAttivita.id,
          descrizione_attivita_corrente: primaAttivita.descrizione,
          reparto_corrente_id: primaAttivita.reparto_id,
          descrizione_reparto_corrente: (primaAttivita.reparto as any)?.nome,
          stato: 'in_attesa',
          creato_da: profile?.id,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Kanban #${data.numero_display} creato!`)
      onCreated()
      onClose()
      setFormData({
        modello: '',
        cliente: '',
        nome_progetto: '',
        descrizione_progetto: '',
        processo_id: '',
      })
      setAttivita([])
    } catch (error) {
      toast.error('Errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuovo Kanban</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modello">Modello</Label>
              <Input
                id="modello"
                value={formData.modello}
                onChange={(e) => setFormData({ ...formData, modello: e.target.value })}
                placeholder="es. PRD-FW25-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                placeholder="es. Prada"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_progetto">Nome Progetto *</Label>
            <Input
              id="nome_progetto"
              value={formData.nome_progetto}
              onChange={(e) => setFormData({ ...formData, nome_progetto: e.target.value })}
              placeholder="es. Giacca Invernale Tre Strati"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descrizione">Descrizione</Label>
            <Textarea
              id="descrizione"
              value={formData.descrizione_progetto}
              onChange={(e) => setFormData({ ...formData, descrizione_progetto: e.target.value })}
              placeholder="Descrizione dettagliata del progetto..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processo">Tipo Processo *</Label>
            <Select
              value={formData.processo_id}
              onValueChange={(value) => setFormData({ ...formData, processo_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona processo" />
              </SelectTrigger>
              <SelectContent>
                {processi.map((processo) => (
                  <SelectItem key={processo.id} value={processo.id}>
                    {processo.codice} - {processo.descrizione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.processo_id && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Attività iniziale:</p>
              {loadingAttivita ? (
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              ) : primaAttivita ? (
                <p className="text-sm text-muted-foreground">
                  {primaAttivita.descrizione}
                  {' '}
                  <span className="text-xs">
                    ({(primaAttivita.reparto as any)?.nome})
                  </span>
                </p>
              ) : (
                <p className="text-sm text-destructive">Processo senza attività iniziale</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || loadingAttivita || (formData.processo_id && !primaAttivita)}>
              {loading ? 'Creazione...' : loadingAttivita ? 'Caricamento...' : 'Crea Kanban'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
