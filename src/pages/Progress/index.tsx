import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, subWeeks } from 'date-fns'
import { TrendingUp, Trophy, Dumbbell, MapPin } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts'
import { db } from '@/db/schema'
import { getExerciseHistory, getPersonalBest } from '@/db/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatPace, formatDistance } from '@/utils/dates'
import type { Exercise } from '@/types'

function ExerciseProgress({ exercise }: { exercise: Exercise }) {
  const history = useLiveQuery(
    () => getExerciseHistory(exercise.id!),
    [exercise.id],
    []
  )

  const pb = useLiveQuery(
    () => getPersonalBest(exercise.id!),
    [exercise.id]
  )

  if (!history || history.length < 2) return null

  const chartData = history.map(h => ({
    date: format(new Date(h.date), 'MMM d'),
    weight: h.maxWeight,
    volume: Math.round(h.totalVolume),
    isDeload: h.isDeload,
  }))

  // Find deload zones for shading
  const deloadZones = history.reduce<Array<{ start: string; end: string }>>((zones, h, i) => {
    if (h.isDeload) {
      zones.push({ start: h.date, end: h.date })
    }
    return zones
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {exercise.name}
          {pb && (
            <span className="text-sm font-normal text-yellow-500 flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              PB: {pb.weight}kg × {pb.reps}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              name="Weight (kg)"
            />
            {/* Shade deload weeks */}
            {chartData.map((d, i) =>
              d.isDeload ? (
                <ReferenceArea
                  key={i}
                  x1={d.date}
                  x2={chartData[i + 1]?.date ?? d.date}
                  fill="hsl(210 100% 56% / 0.15)"
                  stroke="hsl(210 100% 56% / 0.3)"
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function RunningProgress() {
  const runs = useLiveQuery(
    () => db.runs.orderBy('date').toArray(),
    []
  )

  if (!runs || runs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No runs logged yet.</p>
        <p className="text-sm mt-1">Head to the Run tab to track your first run!</p>
      </div>
    )
  }

  // Weekly distance
  const now = new Date()
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = format(subWeeks(now, 7 - i), 'yyyy-MM-dd')
    const weekEnd = format(subWeeks(now, 6 - i), 'yyyy-MM-dd')
    const weekRuns = runs.filter(r => r.date >= weekStart && r.date < weekEnd)
    const totalKm = weekRuns.reduce((sum, r) => sum + r.distanceMeters / 1000, 0)
    return {
      week: format(subWeeks(now, 7 - i), 'MMM d'),
      km: Math.round(totalKm * 10) / 10,
    }
  })

  const pbPace = runs.length > 0
    ? Math.min(...runs.filter(r => r.avgPaceSecondsPerKm > 0).map(r => r.avgPaceSecondsPerKm))
    : 0

  const totalDistance = runs.reduce((sum, r) => sum + r.distanceMeters, 0)

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{runs.length}</p>
            <p className="text-xs text-muted-foreground">Total runs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{formatDistance(totalDistance)}</p>
            <p className="text-xs text-muted-foreground">Total distance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">
              {pbPace > 0 ? formatPace(pbPace) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Best pace</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly km chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly distance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="km"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
                name="km"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProgressPage() {
  const exercises = useLiveQuery(
    () => db.exercises.orderBy('name').toArray(),
    []
  )

  // Filter exercises that have data
  const exercisesWithHistory = exercises?.filter(e => e.id !== undefined) ?? []

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Progress
        </h1>
        <p className="text-sm text-muted-foreground">Your performance over time</p>
      </div>

      <Tabs defaultValue="strength">
        <TabsList className="w-full">
          <TabsTrigger value="strength" className="flex-1">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            Strength
          </TabsTrigger>
          <TabsTrigger value="running" className="flex-1">
            <MapPin className="h-4 w-4 mr-1.5" />
            Running
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength" className="mt-4 space-y-3">
          {exercisesWithHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No workouts logged yet.</p>
              <p className="text-sm mt-1">Start your first workout to see progress!</p>
            </div>
          ) : (
            exercisesWithHistory.map(exercise => (
              <ExerciseProgress key={exercise.id} exercise={exercise} />
            ))
          )}
        </TabsContent>

        <TabsContent value="running" className="mt-4">
          <RunningProgress />
        </TabsContent>
      </Tabs>
    </div>
  )
}
