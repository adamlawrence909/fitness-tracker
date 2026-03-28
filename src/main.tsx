import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { seedExercises, seedInitialPhase } from './db/seed'
import './index.css'

// Seed DB on first run
Promise.all([seedExercises(), seedInitialPhase()]).catch(console.error)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
