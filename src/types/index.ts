// ─── Core Enums ───────────────────────────────────────────────────────────────

export type PhaseType = 'hypertrophy' | 'strength' | 'endurance' | 'deload'
export type WeekType = 'build' | 'overload' | 'deload'
export type WorkoutCategory =
  | 'shoulders_triceps'
  | 'back_biceps'
  | 'chest_triceps'
  | 'legs'
  | 'pilates'
  | 'run'
  | 'walk'
  | 'cycle'
  | 'free'
export type ActivityMode = 'run' | 'walk' | 'cycle' | 'pilates' | 'free'
export type WeightUnit = 'kg' | 'band'

// ─── Database Models ───────────────────────────────────────────────────────────

export interface User {
  id?: number
  name: string
  settings: UserSettings
  createdAt: Date
}

export interface UserSettings {
  phaseStartDate?: string  // ISO date string
  currentPhaseId?: number
  theme: 'dark' | 'light'
  weightUnit: 'kg' | 'lb'
}

export interface Phase {
  id?: number
  type: PhaseType
  name: string
  goal: string
  startDate: string  // ISO date string
  endDate: string    // ISO date string
  durationWeeks: number
  repRangeMin: number
  repRangeMax: number
  isActive: boolean
}

export interface WeekCycle {
  id?: number
  phaseId: number
  weekNumber: 1 | 2 | 3 | 4
  type: WeekType
  isDeload: boolean
  startDate: string  // ISO date string
  endDate: string    // ISO date string
}

export interface WorkoutSession {
  id?: number
  date: string         // ISO date string
  category: WorkoutCategory
  cycleWeekId?: number
  phaseId?: number
  durationMinutes?: number
  notes?: string
  completedAt?: string // ISO date string
}

export interface Exercise {
  id?: number
  name: string
  category: WorkoutCategory
  isStarred: boolean
  defaultWeight?: number
  defaultWeightAlt?: number  // For exercises with two common weights
  weightUnit: WeightUnit
  bandLevel?: string         // e.g. "Band 5", "Band 9"
  notes?: string
}

export interface ExerciseSet {
  id?: number
  sessionId: number
  exerciseId: number
  setNumber: number
  weight: number
  weightUnit: WeightUnit
  reps: number
  notes?: string
  isPB: boolean         // personal best flag
  createdAt: Date
}

export interface Run {
  id?: number
  sessionId?: number
  date: string           // ISO date string
  mode: ActivityMode
  name?: string          // e.g. "Morning Loop"
  routeId?: number       // link to a saved route
  distanceMeters: number
  durationSeconds: number
  avgPaceSecondsPerKm: number
  fastestKmSplit?: number    // seconds
  fastest100m?: number       // seconds
  elevationGainMeters?: number
  elevationLossMeters?: number
  estimatedCalories?: number
  notes?: string
}

export interface RoutePoint {
  id?: number
  runId: number
  lat: number
  lng: number
  timestamp: number   // Unix ms
  altitude?: number
  accuracy?: number
}

export interface SavedRoute {
  id?: number
  name: string
  distanceMeters: number
  createdAt: Date
  runCount: number
}

// ─── Derived / UI Types ────────────────────────────────────────────────────────

export interface KmSplit {
  km: number
  paceSeconds: number
  isNegativeSplit: boolean  // faster than previous km
}

export interface ExerciseWithSets {
  exercise: Exercise
  sets: ExerciseSet[]
}

export interface SessionSummary {
  session: WorkoutSession
  exercisesWithSets: ExerciseWithSets[]
  totalVolume: number  // sum of weight × reps × sets
  pbCount: number
}

export interface ProgressDataPoint {
  date: string
  value: number
  isDeload: boolean
  phaseType: PhaseType
}

export interface WeeklyScheduleDay {
  date: string               // ISO date string
  dayName: string
  category: WorkoutCategory | null
  categoryLabel: string
  hasSession: boolean
  sessionId?: number
  isToday: boolean
  isDeloadWeek: boolean
}

// ─── Phase Config ──────────────────────────────────────────────────────────────

export interface PhaseConfig {
  type: PhaseType
  name: string
  goal: string
  durationWeeks: number
  repRangeMin: number
  repRangeMax: number
  suggestedNextPhase: PhaseType
  schedule: Record<string, WorkoutCategory | null>
}

export const PHASE_CONFIGS: Record<PhaseType, PhaseConfig> = {
  hypertrophy: {
    type: 'hypertrophy',
    name: 'Hypertrophy',
    goal: 'Muscle growth',
    durationWeeks: 8,
    repRangeMin: 8,
    repRangeMax: 12,
    suggestedNextPhase: 'strength',
    schedule: {
      monday: 'shoulders_triceps',
      tuesday: 'back_biceps',
      wednesday: 'run',
      thursday: 'chest_triceps',
      friday: 'legs',
      saturday: 'pilates',
      sunday: 'pilates',
    },
  },
  strength: {
    type: 'strength',
    name: 'Strength',
    goal: 'Max strength',
    durationWeeks: 6,
    repRangeMin: 3,
    repRangeMax: 6,
    suggestedNextPhase: 'endurance',
    schedule: {
      monday: 'shoulders_triceps',
      tuesday: 'back_biceps',
      wednesday: 'run',
      thursday: 'chest_triceps',
      friday: 'legs',
      saturday: 'pilates',
      sunday: 'pilates',
    },
  },
  endurance: {
    type: 'endurance',
    name: 'Endurance',
    goal: 'Muscular endurance',
    durationWeeks: 4,
    repRangeMin: 15,
    repRangeMax: 20,
    suggestedNextPhase: 'hypertrophy',
    schedule: {
      monday: 'shoulders_triceps',
      tuesday: 'back_biceps',
      wednesday: 'run',
      thursday: 'chest_triceps',
      friday: 'legs',
      saturday: 'pilates',
      sunday: 'pilates',
    },
  },
  deload: {
    type: 'deload',
    name: 'Deload',
    goal: 'Recovery',
    durationWeeks: 1,
    repRangeMin: 8,
    repRangeMax: 15,
    suggestedNextPhase: 'hypertrophy',
    schedule: {
      monday: 'shoulders_triceps',
      tuesday: 'back_biceps',
      wednesday: 'run',
      thursday: 'chest_triceps',
      friday: 'legs',
      saturday: 'pilates',
      sunday: null,
    },
  },
}
