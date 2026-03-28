import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Phase, WeekCycle, WorkoutSession, Exercise, ExerciseSet } from '@/types'

// ─── Active Workout State ──────────────────────────────────────────────────────

interface ActiveSetEntry {
  exerciseId: number
  exercise: Exercise
  sets: Omit<ExerciseSet, 'id' | 'sessionId'>[]
}

interface AppState {
  // Current phase + cycle (loaded from DB, cached here)
  activePhase: Phase | null
  currentWeekCycle: WeekCycle | null
  isDeloadWeek: boolean

  // Active workout session
  activeSession: WorkoutSession | null
  activeSessionSets: ActiveSetEntry[]

  // Active run tracking
  isRunActive: boolean
  runStartTime: number | null
  runElapsedSeconds: number

  // UI state
  isLoading: boolean

  // Actions
  setActivePhase: (phase: Phase | null) => void
  setCurrentWeekCycle: (cycle: WeekCycle | null) => void
  setActiveSession: (session: WorkoutSession | null) => void
  addExerciseToSession: (exercise: Exercise) => void
  removeExerciseFromSession: (exerciseId: number) => void
  addSetToExercise: (exerciseId: number, set: Omit<ExerciseSet, 'id' | 'sessionId'>) => void
  updateSetInExercise: (exerciseId: number, setIndex: number, updates: Partial<ExerciseSet>) => void
  removeSetFromExercise: (exerciseId: number, setIndex: number) => void
  clearActiveSession: () => void
  startRun: () => void
  stopRun: () => void
  setRunElapsed: (seconds: number) => void
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activePhase: null,
      currentWeekCycle: null,
      isDeloadWeek: false,
      activeSession: null,
      activeSessionSets: [],
      isRunActive: false,
      runStartTime: null,
      runElapsedSeconds: 0,
      isLoading: false,

      setActivePhase: (phase) =>
        set({ activePhase: phase }),

      setCurrentWeekCycle: (cycle) =>
        set({ currentWeekCycle: cycle, isDeloadWeek: cycle?.isDeload ?? false }),

      setActiveSession: (session) =>
        set({ activeSession: session }),

      addExerciseToSession: (exercise) => {
        const existing = get().activeSessionSets.find(e => e.exerciseId === exercise.id)
        if (existing) return
        set(state => ({
          activeSessionSets: [
            ...state.activeSessionSets,
            { exerciseId: exercise.id!, exercise, sets: [] },
          ],
        }))
      },

      removeExerciseFromSession: (exerciseId) =>
        set(state => ({
          activeSessionSets: state.activeSessionSets.filter(e => e.exerciseId !== exerciseId),
        })),

      addSetToExercise: (exerciseId, setData) =>
        set(state => ({
          activeSessionSets: state.activeSessionSets.map(entry =>
            entry.exerciseId === exerciseId
              ? {
                  ...entry,
                  sets: [...entry.sets, {
                    ...setData,
                    exerciseId,
                    setNumber: entry.sets.length + 1,
                    isPB: false,
                    createdAt: new Date(),
                  }],
                }
              : entry
          ),
        })),

      updateSetInExercise: (exerciseId, setIndex, updates) =>
        set(state => ({
          activeSessionSets: state.activeSessionSets.map(entry =>
            entry.exerciseId === exerciseId
              ? {
                  ...entry,
                  sets: entry.sets.map((s, i) => i === setIndex ? { ...s, ...updates } : s),
                }
              : entry
          ),
        })),

      removeSetFromExercise: (exerciseId, setIndex) =>
        set(state => ({
          activeSessionSets: state.activeSessionSets.map(entry =>
            entry.exerciseId === exerciseId
              ? {
                  ...entry,
                  sets: entry.sets
                    .filter((_, i) => i !== setIndex)
                    .map((s, i) => ({ ...s, setNumber: i + 1 })),
                }
              : entry
          ),
        })),

      clearActiveSession: () =>
        set({ activeSession: null, activeSessionSets: [] }),

      startRun: () =>
        set({ isRunActive: true, runStartTime: Date.now(), runElapsedSeconds: 0 }),

      stopRun: () =>
        set({ isRunActive: false }),

      setRunElapsed: (seconds) =>
        set({ runElapsedSeconds: seconds }),

      setIsLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'workout-tracker-store',
      partialize: (state) => ({
        // Only persist session data — phase/cycle are reloaded from DB
        activeSession: state.activeSession,
        activeSessionSets: state.activeSessionSets,
        isRunActive: state.isRunActive,
        runStartTime: state.runStartTime,
        runElapsedSeconds: state.runElapsedSeconds,
      }),
    }
  )
)
