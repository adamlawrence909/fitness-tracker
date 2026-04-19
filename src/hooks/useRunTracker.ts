import { useState, useRef, useCallback, useEffect } from 'react'
import type { GpsPoint } from '@/utils/calculations'
import { haversineDistance, calculateKmSplits } from '@/utils/calculations'
import { useAppStore } from '@/store/useAppStore'

export interface RunState {
  isTracking: boolean
  distanceMeters: number
  elapsedSeconds: number
  points: GpsPoint[]
  currentPace: number   // seconds per km
  splits: Array<{ km: number; paceSeconds: number; isNegativeSplit: boolean }>
  error: string | null
}

export function useRunTracker() {
  const { startRun, stopRun, setRunElapsed } = useAppStore()

  const [state, setState] = useState<RunState>({
    isTracking: false,
    distanceMeters: 0,
    elapsedSeconds: 0,
    points: [],
    currentPace: 0,
    splits: [],
    error: null,
  })

  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'GPS not available on this device' }))
      return
    }

    startTimeRef.current = Date.now()
    startRun()

    // Reset all run state for a fresh start
    setState({
      isTracking: true,
      distanceMeters: 0,
      elapsedSeconds: 0,
      points: [],
      currentPace: 0,
      splits: [],
      error: null,
    })

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setRunElapsed(elapsed)
      setState(s => ({ ...s, elapsedSeconds: elapsed }))
    }, 1000)

    // Start GPS tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point: GpsPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          altitude: position.coords.altitude ?? undefined,
        }

        setState(prev => {
          const newPoints = [...prev.points, point]
          const newDist =
            prev.points.length > 0
              ? prev.distanceMeters + haversineDistance(prev.points[prev.points.length - 1], point)
              : 0

          // Current pace — last 500m
          let currentPace = 0
          if (newPoints.length >= 2) {
            const recentPoints = newPoints.slice(-20)  // last ~20 readings
            const recentDist = recentPoints.reduce((sum, p, i) =>
              i === 0 ? 0 : sum + haversineDistance(recentPoints[i - 1], p), 0)
            const recentTime = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 1000
            currentPace = recentDist > 50 ? (recentTime / recentDist) * 1000 : 0
          }

          return {
            ...prev,
            points: newPoints,
            distanceMeters: newDist,
            currentPace,
            splits: calculateKmSplits(newPoints),
            isTracking: true,
            error: null,
          }
        })
      },
      (err) => {
        setState(s => ({ ...s, error: `GPS error: ${err.message}` }))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    )

    setState(s => ({ ...s, isTracking: true }))
  }, [startRun, setRunElapsed])

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stopRun()
    setState(s => ({ ...s, isTracking: false }))
  }, [stopRun])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { state, start, stop }
}
