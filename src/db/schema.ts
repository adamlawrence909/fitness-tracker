import Dexie, { Table } from 'dexie'
import type {
  User,
  Phase,
  WeekCycle,
  WorkoutSession,
  Exercise,
  ExerciseSet,
  Run,
  RoutePoint,
  SavedRoute,
} from '@/types'

// ─── Database Schema ───────────────────────────────────────────────────────────

export class WorkoutDB extends Dexie {
  users!: Table<User>
  phases!: Table<Phase>
  weekCycles!: Table<WeekCycle>
  workoutSessions!: Table<WorkoutSession>
  exercises!: Table<Exercise>
  exerciseSets!: Table<ExerciseSet>
  runs!: Table<Run>
  routePoints!: Table<RoutePoint>
  savedRoutes!: Table<SavedRoute>

  constructor() {
    super('WorkoutTrackerDB')

    this.version(1).stores({
      users: '++id, name',
      phases: '++id, type, isActive, startDate, endDate',
      weekCycles: '++id, phaseId, weekNumber, isDeload, startDate',
      workoutSessions: '++id, date, category, cycleWeekId, phaseId, completedAt',
      exercises: '++id, name, category, isStarred',
      exerciseSets: '++id, sessionId, exerciseId, isPB, createdAt',
      runs: '++id, sessionId, date, mode, routeId',
      routePoints: '++id, runId, timestamp',
      savedRoutes: '++id, name',
    })
  }
}

export const db = new WorkoutDB()
