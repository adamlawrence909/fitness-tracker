import { useState, useCallback } from 'react'
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
import { RestTimer } from '@/components/RestTimer'
import { deloadRange, suggestDeloadWeight } from '@/utils/calculations'
import type { Exercise, WorkoutCategory, WorkoutTemplateId } from '@/types'
import { WORKOUT_TEMPLATES } from '@/types'

// Workout templates available in the Workout page (excludes pure cardio — those use Run page)
const LIFTING_TEMPLATES: WorkoutTemplateId[] = [
  'shoulders_triceps',
  'back_biceps',
  'chest_triceps',
  'legs',
  'pilates',
]

const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  shoulders: 'Shoulders',
  triceps:   'Triceps',
  biceps:    'Biceps',
  back:      'Back',
  chest:     'Chest',
  legs:      'Legs',
  pilates:   'Pilates',
  run:       'Run',
  walk:      'Walk',
  cycle:     'Cycle',
  free:      'Free',
}

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

        {expanded && sets && sets.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sets.map(set => (
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

// Category tab within a template — loads exercises and manages its own session
function CategoryTab({
  category,
  templateId,
  isDeload,
  onSetLogged,
}: {
  category: WorkoutCategory
  templateId: WorkoutTemplateId
  isDeload: boolean
  onSetLogged: () => void
}) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const todaySession = useLiveQuery(
    () => db.workoutSessions
      .filter(s => s.date === today && s.category === category)
      .first(),
    [today, category]
  )

  const exercises = useLiveQuery(
    () => db.exercises.where('category').equals(category).sortBy('isStarred'),
    [category]
  )

  async function getOrCreateSession(): Promise<number> {
    const existing = await db.workoutSessions
      .filter(s => s.date === today && s.category === category)
      .first()
    if (existing?.id) return existing.id

    return db.workoutSessions.add({
      date: today,
      category,
      workoutTemplateId: templateId,
      notes: undefined,
    }) as Promise<number>
  }

  async function handleAddSet(exerciseId: number, weight: number, reps: number) {
    const sessionId = await getOrCreateSession()
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

    onSetLogged()
  }

  const sessionId = todaySession?.id ?? 0

  if (exercises?.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No exercises found for {CATEGORY_LABELS[category]}.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {exercises
        ?.sort((a, b) => (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0))
        .map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            sessionId={sessionId}
            isDeload={isDeload}
            onAddSet={handleAddSet}
          />
        ))}
    </div>
  )
}

export function WorkoutPage() {
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplateId>('shoulders_triceps')
  const { isDeloadWeek } = useAppStore()
  const { activePhase } = usePhase()

  const template = WORKOUT_TEMPLATES[activeTemplate]
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory>(
    template.categories[0] ?? 'legs'
  )

  // Rest timer state — timerKey increments to restart the timer on each new set
  const [showTimer, setShowTimer] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  const handleSetLogged = useCallback(() => {
    setShowTimer(true)
    setTimerKey(k => k + 1)
  }, [])

  function handleTemplateChange(templateId: WorkoutTemplateId) {
    setActiveTemplate(templateId)
    const t = WORKOUT_TEMPLATES[templateId]
    setActiveCategory(t.categories[0] ?? 'legs')
  }

  return (
    <div className="pb-6">
      {showTimer && (
        <RestTimer timerKey={timerKey} onDismiss={() => setShowTimer(false)} />
      )}
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

      {/* Template tabs */}
      <div className="px-4">
        <Tabs
          value={activeTemplate}
          onValueChange={v => handleTemplateChange(v as WorkoutTemplateId)}
        >
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1 h-auto p-1">
            {LIFTING_TEMPLATES.map(id => (
              <TabsTrigger key={id} value={id} className="text-xs whitespace-nowrap">
                {WORKOUT_TEMPLATES[id].emoji} {WORKOUT_TEMPLATES[id].name}
              </TabsTrigger>
            ))}
          </TabsList>

          {LIFTING_TEMPLATES.map(templateId => {
            const tmpl = WORKOUT_TEMPLATES[templateId]
            return (
              <TabsContent key={templateId} value={templateId} className="mt-4">
                {tmpl.categories.length > 1 ? (
                  // Multi-category template: show sub-tabs
                  <Tabs
                    value={activeCategory}
                    onValueChange={v => setActiveCategory(v as WorkoutCategory)}
                  >
                    <TabsList className="w-full mb-4">
                      {tmpl.categories.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="flex-1 text-sm">
                          {CATEGORY_LABELS[cat]}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {tmpl.categories.map(cat => (
                      <TabsContent key={cat} value={cat}>
                        <CategoryTab
                          category={cat}
                          templateId={templateId}
                          isDeload={isDeloadWeek}
                          onSetLogged={handleSetLogged}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  // Single-category template: render directly
                  tmpl.categories[0] && (
                    <CategoryTab
                      category={tmpl.categories[0]}
                      templateId={templateId}
                      isDeload={isDeloadWeek}
                      onSetLogged={handleSetLogged}
                    />
                  )
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}
