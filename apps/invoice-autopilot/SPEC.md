# InvoiceAutopilot — Specification

> **One-liner:** Drop a messy supplier invoice and watch it become a validated, ready-to-post accounting entry in ~9 seconds — fields light up on the document live, VAT is reconciled, and a price typo is caught *before* it hits the books.

Portfolio demo #2 of an automation studio selling to **European SMBs**. English UI, EUR, EU context (VAT, PEPPOL / ZUGFeRD / Factur-X e-invoicing). Self-contained, deterministic mock data. Spec-first, engine built test-first (TDD).

---

## 1. Purpose & audience
**Target client (Europe):** any EU/EEA SMB with a bookkeeper handling **50–800 incoming supplier documents/month** — wholesale/trade, e-commerce, HoReCa, agencies, small manufacturing. Decision-maker: owner or chief accountant.

**Pain:** manual keying of supplier invoices into accounting software (Xero / DATEV / Sage / Lexoffice) is slow (~7 min/doc), error-prone (VAT mismatches → tax-authority corrections), and scales badly. The big objection is *"will it work on MY documents?"* — so the demo proves the hard part live: reading a messy invoice and catching an error.

**Wow:** the live field-overlay scan on a skewed photo + catching a planted price typo before posting. It's instant self-projection ("that's my pile of paperwork"), not just animation.

## 2. The demo experience (happy path)
1. Left rail: a stack of **3 realistic sample documents** + an "Upload example" affordance (loads a sample — no real upload).
   - **DOC-1:** messy phone photo of a German supplier invoice (*Rechnung*), slightly skewed — **contains a planted price typo**.
   - **DOC-2:** clean Factur-X / ZUGFeRD PDF (French supplier) — validates clean.
   - **DOC-3:** skewed scan of an Italian *Fattura* — clean but low confidence on one field.
2. Pick a doc → it renders as a bright "paper" card on the dark workspace.
3. Hit **Scan**: a scan-line sweeps top→bottom; as it passes each field, a highlight **box flashes on the image** (Supplier, VAT ID, Invoice no., Dates, each line item, Net, VAT, Total) and a **confidence meter** fills.
4. Right panel: a **structured extraction card** assembles field-by-field in sync.
5. One line is flagged **amber** — e.g. *"Unit price looks off: €1 200,00 vs €12,00?"* (the typo) → **Confirm / Fix** buttons. Fixing re-reconciles the totals (VAT, net, gross go green).
6. **Send to accounting** (Xero / DATEV) → green check, a row drops into a mock **ledger/registry**, a **Telegram/Slack digest card** updates ("14 docs · 1h 38m saved · 1 error prevented"), and the **"Saved this month"** counter (hours + €) ticks up.
7. A **before/after** bar: *Manual 7 min · Autopilot 9 sec*.
8. Honesty banner: *"Demo on fixed sample documents. In production this connects to your inbox / PEPPOL / scanner and your accounting software. It assists your bookkeeper — it doesn't replace them."*

## 3. Deterministic engine (TDD first — `src/engine/`, framework-free, integer cents)
### Types
```
DocId = 'DOC-1' | 'DOC-2' | 'DOC-3'
Box { x, y, w, h }                  // normalized 0..1 over the document image
Field<T> { value: T; box: Box; confidence: number /*0..1*/ }
LineItem { desc; qty; unitPriceCents; lineTotalCents; box: Box }
Extraction {
  docId; supplier: Field<string>; vatId: Field<string>; country: 'DE'|'FR'|'IT'
  invoiceNo: Field<string>; invoiceDate: Field<string>; dueDate: Field<string>
  lineItems: LineItem[]; netCents: Field<number>; vatRatePct: Field<number>
  vatCents: Field<number>; grossCents: Field<number>; currency: 'EUR'
}
Issue { id; severity:'warn'|'error'; field; message; suggestedFixCents? }
LedgerEntry { docId; supplier; grossCents; postedAtMs }
Ledger { entries: LedgerEntry[]; docCount; savedSeconds; errorsPrevented }
```
### Functions (pure)
- `extract(docId): Extraction` — returns the pre-baked, deterministic OCR result (fixed values + boxes + per-field confidence). Same input → identical output.
- `validate(ext): Issue[]` — rules:
  1. `sum(lineItems.lineTotalCents) === netCents` else `error` (line_sum).
  2. `vatCents === round(netCents * vatRatePct/100)` else `error` (vat_math).
  3. `netCents + vatCents === grossCents` else `error` (gross_math).
  4. each `lineTotalCents === qty * unitPriceCents` else `warn` price_anomaly **(DOC-1's planted typo trips this)**.
  5. `isValidVatId(country, vatId)` else `warn` (vat_id_format).
- `applyFix(ext, issueId): Extraction` — applies the `suggestedFixCents` (corrects the typo'd unit price + line total, then re-derives net/vat/gross) so `validate()` returns [] afterwards.
- `isValidVatId(country, id): boolean` — DE `^DE\d{9}$`, FR `^FR[A-Z0-9]{2}\d{9}$`, IT `^IT\d{11}$`.
- `postToLedger(ledger, ext, opts): Ledger` — appends entry; `docCount+1`; `savedSeconds += (MANUAL_SEC - AUTO_SEC)` (420 − 9 = 411); `errorsPrevented += hadFix?1:0`.
- `MANUAL_SEC=420`, `AUTO_SEC=9`. `formatDuration(sec)`, `formatEur(cents)`.

### Invariants the tests enforce (write tests FIRST)
1. `extract` deterministic; every Box within [0,1]; confidences in [0,1]; money integer cents.
2. DOC-2 (clean) → `validate` returns `[]`.
3. DOC-1 → `validate` returns a `price_anomaly` warn (the typo).
4. `applyFix` on DOC-1's anomaly → re-`validate` returns `[]`; gross/net/vat reconcile.
5. For every doc after any needed fix: `net+vat===gross` and `Σ lineTotals===net` and `vat===round(net*rate)`.
6. `isValidVatId` accepts the 3 sample IDs, rejects malformed ones.
7. `postToLedger` increments docCount by 1 and savedSeconds by 411; errorsPrevented counts fixed docs.
8. Idempotent/pure: no mutation of inputs (clone in reducers).

## 4. Tech & layout (reuse #1 recipe)
- Vite + React + TS + Vitest; Zustand store; hand-SVG (confidence meter, before/after bar); Framer Motion (scan-line, field boxes, card assembly) respecting `prefers-reduced-motion`.
- Build: `tsc --noEmit -p tsconfig.json && vite build`; `base: './'`.
- `src/engine/` pure + tested; `src/store/`; `src/components/` (DocStack, DocCanvas+ScanOverlay, ExtractionCard, FieldRow, IssueFlag, ConfidenceMeter, Ledger, DigestCard, SavedCounter, BeforeAfter, DemoBanner, icons).

## 5. Design system (ui-ux-pro-max — "document grey + scan blue")
- Dark workspace: bg `#0d1320`, panels `#161f30`, border `#28344c`, text `#eef2f8`, dim `#94a3b8`.
- The **document renders as a light paper card** (`#f7f7f4`, dark text) for contrast — the scan happens on bright paper over a dark desk.
- Accent **scan-blue `#2563EB`**; confidence/ok **green `#22c55e`**; anomaly **amber `#f59e0b`** (pulse); error **red `#ef4444`**.
- Field highlight boxes: 2px scan-blue, translucent fill, glow; flagged field box amber.
- Type: Fira Sans (UI) + Fira Code (numbers, VAT IDs, totals).
- Effects: scan-line sweep, box flash-in sequential, confidence fade-in, anomaly pulse. No 3D/heavy shadows. WCAG AA, visible focus, keyboard-operable, reduced-motion freezes scan.

## 6. Acceptance criteria (MVP done)
- [ ] All engine invariant tests green (`vitest run`).
- [ ] 3 sample docs; scan animates field boxes overlaying the document image in sync with extraction card.
- [ ] DOC-1 typo flagged amber; Confirm/Fix reconciles and clears it.
- [ ] Send-to-accounting posts to ledger, updates digest + "Saved this month" (hours + €) + errors-prevented.
- [ ] Before/after bar; honesty banner.
- [ ] Looks premium dark; responsive 1440/1024; reduced-motion safe; SVG icons (no emoji icons).
- [ ] Screenshot-QA passed; private GitHub repo pushed; README + this SPEC committed; local⟷remote synced.
