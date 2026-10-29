import * as turf from '@turf/turf'
import type { SpatialConflictResult } from '@/types/contracts'

export const EUDR_DEFORESTATION_CUTOFF_DATE = '2020-12-31'

export interface DeforestationCutoffZone {
  id: string
  name: string
  country: string
  lossYear: number // >= 2021 represents post-2020 deforestation
  source: 'GLOBAL_FOREST_WATCH' | 'JRC_TMF' | 'EU_OBSERVATORY' | 'MOCK_LAYER'
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

export interface DeforestationAssessmentResult {
  plotId: string
  plotName: string
  hasEncroachment: boolean
  encroachedAreaHectares: number
  encroachmentPercentage: number
  intersectingZones: Array<{
    zoneId: string
    zoneName: string
    lossYear: number
    areaHectares: number
  }>
  cutoffDate: string
  status: 'COMPLIANT' | 'NON_COMPLIANT'
  remediationAdvice: string
  spatialConflictResult: SpatialConflictResult
}

export const BUILTIN_DEFORESTATION_ZONES: DeforestationCutoffZone[] = [
  {
    id: 'zone-gh-cocoa-2021',
    name: 'Ghana Boin River Forest Reserve (Post-2020 Loss)',
    country: 'GH',
    lossYear: 2021,
    source: 'MOCK_LAYER',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-2.75, 5.75],
        [-2.70, 5.75],
        [-2.70, 5.80],
        [-2.75, 5.80],
        [-2.75, 5.75]
      ]]
    }
  },
  {
    id: 'zone-br-amazon-2022',
    name: 'Pará Rainforest Encroachment Sector 4',
    country: 'BR',
    lossYear: 2022,
    source: 'MOCK_LAYER',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-54.50, -3.20],
        [-54.40, -3.20],
        [-54.40, -3.10],
        [-54.50, -3.10],
        [-54.50, -3.20]
      ]]
    }
  },
  {
    id: 'zone-id-borneo-2023',
    name: 'Central Kalimantan Peat Forest Loss',
    country: 'ID',
    lossYear: 2023,
    source: 'MOCK_LAYER',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [114.20, -0.55],
        [114.25, -0.55],
        [114.25, -0.50],
        [114.20, -0.50],
        [114.20, -0.55]
      ]]
    }
  }
]

export function assessPlotDeforestation(
  plot: {
    id?: string
    plotId?: string
    name?: string
    plotName?: string
    geometry: { type: string; coordinates: unknown }
    areaHectares?: number
    supplierId?: string
  },
  customZones?: DeforestationCutoffZone[]
): DeforestationAssessmentResult {
  const plotId = plot.id ?? plot.plotId ?? 'unknown-plot'
  const plotName = plot.name ?? plot.plotName ?? 'Unnamed Plot'
  const zones = customZones && customZones.length > 0 ? customZones : BUILTIN_DEFORESTATION_ZONES
  const intersectingZones: DeforestationAssessmentResult['intersectingZones'] = []
  let totalEncroachedHa = 0

  if (plot.geometry.type === 'Polygon' || plot.geometry.type === 'MultiPolygon') {
    const plotTurf = turf.feature(plot.geometry as any)
    const plotTotalAreaHa = plot.areaHectares ?? (turf.area(plotTurf) / 10000)

    for (const zone of zones) {
      if (zone.lossYear < 2021) continue // Skip pre-cutoff baseline under EUDR Art. 3

      const zoneTurf = turf.feature(zone.geometry as any)

      // Fast bbox/disjoint pre-check
      if (turf.booleanDisjoint(plotTurf, zoneTurf)) continue

      try {
        const intersection = turf.intersect(turf.featureCollection([plotTurf, zoneTurf]))
        if (intersection) {
          const areaM2 = turf.area(intersection)
          const areaHa = areaM2 / 10000
          if (areaHa > 0.0001) {
            totalEncroachedHa += areaHa
            intersectingZones.push({
              zoneId: zone.id,
              zoneName: zone.name,
              lossYear: zone.lossYear,
              areaHectares: Math.round(areaHa * 1000) / 1000
            })
          }
        }
      } catch {
        // Disjoint or boundary touch
      }
    }

    const encroachmentPercentage = plotTotalAreaHa > 0
      ? Math.min(100, Math.round((totalEncroachedHa / plotTotalAreaHa) * 10000) / 100)
      : 0

    const hasEncroachment = totalEncroachedHa > 0.0001

    const remediationAdvice = hasEncroachment
      ? `Plot overlaps post-2020 deforestation cutoff zone by ${encroachmentPercentage}% (${totalEncroachedHa.toFixed(2)} ha). Under EUDR Art. 3, commodities produced on land deforested after Dec 31, 2020 cannot be placed on the EU market. Exclude encroached parcel or obtain verified high-resolution canopy historical proof.`
      : 'Compliant: Zero post-2020 deforestation overlap detected.'

    return {
      plotId,
      plotName,
      hasEncroachment,
      encroachedAreaHectares: Math.round(totalEncroachedHa * 100) / 100,
      encroachmentPercentage,
      intersectingZones,
      cutoffDate: EUDR_DEFORESTATION_CUTOFF_DATE,
      status: hasEncroachment ? 'NON_COMPLIANT' : 'COMPLIANT',
      remediationAdvice,
      spatialConflictResult: {
        hasConflict: hasEncroachment,
        conflictType: hasEncroachment ? 'DEFORESTATION_ENCROACHMENT' : undefined,
        overlapAreaHectares: Math.round(totalEncroachedHa * 100) / 100,
        overlapPercentage: encroachmentPercentage,
        conflictingSupplierIds: plot.supplierId ? [plot.supplierId] : [],
        affectedPlotIds: [plotId],
        remediationAdvice
      }
    }
  } else if (plot.geometry.type === 'Point') {
    const pointTurf = turf.point(plot.geometry.coordinates as [number, number])
    for (const zone of zones) {
      if (zone.lossYear < 2021) continue
      const zoneTurf = turf.feature(zone.geometry as any)
      if (turf.booleanPointInPolygon(pointTurf, zoneTurf)) {
        const remediationAdvice = `Plot point falls inside post-2020 deforestation zone "${zone.name}". Immediate exclusion required under EUDR Art. 3.`
        return {
          plotId,
          plotName,
          hasEncroachment: true,
          encroachedAreaHectares: plot.areaHectares ?? 0,
          encroachmentPercentage: 100,
          intersectingZones: [{
            zoneId: zone.id,
            zoneName: zone.name,
            lossYear: zone.lossYear,
            areaHectares: plot.areaHectares ?? 0
          }],
          cutoffDate: EUDR_DEFORESTATION_CUTOFF_DATE,
          status: 'NON_COMPLIANT',
          remediationAdvice,
          spatialConflictResult: {
            hasConflict: true,
            conflictType: 'DEFORESTATION_ENCROACHMENT',
            overlapAreaHectares: plot.areaHectares ?? 0,
            overlapPercentage: 100,
            conflictingSupplierIds: plot.supplierId ? [plot.supplierId] : [],
            affectedPlotIds: [plotId],
            remediationAdvice
          }
        }
      }
    }
  }

  return {
    plotId,
    plotName,
    hasEncroachment: false,
    encroachedAreaHectares: 0,
    encroachmentPercentage: 0,
    intersectingZones: [],
    cutoffDate: EUDR_DEFORESTATION_CUTOFF_DATE,
    status: 'COMPLIANT',
    remediationAdvice: 'Compliant: Zero post-2020 deforestation overlap detected.',
    spatialConflictResult: {
      hasConflict: false,
      affectedPlotIds: [plotId],
      remediationAdvice: 'Compliant: Zero post-2020 deforestation overlap detected.'
    }
  }
}
