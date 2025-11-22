'use client'

import { useMemo } from 'react'
import { Kanban, Reparto } from '@/types/database'
import { KanbanMarker } from './KanbanMarker'
import { getWeekDates, formatDate, getDayName, isToday, isHoliday, isSameDay } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface HeijunkaGridProps {
  kanbans: Kanban[]
  reparti: Reparto[]
  onKanbanClick: (kanban: Kanban) => void
  loading: boolean
}

type SubRow = 'prossimamente' | 'in_attesa' | 'in_corso'

const subRowLabels: Record<SubRow, string> = {
  prossimamente: 'Prossimamente',
  in_attesa: 'In attesa',
  in_corso: 'In corso',
}

export function HeijunkaGrid({ kanbans, reparti, onKanbanClick, loading }: HeijunkaGridProps) {
  const dates = useMemo(() => getWeekDates(), [])

  // Group kanbans by reparto, subrow, and date
  const kanbanGrid = useMemo(() => {
    const grid: Record<string, Record<SubRow, Record<string, Kanban[]>>> = {}

    // Initialize grid
    reparti.forEach((reparto) => {
      grid[reparto.id] = {
        prossimamente: {},
        in_attesa: {},
        in_corso: {},
      }
      dates.forEach((date) => {
        const dateKey = formatDate(date, 'iso')
        grid[reparto.id].prossimamente[dateKey] = []
        grid[reparto.id].in_attesa[dateKey] = []
        grid[reparto.id].in_corso[dateKey] = []
      })
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = formatDate(today, 'iso')

    // Place main kanban markers
    kanbans.forEach((kanban) => {
      if (!kanban.reparto_corrente_id || !grid[kanban.reparto_corrente_id]) return

      const repartoGrid = grid[kanban.reparto_corrente_id]

      if (kanban.stato === 'in_attesa' || kanban.stato === 'attesa_convergenza') {
        // In attesa goes in today's column
        if (repartoGrid.in_attesa[todayKey]) {
          repartoGrid.in_attesa[todayKey].push(kanban)
        }
      } else if (kanban.stato === 'in_corso') {
        // In corso goes in today's column
        if (repartoGrid.in_corso[todayKey]) {
          repartoGrid.in_corso[todayKey].push(kanban)
        }

        // Create "prossimamente" markers for next activities
        if (kanban.data_prevista_fine) {
          const datePrevista = kanban.data_prevista_fine.split('T')[0]

          // Prossima attività 1
          if (kanban.reparto_prossima_attivita_1_id && grid[kanban.reparto_prossima_attivita_1_id]) {
            const targetGrid = grid[kanban.reparto_prossima_attivita_1_id]
            if (targetGrid.prossimamente[datePrevista]) {
              targetGrid.prossimamente[datePrevista].push({
                ...kanban,
                _isUpcoming: true,
                _upcomingIndex: 1,
              } as any)
            }
          }

          // Prossima attività 2
          if (kanban.reparto_prossima_attivita_2_id && grid[kanban.reparto_prossima_attivita_2_id]) {
            const targetGrid = grid[kanban.reparto_prossima_attivita_2_id]
            if (targetGrid.prossimamente[datePrevista]) {
              targetGrid.prossimamente[datePrevista].push({
                ...kanban,
                _isUpcoming: true,
                _upcomingIndex: 2,
              } as any)
            }
          }

          // Prossima attività 3
          if (kanban.reparto_prossima_attivita_3_id && grid[kanban.reparto_prossima_attivita_3_id]) {
            const targetGrid = grid[kanban.reparto_prossima_attivita_3_id]
            if (targetGrid.prossimamente[datePrevista]) {
              targetGrid.prossimamente[datePrevista].push({
                ...kanban,
                _isUpcoming: true,
                _upcomingIndex: 3,
              } as any)
            }
          }
        }
      }
    })

    return grid
  }, [kanbans, reparti, dates])

  if (loading && kanbans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (reparti.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nessun reparto configurato
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-white overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            <th className="border-b border-r p-2 text-left font-medium text-sm min-w-[150px] bg-gray-50">
              Reparto
            </th>
            {dates.map((date) => {
              const isDateToday = isToday(date)
              const isDateHoliday = isHoliday(date)
              return (
                <th
                  key={date.toISOString()}
                  className={cn(
                    'border-b border-r p-2 text-center font-medium text-sm min-w-[80px]',
                    isDateToday && 'bg-blue-50',
                    isDateHoliday && !isDateToday && 'bg-red-50'
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {getDayName(date)}
                  </div>
                  <div className={cn(isDateToday && 'font-bold text-primary')}>
                    {date.getDate()}
                  </div>
                  {isDateToday && (
                    <div className="text-[10px] text-primary font-semibold">
                      OGGI
                    </div>
                  )}
                  {isDateHoliday && (
                    <div className="text-[10px] text-red-600">
                      FESTIVO
                    </div>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {reparti.map((reparto) => (
            <>
              {/* Sub-rows for each department */}
              {(['prossimamente', 'in_attesa', 'in_corso'] as SubRow[]).map((subRow, subIndex) => (
                <tr key={`${reparto.id}-${subRow}`}>
                  {subIndex === 0 ? (
                    <td
                      rowSpan={3}
                      className="border-b border-r p-2 align-top bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: reparto.colore_hex }}
                        />
                        <span className="font-medium text-sm">{reparto.nome}</span>
                      </div>
                    </td>
                  ) : null}
                  {dates.map((date) => {
                    const dateKey = formatDate(date, 'iso')
                    const cellKanbans = kanbanGrid[reparto.id]?.[subRow]?.[dateKey] || []
                    const isDateToday = isToday(date)
                    const isDateHoliday = isHoliday(date)

                    return (
                      <td
                        key={`${reparto.id}-${subRow}-${dateKey}`}
                        className={cn(
                          'border-b border-r p-1 align-top heijunka-cell min-h-[40px]',
                          isDateToday && 'bg-blue-50/50',
                          isDateHoliday && !isDateToday && 'bg-red-50/50'
                        )}
                      >
                        <div className="flex flex-wrap gap-1">
                          {cellKanbans.slice(0, 5).map((kanban, index) => (
                            <KanbanMarker
                              key={`${kanban.id}-${index}`}
                              kanban={kanban}
                              isUpcoming={(kanban as any)._isUpcoming}
                              onClick={() => onKanbanClick(kanban)}
                            />
                          ))}
                          {cellKanbans.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              +{cellKanbans.length - 5}
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
