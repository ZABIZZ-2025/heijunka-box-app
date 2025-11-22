'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Utente, Reparto } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface UtenteWithReparto extends Utente {
  reparto?: Reparto | null
}

export default function UtentiPage() {
  const supabase = createClient()
  const [utenti, setUtenti] = useState<UtenteWithReparto[]>([])
  const [reparti, setReparti] = useState<Reparto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUtente, setEditingUtente] = useState<UtenteWithReparto | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    nome_completo: '',
    reparto_id: '',
  })

  const loadData = async () => {
    setLoading(true)
    const [utentiRes, repartiRes] = await Promise.all([
      supabase.from('utenti').select('*, reparto:reparti(*)').order('nome_completo'),
      supabase.from('reparti').select('*').eq('attivo', true).order('nome'),
    ])

    if (utentiRes.data) setUtenti(utentiRes.data as any)
    if (repartiRes.data) setReparti(repartiRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const openNewDialog = () => {
    setEditingUtente(null)
    setFormData({
      email: '',
      username: '',
      password: '',
      nome_completo: '',
      reparto_id: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (utente: UtenteWithReparto) => {
    setEditingUtente(utente)
    setFormData({
      email: utente.email,
      username: utente.username,
      password: '', // Don't show existing password
      nome_completo: utente.nome_completo,
      reparto_id: utente.reparto_id || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.email.trim() || !formData.username.trim() || !formData.nome_completo.trim()) {
      toast.error('Email, username e nome sono obbligatori')
      return
    }

    if (!editingUtente && !formData.password) {
      toast.error('La password è obbligatoria per i nuovi utenti')
      return
    }

    try {
      if (editingUtente) {
        // Update existing user
        const updateData: any = {
          email: formData.email,
          username: formData.username,
          nome_completo: formData.nome_completo,
          reparto_id: formData.reparto_id || null,
        }

        const { error } = await supabase
          .from('utenti')
          .update(updateData)
          .eq('id', editingUtente.id)

        if (error) throw error

        // Update auth email if changed
        if (formData.email !== editingUtente.email) {
          // Note: This requires admin rights in Supabase
          toast('Nota: l\'email di autenticazione potrebbe richiedere aggiornamento manuale', { icon: 'ℹ️' })
        }

        toast.success('Utente aggiornato')
      } else {
        // Create new user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })

        if (authError) throw authError

        // Create user profile
        const { error: profileError } = await supabase
          .from('utenti')
          .insert({
            id: authData.user?.id,
            email: formData.email,
            username: formData.username,
            password_hash: 'managed_by_supabase_auth',
            nome_completo: formData.nome_completo,
            reparto_id: formData.reparto_id || null,
          })

        if (profileError) throw profileError

        toast.success('Utente creato. Un\'email di conferma è stata inviata.')
      }

      setDialogOpen(false)
      loadData()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Email o username già esistente')
      } else {
        toast.error(error.message || 'Errore durante il salvataggio')
      }
      console.error(error)
    }
  }

  const handleDelete = async (utente: UtenteWithReparto) => {
    if (!confirm(`Eliminare l'utente "${utente.nome_completo}"?`)) return

    try {
      const { error } = await supabase
        .from('utenti')
        .delete()
        .eq('id', utente.id)

      if (error) throw error
      toast.success('Utente eliminato')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione')
      console.error(error)
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
        <h1 className="text-2xl font-semibold">Gestione Utenti</h1>
        <Button onClick={openNewDialog} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Reparto</TableHead>
              <TableHead>Stato</TableHead>
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
            ) : utenti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nessun utente configurato
                </TableCell>
              </TableRow>
            ) : (
              utenti.map((utente) => (
                <TableRow key={utente.id}>
                  <TableCell className="font-medium">{utente.nome_completo}</TableCell>
                  <TableCell>{utente.email}</TableCell>
                  <TableCell>{utente.username}</TableCell>
                  <TableCell>
                    {utente.reparto ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: utente.reparto.colore_hex }}
                        />
                        {utente.reparto.nome}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Non assegnato</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={utente.attivo ? 'success' : 'secondary'}>
                      {utente.attivo ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(utente)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(utente)}
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
              {editingUtente ? 'Modifica Utente' : 'Nuovo Utente'}
            </DialogTitle>
            {!editingUtente && (
              <DialogDescription>
                L'utente riceverà un'email per confermare l'account.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="es. Mario Rossi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@azienda.it"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="es. mrossi"
                />
              </div>
            </div>

            {!editingUtente && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimo 6 caratteri"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reparto">Reparto</Label>
              <Select
                value={formData.reparto_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, reparto_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona reparto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun reparto</SelectItem>
                  {reparti.map((reparto) => (
                    <SelectItem key={reparto.id} value={reparto.id}>
                      {reparto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              {editingUtente ? 'Salva' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
