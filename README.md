# Workout Tracker PWA

A mobile-first Progressive Web App for tracking workouts with progressive overload, deload cycles, periodization, and GPS run tracking.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:5173 in your browser, then on iPhone:
- Open Safari → visit your local IP (e.g. http://192.168.x.x:5173)
- Tap Share → Add to Home Screen

## What's included

- **Dashboard** — weekly schedule, current phase/cycle, today's workout at a glance
- **Workout** — log exercises by category (Shoulders+Tri, Chest+Tri, Back+Bi, Legs, Pilates)
  - + / − stepper inputs (big tap targets for gym use)
  - Auto-starred exercises (⭐ Dips appear in every session)
  - Deload weight suggestions (50–60% of previous week)
  - Personal best detection 🏆
- **Run** — GPS tracking, km splits, pace, distance, multi-mode (Run/Walk/Cycle/Pilates/Free)
- **Progress** — line charts per exercise, running weekly distance, PB tracking, deload shading
- **Settings** — phase management (Hypertrophy/Strength/Endurance), data export

## Tech Stack

React 18 + TypeScript · Vite · shadcn/ui + Tailwind CSS · Dexie.js (IndexedDB) · React Router · Recharts · Zustand · date-fns · vite-plugin-pwa

## Google Maps (optional)

To enable GPS route mapping:
1. Get a Google Maps API key
2. Copy `.env.example` → `.env.local`
3. Add your key: `VITE_GOOGLE_MAPS_API_KEY=your_key`
4. `npm install @googlemaps/react-wrapper @types/google.maps`

## Data

All data stored locally in IndexedDB (works offline, no account needed). Export via Settings → Export all data (JSON) for future migration to Supabase.
