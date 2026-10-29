import {
  assessPlotDeforestation,
  EUDR_DEFORESTATION_CUTOFF_DATE,
  type DeforestationCutoffZone
} from '../src/lib/deforestation'

describe('EUDR Deforestation Cutoff Engine (F24)', () => {
  it('enforces the exact EUDR post-2020 deforestation cutoff date 2020-12-31', () => {
    expect(EUDR_DEFORESTATION_CUTOFF_DATE).toBe('2020-12-31')
  })

  it('marks a plot outside any deforestation zones as COMPLIANT with no conflict', () => {
    const safePlot = {
      id: 'plot-safe-01',
      name: 'Safe Organic Farm',
      supplierId: 'supp-gh-01',
      geometry: {
        type: 'Point',
        coordinates: [-1.554321, 6.789123]
      },
      areaHectares: 3.2
    }

    const result = assessPlotDeforestation(safePlot)
    expect(result.status).toBe('COMPLIANT')
    expect(result.hasEncroachment).toBe(false)
    expect(result.encroachedAreaHectares).toBe(0)
    expect(result.encroachmentPercentage).toBe(0)
    expect(result.intersectingZones).toHaveLength(0)
    expect(result.spatialConflictResult.hasConflict).toBe(false)
    expect(result.spatialConflictResult.affectedPlotIds).toContain('plot-safe-01')
  })

  it('detects point plot encroachment inside post-2020 deforestation zone', () => {
    // Inside zone-gh-cocoa-2021 (bbox: [-2.75, 5.75] to [-2.70, 5.80])
    const encroachedPoint = {
      id: 'plot-bad-point',
      name: 'Illegal Encroachment Point',
      supplierId: 'supp-bad-01',
      geometry: {
        type: 'Point',
        coordinates: [-2.725000, 5.775000]
      },
      areaHectares: 2.5
    }

    const result = assessPlotDeforestation(encroachedPoint)
    expect(result.status).toBe('NON_COMPLIANT')
    expect(result.hasEncroachment).toBe(true)
    expect(result.encroachmentPercentage).toBe(100)
    expect(result.intersectingZones.length).toBeGreaterThan(0)
    expect(result.intersectingZones[0].lossYear).toBeGreaterThanOrEqual(2021)
    expect(result.spatialConflictResult.hasConflict).toBe(true)
    expect(result.spatialConflictResult.conflictType).toBe('DEFORESTATION_ENCROACHMENT')
    expect(result.spatialConflictResult.conflictingSupplierIds).toContain('supp-bad-01')
  })

  it('calculates partial polygon spatial intersection and encroachment percentage', () => {
    // Pará zone is [-54.50, -3.20] to [-54.40, -3.10]
    // Overlapping polygon: [-54.45, -3.15] to [-54.35, -3.05]
    const partialOverlapPlot = {
      id: 'plot-br-overlap',
      name: 'Fazenda Amazonia Sector B',
      supplierId: 'supp-br-02',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-54.45, -3.15],
          [-54.35, -3.15],
          [-54.35, -3.05],
          [-54.45, -3.05],
          [-54.45, -3.15]
        ]]
      },
      areaHectares: 120.0
    }

    const result = assessPlotDeforestation(partialOverlapPlot)
    expect(result.status).toBe('NON_COMPLIANT')
    expect(result.hasEncroachment).toBe(true)
    expect(result.encroachedAreaHectares).toBeGreaterThan(0)
    expect(result.encroachmentPercentage).toBeGreaterThan(0)
    expect(result.spatialConflictResult.hasConflict).toBe(true)
    expect(result.spatialConflictResult.overlapPercentage).toBe(result.encroachmentPercentage)
    expect(result.remediationAdvice).toContain('Under EUDR Art. 3')
  })

  it('strictly ignores pre-2021 deforestation layers under EUDR baseline rules', () => {
    const historicalZones: DeforestationCutoffZone[] = [
      {
        id: 'zone-historical-2018',
        name: 'Pre-2020 Historic Loss Area',
        country: 'GH',
        lossYear: 2018, // Prior to Dec 31, 2020 cutoff
        source: 'MOCK_LAYER',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-1.60, 6.70],
            [-1.50, 6.70],
            [-1.50, 6.80],
            [-1.60, 6.80],
            [-1.60, 6.70]
          ]]
        }
      }
    ]

    const plotInHistoricalZone = {
      id: 'plot-legitimate-clearing',
      name: 'Pre-Cutoff Clearing Farm',
      geometry: {
        type: 'Point',
        coordinates: [-1.550000, 6.750000]
      },
      areaHectares: 3.0
    }

    const result = assessPlotDeforestation(plotInHistoricalZone, historicalZones)
    expect(result.status).toBe('COMPLIANT')
    expect(result.hasEncroachment).toBe(false)
    expect(result.spatialConflictResult.hasConflict).toBe(false)
  })
})
