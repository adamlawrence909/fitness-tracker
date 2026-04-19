import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const TOTAL_SECONDS = 60
const READY_AT = 45

// SVG arc constants
const RADIUS = 15.9
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 99.9

interface RestTimerProps {
  /** Increment this key to restart the timer */
  timerKey: number
  onDismiss: () => void
}

export function RestTimer({ timerKey, onDismiss }: RestTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  // Reset and start counting when timerKey changes
  useEffect(() => {
    setElapsed(0)
    const interval = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= TOTAL_SECONDS) {
          clearInterval(interval)
          return TOTAL_SECONDS
        }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerKey])

  // Auto-dismiss a moment after reaching 60s
  useEffect(() => {
    if (elapsed >= TOTAL_SECONDS) {
      const t = setTimeout(onDismiss, 800)
      return () => clearTimeout(t)
    }
  }, [elapsed, onDismiss])

  const isReady = elapsed >= READY_AT
  const progress = elapsed / TOTAL_SECONDS
  const filled = progress * CIRCUMFERENCE

  // 45s marker position on the arc (75% around the circle, starting from top)
  const markerAngle = (READY_AT / TOTAL_SECONDS) * 360 - 90  // -90 = start at top
  const markerRad = (markerAngle * Math.PI) / 180
  const cx = 18 + RADIUS * Math.cos(markerRad)
  const cy = 18 + RADIUS * Math.sin(markerRad)

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div
      className={`
        fixed bottom-[72px] inset-x-3 z-50
        rounded-2xl border shadow-xl backdrop-blur-sm
        transition-colors duration-500
        ${isReady
          ? 'bg-emerald-950/95 border-emerald-500/60'
          : 'bg-card/95 border-border'
        }
      `}
    >
      <div className="flex items-center gap-4 px-4 py-3">

        {/* Circular arc timer */}
        <svg viewBox="0 0 36 36" className="w-14 h-14 shrink-0 -rotate-90">
          {/* Track */}
          <circle
            cx="18" cy="18" r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          {/* Progress arc */}
          <circle
            cx="18" cy="18" r={RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className={`transition-colors duration-500 ${isReady ? 'stroke-emerald-400' : 'stroke-amber-400'}`}
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            strokeDashoffset="0"
          />
          {/* 45s threshold dot */}
          <circle
            cx={cx} cy={cy} r="1.8"
            className={`transition-colors duration-500 ${isReady ? 'fill-emerald-300' : 'fill-white/50'}`}
          />
          {/* Time text — counter-rotate so it reads upright */}
          <text
            x="18" y="18"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="7"
            fontWeight="600"
            className={`rotate-90 origin-[18px_18px] font-mono transition-colors duration-500 ${
              isReady ? 'fill-emerald-300' : 'fill-foreground'
            }`}
            style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}
          >
            {timeStr}
          </text>
        </svg>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm transition-colors duration-300 ${isReady ? 'text-emerald-300' : 'text-foreground'}`}>
            {isReady ? 'Ready for next set!' : 'Rest period'}
          </p>
          <p className={`text-xs mt-0.5 transition-colors duration-300 ${isReady ? 'text-emerald-400/80' : 'text-muted-foreground'}`}>
            {isReady
              ? `${elapsed - READY_AT}s over rest target`
              : `${READY_AT - elapsed}s until ready`}
          </p>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-muted/40 relative overflow-visible">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isReady ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${progress * 100}%` }}
            />
            {/* 45s marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-white/40"
              style={{ left: `${(READY_AT / TOTAL_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0"
          aria-label="Dismiss timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
