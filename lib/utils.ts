import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const options: Intl.DateTimeFormatOptions = format === 'long'
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }

  if (format === 'iso') {
    return d.toISOString().split('T')[0]
  }

  return d.toLocaleDateString('it-IT', options)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getWeekDates(): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust for Monday start

  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const dates: Date[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }

  return dates
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  // Italian holidays (fixed dates)
  const fixedHolidays = [
    [0, 1],   // 1 Gennaio - Capodanno
    [0, 6],   // 6 Gennaio - Epifania
    [3, 25],  // 25 Aprile - Liberazione
    [4, 1],   // 1 Maggio - Festa del lavoro
    [5, 2],   // 2 Giugno - Festa della Repubblica
    [7, 15],  // 15 Agosto - Ferragosto
    [10, 1],  // 1 Novembre - Tutti i Santi
    [11, 8],  // 8 Dicembre - Immacolata
    [11, 25], // 25 Dicembre - Natale
    [11, 26], // 26 Dicembre - Santo Stefano
  ]

  if (fixedHolidays.some(([m, d]) => month === m && day === d)) {
    return true
  }

  // Easter calculation (approximate for relevant years)
  const easter = calculateEaster(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)

  if (date.toDateString() === easter.toDateString() ||
      date.toDateString() === easterMonday.toDateString()) {
    return true
  }

  return false
}

function calculateEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month, day)
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString('it-IT', { weekday: 'short' })
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}

export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay))
}
