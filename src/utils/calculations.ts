/**
 * Fitness calculation utilities — deload weights, volume, splits, etc.
 */

// ─── Deload Weight Suggestions ─────────────────────────────────────────────────

export function suggestDeloadWeight(previousWeight: number): number {
  // 55% of previous — midpoint of 50–60% range, rounded to nearest 1.25kg
  const raw = previousWeight * 0.55
  return Math.round(raw / 1.25) * 1.25
}

export function deloadRange(weight: number): string {
  const min = Math.round(weight * 0.5 / 1.25) * 1.25
  const max = Math.round(weight * 0.6 / 1.25) * 1.25
  return `${min}–${max}kg`
}

// ─── Volume ────────────────────────────────────────────────────────────────────

export function calculateVolume(weight: number, reps: number, sets: number): number {
  return weight * reps * sets
}

export function totalVolumeForExercise(
  sets: Array<{ weight: number; reps: number }>
): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
}

// ─── Running / GPS ─────────────────────────────────────────────────────────────

export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  altitude?: number
}

/** Haversine distance between two GPS coordinates in metres */
export function haversineDistance(p1: GpsPoint, p2: GpsPoint): number {
  const R = 6371000  // Earth radius in metres
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function totalDistance(points: GpsPoint[]): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i])
  }
  return total
}

export interface KmSplitResult {
  km: number
  paceSeconds: number
  isNegativeSplit: boolean
}

export function calculateKmSplits(points: GpsPoint[]): KmSplitResult[] {
  if (points.length < 2) return []

  const splits: KmSplitResult[] = []
  let currentKm = 0
  let distanceCovered = 0
  let kmStart = 0  // index of start point for current km
  let kmStartTime = points[0].timestamp

  for (let i = 1; i < points.length; i++) {
    const seg = haversineDistance(points[i - 1], points[i])
    distanceCovered += seg

    if (distanceCovered >= (currentKm + 1) * 1000) {
      const durationSeconds = (points[i].timestamp - kmStartTime) / 1000
      const paceSeconds = durationSeconds  // seconds for this km

      splits.push({
        km: currentKm + 1,
        paceSeconds,
        isNegativeSplit: splits.length > 0 && paceSeconds < splits[splits.length - 1].paceSeconds,
      })

      currentKm++
      kmStartTime = points[i].timestamp
    }
  }

  return splits
}

export function estimatedCalories(distanceKm: number, weightKg = 75): number {
  // Rough estimate: ~60–80 cal/km for average runner
  return Math.round(distanceKm * 70 * (weightKg / 75))
}

// ─── Progressive Overload Hints ─────────────────────────────────────────────────

export function suggestNextWeight(
  currentWeight: number,
  repsAchieved: number,
  targetRepMax: number
): number | null {
  if (repsAchieved >= targetRepMax) {
    // Hit the top of the range — suggest 2.5kg increase
    return Math.round((currentWeight + 2.5) / 1.25) * 1.25
  }
  return null  // Stay at current weight
}
