'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Layers,
  MapPin,
  Leaf,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { EUDR_DEMO_PRESETS, type EudrPreset, type DemoPlace } from '@/lib/demo-presets'
import type { SupplierInput } from '@/lib/risk'

const DemoMap = dynamic(() => import('@/components/demo/DemoMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2 text-emerald-600" />
      <span className="text-sm">Loading interactive map...</span>
    </div>
  )
})

export default function DemoPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<EudrPreset['id']>('cocoa-ghana')
  const [downloading, setDownloading] = useState(false)
  const [packageChecksum, setPackageChecksum] = useState<string | null>(null)

  const preset = useMemo(() => {
    return EUDR_DEMO_PRESETS.find(p => p.id === selectedPresetId) ?? EUDR_DEMO_PRESETS[0]
  }, [selectedPresetId])

  // Reset checksum when switching preset
  useEffect(() => {
    setPackageChecksum(null)
  }, [selectedPresetId])

  const handleDownloadCompliancePack = async () => {
    setDownloading(true)
    try {
      const supplierMap = new Map<string, { id: string; name: string; places: DemoPlace[] }>()
      preset.places.forEach(p => {
        if (!supplierMap.has(p.supplierId)) {
          supplierMap.set(p.supplierId, { id: p.supplierId, name: p.supplierName, places: [] })
        }
        supplierMap.get(p.supplierId)!.places.push(p)
      })

      const suppliers: SupplierInput[] = Array.from(supplierMap.values()).map(s => ({
        id: s.id,
        name: s.name,
        country: preset.country,
        commodity: preset.commodity,
        places: s.places.map((pl, idx) => ({
          id: `demo-place-${s.id}-${idx}`,
          name: pl.name,
          country: pl.country,
          areaHectares: pl.areaHectares,
          geometryType: pl.geometryType,
          validationStatus: preset.expectedVerdict === 'COMPLIANT' ? 'VALID' : 'INVALID',
          coordinates: pl.coordinates
        }))
      }))

      const payload = {
        clientId: 'demo-employer-client',
        operator: {
          companyName: 'EUDR Demonstration Operator GmbH',
          country: 'DE',
          email: 'compliance@eudr-demo.eu'
        },
        suppliers
      }

      const response = await fetch('/api/demo/compliance-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to generate compliance pack from demo endpoint')
      }

      const checksumHeader = response.headers.get('X-EUDR-SHA256-Certificate')
      if (checksumHeader) {
        setPackageChecksum(checksumHeader)
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `EUDR-COMPLIANCE-PACK-${preset.id}.zip`
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match && match[1]) filename = match[1]
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Compliance pack generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-semibold">Back to Overview</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-slate-900">EUDR Assistant</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                Offline Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main demo content */}
      <main className="container mx-auto px-4 py-8 flex-1 max-w-7xl">
        {/* Intro Banner */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            EUDR Geospatial Compliance & Land Conflict Audit
          </h1>
          <p className="mt-1 text-slate-600 text-sm md:text-base">
            Zero-cloud, zero-auth demonstration environment. Explore boundary validation, cross-supplier conflict detection, and sealed TRACES NT compliance packages in under 30 seconds.
          </p>
        </div>

        {/* 1-Click Presets Bar */}
        <div className="mb-6 bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1-Click Employer Demonstration Presets
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {EUDR_DEMO_PRESETS.map(p => {
              const active = p.id === selectedPresetId
              const badgeStyle =
                p.expectedVerdict === 'COMPLIANT'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : p.expectedVerdict === 'CONFLICT_DETECTED'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-red-100 text-red-800 border-red-300'

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPresetId(p.id)}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                    active
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Workspace: Map + Diagnostics */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Map Viewer */}
          <div className="lg:col-span-7 bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">
                  Interactive Geolocation Canvas ({preset.places.length} plots rendered)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">EPSG:4326 · WGS84</span>
            </div>

            <div className="h-[460px] w-full relative">
              <DemoMap preset={preset} />
            </div>
          </div>

          {/* Diagnostics Card */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Audit Verdict & Compliance Status</CardTitle>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      preset.expectedVerdict === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : preset.expectedVerdict === 'CONFLICT_DETECTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {preset.expectedVerdict === 'COMPLIANT' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {preset.expectedVerdict.replace('_', ' ')}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Evaluation against EUDR Articles 3 & 9 and TRACES NT submission criteria.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                {/* Conflict / Encroachment details */}
                {preset.conflictResult.hasConflict && (
                  <div className="p-3.5 rounded-lg border bg-amber-50/60 border-amber-200 text-amber-950 space-y-1.5">
                    <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Spatial Conflict Detected: {preset.conflictResult.conflictType}
                    </div>
                    {preset.conflictResult.overlapPercentage !== undefined && (
                      <p className="text-xs">
                        <b>Overlap:</b> {preset.conflictResult.overlapPercentage}% (
                        {preset.conflictResult.overlapAreaHectares} ha)
                      </p>
                    )}
                    {preset.conflictResult.conflictingSupplierIds && (
                      <p className="text-xs">
                        <b>Involved Suppliers:</b>{' '}
                        {preset.conflictResult.conflictingSupplierIds.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Remediation Advice */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Statutory Remediation Guidance
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border">
                    {preset.conflictResult.remediationAdvice}
                  </p>
                </div>

                {/* Plots summary table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Production Places
                  </h4>
                  <div className="border rounded-md divide-y text-xs">
                    {preset.places.map((place, i) => (
                      <div key={i} className="p-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{place.name}</p>
                          <p className="text-slate-500">{place.supplierName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-700">{place.areaHectares} ha</p>
                          <span className="text-[10px] text-slate-400 font-mono">{place.geometryType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Compliance Pack CTA */}
                <div className="pt-2 border-t space-y-2">
                  <Button
                    onClick={handleDownloadCompliancePack}
                    disabled={downloading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sealing TRACES NT Package...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download TRACES NT Pack (.zip)
                      </>
                    )}
                  </Button>

                  {packageChecksum && (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 text-xs">
                      <p className="font-bold flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        SHA-256 Package Integrity Certificate Generated
                      </p>
                      <p className="font-mono text-[10px] break-all text-slate-600 mt-1">
                        {packageChecksum}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
