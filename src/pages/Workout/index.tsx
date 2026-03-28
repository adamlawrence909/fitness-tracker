import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Plus, ChevronDown, ChevronUp, Star, Trophy, Trash2, CheckCircle } from 'lucide-react'
import { db } from '@/db/schema'
import { useAppStore } from '@/store/useAppStore'
import { usePhase } from '@/hooks/usePhase'
import { addSet, deleteSet } from '@/db/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { StepperInput, RepStepper } from '@/components/StepperInput'
import { deloadRange, suggestDeloadWeight } from '@/utils/calculations'
import type { Exercise, WorkoutCategory, ExerciseSet } from '@/types'

const CATEGORY_TABS: Array<{ value: WorkoutCategory; label: string }> = [
  { value: 'shoulders_triceps', label: 'Shoulders + Tri' },
  { value: 'chest_triceps', label: 'Chest + Tri' },
  { value: 'back_biceps', label: 'Back + Bi' },
  { value: 'legs', label: 'Legs' },
  { value: 'pilates', label: 'Pilates' },
]

function ExerciseCard({
  exercise,
  sessionId,
  isDeload,
  onAddSet,
}: {
  exercise: Exercise
  sessionId: number
  isDeload: boolean
  onAddSet: (exerciseId: number, weight: number, reps: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [weight, setWeight] = useState(exercise.defaultWeight ?? 20)
  const [reps, setReps] = useState(10)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sets = useLiveQuery(
    () => db.exerciseSets
      .where('sessionId').equals(sessionId)
      .filter(s => s.exerciseId === exercise.id!)
      .sortBy('setNumber'),
    [sessionId, exercise.id]
  )

  const suggestedWeight = isDeload
    ? suggestDeloadWeight(exercise.defaultWeight ?? 20)
    : exercise.defaultWeight ?? 20

  const handleAddSet = () => {
    onAddSet(exercise.id!, weight, reps)
    setSheetOpen(false)
  }

  return (
    <Card className={exercise.isStarred ? 'border-yellow-500/40' : ''}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{exercise.name}</h3>
              {exercise.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
              {isDeload && (
                <Badge variant="deload" className="text-[10px]">
                  Deload: {deloadRange(exercise.defaultWeight ?? 20)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {exercise.defaultWeight
                ? `Last: ${exercise.defaultWeight}${exercise.defaultWeightAlt ? ` / ${exercise.defaultWeightAlt}` : ''}kg`
                : exercise.bandLevel ?? 'Bodyweight'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sets && sets.length > 0 && (
              <Badge variant="secondary">{sets.length} sets</Badge>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground p-1"
              aria-label="Toggle sets"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Sets list */}
        {expanded && sets && sets.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sets.map((set, i) => (
              <div
                key={set.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">Set {set.setNumber}</span>
                  <span className="font-medium tabular-nums">{set.weight}kg</span>
                  <span className="text-muted-foreground">×</span>
                  <span className="font-medium tabular-nums">{set.reps}</span>
                </div>
                <div className="flex items-center gap-2">
                  {set.isPB && <Trophy className="h-4 w-4 text-yellow-500" />}
                  <button
                    onClick={() => deleteSet(set.id!)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                    aria-label="Delete set"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add set button */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2"
              onClick={() => {
                setWeight(suggestedWeight)
                setSheetOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Log Set {sets ? `${sets.length + 1}` : '1'}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {exercise.name}
                {sets && sets.length > 0 && (
                  <Badge variant="secondary">Set {sets.length + 1}</Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col items-center gap-8">
              <div className="flex gap-8">
                <StepperInput
                  value={weight}
                  onChange={setWeight}
                  label="Weight"
                  unit="kg"
                  step={1.25}
                  min={0}
                  max={500}
                />
                <RepStepper value={reps} onChange={setReps} />
              </div>

              {isDeload && (
                <p className="text-sm text-blue-400 text-center">
                  💙 Deload suggestion: {deloadRange(exercise.defaultWeight ?? 20)}
                </p>
              )}

              <Button size="xl" className="w-full max-w-xs gap-2" onClick={handleAddSet}>
                <CheckCircle className="h-5 w-5" />
                Save Set
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  )
}

export function WorkoutPage() {
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory>('shoulders_triceps')
  const { isDeloadWeek } = useAppStore()
  const { activePhase } = usePhase()

  const today = format(new Date(), 'yyyy-MM-dd')

  // Get or create today's session for current category
  const todaySession = useLiveQuery(
    () => db.workoutSessions
      .filter(s => s.date === today && s.category === activeCategory)
      .first(),
    [today, activeCategory]
  )

  const exercises = useLiveQuery(
    () => db.exercises.where('category').equals(activeCategory).sortBy('isStarred'),
    [activeCategory]
  )

  async function getOrCreateSession(category: WorkoutCategory): Promise<number> {
    const existing = await db.workoutSessions
      .filter(s => s.date === today && s.category === category)
      .first()
    if (existing?.id) return existing.id

    return db.workoutSessions.add({
      date: today,
      category,
      notes: undefined,
    })
  }

  async function handleAddSet(exerciseId: number, weight: number, reps: number) {
    const sessionId = await getOrCreateSession(activeCategory)
    const existingSets = await db.exerciseSets
      .where('sessionId').equals(sessionId)
      .filter(s => s.exerciseId === exerciseId)
      .count()

    await addSet({
      sessionId,
      exerciseId,
      setNumber: existingSets + 1,
      weight,
      weightUnit: 'kg',
      reps,
      isPB: false,
      createdAt: new Date(),
    })
  }

  const sessionId = todaySession?.id ?? 0

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Workout</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        {activePhase && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {activePhase.name} — {activePhase.repRangeMin}–{activePhase.repRangeMax} rep range
          </p>
        )}
      </div>

      {/* Category tabs */}
      <div className="px-4">
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as WorkoutCategory)}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1 h-auto p-1">
            {CATEGORY_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs whitespace-nowrap">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORY_TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <div className="space-y-3">
                {exercises?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No exercises found for this category.
                  </p>
                )}

                {/* Starred first */}
                {exercises
                  ?.sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0))
                  .map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      sessionId={sessionId}
                      isDeload={isDeloadWeek}
                      onAddSet={handleAddSet}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
