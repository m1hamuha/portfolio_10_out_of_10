import { useEffect, useRef, useState } from "react";
import type { Report } from "../types";
import { useStr } from "../i18n";

const ZONE_COLOR: Record<Report["zone"], string> = {
  red: "var(--risk-high)",
  amber: "var(--risk-med)",
  green: "var(--ok)",
};

function useCountUp(target: number, durationMs = 900): number {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, durationMs]);
  return val;
}

export function HealthScore({ report }: { report: Report }) {
  const s = useStr();
  const shown = useCountUp(report.score);
  const color = ZONE_COLOR[report.zone];

  return (
    <div className="print-block rounded-xl2 border border-line bg-surface p-6 shadow-card md:p-8">
      <p className="font-display text-[0.85rem] font-bold uppercase tracking-wider text-ink-2">
        {s.intro.previewScoreLabel}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-1">
          <span
            className="tnum font-display text-[4.5rem] font-extrabold leading-none md:text-[5.5rem]"
            style={{ color }}
          >
            {shown}
          </span>
          <span className="font-display text-[1.6rem] font-bold text-ink-2">/100</span>
        </div>
        <div className="pb-2">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[1rem] font-bold text-white"
            style={{ background: color }}
          >
            {report.zoneLabel}
          </span>
        </div>
      </div>

      {/* Segmented health bar with marker */}
      <div className="mt-6">
        <div className="relative h-3.5 overflow-hidden rounded-full">
          <div className="absolute inset-0 flex">
            <div className="h-full" style={{ width: "50%", background: "var(--risk-high)" }} />
            <div className="h-full" style={{ width: "25%", background: "var(--risk-med)" }} />
            <div className="h-full" style={{ width: "25%", background: "var(--ok)" }} />
          </div>
        </div>
        <div className="relative mt-1 h-4">
          <div
            className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out"
            style={{ left: `${report.score}%` }}
          >
            <div className="mx-auto h-0 w-0 border-x-[7px] border-b-[9px] border-x-transparent border-b-ink" />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[0.82rem] font-semibold text-ink-2">
          <span>{s.report.zone.red}</span>
          <span>{s.report.zone.amber}</span>
          <span>{s.report.zone.green}</span>
        </div>
      </div>

      <p className="mt-5 text-[1.1rem] font-semibold leading-relaxed text-ink">
        {report.verdict}
      </p>
    </div>
  );
}
