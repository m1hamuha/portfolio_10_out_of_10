'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EudrPreset } from '@/lib/demo-presets'

interface DemoMapProps {
  preset: EudrPreset
}

export default function DemoMap({ preset }: DemoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [0, 20],
        zoom: 3,
        zoomControl: true,
        attributionControl: true
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      mapRef.current = map
      layerGroupRef.current = layerGroup
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        layerGroupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()

    const bounds = L.latLngBounds([])

    preset.places.forEach(place => {
      const color =
        preset.expectedVerdict === 'COMPLIANT'
          ? '#059669' // emerald
          : preset.expectedVerdict === 'CONFLICT_DETECTED'
            ? '#d97706' // amber
            : '#dc2626' // red

      if (place.geometryType === 'POINT') {
        const pointGeom = place.coordinates as { coordinates: [number, number] }
        const [lng, lat] = pointGeom.coordinates
        const latLng = L.latLng(lat, lng)
        bounds.extend(latLng)

        const marker = L.circleMarker(latLng, {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(layerGroup)

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: #0f172a;">${place.name}</strong><br/>
            <span style="color: #64748b;">Supplier:</span> ${place.supplierName}<br/>
            <span style="color: #64748b;">Area:</span> ${place.areaHectares} ha (Point)<br/>
            <span style="color: #64748b;">Coords:</span> ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
        `)
      } else if (place.geometryType === 'POLYGON') {
        const polyGeom = place.coordinates as { coordinates: number[][][] }
        const ring = polyGeom.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
        ring.forEach(pt => bounds.extend(pt))

        const poly = L.polygon(ring, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.35
        }).addTo(layerGroup)

        poly.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong style="color: #0f172a;">${place.name}</strong><br/>
            <span style="color: #64748b;">Supplier:</span> ${place.supplierName}<br/>
            <span style="color: #64748b;">Area:</span> ${place.areaHectares} ha (Polygon)<br/>
            <span style="color: #64748b;">Vertices:</span> ${ring.length} points
          </div>
        `)
      }
    })

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [preset])

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 z-0"
    />
  )
}
