import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Play, Square, MapPin, Clock, Zap, TrendingUp, Mountain } from 'lucide-react'
import { db } from '@/db/schema'
import { useRunTracker } from '@/hooks/useRunTracker'
import { createRun, addRoutePoints } from '@/db/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatDistance, formatPace } from '@/utils/dates'
import type { ActivityMode } from '@/types'

const MODE_OPTIONS: Array<{ mode: ActivityMode; emoji: string; label: string }> = [
  { mode: 'run', emoji: '🏃', label: 'Run' },
  { mode: 'walk', emoji: '🚶', label: 'Walk' },
  { mode: 'cycle', emoji: '🚴', label: 'Cycle' },
  { mode: 'pilates', emoji: '🧘', label: 'Pilates' },
  { mode: 'free', emoji: '✍️', label: 'Free' },
]

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-card border p-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function RunPage() {
  const [selectedMode, setSelectedMode] = useState<ActivityMode>('run')
  const [showHistory, setShowHistory] = useState(false)
  const { state, start, stop } = useRunTracker()

  const recentRuns = useLiveQuery(
    () => db.runs.orderBy('date').reverse().limit(10).toArray(),
    []
  )

  async function handleStop() {
    stop()

    if (state.distanceMeters < 50) return  // Too short to save

    const runId = await createRun({
      date: format(new Date(), 'yyyy-MM-dd'),
      mode: selectedMode,
      distanceMeters: state.distanceMeters,
      durationSeconds: state.elapsedSeconds,
      avgPaceSecondsPerKm:
        state.distanceMeters > 0
          ? (state.elapsedSeconds / state.distanceMeters) * 1000
          : 0,
      fastestKmSplit: state.splits.length > 0
        ? Math.min(...state.splits.map(s => s.paceSeconds))
        : undefined,
      notes: undefined,
    })

    // Save GPS points
    if (state.points.length > 0) {
      await addRoutePoints(
        state.points.map(p => ({
          runId,
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
          altitude: p.altitude,
        }))
      )
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Run & Cardio</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Activity mode selector */}
      {!state.isTracking && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Activity type</p>
          <div className="flex gap-2 flex-wrap">
            {MODE_OPTIONS.map(({ mode, emoji, label }) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-colors min-w-[64px] ${
                  selectedMode === mode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active tracking UI */}
      {state.isTracking ? (
        <div className="space-y-4">
          {/* Elapsed time — big */}
          <div className="text-center py-4">
            <p className="text-6xl font-bold tabular-nums tracking-tight">
              {formatDuration(state.elapsedSeconds)}
            </p>
            <p className="text-muted-foreground mt-1">elapsed</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              label="Distance"
              value={formatDistance(state.distanceMeters)}
              icon={MapPin}
            />
            <StatBox
              label="Current pace"
              value={state.currentPace > 0 ? formatPace(state.currentPace) : '—'}
              icon={Zap}
            />
          </div>

          {/* Km splits */}
          {state.splits.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Splits</p>
              <div className="space-y-1">
                {state.splits.map(split => (
                  <div
                    key={split.km}
                    className="flex items-center justify-between rounded-lg bg-card border px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">km {split.km}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">{formatPace(split.paceSeconds)}</span>
                      {split.isNegativeSplit && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GPS error */}
          {state.error && (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          )}

          {/* Stop button */}
          <Button
            size="xl"
            variant="destructive"
            className="w-full gap-2"
            onClick={handleStop}
          >
            <Square className="h-5 w-5 fill-current" />
            Finish & Save
          </Button>
        </div>
      ) : (
        <Button
          size="xl"
          className="w-full gap-2"
          onClick={start}
        >
          <Play className="h-5 w-5 fill-current" />
          Start {MODE_OPTIONS.find(m => m.mode === selectedMode)?.label}
        </Button>
      )}

      {/* Recent runs */}
      <div>
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowHistory(!showHistory)}
        >
          <h2 className="text-base font-semibold">Recent activity</h2>
          <span className="text-sm text-muted-foreground">{showHistory ? 'Hide' : 'Show'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {recentRuns?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No runs yet — let's go! 🏃</p>
            )}
            {recentRuns?.map(run => (
              <Card key={run.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {MODE_OPTIONS.find(m => m.mode === run.mode)?.emoji ?? '🏃'}
                        </span>
                        <div>
                          <p className="font-semibold">{formatDistance(run.distanceMeters)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(run.date), 'MMM d')} · {formatDuration(run.durationSeconds)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPace(run.avgPaceSecondsPerKm)}</p>
                      <p className="text-xs text-muted-foreground">avg pace</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
