import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, addWeeks } from 'date-fns'
import { Settings, RefreshCw, Download, ChevronRight, Dumbbell } from 'lucide-react'
import { db } from '@/db/schema'
import { useAppStore } from '@/store/useAppStore'
import { createPhase } from '@/db/queries'
import { exportAllData } from '@/db/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getPhaseProgress } from '@/utils/dates'
import type { PhaseType } from '@/types'
import { PHASE_CONFIGS } from '@/types'

const PHASE_ORDER: PhaseType[] = ['hypertrophy', 'strength', 'endurance']

const PHASE_ICONS: Record<PhaseType, string> = {
  hypertrophy: '💪',
  strength: '🏋️',
  endurance: '🏃',
  deload: '🔄',
}

export function SettingsPage() {
  const [showPhaseDialog, setShowPhaseDialog] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<PhaseType>('hypertrophy')
  const { activePhase: storePhase } = useAppStore()

  const activePhase = useLiveQuery(
    () => db.phases.where('isActive').equals(1).first(),
    []
  )

  const allPhases = useLiveQuery(
    () => db.phases.orderBy('startDate').reverse().toArray(),
    []
  )

  const phaseProgress = activePhase ? getPhaseProgress(activePhase) : null

  async function startNewPhase() {
    const config = PHASE_CONFIGS[selectedPhase]
    const today = new Date()
    const endDate = addWeeks(today, config.durationWeeks)

    await createPhase({
      type: selectedPhase,
      name: config.name,
      goal: config.goal,
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      durationWeeks: config.durationWeeks,
      repRangeMin: config.repRangeMin,
      repRangeMax: config.repRangeMax,
      isActive: true,
    })

    // Create 4-week cycle
    const cycleTypes: Array<{ weekNumber: 1 | 2 | 3 | 4; type: 'build' | 'overload' | 'deload'; isDeload: boolean }> = [
      { weekNumber: 1, type: 'build', isDeload: false },
      { weekNumber: 2, type: 'build', isDeload: false },
      { weekNumber: 3, type: 'overload', isDeload: false },
      { weekNumber: 4, type: 'deload', isDeload: true },
    ]

    const newPhase = await db.phases.where('isActive').equals(1).first()
    if (newPhase?.id) {
      for (const week of cycleTypes) {
        const weekStart = addWeeks(today, week.weekNumber - 1)
        const weekEnd = addWeeks(weekStart, 1)
        await db.weekCycles.add({
          phaseId: newPhase.id,
          ...week,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(addWeeks(weekStart, 1), 'yyyy-MM-dd'),
        })
      }
    }

    setShowPhaseDialog(false)
  }

  async function handleExport() {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-data-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage phases & preferences</p>
      </div>

      {/* Current phase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Phase</CardTitle>
          {activePhase && (
            <CardDescription>{activePhase.goal}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {activePhase ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{PHASE_ICONS[activePhase.type]}</span>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{activePhase.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {activePhase.repRangeMin}–{activePhase.repRangeMax} reps · {activePhase.durationWeeks} weeks
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              {phaseProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Week {phaseProgress.weeksCompleted} of {phaseProgress.totalWeeks}
                    </span>
                    <span className="font-medium">{phaseProgress.percentComplete}%</span>
                  </div>
                  <Progress value={phaseProgress.percentComplete} />
                  <p className="text-xs text-muted-foreground">
                    Started {format(new Date(activePhase.startDate), 'MMM d')} ·
                    Ends {format(new Date(activePhase.endDate), 'MMM d')}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowPhaseDialog(true)}
              >
                <RefreshCw className="h-4 w-4" />
                Switch Phase
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">No active phase — set one to get started.</p>
              <Button onClick={() => setShowPhaseDialog(true)} className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Start a Phase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase history */}
      {allPhases && allPhases.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phase History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allPhases.slice(1).map(phase => (
              <div key={phase.id} className="flex items-center gap-3 py-1">
                <span className="text-xl">{PHASE_ICONS[phase.type]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(phase.startDate), 'MMM d')} –{' '}
                    {format(new Date(phase.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>Export your data for backup or migration</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export all data (JSON)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Exports all workouts, exercises, runs, and settings as JSON.
            Use this to migrate to a future cloud sync.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Workout Tracker v0.1.0 · All data stored locally
          </p>
        </CardContent>
      </Card>

      {/* Phase switch dialog */}
      <Dialog open={showPhaseDialog} onOpenChange={setShowPhaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a Training Phase</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {PHASE_ORDER.map(phaseType => {
              const config = PHASE_CONFIGS[phaseType]
              return (
                <button
                  key={phaseType}
                  onClick={() => setSelectedPhase(phaseType)}
                  className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                    selectedPhase === phaseType
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <span className="text-3xl">{PHASE_ICONS[phaseType]}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{config.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.goal} · {config.repRangeMin}–{config.repRangeMax} reps · {config.durationWeeks} weeks
                    </p>
                  </div>
                  {selectedPhase === phaseType && (
                    <Badge variant="success">Selected</Badge>
                  )}
                </button>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={startNewPhase} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
