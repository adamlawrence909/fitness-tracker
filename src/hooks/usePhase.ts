import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useAppStore } from '@/store/useAppStore'

export function usePhase() {
  const { setActivePhase, setCurrentWeekCycle } = useAppStore()

  const activePhase = useLiveQuery(() =>
    db.phases.where('isActive').equals(1).first()
  )

  const currentWeekCycle = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0]
    return db.weekCycles
      .filter(wc => wc.startDate <= today && wc.endDate >= today)
      .first()
  })

  useEffect(() => {
    setActivePhase(activePhase ?? null)
  }, [activePhase, setActivePhase])

  useEffect(() => {
    setCurrentWeekCycle(currentWeekCycle ?? null)
  }, [currentWeekCycle, setCurrentWeekCycle])

  return {
    activePhase: activePhase ?? null,
    currentWeekCycle: currentWeekCycle ?? null,
    isDeloadWeek: currentWeekCycle?.isDeload ?? false,
  }
}
