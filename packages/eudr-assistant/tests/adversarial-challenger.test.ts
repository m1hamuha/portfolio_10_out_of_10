import crypto from 'crypto'
import zlib from 'zlib'
import {
  validateGeoJSON,
  VALIDATION_CODES
} from '../src/lib/eudr-validator'
import {
  assessPlotDeforestation,
  EUDR_DEFORESTATION_CUTOFF_DATE,
  type DeforestationCutoffZone
} from '../src/lib/deforestation'
import {
  detectSupplierConflicts,
  type SupplierPlotRef
} from '../src/lib/conflicts'
import {
  buildCompliancePack,
  type CompliancePackInput,
  type SHA256IntegrityCertificate
} from '../src/lib/compliance-pack'

/**
 * Pure TypeScript ZIP extractor that reads central directory records
 * to extract uncompressed byte buffers without external dependencies.
 */
function unzipBuffer(buf: Buffer): Record<string, Buffer> {
  const files: Record<string, Buffer> = {}

  // Find End of Central Directory Record (EOCD) signature 0x06054b50
  let eocdOffset = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  if (eocdOffset === -1) {
    throw new Error('EOCD signature not found in ZIP buffer')
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10)
  const cdOffset = buf.readUInt32LE(eocdOffset + 16)

  let entryOffset = cdOffset
  for (let e = 0; e < totalEntries; e++) {
    const cdSig = buf.readUInt32LE(entryOffset)
    if (cdSig !== 0x02014b50) {
      throw new Error(`Invalid Central Directory header signature at offset ${entryOffset}`)
    }

    const compMethod = buf.readUInt16LE(entryOffset + 10)
    const compSize = buf.readUInt32LE(entryOffset + 20)
    const fnLen = buf.readUInt16LE(entryOffset + 28)
    const extraLen = buf.readUInt16LE(entryOffset + 30)
    const commentLen = buf.readUInt16LE(entryOffset + 32)
    const localHeaderOffset = buf.readUInt32LE(entryOffset + 42)

    const filename = buf.toString('utf8', entryOffset + 46, entryOffset + 46 + fnLen)

    // Local file header inspection
    const localSig = buf.readUInt32LE(localHeaderOffset)
    if (localSig !== 0x04034b50) {
      throw new Error(`Invalid local file header signature at offset ${localHeaderOffset}`)
    }
    const localFnLen = buf.readUInt16LE(localHeaderOffset + 26)
    const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28)

    const dataStart = localHeaderOffset + 30 + localFnLen + localExtraLen
    const compData = buf.subarray(dataStart, dataStart + compSize)

    let fileContent: Buffer
    if (compMethod === 0) {
      fileContent = compData
    } else if (compMethod === 8) {
      fileContent = zlib.inflateRawSync(compData)
    } else {
      throw new Error(`Unsupported compression method: ${compMethod}`)
    }

    files[filename] = fileContent
    entryOffset += 46 + fnLen + extraLen + commentLen
  }

  return files
}

describe('M3 Adversarial Challenge Suite (Empirical Challenger)', () => {
  // Helper for GeoJSON creation
  const createFeature = (geometry: any, properties: Record<string, unknown> = {}) => ({
    type: 'Feature' as const,
    properties,
    geometry
  })

  // =========================================================================
  // 1. BOUNDARY VALIDATOR ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('1. Boundary Validator (src/lib/eudr-validator.ts)', () => {
    it('accurately detects classic bowtie self-intersecting polygon via turf.kinks with SELF_INTERSECTION code', () => {
      // Bowtie geometry: edges cross at (1, 1)
      const bowtie = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [0.000000, 0.000000],
            [2.000000, 2.000000],
            [0.000000, 2.000000],
            [2.000000, 0.000000],
            [0.000000, 0.000000]
          ]
        ]
      }, { ProductionPlace: 'Bowtie Farm' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [bowtie] })
      expect(result.valid).toBe(false)
      const kinkError = result.errors.find(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)
      expect(kinkError).toBeDefined()
      expect(kinkError?.message).toContain('kinks detected')
    })

    it('accurately detects figure-8 self-intersecting polygon', () => {
      // Figure-8 crossing geometry
      const figure8 = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [0.000000, 0.000000],
            [2.000000, 0.000000],
            [0.000000, 2.000000],
            [2.000000, 2.000000],
            [0.000000, 0.000000]
          ]
        ]
      }, { ProductionPlace: 'Figure-8 Parcel' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [figure8] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })

    it('accurately detects 5-point complex star polygon with multiple intersecting edges', () => {
      // Star polygon self-intersecting at multiple points
      const star = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [0.000000, 3.000000],
            [2.000000, -2.000000],
            [-3.000000, 1.000000],
            [3.000000, 1.000000],
            [-2.000000, -2.000000],
            [0.000000, 3.000000]
          ]
        ]
      }, { ProductionPlace: 'Star Concession' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [star] })
      expect(result.valid).toBe(false)
      const kinkError = result.errors.find(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)
      expect(kinkError).toBeDefined()
      expect(kinkError?.message).toMatch(/self-intersects at \d+ point\(s\)/)
    })

    it('detects self-intersection inside a MultiPolygon geometry', () => {
      const multiPoly = createFeature({
        type: 'MultiPolygon',
        coordinates: [
          // Valid polygon 1
          [
            [
              [0.000000, 0.000000],
              [1.000000, 0.000000],
              [1.000000, 1.000000],
              [0.000000, 1.000000],
              [0.000000, 0.000000]
            ]
          ],
          // Self-intersecting bowtie polygon 2
          [
            [
              [2.000000, 0.000000],
              [4.000000, 2.000000],
              [2.000000, 2.000000],
              [4.000000, 0.000000],
              [2.000000, 0.000000]
            ]
          ]
        ]
      }, { ProductionPlace: 'Multi Concession' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [multiPoly] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
    })

    it('rejects collinear collapsed polygon with 0 area (flat line)', () => {
      const collinearLine = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [1.000000, 1.000000],
            [2.000000, 2.000000],
            [3.000000, 3.000000],
            [2.000000, 2.000000],
            [1.000000, 1.000000]
          ]
        ]
      }, { ProductionPlace: 'Flat Line Plot' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [collinearLine] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e =>
        e.code === VALIDATION_CODES.INVALID_GEOMETRY &&
        (e.message.includes('zero or negative') || e.message.includes('Invalid polygon topology'))
      )).toBe(true)
    })

    it('rejects single-point collapsed polygon (all coordinates identical)', () => {
      const pointCollapsed = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [5.000000, 5.000000],
            [5.000000, 5.000000],
            [5.000000, 5.000000],
            [5.000000, 5.000000]
          ]
        ]
      }, { ProductionPlace: 'Zero Point Plot' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [pointCollapsed] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_GEOMETRY)).toBe(true)
    })

    it('rejects unclosed rings with POLYGON_NOT_CLOSED', () => {
      const unclosed = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [0.000000, 0.000000],
            [1.000000, 0.000000],
            [1.000000, 1.000000],
            [0.000000, 1.000000]
            // missing closure [0.000000, 0.000000]
          ]
        ]
      }, { ProductionPlace: 'Unclosed Parcel' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [unclosed] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.POLYGON_NOT_CLOSED)).toBe(true)
    })

    it('rejects unclosed rings with fewer than 4 vertices', () => {
      const triangleUnclosed = createFeature({
        type: 'Polygon',
        coordinates: [
          [
            [0.000000, 0.000000],
            [1.000000, 0.000000],
            [0.000000, 1.000000]
          ]
        ]
      }, { ProductionPlace: 'Open Triangle' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [triangleUnclosed] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.POLYGON_TOO_FEW_VERTICES)).toBe(true)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.POLYGON_NOT_CLOSED)).toBe(true)
    })

    it('rejects disallowed LineString geometry types', () => {
      const lineString = createFeature({
        type: 'LineString',
        coordinates: [
          [0.000000, 0.000000],
          [1.000000, 1.000000]
        ]
      }, { ProductionPlace: 'Boundary Fence' })

      const result = validateGeoJSON({ type: 'FeatureCollection', features: [lineString] })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.LINESTRING_NOT_ALLOWED)).toBe(true)
    })

    it('enforces exact 4 ha boundary: 4.0 ha allowed as point, 4.0001 ha rejected', () => {
      const point4ha = createFeature(
        { type: 'Point', coordinates: [1.234567, 2.345678] },
        { ProductionPlace: 'At Threshold', Area: 4.0 }
      )
      const res4ha = validateGeoJSON({ type: 'FeatureCollection', features: [point4ha] })
      expect(res4ha.valid).toBe(true)

      const pointAbove4ha = createFeature(
        { type: 'Point', coordinates: [1.234567, 2.345678] },
        { ProductionPlace: 'Above Threshold', Area: 4.0001 }
      )
      const resAbove = validateGeoJSON({ type: 'FeatureCollection', features: [pointAbove4ha] })
      expect(resAbove.valid).toBe(false)
      expect(resAbove.errors.some(e => e.code === VALIDATION_CODES.LARGE_PLOT_NEEDS_POLYGON)).toBe(true)
    })

    it('rejects coordinates strictly exceeding EPSG:4326 bounds [-90,90; -180,180]', () => {
      const outOfBoundsPoint = createFeature(
        { type: 'Point', coordinates: [180.000001, -90.000001] },
        { ProductionPlace: 'Outer Space' }
      )
      const result = validateGeoJSON({ type: 'FeatureCollection', features: [outOfBoundsPoint] })
      expect(result.valid).toBe(false)
      const boundErrors = result.errors.filter(e => e.code === VALIDATION_CODES.COORDINATE_OUT_OF_BOUNDS)
      expect(boundErrors.length).toBeGreaterThanOrEqual(2)
    })

    it('rejects oversized GeoJSON payload when maxFileSize option is specified', () => {
      const point = createFeature(
        { type: 'Point', coordinates: [1.234567, 2.345678] },
        { ProductionPlace: 'Test Plot' }
      )
      const fc = { type: 'FeatureCollection' as const, features: [point] }
      const result = validateGeoJSON(fc, { maxFileSize: 50 }) // 50 bytes max
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === VALIDATION_CODES.FILE_TOO_LARGE)).toBe(true)
    })
  })

  // =========================================================================
  // 2. DEFORESTATION CUTOFF ENGINE ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('2. Deforestation Cutoff Engine (src/lib/deforestation.ts)', () => {
    it('strictly enforces the EUDR cutoff date 2020-12-31', () => {
      expect(EUDR_DEFORESTATION_CUTOFF_DATE).toBe('2020-12-31')
    })

    it('strictly distinguishes post-2020 (lossYear >= 2021) from pre-2021 (lossYear <= 2020)', () => {
      const zones: DeforestationCutoffZone[] = [
        {
          id: 'zone-pre-2020',
          name: 'Historic 2020 Clearing',
          country: 'GH',
          lossYear: 2020, // Pre-cutoff: baseline year
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        },
        {
          id: 'zone-post-2020',
          name: 'Illegal 2021 Deforestation',
          country: 'GH',
          lossYear: 2021, // Post-cutoff: strictly illegal
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]]
          }
        }
      ]

      // Plot inside pre-2020 zone
      const plotInPreZone = {
        id: 'plot-pre',
        geometry: { type: 'Point', coordinates: [0.5, 0.5] },
        areaHectares: 2.0
      }
      const resPre = assessPlotDeforestation(plotInPreZone, zones)
      expect(resPre.status).toBe('COMPLIANT')
      expect(resPre.hasEncroachment).toBe(false)
      expect(resPre.spatialConflictResult.hasConflict).toBe(false)

      // Plot inside post-2020 zone
      const plotInPostZone = {
        id: 'plot-post',
        geometry: { type: 'Point', coordinates: [2.5, 2.5] },
        areaHectares: 2.0
      }
      const resPost = assessPlotDeforestation(plotInPostZone, zones)
      expect(resPost.status).toBe('NON_COMPLIANT')
      expect(resPost.hasEncroachment).toBe(true)
      expect(resPost.spatialConflictResult.hasConflict).toBe(true)
      expect(resPost.spatialConflictResult.conflictType).toBe('DEFORESTATION_ENCROACHMENT')
    })

    it('evaluates point on cutoff zone boundary vertex', () => {
      // Cutoff zone: [10, 10] to [11, 11]
      const zones: DeforestationCutoffZone[] = [
        {
          id: 'zone-boundary-test',
          name: 'Border Zone',
          country: 'BR',
          lossYear: 2022,
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[10.0, 10.0], [11.0, 10.0], [11.0, 11.0], [10.0, 11.0], [10.0, 10.0]]]
          }
        }
      ]

      // Point strictly outside
      const pointOutside = {
        id: 'pt-out',
        geometry: { type: 'Point', coordinates: [9.999999, 10.5] }
      }
      const resOut = assessPlotDeforestation(pointOutside, zones)
      expect(resOut.hasEncroachment).toBe(false)

      // Point on exact boundary vertex [10.0, 10.0]
      const pointOnVertex = {
        id: 'pt-vertex',
        geometry: { type: 'Point', coordinates: [10.0, 10.0] }
      }
      const resVertex = assessPlotDeforestation(pointOnVertex, zones)
      // turf.booleanPointInPolygon defaults to true on boundaries
      expect(resVertex.hasEncroachment).toBe(true)
      expect(resVertex.status).toBe('NON_COMPLIANT')
    })

    it('does NOT flag encroachment for polygon that only touches deforestation boundary (tangent line/point)', () => {
      // Zone: [0, 0] to [1, 1]
      const zones: DeforestationCutoffZone[] = [
        {
          id: 'zone-tangent',
          name: 'Tangent Zone',
          country: 'ID',
          lossYear: 2023,
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }
      ]

      // Plot shares edge from [1, 0] to [1, 1] but has 0 area overlap: [1, 0] to [2, 1]
      const tangentPlot = {
        id: 'plot-tangent',
        plotName: 'Adjacent Neighbor Parcel',
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]]
        }
      }

      const res = assessPlotDeforestation(tangentPlot, zones)
      expect(res.hasEncroachment).toBe(false)
      expect(res.status).toBe('COMPLIANT')
    })

    it('accurately computes partial polygon overlap and encroachment percentage', () => {
      // Zone: [0, 0] to [1, 1]
      const zones: DeforestationCutoffZone[] = [
        {
          id: 'zone-partial',
          name: 'Partial Overlap Sector',
          country: 'ID',
          lossYear: 2023,
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }
      ]

      // Plot: [0.5, 0] to [1.5, 1] -> Overlap is exactly 50%
      const halfOverlapPlot = {
        id: 'plot-half',
        plotName: 'Half Overlap Estate',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0.5, 0], [1.5, 0], [1.5, 1], [0.5, 1], [0.5, 0]]]
        }
      }

      const res = assessPlotDeforestation(halfOverlapPlot, zones)
      expect(res.hasEncroachment).toBe(true)
      expect(res.status).toBe('NON_COMPLIANT')
      expect(res.encroachmentPercentage).toBeCloseTo(50, 0)
      expect(res.spatialConflictResult.hasConflict).toBe(true)
      expect(res.spatialConflictResult.overlapPercentage).toBeCloseTo(50, 0)
    })

    it('aggregates multiple overlapping deforestation zones in intersectingZones', () => {
      const multiZones: DeforestationCutoffZone[] = [
        {
          id: 'zone-alpha-2022',
          name: 'Zone Alpha',
          country: 'BR',
          lossYear: 2022,
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
          }
        },
        {
          id: 'zone-beta-2023',
          name: 'Zone Beta',
          country: 'BR',
          lossYear: 2023,
          source: 'MOCK_LAYER',
          geometry: {
            type: 'Polygon',
            coordinates: [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]]
          }
        }
      ]

      // Plot covering [0.5, 0.5] to [2.5, 2.5]
      const spanPlot = {
        id: 'plot-span',
        plotName: 'Cross-Sector Concession',
        geometry: {
          type: 'Polygon',
          coordinates: [[[0.5, 0.5], [2.5, 0.5], [2.5, 2.5], [0.5, 2.5], [0.5, 0.5]]]
        }
      }

      const res = assessPlotDeforestation(spanPlot, multiZones)
      expect(res.hasEncroachment).toBe(true)
      expect(res.intersectingZones).toHaveLength(2)
      const zoneIds = res.intersectingZones.map(z => z.zoneId)
      expect(zoneIds).toContain('zone-alpha-2022')
      expect(zoneIds).toContain('zone-beta-2023')
    })
  })

  // =========================================================================
  // 3. CROSS-SUPPLIER CONFLICT ENGINE ADVERSARIAL STRESS TESTS
  // =========================================================================
  describe('3. Conflict Engine (src/lib/conflicts.ts)', () => {
    it('detects duplicate coordinates between distinct suppliers at 6 decimal precision', () => {
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 'sup-alpha',
          supplierName: 'Alpha Cocoa',
          plotId: 'p-1',
          plotName: 'Alpha Plot',
          geometry: { type: 'Point', coordinates: [-1.123456, 6.654321] }
        },
        {
          supplierId: 'sup-beta',
          supplierName: 'Beta Palm',
          plotId: 'p-2',
          plotName: 'Beta Plot',
          geometry: { type: 'Point', coordinates: [-1.123456, 6.654321] }
        }
      ]

      const summary = detectSupplierConflicts(plots)
      expect(summary.hasConflicts).toBe(true)
      expect(summary.exactDuplicatesCount).toBe(1)
      expect(summary.conflicts[0].conflictType).toBe('EXACT_DUPLICATE')
      expect(summary.conflicts[0].spatialConflictResult.conflictingSupplierIds).toEqual(
        expect.arrayContaining(['sup-alpha', 'sup-beta'])
      )
    })

    it('handles negative coordinates in southern hemisphere (e.g. Brazil Amazon) for duplicate detection', () => {
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 'sup-br-1',
          supplierName: 'Fazenda Sul 1',
          plotId: 'br-p-1',
          plotName: 'Pará Farm 1',
          geometry: { type: 'Point', coordinates: [-54.123456, -3.654321] }
        },
        {
          supplierId: 'sup-br-2',
          supplierName: 'Fazenda Sul 2',
          plotId: 'br-p-2',
          plotName: 'Pará Farm 2',
          geometry: { type: 'Point', coordinates: [-54.123456, -3.654321] }
        }
      ]

      const summary = detectSupplierConflicts(plots)
      expect(summary.hasConflicts).toBe(true)
      expect(summary.exactDuplicatesCount).toBe(1)
    })

    it('flags duplicate if coordinate difference is strictly within 1e-6 epsilon', () => {
      // 0.0000004 diff is < 1e-6 -> duplicate
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 'sup-1',
          supplierName: 'Supp 1',
          plotId: 'p-1',
          plotName: 'P1',
          geometry: { type: 'Point', coordinates: [10.0000000, 20.0000000] }
        },
        {
          supplierId: 'sup-2',
          supplierName: 'Supp 2',
          plotId: 'p-2',
          plotName: 'P2',
          geometry: { type: 'Point', coordinates: [10.0000004, 20.0000003] }
        }
      ]

      const summary = detectSupplierConflicts(plots)
      expect(summary.hasConflicts).toBe(true)
      expect(summary.exactDuplicatesCount).toBe(1)
    })

    it('does NOT flag duplicate if coordinates differ by more than 1e-6', () => {
      // 0.000005 diff is > 1e-6
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 'sup-1',
          supplierName: 'Supp 1',
          plotId: 'p-1',
          plotName: 'P1',
          geometry: { type: 'Point', coordinates: [10.000000, 20.000000] }
        },
        {
          supplierId: 'sup-2',
          supplierName: 'Supp 2',
          plotId: 'p-2',
          plotName: 'P2',
          geometry: { type: 'Point', coordinates: [10.000005, 20.000005] }
        }
      ]

      const summary = detectSupplierConflicts(plots)
      expect(summary.hasConflicts).toBe(false)
      expect(summary.exactDuplicatesCount).toBe(0)
    })

    it('strictly isolates suppliers: same supplier plots NEVER trigger false conflict alerts', () => {
      // Same supplier S-SAME claiming two identical points AND two identical polygons
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 's-same',
          supplierName: 'Internal Holdings',
          plotId: 'p-pt-1',
          plotName: 'Point Sector 1',
          geometry: { type: 'Point', coordinates: [5.000000, 10.000000] }
        },
        {
          supplierId: 's-same',
          supplierName: 'Internal Holdings',
          plotId: 'p-pt-2',
          plotName: 'Point Sector 2',
          geometry: { type: 'Point', coordinates: [5.000000, 10.000000] }
        },
        {
          supplierId: 's-same',
          supplierName: 'Internal Holdings',
          plotId: 'p-poly-1',
          plotName: 'Poly Sector 1',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        },
        {
          supplierId: 's-same',
          supplierName: 'Internal Holdings',
          plotId: 'p-poly-2',
          plotName: 'Poly Sector 2',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }
      ]

      const summary = detectSupplierConflicts(plots)
      expect(summary.hasConflicts).toBe(false)
      expect(summary.conflicts).toHaveLength(0)
      expect(summary.exactDuplicatesCount).toBe(0)
      expect(summary.polygonOverlapsCount).toBe(0)
    })

    it('boundary test for 1.0% overlap threshold: 0.5% ignored vs 1.1% flagged', () => {
      // Square 1: [0, 0] to [1, 1] (width = 1.0)
      // Square 2 with 0.5% overlap: offset by 0.995 -> overlap width is 0.005, overlap area is 0.5%
      const plots05Pct: SupplierPlotRef[] = [
        {
          supplierId: 'supp-a',
          supplierName: 'Supplier A',
          plotId: 'p-a',
          plotName: 'Plot A',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        },
        {
          supplierId: 'supp-b',
          supplierName: 'Supplier B',
          plotId: 'p-b',
          plotName: 'Plot B',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0.995, 0], [1.995, 0], [1.995, 1], [0.995, 1], [0.995, 0]]]
          }
        }
      ]

      const res05 = detectSupplierConflicts(plots05Pct, { overlapThresholdPercentage: 1.0 })
      expect(res05.hasConflicts).toBe(false)
      expect(res05.polygonOverlapsCount).toBe(0)

      // Square 3 with 1.1% overlap: offset by 0.989 -> overlap width is 0.011, overlap area is 1.1%
      const plots11Pct: SupplierPlotRef[] = [
        {
          supplierId: 'supp-a',
          supplierName: 'Supplier A',
          plotId: 'p-a',
          plotName: 'Plot A',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        },
        {
          supplierId: 'supp-c',
          supplierName: 'Supplier C',
          plotId: 'p-c',
          plotName: 'Plot C',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0.989, 0], [1.989, 0], [1.989, 1], [0.989, 1], [0.989, 0]]]
          }
        }
      ]

      const res11 = detectSupplierConflicts(plots11Pct, { overlapThresholdPercentage: 1.0 })
      expect(res11.hasConflicts).toBe(true)
      expect(res11.polygonOverlapsCount).toBe(1)
      expect(res11.conflicts[0].conflictType).toBe('POLYGON_OVERLAP')
      expect(res11.conflicts[0].overlapPercentage).toBeGreaterThanOrEqual(1.1)
      expect(res11.conflicts[0].spatialConflictResult.hasConflict).toBe(true)
    })

    it('correctly maps multi-supplier conflict topology in conflictsBySupplierId and conflictsByPlotId', () => {
      // Supplier A overlaps B, B overlaps C, but A and C do not overlap
      const plots: SupplierPlotRef[] = [
        {
          supplierId: 'sup-A',
          supplierName: 'Supplier A',
          plotId: 'plot-A',
          plotName: 'Plot A',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        },
        {
          supplierId: 'sup-B',
          supplierName: 'Supplier B',
          plotId: 'plot-B',
          plotName: 'Plot B',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0.8, 0], [1.8, 0], [1.8, 1], [0.8, 1], [0.8, 0]]]
          }
        },
        {
          supplierId: 'sup-C',
          supplierName: 'Supplier C',
          plotId: 'plot-C',
          plotName: 'Plot C',
          geometry: {
            type: 'Polygon',
            coordinates: [[[1.6, 0], [2.6, 0], [2.6, 1], [1.6, 1], [1.6, 0]]]
          }
        }
      ]

      const res = detectSupplierConflicts(plots)
      expect(res.conflicts).toHaveLength(2) // A-B and B-C
      expect(res.conflictsBySupplierId['sup-A']).toHaveLength(1)
      expect(res.conflictsBySupplierId['sup-B']).toHaveLength(2)
      expect(res.conflictsBySupplierId['sup-C']).toHaveLength(1)
      expect(res.conflictsByPlotId['plot-B']).toHaveLength(2)
    })
  })

  // =========================================================================
  // 4. COMPLIANCE PACK IN-MEMORY ZIP & CRYPTOGRAPHIC SHA-256 VERIFICATION
  // =========================================================================
  describe('4. Compliance Pack (src/lib/compliance-pack.ts)', () => {
    const input: CompliancePackInput = {
      clientId: 'challenger-test-client',
      operator: {
        companyName: 'Adversarial Test BV',
        country: 'NL',
        email: 'audit@adversarial.test'
      },
      suppliers: [
        {
          id: 'sup-gh-challenger',
          name: 'Cooperative Ashanti, Ltd "Premium"',
          country: 'GH',
          commodity: 'COCOA',
          places: [
            {
              id: 'pl-1',
              name: 'Ashanti Plot "Alpha", Sector 1',
              country: 'GH',
              areaHectares: 3.5,
              geometryType: 'POINT',
              validationStatus: 'VALID',
              coordinates: {
                type: 'Point',
                coordinates: [-1.624321, 6.689123]
              }
            },
            {
              id: 'pl-2',
              name: 'Ashanti Plot 2',
              country: 'GH',
              areaHectares: 15.0,
              geometryType: 'POLYGON',
              validationStatus: 'VALID',
              coordinates: {
                type: 'Polygon',
                coordinates: [[
                  [-1.700000, 6.700000],
                  [-1.600000, 6.700000],
                  [-1.600000, 6.800000],
                  [-1.700000, 6.800000],
                  [-1.700000, 6.700000]
                ]]
              }
            }
          ]
        }
      ],
      now: new Date('2026-10-26T15:30:00.000Z')
    }

    it('generates in-memory ZIP and cryptographically validates every file against sha256_certificate.json', async () => {
      // 1. Build compliance pack in memory
      const result = await buildCompliancePack(input)

      expect(result.zipBuffer).toBeInstanceOf(Buffer)
      expect(result.fileCount).toBe(5)

      // 2. Unpack the zipBuffer in memory using our raw central-directory parser
      const extractedFiles = unzipBuffer(result.zipBuffer)
      const filenames = Object.keys(extractedFiles)

      // 3. Verify exactly the 5 expected files exist in archive
      expect(filenames).toHaveLength(5)
      expect(filenames).toContain('traces_nt_geolocation.geojson')
      expect(filenames).toContain('due_diligence_statement.json')
      expect(filenames).toContain('summary.csv')
      expect(filenames).toContain('validation_report.txt')
      expect(filenames).toContain('sha256_certificate.json')

      // 4. Parse extracted sha256_certificate.json
      const certRaw = extractedFiles['sha256_certificate.json'].toString('utf-8')
      const cert: SHA256IntegrityCertificate = JSON.parse(certRaw)

      expect(cert.algorithm).toBe('SHA-256')
      expect(cert.eudrComplianceDeclaration.cutoffDateVerified).toBe('2020-12-31')
      expect(cert.eudrComplianceDeclaration.regulation).toBe('Regulation (EU) 2023/1115')
      expect(cert.operator.companyName).toBe('Adversarial Test BV')

      // 5. Independently compute cryptographic SHA-256 hash for every extracted file
      // and assert exact 1:1 match with cert.manifest
      for (const manifestItem of cert.manifest) {
        const fileContent = extractedFiles[manifestItem.filename]
        expect(fileContent).toBeDefined()

        const actualSha256 = crypto.createHash('sha256').update(fileContent).digest('hex')

        expect(actualSha256).toBe(manifestItem.sha256)
        expect(fileContent.length).toBe(manifestItem.sizeBytes)
      }

      // 6. Verify master packageChecksum calculation
      const sortedHashes = cert.manifest.map(m => `${m.filename}:${m.sha256}`).sort().join('\n')
      const expectedPackageChecksum = crypto.createHash('sha256').update(sortedHashes).digest('hex')
      expect(cert.packageChecksum).toBe(expectedPackageChecksum)

      // 7. Verify GeoJSON and DDS validity in unpacked contents
      const geojson = JSON.parse(extractedFiles['traces_nt_geolocation.geojson'].toString('utf-8'))
      expect(geojson.type).toBe('FeatureCollection')
      expect(geojson.features).toHaveLength(2)

      const dds = JSON.parse(extractedFiles['due_diligence_statement.json'].toString('utf-8'))
      expect(dds.referenceNumber).toBe(cert.referenceNumber)
      expect(dds.totalPlots).toBe(2)
      expect(dds.totalAreaHectares).toBe(18.5)

      // 8. Verify CSV RFC 4180 escaping of double quotes in extracted file
      const csvContent = extractedFiles['summary.csv'].toString('utf-8')
      expect(csvContent).toContain('""Alpha""')
      expect(csvContent).toContain('""Premium""')
    })
  })
})
