import {
  format,
  startOfWeek,
  addDays,
  isToday,
  parseISO,
  differenceInWeeks,
} from 'date-fns'
import type { WeeklyScheduleDay, WorkoutTemplateId, Phase } from '@/types'
import { PHASE_CONFIGS, WORKOUT_TEMPLATES } from '@/types'

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

export function getTemplateLabel(templateId: WorkoutTemplateId | null): string {
  if (!templateId) return 'Rest'
  return WORKOUT_TEMPLATES[templateId]?.name ?? templateId
}

export function getTemplateEmoji(templateId: WorkoutTemplateId | null): string {
  if (!templateId) return '😴'
  return WORKOUT_TEMPLATES[templateId]?.emoji ?? '🏋️'
}

export function getWeeklySchedule(
  phase: Phase | null,
  sessions: Array<{ date: string; workoutTemplateId?: string }>,
  isDeloadWeek: boolean
): WeeklyScheduleDay[] {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

  const schedule =
    phase ? PHASE_CONFIGS[phase.type].schedule : PHASE_CONFIGS.hypertrophy.schedule

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    const dayName = DAY_NAMES[date.getDay()]
    const templateId = (schedule[dayName] ?? null) as WorkoutTemplateId | null
    const dateStr = format(date, 'yyyy-MM-dd')

    // A day is "done" if any session logged that day matches the scheduled template
    const hasSession = sessions.some(
      s => s.date === dateStr && (
        !templateId ||
        s.workoutTemplateId === templateId ||
        // backwards compat: old sessions without templateId but logged on same date
        s.workoutTemplateId === undefined
      )
    )

    return {
      date: dateStr,
      dayName: format(date, 'EEE'),
      templateId,
      categoryLabel: getTemplateLabel(templateId),
      hasSession,
      isToday: isToday(date),
      isDeloadWeek,
    }
  })
}

// ─── Deload Calculation ────────────────────────────────────────────────────────

export function getDeloadWeight(week3Weight: number): { min: number; max: number } {
  return {
    min: Math.round(week3Weight * 0.5 * 4) / 4,
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
