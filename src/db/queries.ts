/**
 * Data Access Layer
 * All DB interactions go through here so we can swap IndexedDB → Postgres later.
 */

import { db } from './schema'
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
  WorkoutCategory,
  PhaseType,
  ExerciseWithSets,
  SessionSummary,
} from '@/types'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'

// ─── User ──────────────────────────────────────────────────────────────────────

export async function getUser(): Promise<User | undefined> {
  return db.users.get(1)
}

export async function upsertUser(data: Partial<User>): Promise<void> {
  const existing = await getUser()
  if (existing) {
    await db.users.update(1, data)
  } else {
    await db.users.add({
      id: 1,
      name: 'Adam',
      settings: { theme: 'dark', weightUnit: 'kg' },
      createdAt: new Date(),
      ...data,
    })
  }
}

// ─── Phases ────────────────────────────────────────────────────────────────────

export async function getActivePhase(): Promise<Phase | undefined> {
  return db.phases.where('isActive').equals(1).first()
}

export async function getAllPhases(): Promise<Phase[]> {
  return db.phases.orderBy('startDate').reverse().toArray()
}

export async function createPhase(data: Omit<Phase, 'id'>): Promise<number> {
  // Deactivate current active phase
  await db.phases.where('isActive').equals(1).modify({ isActive: false })
  return db.phases.add(data)
}

export async function updatePhase(id: number, data: Partial<Phase>): Promise<void> {
  await db.phases.update(id, data)
}

// ─── Week Cycles ───────────────────────────────────────────────────────────────

export async function getCurrentWeekCycle(): Promise<WeekCycle | undefined> {
  const today = format(new Date(), 'yyyy-MM-dd')
  return db.weekCycles
    .filter(wc => wc.startDate <= today && wc.endDate >= today)
    .first()
}

export async function getWeekCyclesForPhase(phaseId: number): Promise<WeekCycle[]> {
  return db.weekCycles.where('phaseId').equals(phaseId).sortBy('startDate')
}

export async function createWeekCycle(data: Omit<WeekCycle, 'id'>): Promise<number> {
  return db.weekCycles.add(data)
}

// ─── Workout Sessions ──────────────────────────────────────────────────────────

export async function getTodaySession(
  category: WorkoutCategory
): Promise<WorkoutSession | undefined> {
  const today = format(new Date(), 'yyyy-MM-dd')
  return db.workoutSessions
    .filter(s => s.date === today && s.category === category)
    .first()
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<WorkoutSession[]> {
  return db.workoutSessions
    .filter(s => s.date >= startDate && s.date <= endDate)
    .sortBy('date')
}

export async function getRecentSessions(limit = 20): Promise<WorkoutSession[]> {
  return db.workoutSessions.orderBy('date').reverse().limit(limit).toArray()
}

export async function createSession(
  data: Omit<WorkoutSession, 'id'>
): Promise<number> {
  return db.workoutSessions.add(data)
}

export async function updateSession(
  id: number,
  data: Partial<WorkoutSession>
): Promise<void> {
  await db.workoutSessions.update(id, data)
}

export async function getSessionSummary(sessionId: number): Promise<SessionSummary | null> {
  const session = await db.workoutSessions.get(sessionId)
  if (!session) return null

  const sets = await db.exerciseSets.where('sessionId').equals(sessionId).toArray()
  const exerciseIds = [...new Set(sets.map(s => s.exerciseId))]
  const exercises = await Promise.all(exerciseIds.map(id => db.exercises.get(id)))

  const exercisesWithSets: ExerciseWithSets[] = exercises
    .filter(Boolean)
    .map(exercise => ({
      exercise: exercise!,
      sets: sets.filter(s => s.exerciseId === exercise!.id),
    }))

  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const pbCount = sets.filter(s => s.isPB).length

  return { session, exercisesWithSets, totalVolume, pbCount }
}

// ─── Exercises ─────────────────────────────────────────────────────────────────

export async function getExercisesByCategory(
  category: WorkoutCategory
): Promise<Exercise[]> {
  return db.exercises.where('category').equals(category).sortBy('name')
}

export async function getStarredExercises(
  category: WorkoutCategory
): Promise<Exercise[]> {
  return db.exercises
    .filter(e => e.category === category && e.isStarred)
    .toArray()
}

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy('name').toArray()
}

export async function createExercise(data: Omit<Exercise, 'id'>): Promise<number> {
  return db.exercises.add(data)
}

export async function updateExercise(id: number, data: Partial<Exercise>): Promise<void> {
  await db.exercises.update(id, data)
}

// ─── Exercise Sets ─────────────────────────────────────────────────────────────

export async function getSetsForSession(sessionId: number): Promise<ExerciseSet[]> {
  return db.exerciseSets.where('sessionId').equals(sessionId).sortBy('setNumber')
}

export async function getSetsForExercise(
  exerciseId: number,
  limit?: number
): Promise<ExerciseSet[]> {
  const query = db.exerciseSets
    .where('exerciseId')
    .equals(exerciseId)
    .reverse()
  return limit ? query.limit(limit).toArray() : query.toArray()
}

export async function addSet(data: Omit<ExerciseSet, 'id'>): Promise<number> {
  // Check for personal best
  const previousSets = await db.exerciseSets
    .where('exerciseId')
    .equals(data.exerciseId)
    .toArray()
  const maxVolume = Math.max(0, ...previousSets.map(s => s.weight * s.reps))
  const isPB = data.weight * data.reps > maxVolume

  return db.exerciseSets.add({ ...data, isPB })
}

export async function updateSet(id: number, data: Partial<ExerciseSet>): Promise<void> {
  await db.exerciseSets.update(id, data)
}

export async function deleteSet(id: number): Promise<void> {
  await db.exerciseSets.delete(id)
}

export async function getPersonalBest(exerciseId: number): Promise<ExerciseSet | undefined> {
  const sets = await db.exerciseSets
    .where('exerciseId')
    .equals(exerciseId)
    .toArray()
  if (!sets.length) return undefined
  return sets.reduce((best, s) =>
    s.weight * s.reps > best.weight * best.reps ? s : best
  )
}

// ─── Progress / History ────────────────────────────────────────────────────────

export async function getExerciseHistory(
  exerciseId: number,
  phaseType?: PhaseType
): Promise<Array<{ date: string; maxWeight: number; totalVolume: number; isDeload: boolean }>> {
  const sets = await db.exerciseSets.where('exerciseId').equals(exerciseId).toArray()

  // Group by session
  const sessionIds = [...new Set(sets.map(s => s.sessionId))]
  const sessions = await Promise.all(sessionIds.map(id => db.workoutSessions.get(id)))

  const rows = await Promise.all(
    sessions.filter(Boolean).map(async session => {
      const sessionSets = sets.filter(s => s.sessionId === session!.id)
      const weekCycle = session!.cycleWeekId
        ? await db.weekCycles.get(session!.cycleWeekId)
        : undefined

      return {
        date: session!.date,
        maxWeight: Math.max(...sessionSets.map(s => s.weight)),
        totalVolume: sessionSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
        isDeload: weekCycle?.isDeload ?? false,
        phaseId: session!.phaseId,
      }
    })
  )

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Runs ──────────────────────────────────────────────────────────────────────

export async function getRuns(limit = 50): Promise<Run[]> {
  return db.runs.orderBy('date').reverse().limit(limit).toArray()
}

export async function getRunById(id: number): Promise<Run | undefined> {
  return db.runs.get(id)
}

export async function createRun(data: Omit<Run, 'id'>): Promise<number> {
  return db.runs.add(data)
}

export async function updateRun(id: number, data: Partial<Run>): Promise<void> {
  await db.runs.update(id, data)
}

export async function addRoutePoints(points: Omit<RoutePoint, 'id'>[]): Promise<void> {
  await db.routePoints.bulkAdd(points)
}

export async function getRoutePoints(runId: number): Promise<RoutePoint[]> {
  return db.routePoints.where('runId').equals(runId).sortBy('timestamp')
}

// ─── Saved Routes ──────────────────────────────────────────────────────────────

export async function getSavedRoutes(): Promise<SavedRoute[]> {
  return db.savedRoutes.orderBy('name').toArray()
}

export async function createSavedRoute(data: Omit<SavedRoute, 'id'>): Promise<number> {
  return db.savedRoutes.add(data)
}

// ─── Export (for future Supabase migration) ────────────────────────────────────

export async function exportAllData() {
  const [users, phases, weekCycles, workoutSessions, exercises, exerciseSets, runs, routePoints] =
    await Promise.all([
      db.users.toArray(),
      db.phases.toArray(),
      db.weekCycles.toArray(),
      db.workoutSessions.toArray(),
      db.exercises.toArray(),
      db.exerciseSets.toArray(),
      db.runs.toArray(),
      db.routePoints.toArray(),
    ])

  return { users, phases, weekCycles, workoutSessions, exercises, exerciseSets, runs, routePoints }
}
