import { validateGeoJSON } from '../src/lib/eudr-validator'
import { assessPlotDeforestation } from '../src/lib/deforestation'
import { detectSupplierConflicts, type SupplierPlotRef } from '../src/lib/conflicts'
import { buildCompliancePack, type CompliancePackInput } from '../src/lib/compliance-pack'

describe('Tier 4 Scenario 4: Cross-Border Cocoa Cooperative Audit (30 Plots)', () => {
  // Generate 30 realistic cocoa plots across Western Ghana & Eastern Ivory Coast border
  const generateAuditCallset = () => {
    const plots: SupplierPlotRef[] = []

    // Supplier 1: Kuapa Kokoo Ashanti (Ghana) - 15 plots
    for (let i = 1; i <= 15; i++) {
      const isLarge = i % 3 === 0
      const baseLng = -2.100000 + (i * 0.015)
      const baseLat = 6.200000 + (i * 0.015)

      plots.push({
        supplierId: 'supp-gh-kuapa',
        supplierName: 'Kuapa Kokoo Ashanti',
        commodity: 'COCOA',
        country: 'GH',
        plotId: `gh-plot-${i}`,
        plotName: `Kumasi Smallholder #${i}`,
        areaHectares: isLarge ? 8.5 : 2.8,
        geometry: isLarge
          ? {
              type: 'Polygon',
              coordinates: [[
                [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))],
                [Number((baseLng + 0.01).toFixed(6)), Number(baseLat.toFixed(6))],
                [Number((baseLng + 0.01).toFixed(6)), Number((baseLat + 0.01).toFixed(6))],
                [Number(baseLng.toFixed(6)), Number((baseLat + 0.01).toFixed(6))],
                [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))]
              ]]
            }
          : {
              type: 'Point',
              coordinates: [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))]
            }
      })
    }

    // Supplier 2: Cavally Cooperative (Ivory Coast) - 15 plots
    for (let j = 1; j <= 15; j++) {
      const isLarge = j % 3 === 0
      const baseLng = -3.400000 + (j * 0.015)
      const baseLat = 6.100000 + (j * 0.015)

      plots.push({
        supplierId: 'supp-ci-cavally',
        supplierName: 'Cavally Cocoa Cooperative',
        commodity: 'COCOA',
        country: 'CI',
        plotId: `ci-plot-${j}`,
        plotName: `Cavally Plantation #${j}`,
        areaHectares: isLarge ? 9.2 : 3.1,
        geometry: isLarge
          ? {
              type: 'Polygon',
              coordinates: [[
                [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))],
                [Number((baseLng + 0.01).toFixed(6)), Number(baseLat.toFixed(6))],
                [Number((baseLng + 0.01).toFixed(6)), Number((baseLat + 0.01).toFixed(6))],
                [Number(baseLng.toFixed(6)), Number((baseLat + 0.01).toFixed(6))],
                [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))]
              ]]
            }
          : {
              type: 'Point',
              coordinates: [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))]
            }
      })
    }

    // Inject Scenario Anomaly 1: Cross-supplier coordinate duplicate
    // Plot GH-5 and Plot CI-5 claim identical point coordinates
    plots[19].geometry = {
      type: 'Point',
      coordinates: plots[4].geometry.coordinates
    }

    // Inject Scenario Anomaly 2: Cross-supplier polygon overlap (>10%)
    // Plot CI-6 overlaps with GH-6
    plots[20].geometry = {
      type: 'Polygon',
      coordinates: [[
        [-2.020000, 6.280000],
        [-2.005000, 6.280000],
        [-2.005000, 6.295000],
        [-2.020000, 6.295000],
        [-2.020000, 6.280000]
      ]]
    }

    // Inject Scenario Anomaly 3: Post-2020 deforestation encroachment
    // Plot GH-15 placed directly inside Ghana Boin River Reserve (post-2020 loss zone)
    plots[14].geometry = {
      type: 'Point',
      coordinates: [-2.720000, 5.770000]
    }

    return plots
  }

  it('audits 30 cross-border plots, isolates conflicts and deforestation, and produces verified compliance pack', async () => {
    const plots = generateAuditCallset()
    expect(plots).toHaveLength(30)

    // 1. Cross-Supplier Conflict Engine Analysis
    const conflictSummary = detectSupplierConflicts(plots)
    expect(conflictSummary.hasConflicts).toBe(true)
    expect(conflictSummary.exactDuplicatesCount).toBe(1)
    expect(conflictSummary.polygonOverlapsCount).toBeGreaterThanOrEqual(1)

    // 2. Deforestation Cutoff Analysis across all 30 plots
    const deforestationAssessments = plots.map(p => assessPlotDeforestation(p))
    const deforestedPlots = deforestationAssessments.filter(a => a.hasEncroachment)
    expect(deforestedPlots.length).toBeGreaterThanOrEqual(1)
    expect(deforestedPlots[0].plotId).toBe('gh-plot-15')
    expect(deforestedPlots[0].cutoffDate).toBe('2020-12-31')

    // 3. GeoJSON Validation on all plots
    const geojsonFeatures = plots.map(p => ({
      type: 'Feature' as const,
      properties: { ProductionPlace: p.plotName, Area: p.areaHectares },
      geometry: p.geometry as any
    }))
    const validationResult = validateGeoJSON({
      type: 'FeatureCollection',
      features: geojsonFeatures
    })
    // Geometries themselves are closed WGS84 coordinates
    expect(validationResult.errors.filter(e => e.code === 'POLYGON_NOT_CLOSED')).toHaveLength(0)

    // 4. Remediation & Clean Sub-set Isolation
    const conflictPlotIds = new Set(conflictSummary.conflicts.flatMap(c => [c.supplierA.plotId, c.supplierB.plotId]))
    const deforestedPlotIds = new Set(deforestedPlots.map(d => d.plotId))

    const cleanPlots = plots.filter(p => !conflictPlotIds.has(p.plotId) && !deforestedPlotIds.has(p.plotId))
    expect(cleanPlots.length).toBeGreaterThanOrEqual(25) // At least 25 plots clean

    // 5. Generate TRACES NT Compliance Pack for clean plots
    const packInput: CompliancePackInput = {
      clientId: 'coop-audit-client',
      operator: {
        companyName: 'European Craft Cocoa Importers AG',
        country: 'DE',
        email: 'audit@craftcocoa.de'
      },
      suppliers: [
        {
          id: 'supp-gh-kuapa',
          name: 'Kuapa Kokoo Ashanti',
          commodity: 'COCOA',
          country: 'GH',
          places: cleanPlots.filter(p => p.supplierId === 'supp-gh-kuapa').map(p => ({
            id: p.plotId,
            name: p.plotName,
            country: 'GH',
            areaHectares: p.areaHectares ?? 2.5,
            geometryType: p.geometry.type === 'Polygon' ? 'POLYGON' : 'POINT',
            validationStatus: 'VALID' as const,
            coordinates: p.geometry
          }))
        },
        {
          id: 'supp-ci-cavally',
          name: 'Cavally Cocoa Cooperative',
          commodity: 'COCOA',
          country: 'CI',
          places: cleanPlots.filter(p => p.supplierId === 'supp-ci-cavally').map(p => ({
            id: p.plotId,
            name: p.plotName,
            country: 'CI',
            areaHectares: p.areaHectares ?? 2.5,
            geometryType: p.geometry.type === 'Polygon' ? 'POLYGON' : 'POINT',
            validationStatus: 'VALID' as const,
            coordinates: p.geometry
          }))
        }
      ]
    }

    const pack = await buildCompliancePack(packInput)
    expect(pack.fileCount).toBe(5)
    expect(pack.certificate.algorithm).toBe('SHA-256')
    expect(pack.certificate.packageChecksum).toMatch(/^[a-f0-9]{64}$/)
    expect(pack.dds.totalPlots).toBe(cleanPlots.length)
    expect(pack.zipBuffer.length).toBeGreaterThan(1000)
  })
})
