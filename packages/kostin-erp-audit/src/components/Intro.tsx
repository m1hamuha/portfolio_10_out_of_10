import { useStr } from "../i18n";
import type { Answers } from "../types";
import { Button, Chip, ArrowIcon, CheckIcon } from "./ui";
import { PresetsBar } from "./PresetsBar";

export function Intro({
  onStart,
  onSelectPreset,
}: {
  onStart: () => void;
  onSelectPreset: (answers: Answers) => void;
}) {
  const s = useStr();
  return (
    <div className="mx-auto max-w-content px-5 md:px-8">
      {/* Hero */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.9rem] font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-ok" aria-hidden="true" />
            {s.intro.badge}
          </div>
          <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[3.1rem] md:text-[3.6rem]">
            {s.intro.h1a}
            <br />
            {s.intro.h1b}
          </h1>
          <p className="mt-5 max-w-xl text-[1.15rem] leading-relaxed text-ink">
            {s.intro.sub}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={onStart} className="w-full sm:w-auto">
              {s.intro.ctaStart}
              <ArrowIcon className="h-5 w-5" />
            </Button>
            <span className="text-[0.95rem] font-medium text-ink-2">
              {s.intro.ctaNote}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {s.intro.chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        </div>

        {/* Signature preview: the deliverable */}
        <div className="md:col-span-5">
          <PreviewCard />
        </div>
      </section>

      {/* 1-Click Employer Presets */}
      <PresetsBar onSelectPreset={onSelectPreset} className="mb-12" />

      {/* Who this is for */}
      <section className="border-t border-line py-12 md:py-16">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {s.intro.whoForTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-[1.15rem] font-semibold leading-relaxed text-ink">
          {s.intro.whoForLead}
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {s.intro.whoForItems.map((it) => (
            <li
              key={it}
              className="flex items-start gap-3 rounded-xl2 border border-line bg-surface p-5 text-[1.02rem] leading-relaxed text-ink shadow-card"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <CheckIcon className="h-4 w-4" />
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What you get */}
      <section className="border-t border-line py-12 md:py-16">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {s.intro.whatYouGetTitle}
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {s.intro.getItems.map((it) => (
            <div
              key={it.t}
              className="rounded-xl2 border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-[1.15rem] font-bold text-ink">
                    {it.t}
                  </h3>
                  <p className="mt-1 text-[1.02rem] leading-relaxed text-ink">
                    {it.d}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line py-12 md:py-16">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {s.intro.howTitle}
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {s.intro.howSteps.map((st) => (
            <div
              key={st.t}
              className="rounded-xl2 border border-line bg-surface p-6 shadow-card"
            >
              <h3 className="font-display text-[1.15rem] font-bold leading-snug text-ink">
                {st.t}
              </h3>
              <p className="mt-2 text-[1.02rem] leading-relaxed text-ink">
                {st.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why work with me */}
      <section className="border-t border-line py-12 md:py-16">
        <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {s.intro.whyTitle}
        </h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {s.intro.whyItems.map((it) => (
            <div
              key={it.t}
              className="rounded-xl2 border border-line bg-surface p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-[1.15rem] font-bold text-ink">
                    {it.t}
                  </h3>
                  <p className="mt-1 text-[1.02rem] leading-relaxed text-ink">
                    {it.d}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onStart} className="w-full sm:w-auto">
            {s.intro.ctaStart}
            <ArrowIcon className="h-5 w-5" />
          </Button>
          <span className="text-[0.95rem] font-semibold text-ink-2">
            {s.intro.odooNote}
          </span>
        </div>
      </section>
    </div>
  );
}

function PreviewCard() {
  const s = useStr();
  const dot: Record<string, string> = {
    high: "bg-risk-high",
    med: "bg-risk-med",
    low: "bg-risk-low",
  };
  return (
    <div className="rounded-xl2 border border-line bg-surface p-6 shadow-lift">
      <p className="font-display text-[0.85rem] font-bold uppercase tracking-wider text-ink-2">
        {s.intro.previewKicker}
      </p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[0.95rem] font-semibold text-ink">
            {s.intro.previewScoreLabel}
          </p>
          <p className="mt-1 text-[0.92rem] text-ink-2">{s.intro.previewZone}</p>
        </div>
        <div className="tnum font-display text-[3.2rem] font-extrabold leading-none text-risk-med">
          58
        </div>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-risk-med" style={{ width: "58%" }} />
      </div>
      <ul className="mt-5 space-y-2.5">
        {s.intro.previewRisks.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${dot[r.tag]}`}
                aria-hidden="true"
              />
              <span className="text-[1rem] font-semibold text-ink">{r.label}</span>
            </span>
            <span className="text-[0.82rem] font-semibold text-ink-2">
              {s.report.sev[r.tag as "high" | "med" | "low"]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
