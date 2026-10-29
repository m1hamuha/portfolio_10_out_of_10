import {
  validateGeoJSON,
  VALIDATION_CODES,
  fixGeoJSON
} from '../src/lib/eudr-validator'

describe('EUDR Turf Geometry Validator (F23)', () => {
  const createFeature = (geometry: any, properties: Record<string, unknown> = {}) => ({
    type: 'Feature' as const,
    properties,
    geometry
  })

  it('accepts valid 6-decimal point for small plots <= 4ha', () => {
    const point = createFeature(
      { type: 'Point', coordinates: [-1.554321, 6.789123] },
      { ProductionPlace: 'Farm Alpha', Area: 3.5 }
    )
    const result = validateGeoJSON({ type: 'FeatureCollection', features: [point] })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects point geometry for large plots > 4ha requiring polygon', () => {
    const point = createFeature(
      { type: 'Point', coordinates: [-1.554321, 6.789123] },
      { ProductionPlace: 'Estate Mega', Area: 12.5 }
    )
    const result = validateGeoJSON({ type: 'FeatureCollection', features: [point] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === VALIDATION_CODES.LARGE_PLOT_NEEDS_POLYGON)).toBe(true)
  })

  it('accepts valid closed polygon for plots > 4ha', () => {
    const validPoly = createFeature(
      {
        type: 'Polygon',
        coordinates: [
          [
            [-1.500000, 6.500000],
            [-1.400000, 6.500000],
            [-1.400000, 6.600000],
            [-1.500000, 6.600000],
            [-1.500000, 6.500000]
          ]
        ]
      },
      { ProductionPlace: 'Coop Plot 1', Area: 10.0 }
    )
    const result = validateGeoJSON({ type: 'FeatureCollection', features: [validPoly] })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('detects and rejects bowtie self-intersecting polygon using turf.kinks (F23)', () => {
    // Bowtie geometry where edges cross: (0,0) -> (2,2) -> (0,2) -> (2,0) -> (0,0)
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
    }, { ProductionPlace: 'Faulty Plot', Area: 5.0 })

    const result = validateGeoJSON({ type: 'FeatureCollection', features: [bowtie] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === VALIDATION_CODES.SELF_INTERSECTION)).toBe(true)
  })

  it('detects and rejects zero-area collinear polygon (F23)', () => {
    // Degenerate collinear points producing exactly zero area
    const zeroArea = createFeature({
      type: 'Polygon',
      coordinates: [
        [
          [1.000000, 1.000000],
          [2.000000, 1.000000],
          [1.000000, 1.000000],
          [1.000000, 1.000000]
        ]
      ]
    }, { ProductionPlace: 'Flat Line', Area: 0.0 })

    const result = validateGeoJSON({ type: 'FeatureCollection', features: [zeroArea] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === VALIDATION_CODES.INVALID_GEOMETRY)).toBe(true)
  })

  it('rejects unclosed polygons', () => {
    const unclosed = createFeature({
      type: 'Polygon',
      coordinates: [
        [
          [0.000000, 0.000000],
          [1.000000, 0.000000],
          [1.000000, 1.000000],
          [0.000000, 1.000000]
        ]
      ]
    }, { ProductionPlace: 'Open Ring' })

    const result = validateGeoJSON({ type: 'FeatureCollection', features: [unclosed] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === VALIDATION_CODES.POLYGON_NOT_CLOSED)).toBe(true)
  })

  it('rejects polygons with holes', () => {
    const holey = createFeature({
      type: 'Polygon',
      coordinates: [
        [
          [0.000000, 0.000000],
          [3.000000, 0.000000],
          [3.000000, 3.000000],
          [0.000000, 3.000000],
          [0.000000, 0.000000]
        ],
        [
          [1.000000, 1.000000],
          [2.000000, 1.000000],
          [2.000000, 2.000000],
          [1.000000, 2.000000],
          [1.000000, 1.000000]
        ]
      ]
    }, { ProductionPlace: 'Donut Plot' })

    const result = validateGeoJSON({ type: 'FeatureCollection', features: [holey] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === VALIDATION_CODES.POLYGON_HAS_HOLES)).toBe(true)
  })

  it('flags warning when coordinates have lower precision than 6 decimals', () => {
    const lowPrecision = createFeature({
      type: 'Point',
      coordinates: [-1.55, 6.78]
    })
    const result = validateGeoJSON({ type: 'FeatureCollection', features: [lowPrecision] })
    expect(result.warnings.some(w => w.code === VALIDATION_CODES.PRECISION_TOO_LOW)).toBe(true)
  })

  it('fixGeoJSON automatically repairs unclosed rings and clamps decimals', () => {
    const unclosed = createFeature({
      type: 'Polygon',
      coordinates: [
        [
          [0.12345678, 0.12345678],
          [1.12345678, 0.12345678],
          [1.12345678, 1.12345678],
          [0.12345678, 1.12345678]
        ]
      ]
    })
    const fixed = fixGeoJSON({ type: 'FeatureCollection', features: [unclosed] })
    const ring = (fixed.features[0].geometry as any).coordinates[0]
    expect(ring[0]).toEqual(ring[ring.length - 1])
    expect(ring[0][0].toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(6)
  })
})
