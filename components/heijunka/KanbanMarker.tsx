'use client'

import { Kanban } from '@/types/database'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertTriangle, Lock, Clock } from 'lucide-react'

interface KanbanMarkerProps {
  kanban: Kanban
  isUpcoming?: boolean
  onClick: () => void
}

export function KanbanMarker({ kanban, isUpcoming, onClick }: KanbanMarkerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isDelayed =
    kanban.stato === 'in_corso' &&
    kanban.data_prevista_fine &&
    new Date(kanban.data_prevista_fine) < today

  const isConvergence = kanban.stato === 'attesa_convergenza'

  const getMarkerClass = () => {
    if (isUpcoming) return 'kanban-marker upcoming'
    if (isDelayed) return 'kanban-marker delayed'
    if (isConvergence) return 'kanban-marker convergence'
    if (kanban.stato === 'in_attesa') return 'kanban-marker waiting'
    if (kanban.stato === 'in_corso') return 'kanban-marker in-progress'
    return 'kanban-marker'
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              getMarkerClass(),
              'flex items-center justify-center gap-1 px-2 py-1 text-xs font-bold'
            )}
          >
            <span>{kanban.numero_display}</span>
            {isUpcoming && <Clock className="h-3 w-3" />}
            {isDelayed && <AlertTriangle className="h-3 w-3" />}
            {isConvergence && <Lock className="h-3 w-3" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="space-y-1">
            <p className="font-semibold">Kanban #{kanban.numero_display}</p>
            {kanban.cliente && (
              <p className="text-xs">
                <span className="text-muted-foreground">Cliente:</span> {kanban.cliente}
              </p>
            )}
            <p className="text-xs">
              <span className="text-muted-foreground">Progetto:</span> {kanban.nome_progetto}
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Attività:</span>{' '}
              {kanban.descrizione_attivita_corrente}
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Reparto:</span>{' '}
              {kanban.descrizione_reparto_corrente}
            </p>
            {isDelayed && (
              <p className="text-xs text-red-600 font-semibold">
                IN RITARDO
              </p>
            )}
            {isConvergence && (
              <p className="text-xs text-yellow-700">
                In attesa completamento altre fasi
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Click per dettagli
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
