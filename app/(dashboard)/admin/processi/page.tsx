'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Processo, AttivitaProcesso, Reparto } from '@/types/database'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, ArrowLeft, Trash2, Eye, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface ExcelRow {
  cod_proc: string
  descr_proc: string
  num_att: number
  descr_att: string
  num_att_prec: string | number
  num_att_succ: string | number
  rep_att: string
}

interface ValidationError {
  row: number
  message: string
  suggestion: string
}

export default function ProcessiPage() {
  const supabase = createClient()
  const { profile } = useAuthStore()
  const [processi, setProcessi] = useState<Processo[]>([])
  const [reparti, setReparti] = useState<Reparto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null)
  const [attivita, setAttivita] = useState<(AttivitaProcesso & { reparto?: Reparto })[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showErrors, setShowErrors] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [processiRes, repartiRes] = await Promise.all([
      supabase.from('processi').select('*').order('descrizione'),
      supabase.from('reparti').select('*').eq('attivo', true).order('nome'),
    ])

    if (processiRes.data) setProcessi(processiRes.data)
    if (repartiRes.data) setReparti(repartiRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const parseNumberList = (value: string | number): number[] => {
    if (value === null || value === undefined || value === '' || value === 0 || value === '0') {
      return []
    }

    // Convert to string, handling decimal numbers (e.g., 5.6 -> "5,6")
    let strValue = String(value)

    // If it's a decimal number like 5.6, it might be "5,6" interpreted as decimal
    // Convert dots to commas for splitting
    if (typeof value === 'number' && !Number.isInteger(value)) {
      strValue = strValue.replace('.', ',')
    }

    // Split by comma or dot and parse as integers
    return strValue
      .split(/[,.]/)
      .map(v => parseInt(v.trim()))
      .filter(n => !isNaN(n) && n !== 0)
  }

  const validateExcel = (rows: ExcelRow[]): ValidationError[] => {
    const errors: ValidationError[] = []
    const repartiNames = reparti.map(r => r.nome)

    if (rows.length === 0) {
      errors.push({ row: 0, message: 'File vuoto', suggestion: 'Carica un file con almeno una riga di dati' })
      return errors
    }

    // Check required columns
    const requiredCols = ['cod_proc', 'descr_proc', 'num_att', 'descr_att', 'num_att_prec', 'num_att_succ', 'rep_att']
    const firstRow = rows[0]
    for (const col of requiredCols) {
      if (!(col in firstRow)) {
        errors.push({ row: 1, message: `Colonna "${col}" mancante`, suggestion: 'Verifica che tutte le colonne siano presenti' })
      }
    }
    if (errors.length > 0) return errors

    const codProc = rows[0].cod_proc
    const descrProc = rows[0].descr_proc
    const numAtts = new Set<number>()
    let firstActivities = 0
    let lastActivities = 0

    rows.forEach((row, index) => {
      const rowNum = index + 2 // Excel row (header = 1, data starts at 2)

      // Check codice processo consistency
      if (row.cod_proc !== codProc) {
        errors.push({
          row: rowNum,
          message: `Codice processo diverso: "${row.cod_proc}" vs "${codProc}"`,
          suggestion: 'Tutti i codici processo devono essere uguali'
        })
      }

      // Check descrizione processo consistency
      if (row.descr_proc !== descrProc) {
        errors.push({
          row: rowNum,
          message: `Descrizione processo diversa`,
          suggestion: 'Tutte le descrizioni processo devono essere uguali'
        })
      }

      // Check num_att uniqueness
      if (numAtts.has(row.num_att)) {
        errors.push({
          row: rowNum,
          message: `Numero attività ${row.num_att} duplicato`,
          suggestion: 'Ogni numero attività deve essere univoco'
        })
      }
      numAtts.add(row.num_att)

      // Check reparto exists
      if (!repartiNames.includes(row.rep_att)) {
        errors.push({
          row: rowNum,
          message: `Reparto "${row.rep_att}" non esiste`,
          suggestion: `Reparti disponibili: ${repartiNames.join(', ')}`
        })
      }

      // Check first/last activities
      const prec = parseNumberList(row.num_att_prec)
      const succ = parseNumberList(row.num_att_succ)

      if (prec.length === 0) firstActivities++
      if (succ.length === 0) lastActivities++

      // Check max 3 successive activities
      if (succ.length > 3) {
        errors.push({
          row: rowNum,
          message: `Più di 3 attività successive (${succ.length})`,
          suggestion: 'Massimo 3 attività successive consentite'
        })
      }
    })

    // Check exactly one first activity
    if (firstActivities === 0) {
      errors.push({
        row: 0,
        message: 'Nessuna attività iniziale',
        suggestion: "Deve esserci un'attività con num_att_prec = 0"
      })
    } else if (firstActivities > 1) {
      errors.push({
        row: 0,
        message: `${firstActivities} attività iniziali trovate`,
        suggestion: "Deve esserci una sola attività con num_att_prec = 0"
      })
    }

    // Check at least one last activity
    if (lastActivities === 0) {
      errors.push({
        row: 0,
        message: 'Nessuna attività finale',
        suggestion: "Deve esserci almeno un'attività con num_att_succ = 0"
      })
    }

    // Validate connections
    rows.forEach((row, index) => {
      const rowNum = index + 2
      const succ = parseNumberList(row.num_att_succ)

      succ.forEach(numSucc => {
        const successorExists = rows.some(r => r.num_att === numSucc)
        if (!successorExists) {
          errors.push({
            row: rowNum,
            message: `Attività successiva ${numSucc} non esiste`,
            suggestion: 'Verifica che tutte le attività riferite esistano'
          })
        }
      })

      const prec = parseNumberList(row.num_att_prec)
      prec.forEach(numPrec => {
        const predecessorExists = rows.some(r => r.num_att === numPrec)
        if (!predecessorExists) {
          errors.push({
            row: rowNum,
            message: `Attività precedente ${numPrec} non esiste`,
            suggestion: 'Verifica che tutte le attività riferite esistano'
          })
        }
      })
    })

    return errors
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Formato file non supportato. Usa .xlsx o .xls')
      return
    }

    setUploading(true)
    setErrors([])

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet)

      // Validate
      const validationErrors = validateExcel(rows)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setShowErrors(true)
        toast.error('Errori di validazione trovati')
        return
      }

      // Check if process already exists
      const codice = rows[0].cod_proc
      const { data: existing } = await supabase
        .from('processi')
        .select('id')
        .eq('codice', codice)
        .single()

      if (existing) {
        toast.error(`Processo "${codice}" già esistente`)
        return
      }

      // Create process
      const { data: processo, error: processoError } = await supabase
        .from('processi')
        .insert({
          codice: rows[0].cod_proc,
          descrizione: rows[0].descr_proc,
          numero_attivita: rows.length,
          caricato_da: profile?.id,
        })
        .select()
        .single()

      if (processoError) throw processoError

      // Create activities
      const attivitaToInsert = rows.map(row => {
        const prec = parseNumberList(row.num_att_prec)
        const succ = parseNumberList(row.num_att_succ)
        const repartoId = reparti.find(r => r.nome === row.rep_att)?.id

        return {
          processo_id: processo.id,
          numero_attivita: row.num_att,
          descrizione: row.descr_att,
          reparto_id: repartoId,
          numero_attivita_precedenti: prec,
          numero_attivita_successive: succ,
          is_prima_attivita: prec.length === 0,
          is_ultima_attivita: succ.length === 0,
        }
      })

      const { error: attivitaError } = await supabase
        .from('attivita_processo')
        .insert(attivitaToInsert)

      if (attivitaError) throw attivitaError

      toast.success(`Processo "${rows[0].cod_proc}" caricato con successo!`)
      loadData()
    } catch (error) {
      toast.error('Errore durante il caricamento')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleViewProcesso = async (processo: Processo) => {
    const { data } = await supabase
      .from('attivita_processo')
      .select('*, reparto:reparti(*)')
      .eq('processo_id', processo.id)
      .order('numero_attivita')

    setAttivita(data as any || [])
    setSelectedProcesso(processo)
  }

  const handleDeleteProcesso = async (processo: Processo) => {
    if (!confirm(`Eliminare il processo "${processo.codice}"? Questa azione non può essere annullata.`)) return

    try {
      // Check if used in any kanban
      const { data: kanbans } = await supabase
        .from('kanban')
        .select('id')
        .eq('processo_id', processo.id)
        .limit(1)

      if (kanbans && kanbans.length > 0) {
        toast.error('Impossibile eliminare: processo in uso in kanban esistenti')
        return
      }

      // Delete activities first
      await supabase
        .from('attivita_processo')
        .delete()
        .eq('processo_id', processo.id)

      // Delete process
      const { error } = await supabase
        .from('processi')
        .delete()
        .eq('id', processo.id)

      if (error) throw error

      toast.success('Processo eliminato')
      loadData()
    } catch (error) {
      toast.error('Errore durante l\'eliminazione')
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
        <h1 className="text-2xl font-semibold">Gestione Processi</h1>
        <div className="ml-auto">
          <Label htmlFor="upload" className="cursor-pointer">
            <Button asChild disabled={uploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Caricamento...' : 'Carica Excel'}
              </span>
            </Button>
          </Label>
          <Input
            id="upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Format instructions */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Formato file Excel richiesto:</strong> Colonne: cod_proc, descr_proc, num_att, descr_att, num_att_prec, num_att_succ, rep_att.
            Il valore 0 per num_att_prec indica l'attività iniziale, 0 per num_att_succ indica l'attività finale.
            Per attività multiple usa virgole (es. "2,3").
          </p>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>N. Attività</TableHead>
              <TableHead>Caricato il</TableHead>
              <TableHead className="w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : processi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nessun processo caricato
                </TableCell>
              </TableRow>
            ) : (
              processi.map((processo) => (
                <TableRow key={processo.id}>
                  <TableCell className="font-medium">{processo.codice}</TableCell>
                  <TableCell>{processo.descrizione}</TableCell>
                  <TableCell>{processo.numero_attivita}</TableCell>
                  <TableCell>
                    {new Date(processo.caricato_il).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewProcesso(processo)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProcesso(processo)}
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

      {/* View Process Dialog */}
      <Dialog open={!!selectedProcesso} onOpenChange={() => setSelectedProcesso(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProcesso?.codice} - {selectedProcesso?.descrizione}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N.</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Reparto</TableHead>
                <TableHead>Prec.</TableHead>
                <TableHead>Succ.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attivita.map((att) => (
                <TableRow key={att.id}>
                  <TableCell>{att.numero_attivita}</TableCell>
                  <TableCell>{att.descrizione}</TableCell>
                  <TableCell>{(att.reparto as any)?.nome}</TableCell>
                  <TableCell>{att.numero_attivita_precedenti?.join(', ') || '-'}</TableCell>
                  <TableCell>{att.numero_attivita_successive?.join(', ') || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Validation Errors Dialog */}
      <Dialog open={showErrors} onOpenChange={setShowErrors}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Errori di Validazione
            </DialogTitle>
            <DialogDescription>
              Correggi i seguenti errori nel file Excel e riprova.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {errors.map((error, index) => (
              <div key={index} className="border rounded-lg p-3">
                <p className="font-medium text-sm">
                  {error.row > 0 ? `Riga ${error.row}:` : 'Generale:'} {error.message}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suggerimento: {error.suggestion}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
