export * from './types'
export { generateStore, buildStoreFromSkus, DAY_MS } from './generate'
export { detectLeaks, unitEconomics } from './detect'
export {
  parseCsv,
  parseCsvBundle,
  parseCsvLine,
  parseCsvTable,
  parseMoneyEuros,
  summarizeCoverage,
  leaksReportCsv,
  profitReportCsv,
  TEMPLATE_CSV,
  SAMPLE_CSV,
  MAX_CSV_FILE_BYTES,
  MAX_CSV_TEXT_CHARS,
  MAX_CSV_DATA_ROWS,
} from './csv'
export type { CsvResult, CsvBundleResult, CsvInput, CoverageSummary, CsvTable } from './csv'
export { detectSourceKind, importRawExports, SHOPIFY_SAMPLE_EXPORTS } from './raw-import'
export type { RawSourceKind, RawSourceSummary, RawImportReadiness, RawImportResult } from './raw-import'
export type { Derived } from './recompute'
export {
  recompute,
  activeLeaks,
  findSku,
  dayFraction,
  leakedSoFarTodayCents,
  waterfallFor,
  storeWaterfall,
  sparkline,
  projectSavingsCents,
} from './recompute'
export { apply, primaryAction } from './reducers'
export * from './money'
export { makeRng, mulberry32, hashSeed } from './random'
export * from './waterfall'
export * from './presets'
export * from './report'
