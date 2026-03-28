import {
  format,
  startOfWeek,
  addDays,
  isToday,
  parseISO,
  differenceInWeeks,
  isSameDay,
} from 'date-fns'
import type { WeeklyScheduleDay, WorkoutCategory, Phase, WeekCycle } from '@/types'
import { PHASE_CONFIGS } from '@/types'

// ─── Formatting ────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60)
  const secs = Math.round(secondsPerKm % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}/km`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(2)}km`
}

// ─── Weekly Schedule ───────────────────────────────────────────────────────────

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const CATEGORY_LABELS: Record<WorkoutCategory | string, string> = {
  shoulders_triceps: 'Shoulders + Triceps',
  back_biceps: 'Back + Biceps',
  chest_triceps: 'Chest + Triceps',
  legs: 'Legs',
  pilates: 'Pilates',
  run: 'Run',
  walk: 'Walk',
  cycle: 'Cycle',
  free: 'Free Activity',
}

export function getWeeklySchedule(
  phase: Phase | null,
  sessions: Array<{ date: string; category: WorkoutCategory }>,
  isDeloadWeek: boolean
): WeeklyScheduleDay[] {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

  const schedule =
    phase ? PHASE_CONFIGS[phase.type].schedule : PHASE_CONFIGS.hypertrophy.schedule

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayName = DAY_NAMES[date.getDay()]
    const category = schedule[dayName] as WorkoutCategory | null
    const dateStr = format(date, 'yyyy-MM-dd')
    const hasSession = sessions.some(s => s.date === dateStr)
    const matchingSession = sessions.find(s => s.date === dateStr)

    return {
      date: dateStr,
      dayName: format(date, 'EEE'),
      category,
      categoryLabel: category ? CATEGORY_LABELS[category] : 'Rest',
      hasSession,
      sessionId: matchingSession ? undefined : undefined, // will be filled from DB
      isToday: isToday(date),
      isDeloadWeek,
    }
  })
}

// ─── Deload Calculation ────────────────────────────────────────────────────────

export function getDeloadWeight(week3Weight: number): { min: number; max: number } {
  return {
    min: Math.round(week3Weight * 0.5 * 4) / 4,  // round to nearest 0.25
    max: Math.round(week3Weight * 0.6 * 4) / 4,
  }
}

export function getCurrentCycleWeek(phaseStartDate: string): 1 | 2 | 3 | 4 {
  const start = parseISO(phaseStartDate)
  const weeks = differenceInWeeks(new Date(), start)
  return ((weeks % 4) + 1) as 1 | 2 | 3 | 4
}

// ─── Phase Helpers ─────────────────────────────────────────────────────────────

export function getPhaseProgress(phase: Phase): { weeksCompleted: number; totalWeeks: number; percentComplete: number } {
  const start = parseISO(phase.startDate)
  const weeksCompleted = Math.min(
    differenceInWeeks(new Date(), start),
    phase.durationWeeks
  )
  return {
    weeksCompleted,
    totalWeeks: phase.durationWeeks,
    percentComplete: Math.round((weeksCompleted / phase.durationWeeks) * 100),
  }
}
