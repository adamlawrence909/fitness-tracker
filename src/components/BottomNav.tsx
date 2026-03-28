import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, MapPin, TrendingUp, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Today' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/run', icon: MapPin, label: 'Run' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around px-2 pb-safe">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-3 min-w-[56px] rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('h-6 w-6', isActive && 'stroke-[2.5]')}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
