import * as turf from '@turf/turf'
import type { SpatialConflictResult } from '@/types/contracts'

export interface SupplierPlotRef {
  supplierId: string
  supplierName: string
  plotId: string
  plotName: string
  commodity?: string
  country?: string
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon'
    coordinates: unknown
  }
  areaHectares?: number
}

export interface SupplierConflict {
  conflictId: string
  conflictType: 'EXACT_DUPLICATE' | 'POLYGON_OVERLAP'
  supplierA: { id: string; name: string; plotId: string; plotName: string }
  supplierB: { id: string; name: string; plotId: string; plotName: string }
  overlapAreaHectares?: number
  overlapPercentage?: number
  duplicateCoordinates?: [number, number]
  remediationAdvice: string
  spatialConflictResult: SpatialConflictResult
}

export interface ConflictDetectionSummary {
  totalPlotsAnalyzed: number
  totalSuppliersAnalyzed: number
  hasConflicts: boolean
  exactDuplicatesCount: number
  polygonOverlapsCount: number
  conflicts: SupplierConflict[]
  conflictsBySupplierId: Record<string, SupplierConflict[]>
  conflictsByPlotId: Record<string, SupplierConflict[]>
}

export function detectSupplierConflicts(
  plots: SupplierPlotRef[],
  options: { overlapThresholdPercentage?: number } = {}
): ConflictDetectionSummary {
  const threshold = options.overlapThresholdPercentage ?? 1.0 // 1% threshold
  const conflicts: SupplierConflict[] = []
  const uniqueSuppliers = new Set(plots.map(p => p.supplierId))

  for (let i = 0; i < plots.length; i++) {
    for (let j = i + 1; j < plots.length; j++) {
      const pA = plots[i]
      const pB = plots[j]

      // Cross-supplier only: conflicts between the same supplier's plots are ignored
      if (pA.supplierId === pB.supplierId) continue

      // Case 1: Point vs Point duplicate
      if (pA.geometry.type === 'Point' && pB.geometry.type === 'Point') {
        const coordA = pA.geometry.coordinates as [number, number]
        const coordB = pB.geometry.coordinates as [number, number]

        const lngDiff = Math.abs(coordA[0] - coordB[0])
        const latDiff = Math.abs(coordA[1] - coordB[1])

        if (lngDiff < 1e-6 && latDiff < 1e-6) {
          const advice = `Exact duplicate coordinates claimed by suppliers "${pA.supplierName}" and "${pB.supplierName}". Under EUDR Art. 9, unique producer origin is required. Verify land titles.`
          conflicts.push({
            conflictId: `conflict-dup-${pA.plotId}-${pB.plotId}`,
            conflictType: 'EXACT_DUPLICATE',
            supplierA: { id: pA.supplierId, name: pA.supplierName, plotId: pA.plotId, plotName: pA.plotName },
            supplierB: { id: pB.supplierId, name: pB.supplierName, plotId: pB.plotId, plotName: pB.plotName },
            duplicateCoordinates: [coordA[0], coordA[1]],
            remediationAdvice: advice,
            spatialConflictResult: {
              hasConflict: true,
              conflictType: 'EXACT_DUPLICATE',
              conflictingSupplierIds: [pA.supplierId, pB.supplierId],
              affectedPlotIds: [pA.plotId, pB.plotId],
              remediationAdvice: advice
            }
          })
        }
      }

      // Case 2: Polygon vs Polygon overlap
      if (
        (pA.geometry.type === 'Polygon' || pA.geometry.type === 'MultiPolygon') &&
        (pB.geometry.type === 'Polygon' || pB.geometry.type === 'MultiPolygon')
      ) {
        const featA = turf.feature(pA.geometry as any)
        const featB = turf.feature(pB.geometry as any)

        if (turf.booleanDisjoint(featA, featB)) continue

        try {
          const intersection = turf.intersect(turf.featureCollection([featA, featB]))
          if (intersection) {
            const overlapM2 = turf.area(intersection)
            const overlapHa = overlapM2 / 10000

            const areaA = pA.areaHectares ?? (turf.area(featA) / 10000)
            const areaB = pB.areaHectares ?? (turf.area(featB) / 10000)

            const pctA = areaA > 0 ? (overlapHa / areaA) * 100 : 0
            const pctB = areaB > 0 ? (overlapHa / areaB) * 100 : 0
            const maxPct = Math.max(pctA, pctB)

            // Overlap must exceed the 1% threshold
            if (maxPct > threshold) {
              const roundedPct = Math.round(maxPct * 10) / 10
              const roundedHa = Math.round(overlapHa * 100) / 100
              const advice = `Plot polygons overlap by ${roundedPct}% (${roundedHa} ha) between "${pA.supplierName}" and "${pB.supplierName}". Exceeds ${threshold}% conflict threshold. Perform joint cadastral survey.`

              conflicts.push({
                conflictId: `conflict-overlap-${pA.plotId}-${pB.plotId}`,
                conflictType: 'POLYGON_OVERLAP',
                supplierA: { id: pA.supplierId, name: pA.supplierName, plotId: pA.plotId, plotName: pA.plotName },
                supplierB: { id: pB.supplierId, name: pB.supplierName, plotId: pB.plotId, plotName: pB.plotName },
                overlapAreaHectares: roundedHa,
                overlapPercentage: roundedPct,
                remediationAdvice: advice,
                spatialConflictResult: {
                  hasConflict: true,
                  conflictType: 'POLYGON_OVERLAP',
                  overlapAreaHectares: roundedHa,
                  overlapPercentage: roundedPct,
                  conflictingSupplierIds: [pA.supplierId, pB.supplierId],
                  affectedPlotIds: [pA.plotId, pB.plotId],
                  remediationAdvice: advice
                }
              })
            }
          }
        } catch {
          // Boundary touch / self-tangency
        }
      }
    }
  }

  const conflictsBySupplierId: Record<string, SupplierConflict[]> = {}
  const conflictsByPlotId: Record<string, SupplierConflict[]> = {}

  for (const c of conflicts) {
    for (const sid of [c.supplierA.id, c.supplierB.id]) {
      if (!conflictsBySupplierId[sid]) conflictsBySupplierId[sid] = []
      conflictsBySupplierId[sid].push(c)
    }
    for (const pid of [c.supplierA.plotId, c.supplierB.plotId]) {
      if (!conflictsByPlotId[pid]) conflictsByPlotId[pid] = []
      conflictsByPlotId[pid].push(c)
    }
  }

  return {
    totalPlotsAnalyzed: plots.length,
    totalSuppliersAnalyzed: uniqueSuppliers.size,
    hasConflicts: conflicts.length > 0,
    exactDuplicatesCount: conflicts.filter(c => c.conflictType === 'EXACT_DUPLICATE').length,
    polygonOverlapsCount: conflicts.filter(c => c.conflictType === 'POLYGON_OVERLAP').length,
    conflicts,
    conflictsBySupplierId,
    conflictsByPlotId
  }
}
