import { create } from 'zustand'
import {
  generateStore,
  buildStoreFromSkus,
  recompute,
  apply,
  importRawExports,
  type Store,
  type Derived,
  type ActionType,
  type Sku,
  type CanonicalWaterfallStage,
  type PresetBundle,
} from '../engine'

const SEED = 20260619
// 11:18 into the day — enough elapsed that "leaked so far today" already has weight.
const START_MS = 11 * 3_600_000 + 18 * 60_000
const STORAGE_KEY = 'marginpulse:v2'

type Mode = 'demo' | 'imported'
type ModalKind = 'import' | 'lead' | null

const ACTION_TOAST: Record<ActionType, string> = {
  SET_PRICE_FLOOR: 'Simulated: price floor',
  PAUSE_REPRICER: 'Simulated: repricer pause',
  DISPUTE_FEE: 'Simulated: fee-dispute draft',
  DISPUTE_STORAGE: 'Simulated: removal-order plan',
  RESOLVE_RETURNS: 'Simulated: returns response',
  WIN_BUYBOX: 'Simulated: Buy Box recovery',
  FIX_VAT: 'Simulated: VAT correction',
  CAP_AD_SPEND: 'Simulated: ad-spend cap',
  CREATE_RESTOCK_ALERT: 'Simulated: restock alert',
}

interface AppState {
  store: Store
  derived: Derived
  mode: Mode
  selectedLeakId: string | null
  selectedStage: CanonicalWaterfallStage | null
  benchmarkDurationMs: number
  isExecutiveReportOpen: boolean
  activePresetId: string | null
  paused: boolean
  toast: { title: string; amountCents: number } | null
  modal: ModalKind
  resolve: (leakId: string, action: ActionType) => void
  importCatalogue: (skus: Sku[], name: string) => void
  loadPresetBundle: (preset: PresetBundle) => void
  setSelectedStage: (stage: CanonicalWaterfallStage | null) => void
  setExecutiveReportOpen: (open: boolean) => void
  tick: (scaledMs: number) => void
  select: (leakId: string | null) => void
  togglePause: () => void
  clearToast: () => void
  reset: () => void
  openModal: (m: Exclude<ModalKind, null>) => void
  closeModal: () => void
}

function demoBuild() {
  // Generate the deterministic store, then seed plausible "already-running" demo
  // history so cold visitors never see €0 in the saved / claimable columns. This
  // is store-layer presentation state only — generateStore() (and every engine
  // number, incl. the −€8,850/mo hero) is left byte-identical, so all engine
  // tests stay green. Leaks are NOT pre-resolved: the full leak list + hero
  // number remain intact.
  const base = generateStore(SEED, START_MS)
  const store: Store = {
    ...base,
    savedThisWeekCents: 134_200, // €1,342 modelled weekly effect (fictional demo history)
    reimbursementsPendingCents: 87_500, // €875 in possible claim drafts (fictional demo history)
    resolvedCount: 6,
  }
  return { store, derived: recompute(store) }
}

/** Persist the live store + mode so resolved leaks and imported data survive reload. */
function persist(store: Store, mode: Mode) {
  if (typeof window === 'undefined') return
  try {
    if (store.skus.length > 100) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ store, mode }))
  } catch {
    /* quota / disabled storage — degrade silently */
  }
}

function clearPersisted() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function restore(): { store: Store; derived: Derived; mode: Mode } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { store?: Store; mode?: Mode }
    const s = parsed.store
    if (!s || !Array.isArray(s.skus) || !Array.isArray(s.leaks) || typeof s.clockMs !== 'number') return null
    if (s.skus.length > 100) return null
    return { store: s, derived: recompute(s), mode: parsed.mode === 'imported' ? 'imported' : 'demo' }
  } catch {
    return null
  }
}

function initialState() {
  return restore() ?? { ...demoBuild(), mode: 'demo' as Mode }
}

export const useStore = create<AppState>((set, get) => ({
  ...initialState(),
  selectedLeakId: null,
  selectedStage: null,
  benchmarkDurationMs: 0,
  isExecutiveReportOpen: false,
  activePresetId: null,
  paused: false,
  toast: null,
  modal: null,

  resolve: (leakId, action) => {
    const cur = get().store
    const leak = cur.leaks.find((l) => l.id === leakId)
    const store = apply(cur, { type: action, leakId })
    set({
      store,
      derived: recompute(store),
      selectedLeakId: null,
      toast: leak
        ? { title: ACTION_TOAST[action], amountCents: leak.ratePerDayCents * 7 }
        : null,
    })
    persist(store, get().mode)
  },

  importCatalogue: (skus, name) => {
    const store = buildStoreFromSkus(skus, START_MS, name)
    set({
      store,
      derived: recompute(store),
      mode: 'imported',
      selectedLeakId: null,
      toast: null,
      paused: false,
      modal: null,
      selectedStage: null,
      activePresetId: null,
    })
    persist(store, 'imported')
  },

  loadPresetBundle: (preset) => {
    const start = performance.now()
    const parsed = importRawExports(preset.files)
    const duration = performance.now() - start
    const store = buildStoreFromSkus(parsed.skus, START_MS, preset.name)
    set({
      store,
      derived: recompute(store),
      mode: 'imported',
      selectedLeakId: null,
      toast: null,
      paused: false,
      modal: null,
      selectedStage: null,
      benchmarkDurationMs: Math.round(duration * 10) / 10,
      activePresetId: preset.id,
    })
    persist(store, 'imported')
  },

  setSelectedStage: (selectedStage) => set({ selectedStage }),
  setExecutiveReportOpen: (isExecutiveReportOpen) => set({ isExecutiveReportOpen }),

  tick: (scaledMs) => {
    if (get().paused) return
    const cur = get().store
    const store = apply(cur, { type: 'TICK', clockMs: cur.clockMs + scaledMs })
    set({ store, derived: recompute(store) })
  },

  select: (leakId) => set({ selectedLeakId: leakId }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  clearToast: () => set({ toast: null }),
  reset: () => {
    clearPersisted()
    set({
      ...demoBuild(),
      mode: 'demo',
      selectedLeakId: null,
      toast: null,
      paused: false,
      modal: null,
      selectedStage: null,
      benchmarkDurationMs: 0,
      activePresetId: null,
    })
  },
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),
}))
