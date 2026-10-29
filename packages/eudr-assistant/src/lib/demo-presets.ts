import type { SpatialConflictResult } from '@/types/contracts'

export interface DemoPlace {
  name: string
  areaHectares: number
  geometryType: 'POINT' | 'POLYGON'
  coordinates: unknown
  country: string
  supplierName: string
  supplierId: string
}

export interface EudrPreset {
  id: 'cocoa-ghana' | 'conflict-indonesia' | 'deforestation-brazil'
  name: string
  badge: string
  commodity: 'COCOA' | 'WOOD' | 'CATTLE'
  country: string
  description: string
  places: DemoPlace[]
  conflictResult: SpatialConflictResult
  expectedVerdict: 'COMPLIANT' | 'CONFLICT_DETECTED' | 'DEFORESTATION_DETECTED'
}

export const EUDR_DEMO_PRESETS: EudrPreset[] = [
  {
    id: 'cocoa-ghana',
    name: 'Compliant Cocoa Ghana',
    badge: 'Ghana · Compliant',
    commodity: 'COCOA',
    country: 'GH',
    description:
      'Clean cooperative smallholder cocoa plots with 6-decimal precision, closed outer rings, zero overlap, and zero post-2020 deforestation encroachment.',
    expectedVerdict: 'COMPLIANT',
    conflictResult: {
      hasConflict: false,
      affectedPlotIds: [],
      remediationAdvice:
        'All plots satisfy EUDR Article 9 geolocation precision and Article 3 deforestation-free mandates. Due Diligence Statement is ready for TRACES NT submission.'
    },
    places: [
      {
        name: 'Ashanti Plot 1',
        areaHectares: 3.4,
        geometryType: 'POINT',
        coordinates: { type: 'Point', coordinates: [-1.624412, 6.688487] },
        country: 'GH',
        supplierName: 'Kumasi Cocoa Coop',
        supplierId: 'sup-gh-01'
      },
      {
        name: 'Sunyani Plot 2',
        areaHectares: 8.5,
        geometryType: 'POLYGON',
        coordinates: {
          type: 'Polygon',
          coordinates: [[
            [-2.321145, 7.334120],
            [-2.315000, 7.334120],
            [-2.315000, 7.339500],
            [-2.321145, 7.339500],
            [-2.321145, 7.334120]
          ]]
        },
        country: 'GH',
        supplierName: 'Kumasi Cocoa Coop',
        supplierId: 'sup-gh-01'
      }
    ]
  },
  {
    id: 'conflict-indonesia',
    name: 'Supplier Conflict Indonesia',
    badge: 'Indonesia · Overlap Conflict',
    commodity: 'WOOD',
    country: 'ID',
    description:
      'Two rival timber concessions in East Kalimantan claiming overlapping boundaries exceeding the 1% EUDR tolerance threshold.',
    expectedVerdict: 'CONFLICT_DETECTED',
    conflictResult: {
      hasConflict: true,
      conflictType: 'POLYGON_OVERLAP',
      overlapAreaHectares: 4.8,
      overlapPercentage: 14.8,
      conflictingSupplierIds: ['sup-id-borneo', 'sup-id-kaltim'],
      affectedPlotIds: ['id-plot-timber-a', 'id-plot-timber-b'],
      remediationAdvice:
        'Concession boundary conflict exceeds 1% tolerance threshold. Engage suppliers to verify cadastral title or submit formal partition agreement before filing DDS.'
    },
    places: [
      {
        name: 'Borneo Concession A',
        areaHectares: 32.4,
        geometryType: 'POLYGON',
        coordinates: {
          type: 'Polygon',
          coordinates: [[
            [116.120000, -0.450000],
            [116.140000, -0.450000],
            [116.140000, -0.430000],
            [116.120000, -0.430000],
            [116.120000, -0.450000]
          ]]
        },
        country: 'ID',
        supplierName: 'Borneo Timber Co',
        supplierId: 'sup-id-borneo'
      },
      {
        name: 'Kaltim Concession B (Overlap)',
        areaHectares: 28.0,
        geometryType: 'POLYGON',
        coordinates: {
          type: 'Polygon',
          coordinates: [[
            [116.135000, -0.445000],
            [116.155000, -0.445000],
            [116.155000, -0.425000],
            [116.135000, -0.425000],
            [116.135000, -0.445000]
          ]]
        },
        country: 'ID',
        supplierName: 'Kaltim Forestry Ltd',
        supplierId: 'sup-id-kaltim'
      }
    ]
  },
  {
    id: 'deforestation-brazil',
    name: 'Deforestation Brazil',
    badge: 'Brazil · Encroachment Warning',
    commodity: 'CATTLE',
    country: 'BR',
    description:
      'Cattle grazing parcel in Pará intersecting post-December 2020 deforestation cutoff buffer zone.',
    expectedVerdict: 'DEFORESTATION_DETECTED',
    conflictResult: {
      hasConflict: true,
      conflictType: 'DEFORESTATION_ENCROACHMENT',
      overlapAreaHectares: 11.2,
      overlapPercentage: 23.5,
      conflictingSupplierIds: ['sup-br-cerrado'],
      affectedPlotIds: ['br-plot-cerrado-ext'],
      remediationAdvice:
        'Plot intersects post-December 2020 deforestation event (EUDR Article 3(a)). Due Diligence Statement blocked from submission; commodities must be excluded from EU consignment.'
    },
    places: [
      {
        name: 'Fazenda Rio Verde',
        areaHectares: 48.0,
        geometryType: 'POLYGON',
        coordinates: {
          type: 'Polygon',
          coordinates: [[
            [-54.50, -3.20],
            [-54.42, -3.20],
            [-54.42, -3.12],
            [-54.50, -3.12],
            [-54.50, -3.20]
          ]]
        },
        country: 'BR',
        supplierName: 'Cerrado Cattle Holdings',
        supplierId: 'sup-br-cerrado'
      }
    ]
  }
]
