import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Play, Square, MapPin, Zap, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { db } from '@/db/schema'
import { useRunTracker } from '@/hooks/useRunTracker'
import { createRun, addRoutePoints, getRoutePoints } from '@/db/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RunMap } from '@/components/RunMap'
import { formatDuration, formatDistance, formatPace } from '@/utils/dates'
import type { ActivityMode, Run } from '@/types'
import type { GpsPoint } from '@/utils/calculations'

const MODE_OPTIONS: Array<{ mode: ActivityMode; emoji: string; label: string }> = [
  { mode: 'run',    emoji: '🏃', label: 'Run'     },
  { mode: 'walk',   emoji: '🚶', label: 'Walk'    },
  { mode: 'cycle',  emoji: '🚴', label: 'Cycle'   },
  { mode: 'pilates',emoji: '🧘', label: 'Pilates' },
  { mode: 'free',   emoji: '✍️', label: 'Free'   },
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

// Lazy-loads route points and renders the map for a saved run
function HistoryRunMap({ run }: { run: Run }) {
  const [expanded, setExpanded] = useState(false)
  const [points, setPoints] = useState<GpsPoint[]>([])
  const [loaded, setLoaded] = useState(false)

  async function handleExpand() {
    if (!expanded && !loaded && run.id) {
      const routePoints = await getRoutePoints(run.id)
      setPoints(routePoints.map(p => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp, altitude: p.altitude })))
      setLoaded(true)
    }
    setExpanded(e => !e)
  }

  return (
    <div>
      <button
        onClick={handleExpand}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5" />
        {expanded ? 'Hide route' : 'Show route'}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <div className="mt-2">
          {loaded && points.length >= 2 ? (
            <RunMap points={points} isLive={false} height="200px" />
          ) : loaded ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No GPS route recorded.</p>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading route…</p>
          )}
        </div>
      )}
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
    // Capture state before stop() clears isTracking
    const { distanceMeters, elapsedSeconds, splits, points } = state

    stop()

    if (distanceMeters < 50) return  // Too short to save

    const runId = await createRun({
      date: format(new Date(), 'yyyy-MM-dd'),
      mode: selectedMode,
      distanceMeters,
      durationSeconds: elapsedSeconds,
      avgPaceSecondsPerKm:
        distanceMeters > 0 ? (elapsedSeconds / distanceMeters) * 1000 : 0,
      fastestKmSplit: splits.length > 0
        ? Math.min(...splits.map(s => s.paceSeconds))
        : undefined,
      notes: undefined,
    }) as unknown as number

    if (points.length > 0) {
      await addRoutePoints(
        points.map(p => ({
          runId,
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
          altitude: p.altitude,
        }))
      )
    }
  }

  const hasGpsPoints = state.points.length > 0
  const isAcquiringGps = state.isTracking && !hasGpsPoints && !state.error

  return (
    <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Run & Cardio</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Activity mode selector — hidden while tracking */}
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

      {state.isTracking ? (
        <div className="space-y-4">
          {/* Live map */}
          {hasGpsPoints ? (
            <RunMap points={state.points} isLive height="260px" />
          ) : isAcquiringGps ? (
            <div className="flex items-center justify-center gap-2 h-16 text-sm text-muted-foreground rounded-xl border border-border bg-card">
              <MapPin className="h-4 w-4 animate-pulse" />
              Acquiring GPS signal…
            </div>
          ) : null}

          {/* Elapsed time */}
          <div className="text-center py-2">
            <p className="text-6xl font-bold tabular-nums tracking-tight">
              {formatDuration(state.elapsedSeconds)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">elapsed</p>
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
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-3">
              {state.error}
            </p>
          )}

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
          onClick={() => setShowHistory(h => !h)}
        >
          <h2 className="text-base font-semibold">Recent activity</h2>
          <span className="text-sm text-muted-foreground">{showHistory ? 'Hide' : 'Show'}</span>
        </button>

        {showHistory && (
          <div className="mt-3 space-y-3">
            {recentRuns?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No runs yet — let's go! 🏃</p>
            )}
            {recentRuns?.map(run => (
              <Card key={run.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
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
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatPace(run.avgPaceSecondsPerKm)}</p>
                      <p className="text-xs text-muted-foreground">avg pace</p>
                    </div>
                  </div>
                  <HistoryRunMap run={run} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
