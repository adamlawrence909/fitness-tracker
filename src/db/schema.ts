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

    // v2: atomic muscle-group categories + workoutTemplateId on sessions
    this.version(2).stores({
      users: '++id, name',
      phases: '++id, type, isActive, startDate, endDate',
      weekCycles: '++id, phaseId, weekNumber, isDeload, startDate',
      workoutSessions: '++id, date, category, workoutTemplateId, cycleWeekId, phaseId, completedAt',
      exercises: '++id, name, category, isStarred',
      exerciseSets: '++id, sessionId, exerciseId, isPB, createdAt',
      runs: '++id, sessionId, date, mode, routeId',
      routePoints: '++id, runId, timestamp',
      savedRoutes: '++id, name',
    }).upgrade(async tx => {

      // ── 1. Remap compound session categories → atomic + set templateId ──────
      // Old compound category becomes the templateId; sessions are remapped to
      // the primary muscle group that was actually trained.
      const sessionCategoryRemap: Record<string, string> = {
        shoulders_triceps: 'triceps',  // no shoulder exercises existed pre-v2
        back_biceps:       'back',
        chest_triceps:     'chest',
      }

      await tx.table('workoutSessions').toCollection().modify((session: any) => {
        const atomic = sessionCategoryRemap[session.category]
        if (atomic) {
          session.workoutTemplateId = session.category  // keep original as template link
          session.category = atomic
        }
      })

      // ── 2. Remap exercises to atomic categories (keyed by oldCategory::name) ─
      // Using compound key avoids mismatches for exercises that share a name
      // across different old categories (e.g. "Pulldown", "Dips").
      const exerciseCategoryRemap: Record<string, string> = {
        // shoulders_triceps → all were tricep movements
        'shoulders_triceps::Quad (cable)':                    'triceps',
        'shoulders_triceps::Pulldown Ropes':                  'triceps',
        'shoulders_triceps::Overhead Pull':                   'triceps',
        'shoulders_triceps::Fixed Handle Pulldown':           'triceps',
        'shoulders_triceps::Quad + Core':                     'triceps',
        'shoulders_triceps::Band Pull':                       'triceps',
        'shoulders_triceps::Pulldown':                        'triceps',
        'shoulders_triceps::Straight Arm Pulldown (Triceps)': 'triceps',
        'shoulders_triceps::Skull Crushers':                  'triceps',
        'shoulders_triceps::Tricep Press':                    'triceps',
        'shoulders_triceps::Reverse Curl':                    'triceps',
        'shoulders_triceps::Dips':                            'triceps',

        // chest_triceps → chest exercises
        'chest_triceps::Dumbbell Press':          'chest',
        'chest_triceps::Chest Press Machine':     'chest',
        'chest_triceps::Bench Press Variation':   'chest',
        'chest_triceps::Flys (machine)':          'chest',
        'chest_triceps::Upper Chest Fly':         'chest',
        'chest_triceps::Push Ups (power station)':'chest',
        'chest_triceps::Push Ups (hand release)': 'chest',
        'chest_triceps::Dips':                    'chest',
        'chest_triceps::Bench Press':             'chest',
        'chest_triceps::Bench Machine':           'chest',

        // back_biceps → back
        'back_biceps::Chin Up (standard)':        'back',
        'back_biceps::Band Chin Up (wide)':       'back',
        'back_biceps::Pulldown':                  'back',
        'back_biceps::Pulldown (RM grip)':        'back',
        'back_biceps::Pull Down Row':             'back',
        'back_biceps::Seated Machine Row':        'back',
        'back_biceps::Row':                       'back',
        'back_biceps::Row (curl grip)':           'back',
        'back_biceps::Lying Pull':                'back',
        'back_biceps::Top Back Pull':             'back',
        'back_biceps::Flys (back)':               'back',
        'back_biceps::Machine Single Arm Pull':   'back',
        'back_biceps::Machine Row Pulldown':      'back',
        'back_biceps::Face Pull':                 'back',
        'back_biceps::Single Arm Row Machine':    'back',
        'back_biceps::Single Arm Pulldown':       'back',
        'back_biceps::Seated Single Arm Pull':    'back',
        'back_biceps::Dumbbell Row':              'back',
        'back_biceps::New Grip Pulldown':         'back',
        'back_biceps::Straight Arm Pulldown (Back)': 'back',
        'back_biceps::Handle Pulldown':           'back',
        'back_biceps::High Row':                  'back',
        'back_biceps::ISO Lateral':               'back',
        'back_biceps::ISO Lateral Low':           'back',
        'back_biceps::Band Single Arm Pulldown':  'back',
        'back_biceps::Band Row':                  'back',
        'back_biceps::Band Double Pull':          'back',

        // back_biceps → biceps
        'back_biceps::Bar Curl':                  'biceps',
        'back_biceps::Sitting Curl':              'biceps',
        'back_biceps::Standing Dumbbell Curl':    'biceps',
        'back_biceps::Band Curl':                 'biceps',
        'back_biceps::Cable Curl':                'biceps',
        'back_biceps::Standing Barbell Curl':     'biceps',
        'back_biceps::Double Cable Pull':         'biceps',

        // legs & pilates stay as-is (no remap needed)
      }

      await tx.table('exercises').toCollection().modify((exercise: any) => {
        const key = `${exercise.category}::${exercise.name}`
        const newCategory = exerciseCategoryRemap[key]
        if (newCategory) exercise.category = newCategory
      })

      // ── 3. Add new shoulder exercises ────────────────────────────────────────
      const shoulderExercises = [
        { name: 'Arnold Press',            category: 'shoulders', isStarred: false, defaultWeight: 14,  weightUnit: 'kg' },
        { name: 'Barbell Shoulder Press',  category: 'shoulders', isStarred: false, defaultWeight: 40,  weightUnit: 'kg' },
        { name: 'Dumbbell Shoulder Press', category: 'shoulders', isStarred: false, defaultWeight: 16,  weightUnit: 'kg' },
        { name: 'Dumbbell Lateral Raise',  category: 'shoulders', isStarred: false, defaultWeight: 8,   weightUnit: 'kg' },
        { name: 'Cable Lateral Raise',     category: 'shoulders', isStarred: false, defaultWeight: 6,   weightUnit: 'kg' },
        { name: 'Front Raise',             category: 'shoulders', isStarred: false, defaultWeight: 8,   weightUnit: 'kg' },
        { name: 'Rear Delt Fly (machine)', category: 'shoulders', isStarred: false, defaultWeight: 50,  weightUnit: 'kg' },
        { name: 'Upright Row',             category: 'shoulders', isStarred: false, defaultWeight: 30,  weightUnit: 'kg' },
        { name: 'Face Pull (shoulders)',   category: 'shoulders', isStarred: false, defaultWeight: 20,  weightUnit: 'kg' },
        { name: 'Shrugs',                  category: 'shoulders', isStarred: false, defaultWeight: 20,  weightUnit: 'kg' },
      ]

      await tx.table('exercises').bulkAdd(shoulderExercises)
    })
  }
}

export const db = new WorkoutDB()
