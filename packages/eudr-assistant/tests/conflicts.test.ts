import {
  detectSupplierConflicts,
  type SupplierPlotRef
} from '../src/lib/conflicts'

describe('EUDR Cross-Supplier Conflict Engine (F25)', () => {
  it('detects exact duplicate coordinates between two distinct suppliers', () => {
    const plots: SupplierPlotRef[] = [
      {
        supplierId: 'supp-101',
        supplierName: 'Agro Export A',
        plotId: 'plot-101-a',
        plotName: 'Farm Alpha',
        geometry: {
          type: 'Point',
          coordinates: [-1.554321, 6.789123]
        }
      },
      {
        supplierId: 'supp-102',
        supplierName: 'Commodity Co B',
        plotId: 'plot-102-b',
        plotName: 'Farm Beta',
        geometry: {
          type: 'Point',
          coordinates: [-1.554321, 6.789123]
        }
      }
    ]

    const result = detectSupplierConflicts(plots)
    expect(result.hasConflicts).toBe(true)
    expect(result.exactDuplicatesCount).toBe(1)
    expect(result.polygonOverlapsCount).toBe(0)
    expect(result.conflicts[0].conflictType).toBe('EXACT_DUPLICATE')
    expect(result.conflicts[0].spatialConflictResult.hasConflict).toBe(true)
    expect(result.conflicts[0].spatialConflictResult.conflictingSupplierIds).toEqual(
      expect.arrayContaining(['supp-101', 'supp-102'])
    )
    expect(result.conflictsBySupplierId['supp-101']).toHaveLength(1)
    expect(result.conflictsBySupplierId['supp-102']).toHaveLength(1)
  })

  it('ignores duplicate coordinates between plots belonging to the same supplier', () => {
    const plots: SupplierPlotRef[] = [
      {
        supplierId: 'supp-same',
        supplierName: 'Internal Estate',
        plotId: 'plot-sub-1',
        plotName: 'Sector 1',
        geometry: {
          type: 'Point',
          coordinates: [-1.554321, 6.789123]
        }
      },
      {
        supplierId: 'supp-same',
        supplierName: 'Internal Estate',
        plotId: 'plot-sub-2',
        plotName: 'Sector 2',
        geometry: {
          type: 'Point',
          coordinates: [-1.554321, 6.789123]
        }
      }
    ]

    const result = detectSupplierConflicts(plots)
    expect(result.hasConflicts).toBe(false)
    expect(result.exactDuplicatesCount).toBe(0)
  })

  it('detects cross-supplier polygon overlaps exceeding the 1% threshold', () => {
    // Two overlapping 100ha square plots with 25% overlap
    // Plot A: [0, 0] to [1, 1]
    // Plot B: [0.5, 0] to [1.5, 1]
    const plots: SupplierPlotRef[] = [
      {
        supplierId: 'supp-poly-a',
        supplierName: 'Supplier North',
        plotId: 'plot-poly-a',
        plotName: 'North Parcel',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0.0, 0.0],
            [1.0, 0.0],
            [1.0, 1.0],
            [0.0, 1.0],
            [0.0, 0.0]
          ]]
        }
      },
      {
        supplierId: 'supp-poly-b',
        supplierName: 'Supplier South',
        plotId: 'plot-poly-b',
        plotName: 'South Parcel',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0.5, 0.0],
            [1.5, 0.0],
            [1.5, 1.0],
            [0.5, 1.0],
            [0.5, 0.0]
          ]]
        }
      }
    ]

    const result = detectSupplierConflicts(plots)
    expect(result.hasConflicts).toBe(true)
    expect(result.polygonOverlapsCount).toBe(1)
    expect(result.conflicts[0].conflictType).toBe('POLYGON_OVERLAP')
    expect(result.conflicts[0].overlapPercentage).toBeGreaterThan(1.0)
    expect(result.conflicts[0].spatialConflictResult.hasConflict).toBe(true)
    expect(result.conflicts[0].remediationAdvice).toContain('Perform joint cadastral survey')
  })

  it('ignores minor boundary overlaps below or equal to the threshold (e.g., 0.5%)', () => {
    // Plot A: [0, 0] to [1, 1] (Area ~ 1.0 deg^2)
    // Plot B: [0.998, 0] to [1.998, 1] (Overlap is 0.002 x 1 = 0.2%, <= 1.0% tolerance)
    const plots: SupplierPlotRef[] = [
      {
        supplierId: 'supp-border-a',
        supplierName: 'Border Farm A',
        plotId: 'plot-border-a',
        plotName: 'Parcel A',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0.000, 0.000],
            [1.000, 0.000],
            [1.000, 1.000],
            [0.000, 1.000],
            [0.000, 0.000]
          ]]
        }
      },
      {
        supplierId: 'supp-border-b',
        supplierName: 'Border Farm B',
        plotId: 'plot-border-b',
        plotName: 'Parcel B',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0.998, 0.000],
            [1.998, 0.000],
            [1.998, 1.000],
            [0.998, 1.000],
            [0.998, 0.000]
          ]]
        }
      }
    ]

    const result = detectSupplierConflicts(plots, { overlapThresholdPercentage: 1.0 })
    expect(result.hasConflicts).toBe(false)
    expect(result.polygonOverlapsCount).toBe(0)
  })

  it('returns clean summary with 0 conflicts when all suppliers have disjoint plots', () => {
    const plots: SupplierPlotRef[] = [
      {
        supplierId: 'supp-clean-1',
        supplierName: 'Ghana Co',
        plotId: 'plot-c-1',
        plotName: 'Farm GH',
        geometry: {
          type: 'Point',
          coordinates: [-1.500000, 6.500000]
        }
      },
      {
        supplierId: 'supp-clean-2',
        supplierName: 'Ivory Coast Co',
        plotId: 'plot-c-2',
        plotName: 'Farm CI',
        geometry: {
          type: 'Point',
          coordinates: [-3.200000, 5.800000]
        }
      }
    ]

    const result = detectSupplierConflicts(plots)
    expect(result.hasConflicts).toBe(false)
    expect(result.conflicts).toHaveLength(0)
    expect(result.totalPlotsAnalyzed).toBe(2)
    expect(result.totalSuppliersAnalyzed).toBe(2)
  })
})
