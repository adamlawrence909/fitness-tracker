import { RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function DeloadBanner() {
  const { isDeloadWeek, currentWeekCycle } = useAppStore()

  if (!isDeloadWeek) return null

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-blue-600 px-4 py-3 text-white">
      <RotateCcw className="h-4 w-4 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
      <div className="flex-1">
        <p className="text-sm font-semibold">Deload Week — recover well 💙</p>
        <p className="text-xs text-blue-100">
          Use 50–60% of last week's weights. Focus on form and full range of motion.
        </p>
      </div>
    </div>
  )
}
