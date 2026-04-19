import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Flame, Calendar, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { db } from '@/db/schema'
import { useAppStore } from '@/store/useAppStore'
import { usePhase } from '@/hooks/usePhase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { getWeeklySchedule, getPhaseProgress, getTemplateEmoji, getTemplateLabel } from '@/utils/dates'

const WEEK_TYPE_LABELS = {
  1: 'Week 1 — Build',
  2: 'Week 2 — Push',
  3: 'Week 3 — Overload',
  4: 'Week 4 — Deload',
}

export function Dashboard() {
  const navigate = useNavigate()
  const { activePhase, currentWeekCycle } = usePhase()
  const { isDeloadWeek: isDeload } = useAppStore()

  const recentSessions = useLiveQuery(
    () => db.workoutSessions.orderBy('date').reverse().limit(14).toArray(),
    []
  )

  const phase = activePhase
  const phaseProgress = phase ? getPhaseProgress(phase) : null

  const weekDays = getWeeklySchedule(
    phase,
    recentSessions?.map(s => ({ date: s.date, workoutTemplateId: s.workoutTemplateId })) ?? [],
    isDeload
  )

  const todaySchedule = weekDays.find(d => d.isToday)

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-3xl font-bold tracking-tight">Good morning 👋</h1>
      </div>

      {/* Today's workout */}
      {todaySchedule && (
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => todaySchedule.templateId && navigate('/workout')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Today
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {getTemplateEmoji(todaySchedule.templateId)}
                  </span>
                  <div>
                    <p className="text-lg font-bold">
                      {todaySchedule.categoryLabel}
                    </p>
                    {todaySchedule.hasSession && (
                      <Badge variant="success" className="mt-0.5">
                        ✓ Logged
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {todaySchedule.templateId && (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase + Week */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phase</p>
            <p className="font-bold">{phase?.name ?? 'Hypertrophy'}</p>
            <p className="text-xs text-muted-foreground">
              {phase ? `${phase.repRangeMin}–${phase.repRangeMax} reps` : '8–12 reps'}
            </p>
            {phaseProgress && (
              <>
                <Progress value={phaseProgress.percentComplete} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Week {phaseProgress.weeksCompleted} of {phaseProgress.totalWeeks}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={isDeload ? 'border-blue-500/50 bg-blue-950/20' : ''}>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cycle</p>
            {isDeload ? (
              <>
                <p className="font-bold text-blue-400">Deload 🔄</p>
                <p className="text-xs text-blue-300">50–60% weights</p>
              </>
            ) : (
              <>
                <p className="font-bold">
                  {currentWeekCycle
                    ? WEEK_TYPE_LABELS[currentWeekCycle.weekNumber]
                    : 'Week 1 — Build'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {currentWeekCycle?.type ?? 'build'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly schedule */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          This Week
        </h2>
        <div className="space-y-2">
          {weekDays.map(day => (
            <div
              key={day.date}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                day.isToday
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : 'bg-card border border-border/50'
              }`}
            >
              <div className="w-8 text-center">
                <p className={`text-xs font-medium ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day.dayName}
                </p>
                <p className={`text-sm font-bold ${day.isToday ? 'text-primary' : ''}`}>
                  {format(parseISO(day.date), 'd')}
                </p>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${day.isToday ? '' : 'text-muted-foreground'}`}>
                  {day.categoryLabel}
                </p>
              </div>

              {day.templateId && (
                <span className="text-lg">{getTemplateEmoji(day.templateId)}</span>
              )}

              {day.templateId ? (
                day.hasSession ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-border shrink-0" />
                )
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Quick Start
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            variant="outline"
            className="h-16 flex-col gap-1 text-sm"
            onClick={() => navigate('/workout')}
          >
            <span className="text-xl">🏋️</span>
            Start Workout
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-16 flex-col gap-1 text-sm"
            onClick={() => navigate('/run')}
          >
            <span className="text-xl">🏃</span>
            Track Run
          </Button>
        </div>
      </div>
    </div>
  )
}
