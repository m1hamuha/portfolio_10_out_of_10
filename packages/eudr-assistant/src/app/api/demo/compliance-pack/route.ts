import { NextResponse } from 'next/server'
import { buildCompliancePack, type CompliancePackInput } from '@/lib/compliance-pack'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompliancePackInput
    const result = await buildCompliancePack(body)

    return new NextResponse(new Uint8Array(result.zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-EUDR-Reference': result.referenceNumber,
        'X-EUDR-SHA256-Certificate': result.certificate.packageChecksum,
      }
    })
  } catch (error) {
    console.error('Compliance pack generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate compliance pack' },
      { status: 500 }
    )
  }
}
