/**
 * Seeds the exercise library on first run.
 * Called from main.tsx after DB is ready.
 */
import { db } from './schema'
import type { Exercise } from '@/types'

const EXERCISES: Omit<Exercise, 'id'>[] = [
  // ── TRICEPS ──────────────────────────────────────────────────────────────────
  { name: 'Quad (cable)', category: 'shoulders_triceps', isStarred: false, defaultWeight: 14, weightUnit: 'kg' },
  { name: 'Pulldown Ropes', category: 'shoulders_triceps', isStarred: false, defaultWeight: 32.5, weightUnit: 'kg' },
  { name: 'Overhead Pull', category: 'shoulders_triceps', isStarred: false, defaultWeight: 18.75, weightUnit: 'kg' },
  { name: 'Fixed Handle Pulldown', category: 'shoulders_triceps', isStarred: false, defaultWeight: 36.25, weightUnit: 'kg' },
  { name: 'Quad + Core', category: 'shoulders_triceps', isStarred: false, defaultWeight: 18, weightUnit: 'kg' },
  { name: 'Band Pull', category: 'shoulders_triceps', isStarred: false, weightUnit: 'band', bandLevel: 'Band 5' },
  { name: 'Pulldown', category: 'shoulders_triceps', isStarred: false, defaultWeight: 21, weightUnit: 'kg' },
  { name: 'Straight Arm Pulldown (Triceps)', category: 'shoulders_triceps', isStarred: false, defaultWeight: 16.25, weightUnit: 'kg' },
  { name: 'Skull Crushers', category: 'shoulders_triceps', isStarred: false, defaultWeight: 10, weightUnit: 'kg' },
  { name: 'Tricep Press', category: 'shoulders_triceps', isStarred: false, defaultWeight: 55, weightUnit: 'kg' },
  { name: 'Reverse Curl', category: 'shoulders_triceps', isStarred: false, defaultWeight: 17.5, weightUnit: 'kg' },
  { name: 'Dips', category: 'shoulders_triceps', isStarred: true, defaultWeight: 10, defaultWeightAlt: 15, weightUnit: 'kg' },

  // ── CHEST ──────────────────────────────────────────────────────────────────
  { name: 'Dumbbell Press', category: 'chest_triceps', isStarred: false, defaultWeight: 20, defaultWeightAlt: 25, weightUnit: 'kg' },
  { name: 'Chest Press Machine', category: 'chest_triceps', isStarred: false, defaultWeight: 20, weightUnit: 'kg' },
  { name: 'Bench Press Variation', category: 'chest_triceps', isStarred: false, defaultWeight: 30, weightUnit: 'kg' },
  { name: 'Flys (machine)', category: 'chest_triceps', isStarred: false, defaultWeight: 75, defaultWeightAlt: 80, weightUnit: 'kg' },
  { name: 'Upper Chest Fly', category: 'chest_triceps', isStarred: false, defaultWeight: 11.25, weightUnit: 'kg' },
  { name: 'Push Ups (power station)', category: 'chest_triceps', isStarred: false, defaultWeight: 5, weightUnit: 'kg', notes: 'Level 5' },
  { name: 'Push Ups (hand release)', category: 'chest_triceps', isStarred: false, defaultWeight: 7, weightUnit: 'kg', notes: 'Level 7' },
  { name: 'Dips', category: 'chest_triceps', isStarred: true, defaultWeight: 10, defaultWeightAlt: 15, weightUnit: 'kg' },
  { name: 'Bench Press', category: 'chest_triceps', isStarred: false, defaultWeight: 50, defaultWeightAlt: 60, weightUnit: 'kg' },
  { name: 'Bench Machine', category: 'chest_triceps', isStarred: false, defaultWeight: 25, weightUnit: 'kg' },

  // ── BACK ──────────────────────────────────────────────────────────────────
  { name: 'Chin Up (standard)', category: 'back_biceps', isStarred: false, defaultWeight: 0, weightUnit: 'kg', notes: 'Bodyweight' },
  { name: 'Band Chin Up (wide)', category: 'back_biceps', isStarred: false, weightUnit: 'band', bandLevel: 'Band 9' },
  { name: 'Pulldown', category: 'back_biceps', isStarred: false, defaultWeight: 70, defaultWeightAlt: 80, weightUnit: 'kg' },
  { name: 'Pulldown (RM grip)', category: 'back_biceps', isStarred: false, defaultWeight: 80, weightUnit: 'kg' },
  { name: 'Pull Down Row', category: 'back_biceps', isStarred: false, defaultWeight: 67, weightUnit: 'kg' },
  { name: 'Seated Machine Row', category: 'back_biceps', isStarred: false, defaultWeight: 75, weightUnit: 'kg' },
  { name: 'Row', category: 'back_biceps', isStarred: false, defaultWeight: 60, defaultWeightAlt: 70, weightUnit: 'kg' },
  { name: 'Row (curl grip)', category: 'back_biceps', isStarred: false, defaultWeight: 70, weightUnit: 'kg' },
  { name: 'Lying Pull', category: 'back_biceps', isStarred: false, defaultWeight: 4, weightUnit: 'kg', notes: 'Level 4' },
  { name: 'Top Back Pull', category: 'back_biceps', isStarred: false, defaultWeight: 36.5, weightUnit: 'kg', notes: 'Rename needed' },
  { name: 'Flys (back)', category: 'back_biceps', isStarred: false, defaultWeight: 68, weightUnit: 'kg' },
  { name: 'Machine Single Arm Pull', category: 'back_biceps', isStarred: false, defaultWeight: 55, weightUnit: 'kg' },
  { name: 'Machine Row Pulldown', category: 'back_biceps', isStarred: false, defaultWeight: 67, weightUnit: 'kg' },
  { name: 'Face Pull', category: 'back_biceps', isStarred: false, defaultWeight: 21, weightUnit: 'kg' },
  { name: 'Single Arm Row Machine', category: 'back_biceps', isStarred: false, defaultWeight: 50, weightUnit: 'kg' },
  { name: 'Single Arm Pulldown', category: 'back_biceps', isStarred: false, defaultWeight: 35, weightUnit: 'kg' },
  { name: 'Seated Single Arm Pull', category: 'back_biceps', isStarred: false, defaultWeight: 35, weightUnit: 'kg' },
  { name: 'Dumbbell Row', category: 'back_biceps', isStarred: false, defaultWeight: 37.5, defaultWeightAlt: 40, weightUnit: 'kg' },
  { name: 'New Grip Pulldown', category: 'back_biceps', isStarred: false, defaultWeight: 77, defaultWeightAlt: 57, weightUnit: 'kg' },
  { name: 'Straight Arm Pulldown (Back)', category: 'back_biceps', isStarred: false, defaultWeight: 32.5, weightUnit: 'kg' },
  { name: 'Handle Pulldown', category: 'back_biceps', isStarred: false, defaultWeight: 77, weightUnit: 'kg' },
  { name: 'High Row', category: 'back_biceps', isStarred: false, defaultWeight: 40, defaultWeightAlt: 32.5, weightUnit: 'kg' },
  { name: 'ISO Lateral', category: 'back_biceps', isStarred: false, defaultWeight: 40, weightUnit: 'kg' },
  { name: 'ISO Lateral Low', category: 'back_biceps', isStarred: false, defaultWeight: 40, weightUnit: 'kg' },
  { name: 'Band Single Arm Pulldown', category: 'back_biceps', isStarred: false, weightUnit: 'band' },
  { name: 'Band Row', category: 'back_biceps', isStarred: false, weightUnit: 'band' },
  { name: 'Band Double Pull', category: 'back_biceps', isStarred: false, weightUnit: 'band' },

  // ── BICEPS ──────────────────────────────────────────────────────────────────
  { name: 'Bar Curl', category: 'back_biceps', isStarred: false, defaultWeight: 37.5, weightUnit: 'kg' },
  { name: 'Sitting Curl', category: 'back_biceps', isStarred: false, defaultWeight: 15, defaultWeightAlt: 20, weightUnit: 'kg' },
  { name: 'Standing Dumbbell Curl', category: 'back_biceps', isStarred: false, defaultWeight: 15, weightUnit: 'kg' },
  { name: 'Band Curl', category: 'back_biceps', isStarred: false, weightUnit: 'band', bandLevel: 'Band 4' },
  { name: 'Cable Curl', category: 'back_biceps', isStarred: false, defaultWeight: 13.5, defaultWeightAlt: 11.25, weightUnit: 'kg' },
  { name: 'Standing Barbell Curl', category: 'back_biceps', isStarred: false, defaultWeight: 25, weightUnit: 'kg' },
  { name: 'Double Cable Pull', category: 'back_biceps', isStarred: false, defaultWeight: 11.25, weightUnit: 'kg' },

  // ── LEGS & CALVES ──────────────────────────────────────────────────────────
  { name: 'Calf Half Press', category: 'legs', isStarred: false, defaultWeight: 80, defaultWeightAlt: 120, weightUnit: 'kg' },
  { name: 'Squats (dumbbell)', category: 'legs', isStarred: false, defaultWeight: 12, weightUnit: 'kg' },
  { name: 'Bar Squat', category: 'legs', isStarred: false, defaultWeight: 20, weightUnit: 'kg' },
  { name: 'Back Squat', category: 'legs', isStarred: false, defaultWeight: 60, defaultWeightAlt: 80, weightUnit: 'kg' },
  { name: 'Lunges', category: 'legs', isStarred: false, defaultWeight: 15, weightUnit: 'kg' },
  { name: 'Deadlift Machine', category: 'legs', isStarred: false, defaultWeight: 70, defaultWeightAlt: 80, weightUnit: 'kg' },
  { name: 'Squat Press', category: 'legs', isStarred: false, defaultWeight: 50, defaultWeightAlt: 80, weightUnit: 'kg' },
  { name: 'Back Squat Press', category: 'legs', isStarred: false, defaultWeight: 60, weightUnit: 'kg' },
  { name: 'Glute Press', category: 'legs', isStarred: false, defaultWeight: 60, weightUnit: 'kg' },
  { name: 'Seated Glute Press', category: 'legs', isStarred: false, defaultWeight: 80, weightUnit: 'kg' },
  { name: 'Stand Up Squat Machine', category: 'legs', isStarred: false, defaultWeight: 10, weightUnit: 'kg' },
  { name: 'Lunge Walk', category: 'legs', isStarred: false, defaultWeight: 0, weightUnit: 'kg', notes: 'Bodyweight or 10kg' },
  { name: 'Single Leg Squat', category: 'legs', isStarred: false, defaultWeight: 10, weightUnit: 'kg' },
  { name: 'Leg Curl', category: 'legs', isStarred: false, defaultWeight: 25, weightUnit: 'kg' },
]

export async function seedExercises(): Promise<void> {
  const count = await db.exercises.count()
  if (count > 0) return  // Already seeded

  await db.exercises.bulkAdd(EXERCISES)
  console.log(`✅ Seeded ${EXERCISES.length} exercises`)
}

export async function seedInitialPhase(): Promise<void> {
  const count = await db.phases.count()
  if (count > 0) return  // Already set up

  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 8 * 7)  // 8 weeks

  const phaseId = await db.phases.add({
    type: 'hypertrophy',
    name: 'Hypertrophy',
    goal: 'Muscle growth',
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    durationWeeks: 8,
    repRangeMin: 8,
    repRangeMax: 12,
    isActive: true,
  })

  // Create 4 week cycles (3 build + 1 deload)
  const weekTypes: Array<{ weekNumber: 1 | 2 | 3 | 4; type: 'build' | 'overload' | 'deload'; isDeload: boolean }> = [
    { weekNumber: 1, type: 'build', isDeload: false },
    { weekNumber: 2, type: 'build', isDeload: false },
    { weekNumber: 3, type: 'overload', isDeload: false },
    { weekNumber: 4, type: 'deload', isDeload: true },
  ]

  for (const week of weekTypes) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() + (week.weekNumber - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    await db.weekCycles.add({
      phaseId: phaseId as number,
      ...week,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
    })
  }

  console.log('✅ Seeded initial Hypertrophy phase')
}
