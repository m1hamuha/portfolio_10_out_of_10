import {
  buildCompliancePack,
  EudrCompliancePackService,
  eudrCompliancePackService,
  type CompliancePackInput
} from '../src/lib/compliance-pack'

describe('EUDR TRACES NT Compliance Pack ZIP Service (F26)', () => {
  const sampleInput: CompliancePackInput = {
    clientId: 'client-eudr-001',
    operator: {
      companyName: 'European Chocolatiers BV',
      country: 'NL',
      email: 'compliance@chocolatiers.nl'
    },
    suppliers: [
      {
        id: 'supp-gh-1',
        name: 'Kuapa Kokoo Cooperative',
        country: 'GH',
        commodity: 'COCOA',
        places: [
          {
            id: 'place-1',
            name: 'Kumasi Plantation Alpha',
            country: 'GH',
            areaHectares: 3.2,
            geometryType: 'POINT',
            validationStatus: 'VALID',
            coordinates: {
              type: 'Point',
              coordinates: [-1.554321, 6.789123]
            }
          },
          {
            id: 'place-2',
            name: 'Sunyani Estate Beta',
            country: 'GH',
            areaHectares: 12.5,
            geometryType: 'POLYGON',
            validationStatus: 'VALID',
            coordinates: {
              type: 'Polygon',
              coordinates: [[
                [-2.300000, 7.300000],
                [-2.200000, 7.300000],
                [-2.200000, 7.400000],
                [-2.300000, 7.400000],
                [-2.300000, 7.300000]
              ]]
            }
          }
        ]
      }
    ],
    now: new Date('2026-10-26T12:00:00Z')
  }

  it('builds an in-memory ZIP archive containing the 5 required compliance files', async () => {
    const result = await buildCompliancePack(sampleInput)

    expect(result.fileCount).toBe(5)
    expect(result.zipBuffer).toBeInstanceOf(Buffer)
    expect(result.zipBuffer.length).toBeGreaterThan(500) // genuine ZIP content
    expect(result.filename).toMatch(/^EUDR-COMPLIANCE-PACK-EUDR-DDS-/)
    expect(result.referenceNumber).toMatch(/^EUDR-DDS-/)
  })

  it('generates a SHA-256 integrity certificate with verified manifest hashes (F26)', async () => {
    const result = await buildCompliancePack(sampleInput)
    const cert = result.certificate

    expect(cert.algorithm).toBe('SHA-256')
    expect(cert.eudrComplianceDeclaration.cutoffDateVerified).toBe('2020-12-31')
    expect(cert.eudrComplianceDeclaration.regulation).toBe('Regulation (EU) 2023/1115')
    expect(cert.operator.companyName).toBe('European Chocolatiers BV')

    // Manifest must list the 4 verified files
    expect(cert.manifest).toHaveLength(4)
    const filenames = cert.manifest.map(m => m.filename)
    expect(filenames).toContain('traces_nt_geolocation.geojson')
    expect(filenames).toContain('due_diligence_statement.json')
    expect(filenames).toContain('summary.csv')
    expect(filenames).toContain('validation_report.txt')

    // Verify SHA-256 format for every manifest file
    for (const item of cert.manifest) {
      expect(item.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(item.sizeBytes).toBeGreaterThan(0)
    }

    // Verify composite package checksum
    expect(cert.packageChecksum).toMatch(/^[a-f0-9]{64}$/)
  })

  it('adheres to ExecutiveExportService interface contract', async () => {
    const service = new EudrCompliancePackService()
    expect(typeof service.generate).toBe('function')
    expect(typeof service.download).toBe('function')

    const result = await service.generate(sampleInput)
    expect(result.totalSizeBytes).toBe(result.zipBuffer.length)
    expect(result.dds.totalPlots).toBe(2)
  })

  it('handles client-side download invocation gracefully', () => {
    const service = eudrCompliancePackService
    // download() handles SSR/test environment without throwing
    expect(() => {
      service.download({
        zipBuffer: Buffer.from('mock-zip'),
        filename: 'test.zip',
        referenceNumber: 'EUDR-123',
        certificate: {} as any,
        dds: {} as any,
        fileCount: 5,
        totalSizeBytes: 8
      })
    }).not.toThrow()
  })
})
