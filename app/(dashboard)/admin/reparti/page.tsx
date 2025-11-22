'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reparto } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RepartiPage() {
  const supabase = createClient()
  const [reparti, setReparti] = useState<Reparto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReparto, setEditingReparto] = useState<Reparto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    codice: '',
    vedere_tutto: false,
    creare_progetti: false,
    modificare_kanban: false,
    ruolo_amministratore: false,
    colore_hex: '#3399FF',
    ordine_visualizzazione: 0,
  })

  const loadReparti = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reparti')
      .select('*')
      .order('ordine_visualizzazione')

    if (data) setReparti(data)
    if (error) toast.error('Errore nel caricamento')
    setLoading(false)
  }

  useEffect(() => {
    loadReparti()
  }, [])

  const openNewDialog = () => {
    setEditingReparto(null)
    setFormData({
      nome: '',
      codice: '',
      vedere_tutto: false,
      creare_progetti: false,
      modificare_kanban: false,
      ruolo_amministratore: false,
      colore_hex: '#3399FF',
      ordine_visualizzazione: reparti.length,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (reparto: Reparto) => {
    setEditingReparto(reparto)
    setFormData({
      nome: reparto.nome,
      codice: reparto.codice,
      vedere_tutto: reparto.vedere_tutto,
      creare_progetti: reparto.creare_progetti,
      modificare_kanban: reparto.modificare_kanban,
      ruolo_amministratore: reparto.ruolo_amministratore,
      colore_hex: reparto.colore_hex,
      ordine_visualizzazione: reparto.ordine_visualizzazione,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.codice.trim()) {
      toast.error('Nome e codice sono obbligatori')
      return
    }

    try {
      if (editingReparto) {
        const { error } = await supabase
          .from('reparti')
          .update(formData)
          .eq('id', editingReparto.id)

        if (error) throw error
        toast.success('Reparto aggiornato')
      } else {
        const { error } = await supabase
          .from('reparti')
          .insert(formData)

        if (error) throw error
        toast.success('Reparto creato')
      }

      setDialogOpen(false)
      loadReparti()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Nome o codice già esistente')
      } else {
        toast.error('Errore durante il salvataggio')
      }
    }
  }

  const handleDelete = async (reparto: Reparto) => {
    if (!confirm(`Eliminare il reparto "${reparto.nome}"?`)) return

    try {
      const { error } = await supabase
        .from('reparti')
        .delete()
        .eq('id', reparto.id)

      if (error) throw error
      toast.success('Reparto eliminato')
      loadReparti()
    } catch (error: any) {
      if (error.code === '23503') {
        toast.error('Impossibile eliminare: reparto in uso')
      } else {
        toast.error('Errore durante l\'eliminazione')
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Gestione Reparti</h1>
        <Button onClick={openNewDialog} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Reparto
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colore</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Codice</TableHead>
              <TableHead>Permessi</TableHead>
              <TableHead>Ordine</TableHead>
              <TableHead className="w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : reparti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nessun reparto configurato
                </TableCell>
              </TableRow>
            ) : (
              reparti.map((reparto) => (
                <TableRow key={reparto.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: reparto.colore_hex }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{reparto.nome}</TableCell>
                  <TableCell>{reparto.codice}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {reparto.ruolo_amministratore && <Badge variant="destructive">Admin</Badge>}
                      {reparto.vedere_tutto && <Badge>Vede tutto</Badge>}
                      {reparto.creare_progetti && <Badge variant="secondary">Crea</Badge>}
                      {reparto.modificare_kanban && <Badge variant="outline">Modifica</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{reparto.ordine_visualizzazione}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(reparto)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reparto)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReparto ? 'Modifica Reparto' : 'Nuovo Reparto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="es. Sviluppo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codice">Codice *</Label>
                <Input
                  id="codice"
                  value={formData.codice}
                  onChange={(e) => setFormData({ ...formData, codice: e.target.value.toUpperCase() })}
                  placeholder="es. SVL"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colore">Colore</Label>
                <Input
                  id="colore"
                  type="color"
                  value={formData.colore_hex}
                  onChange={(e) => setFormData({ ...formData, colore_hex: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordine">Ordine visualizzazione</Label>
                <Input
                  id="ordine"
                  type="number"
                  value={formData.ordine_visualizzazione}
                  onChange={(e) => setFormData({ ...formData, ordine_visualizzazione: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permessi</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="vedere_tutto"
                    checked={formData.vedere_tutto}
                    onCheckedChange={(checked) => setFormData({ ...formData, vedere_tutto: checked === true })}
                  />
                  <Label htmlFor="vedere_tutto" className="font-normal">
                    Vedere tutto (tutti i kanban di tutti i reparti)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="creare_progetti"
                    checked={formData.creare_progetti}
                    onCheckedChange={(checked) => setFormData({ ...formData, creare_progetti: checked === true })}
                  />
                  <Label htmlFor="creare_progetti" className="font-normal">
                    Creare progetti (può creare nuovi kanban)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="modificare_kanban"
                    checked={formData.modificare_kanban}
                    onCheckedChange={(checked) => setFormData({ ...formData, modificare_kanban: checked === true })}
                  />
                  <Label htmlFor="modificare_kanban" className="font-normal">
                    Modificare kanban (può modificare/annullare)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ruolo_amministratore"
                    checked={formData.ruolo_amministratore}
                    onCheckedChange={(checked) => setFormData({ ...formData, ruolo_amministratore: checked === true })}
                  />
                  <Label htmlFor="ruolo_amministratore" className="font-normal text-red-600">
                    Ruolo amministratore (accesso completo)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              {editingReparto ? 'Salva' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
