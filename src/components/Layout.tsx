import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { DeloadBanner } from './DeloadBanner'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DeloadBanner />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
