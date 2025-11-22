'use client'

import { HeijunkaFiltersState } from '@/app/(dashboard)/heijunka/page'
import { Reparto, Processo } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'

interface HeijunkaFiltersProps {
  filters: HeijunkaFiltersState
  onFiltersChange: (filters: HeijunkaFiltersState) => void
  reparti: Reparto[]
  clienti: (string | null)[]
  modelli: (string | null)[]
  processi: Processo[]
  totalKanbans: number
  filteredKanbans: number
}

export function HeijunkaFilters({
  filters,
  onFiltersChange,
  reparti,
  clienti,
  modelli,
  processi,
  totalKanbans,
  filteredKanbans,
}: HeijunkaFiltersProps) {
  const hasActiveFilters =
    filters.reparto ||
    filters.cliente ||
    filters.modello ||
    filters.processo ||
    filters.soloRitardi

  const resetFilters = () => {
    onFiltersChange({
      reparto: null,
      cliente: null,
      modello: null,
      processo: null,
      soloRitardi: false,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtri:</span>
      </div>

      <Select
        value={filters.reparto || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, reparto: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Reparto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i reparti</SelectItem>
          {reparti.map((reparto) => (
            <SelectItem key={reparto.id} value={reparto.id}>
              {reparto.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.cliente || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, cliente: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i clienti</SelectItem>
          {clienti.filter(Boolean).map((cliente) => (
            <SelectItem key={cliente} value={cliente!}>
              {cliente}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.modello || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, modello: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Modello" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i modelli</SelectItem>
          {modelli.filter(Boolean).map((modello) => (
            <SelectItem key={modello} value={modello!}>
              {modello}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.processo || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, processo: value === 'all' ? null : value })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Processo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i processi</SelectItem>
          {processi.map((processo) => (
            <SelectItem key={processo.id} value={processo.id}>
              {processo.descrizione}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Checkbox
          id="soloRitardi"
          checked={filters.soloRitardi}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, soloRitardi: checked === true })
          }
        />
        <Label htmlFor="soloRitardi" className="text-sm cursor-pointer">
          Solo in ritardo
        </Label>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}

      <div className="ml-auto text-sm text-muted-foreground">
        Mostrando {filteredKanbans} di {totalKanbans} kanban
      </div>
    </div>
  )
}
