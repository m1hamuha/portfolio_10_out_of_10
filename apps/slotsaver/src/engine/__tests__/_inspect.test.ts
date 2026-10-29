import { it } from 'vitest'
import { generateStore, pickDemoSlotId, rankCandidates, resolveFill, openSlot, averageSlotPriceCents, fastForward } from '../index'

it('inspect', () => {
  const s = generateStore(42, Date.UTC(2026,5,19,9,14,0))
  const demoId = pickDemoSlotId(s.slots)
  const demo = s.slots.find(x=>x.id===demoId)!
  console.log('DEMO SLOT:', JSON.stringify(demo))
  console.log('SLOTS:')
  for (const sl of s.slots) console.log(' ', sl.id, sl.time, sl.staff, sl.service, sl.priceCents, sl.status, sl.clientName)
  console.log('WAITLIST:')
  for (const c of s.waitlist) console.log(' ', c.id, c.name, c.fitScore, 'willTake='+c.willTake, c.wantsService)
  const opened = openSlot(s, demoId)
  const os = opened.slots.find(x=>x.id===demoId)!
  const ranked = rankCandidates(opened.waitlist, os)
  console.log('RANKED:', ranked.map(c=>c.name+'/'+c.fitScore+'/'+c.willTake).join(', '))
  const res = resolveFill(os, opened.waitlist, opened.seed)
  console.log('RESULT filled='+res.filled, 'by='+res.filledBy?.name, 'attempts='+res.attempts.map(a=>a.name+(a.accepted?'(Y)':a.responded?'(decline)':'(timeout)')).join(' -> '))
  console.log('avgPrice', averageSlotPriceCents(s))
  console.log('ff30', JSON.stringify(fastForward(s,30)))
  console.log('cancellationsToday', s.cancellationsToday, 'fillRate', s.fillRatePct)
})
