import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, subWeeks } from 'date-fns'
import { TrendingUp, Trophy, Dumbbell, MapPin } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts'
import { db } from '@/db/schema'
import { getExerciseHistory, getPersonalBest } from '@/db/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatPace, formatDistance } from '@/utils/dates'
import type { Exercise, WorkoutCategory } from '@/types'

// Muscle group categories shown in Progress (excludes cardio — those are in Running tab)
const MUSCLE_CATEGORIES: Array<{ value: WorkoutCategory; label: string }> = [
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'triceps',   label: 'Triceps'   },
  { value: 'biceps',    label: 'Biceps'    },
  { value: 'back',      label: 'Back'      },
  { value: 'chest',     label: 'Chest'     },
  { value: 'legs',      label: 'Legs'      },
]

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

function CategoryProgress({ category }: { category: WorkoutCategory }) {
  const exercises = useLiveQuery(
    () => db.exercises.where('category').equals(category).sortBy('name'),
    [category]
  )

  if (!exercises) return null

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>No exercises in this category yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exercises.map(exercise => (
        <ExerciseProgress key={exercise.id} exercise={exercise} />
      ))}
    </div>
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
  const [activeCategory, setActiveCategory] = useState<WorkoutCategory>('shoulders')

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Progress
        </h1>
        <p className="text-sm text-muted-foreground">Your performance over time</p>
      </div>

      <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as WorkoutCategory)}>
        {/* Muscle group tabs — scrollable row */}
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1 h-auto p-1">
          {MUSCLE_CATEGORIES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="text-xs whitespace-nowrap">
              {label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="running" className="text-xs whitespace-nowrap">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            Running
          </TabsTrigger>
        </TabsList>

        {MUSCLE_CATEGORIES.map(({ value }) => (
          <TabsContent key={value} value={value} className="mt-4">
            <CategoryProgress category={value} />
          </TabsContent>
        ))}

        <TabsContent value="running" className="mt-4">
          <RunningProgress />
        </TabsContent>
      </Tabs>
    </div>
  )
}
