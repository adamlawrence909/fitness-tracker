/**
 * + / − stepper for weight and rep inputs — designed for gym use with large tap targets.
 */
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  className?: string
}

export function StepperInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1.25,
  label,
  unit = 'kg',
  className,
}: StepperInputProps) {
  const decrement = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100))
  const increment = () => onChange(Math.min(max, Math.round((value + step) * 100) / 100))

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground active:scale-95 disabled:opacity-40 transition-all touch-manipulation"
          aria-label={`Decrease ${label ?? 'value'}`}
        >
          <Minus className="h-5 w-5" />
        </button>

        <div className="flex min-w-[80px] flex-col items-center">
          <span className="text-2xl font-bold tabular-nums leading-none">
            {Number.isInteger(value) ? value : value.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground active:scale-95 disabled:opacity-40 transition-all touch-manipulation"
          aria-label={`Increase ${label ?? 'value'}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Integer-only stepper (for reps)
export function RepStepper({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (v: number) => void
  className?: string
}) {
  return (
    <StepperInput
      value={value}
      onChange={onChange}
      min={1}
      max={100}
      step={1}
      label="Reps"
      unit="reps"
      className={className}
    />
  )
}
