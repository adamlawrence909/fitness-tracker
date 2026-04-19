/**
 * RunMap — renders a Leaflet/OpenStreetMap map for live run tracking
 * and saved route display. Uses vanilla Leaflet (no react-leaflet) to
 * avoid mounting/context issues with the tabs layout.
 */
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import type { GpsPoint } from '@/utils/calculations'

interface RunMapProps {
  points: GpsPoint[]
  /** If true, auto-centres on the latest point and shows a live marker */
  isLive?: boolean
  height?: string
  className?: string
}

// Custom blue-dot icon for current position (avoids bundler icon-path issues)
function buildCurrentPosIcon(L: typeof import('leaflet')): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:16px;height:16px;
      background:#3b82f6;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: '',
  })
}

// Start/end flag markers
function buildFlagIcon(L: typeof import('leaflet'), color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:12px;height:12px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    className: '',
  })
}

export function RunMap({ points, isLive = false, height = '280px', className = '' }: RunMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const liveMarkerRef = useRef<L.Marker | null>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)

  // Initialise map on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Default view if no points yet
      map.setView([51.505, -0.09], 15)

      mapRef.current = map

      // Draw initial route if points already exist (e.g. static route display)
      if (points.length > 0) {
        const latlngs = points.map(p => [p.lat, p.lng] as [number, number])
        polylineRef.current = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map)

        map.fitBounds(polylineRef.current.getBounds(), { padding: [24, 24] })

        startMarkerRef.current = L.marker(latlngs[0], {
          icon: buildFlagIcon(L, '#22c55e'),
        }).addTo(map)

        if (!isLive) {
          // End marker for completed route
          L.marker(latlngs[latlngs.length - 1], {
            icon: buildFlagIcon(L, '#ef4444'),
          }).addTo(map)
        }

        if (isLive) {
          liveMarkerRef.current = L.marker(latlngs[latlngs.length - 1], {
            icon: buildCurrentPosIcon(L),
          }).addTo(map)
        }
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      polylineRef.current = null
      liveMarkerRef.current = null
      startMarkerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update polyline + live marker when points change
  useEffect(() => {
    if (!mapRef.current || points.length === 0) return

    import('leaflet').then((L) => {
      const map = mapRef.current
      if (!map) return

      const latlngs = points.map(p => [p.lat, p.lng] as [number, number])

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map)
      } else {
        polylineRef.current.setLatLngs(latlngs)
      }

      // Start marker — only once
      if (!startMarkerRef.current) {
        startMarkerRef.current = L.marker(latlngs[0], {
          icon: buildFlagIcon(L, '#22c55e'),
        }).addTo(map)
      }

      const latest = latlngs[latlngs.length - 1]

      if (isLive) {
        // Move or create live position marker
        if (!liveMarkerRef.current) {
          liveMarkerRef.current = L.marker(latest, {
            icon: buildCurrentPosIcon(L),
          }).addTo(map)
        } else {
          liveMarkerRef.current.setLatLng(latest)
        }
        // Keep current position centred during live tracking
        map.panTo(latest, { animate: true, duration: 0.5 })
      } else if (points.length >= 2) {
        // Fit to full route for static display
        const bounds = polylineRef.current!.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24] })
        }
      } else {
        map.setView(latest, 16)
      }
    })
  }, [points, isLive])

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`w-full rounded-xl overflow-hidden border border-border ${className}`}
    />
  )
}
