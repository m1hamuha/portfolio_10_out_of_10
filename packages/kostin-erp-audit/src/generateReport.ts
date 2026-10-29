import type {
  Answers,
  Impact,
  Lang,
  Pkg,
  PathKind,
  Report,
  Risk,
  Severity,
  Stage,
  SubScore,
} from "./types";
import { STR, summarize } from "./i18n";

const SEVERITY_PENALTY: Record<Severity, number> = {
  high: 18,
  med: 10,
  low: 5,
};

function has(list: string[], id: string): boolean {
  return list.includes(id);
}

function isBanned(system: string): boolean {
  return system === "1c" || system === "bas";
}

export function decidePath(a: Answers): PathKind {
  if (isBanned(a.system)) {
    return a.market === "ua" ? "migrate-urgent" : "migrate";
  }
  if (a.system === "spreadsheets") return "implement";
  if (a.system === "sap" || a.system === "quickbooks") return "replace";
  if (a.system === "odoo") return "optimize";
  return "implement"; // "other" / unknown
}

export function generateReport(a: Answers, lang: Lang): Report {
  const s = STR[lang];
  const R = s.risks;
  const risks: Risk[] = [];
  const path = decidePath(a);

  const bigOrg = a.size === "51-200" || a.size === "200+";
  const smallOrg = a.size === "1-5" || a.size === "6-20";

  const add = (id: keyof typeof R, severity: Severity) =>
    risks.push({ id, severity, ...R[id] });

  // --- Headline system-fit risk (the "battle" logic) ---
  if (path === "migrate-urgent") {
    add("legal-ban", "high");
  } else if (path === "migrate") {
    add("legacy-foreign", "high");
  } else if (a.system === "spreadsheets") {
    add("spreadsheets", bigOrg || !smallOrg ? "high" : "med");
  } else if (a.system === "sap" && smallOrg) {
    add("sap-overkill", "med");
  } else if (a.system === "quickbooks") {
    add("quickbooks-outgrown", bigOrg || has(a.pains, "scaling") ? "med" : "low");
  } else if (a.system === "odoo" && a.pains.length > 0) {
    add("odoo-optimize", "low");
  }

  // --- Integrations / disconnection ---
  const noIntegrations =
    a.integrations.length === 0 || has(a.integrations, "none");
  if (noIntegrations && a.system !== "spreadsheets") {
    add("no-integrations", "med");
  }

  // --- Pain-driven risks ---
  if (has(a.pains, "manual")) add("manual", "med");
  if (has(a.pains, "disconnected") && !noIntegrations) add("disconnected", "med");
  if (has(a.pains, "reporting")) add("reporting", "med");
  if (has(a.pains, "scaling")) add("scaling", bigOrg ? "high" : "med");
  if (has(a.pains, "errors")) add("errors", "high");
  if (has(a.pains, "compliance")) add("compliance", a.market === "ua" ? "high" : "med");
  if (has(a.pains, "support")) add("support", "med");
  if (has(a.pains, "cost")) add("cost", "low");

  // De-dupe (a risk id should appear once), keep highest severity.
  const order: Record<Severity, number> = { high: 0, med: 1, low: 2 };
  const byId = new Map<string, Risk>();
  for (const r of risks) {
    const prev = byId.get(r.id);
    if (!prev || order[r.severity] < order[prev.severity]) byId.set(r.id, r);
  }
  const unique = [...byId.values()].sort(
    (x, y) => order[x.severity] - order[y.severity],
  );

  // ---- Score ----
  let score = 100;
  for (const r of unique) score -= SEVERITY_PENALTY[r.severity];
  if (a.system === "odoo") score += 6; // bonus: already on the right platform
  score = Math.max(8, Math.min(98, Math.round(score)));

  const zone: Report["zone"] = score >= 75 ? "green" : score >= 50 ? "amber" : "red";
  const zoneLabel = s.report.zone[zone];
  const verdict = s.report.verdict[zone];
  const highCount = unique.filter((r) => r.severity === "high").length;
  const summary = summarize(lang, unique.length, highCount);

  const profileLine = [
    s.labels.system[(a.system || "other") as keyof typeof s.labels.system],
    a.market ? s.labels.market[a.market as keyof typeof s.labels.market] : null,
    a.size ? s.labels.size[a.size as keyof typeof s.labels.size] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const recommendation = s.recommendation[path];
  const plan = buildPlan(a, path, lang);
  const packages = buildPackages(lang);
  const recommendedPackage: Pkg["id"] =
    path === "optimize" ? (a.pains.length > 0 ? "custom" : "support") : "implementation";

  const subScores = computeSubScores(a, path, lang);
  const impact = computeImpact(a);
  const benchmark = buildBenchmark(a, lang);

  return {
    score,
    zone,
    zoneLabel,
    verdict,
    summary,
    profileLine,
    pathKind: path,
    recommendation,
    subScores,
    impact,
    benchmark,
    risks: unique,
    plan,
    packages,
    recommendedPackage,
  };
}

/* ============================================================
   Quantified impact + area sub-scores (the "wow" of the audit)
   ============================================================ */

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function clampScore(n: number): number {
  return Math.max(10, Math.min(98, Math.round(n)));
}

// Representative team hours/week spent on manual work.
export function repWeeklyHours(a: Answers): number {
  const byAnswer: Record<string, number> = {
    lt5: 3,
    "5-15": 10,
    "15-40": 25,
    "40+": 50,
  };
  const bySize: Record<string, number> = {
    "1-5": 6,
    "6-20": 14,
    "21-50": 28,
    "51-200": 45,
    "200+": 70,
  };
  let h =
    a.manualHours && byAnswer[a.manualHours] != null
      ? byAnswer[a.manualHours]
      : (a.size && bySize[a.size]) || 12;
  if (a.doubleEntry === "yes") h = Math.round(h * 1.2);
  return h;
}

// Stated, market-aware fully loaded labour assumption (EUR/hr).
export function hourlyRate(market: Answers["market"]): number {
  switch (market) {
    case "us":
      return 35;
    case "eu":
      return 32;
    case "ua":
      return 15;
    default:
      return 28;
  }
}

export function computeImpact(a: Answers): Impact {
  const weeklyHours = repWeeklyHours(a);
  const monthlyHours = Math.round(weeklyHours * 4.33);
  const rate = hourlyRate(a.market);
  const monthlyCost = roundTo(monthlyHours * rate, 10);
  const savingsPct = a.doubleEntry === "yes" ? 0.65 : 0.6;
  const savedHoursMonth = Math.round(monthlyHours * savingsPct);
  const savedCostMonth = roundTo(monthlyCost * savingsPct, 10);
  const savedCostYear = roundTo(savedCostMonth * 12, 100);
  return {
    weeklyHours,
    monthlyHours,
    hourlyRate: rate,
    monthlyCost,
    savingsPct,
    savedHoursMonth,
    savedCostMonth,
    savedCostYear,
  };
}

export function computeSubScores(a: Answers, path: PathKind, lang: Lang): SubScore[] {
  const noIntegrations =
    a.integrations.length === 0 || has(a.integrations, "none");
  const hasP = (id: string) => has(a.pains, id);

  // 1. Data Consistency (Data & Integrations)
  let dataConsistency = 100;
  if (a.system === "spreadsheets") dataConsistency -= 22;
  if (noIntegrations && a.system !== "spreadsheets") dataConsistency -= 25;
  if (hasP("disconnected")) dataConsistency -= 20;
  if (hasP("reporting")) dataConsistency -= 14;
  if (a.doubleEntry === "yes") dataConsistency -= 20;

  // 2. Process Bottlenecks (Automation & Workload)
  let processBottlenecks = 100;
  if (hasP("manual")) processBottlenecks -= 20;
  const mh: Record<string, number> = { lt5: 4, "5-15": 12, "15-40": 26, "40+": 38 };
  if (a.manualHours) processBottlenecks -= mh[a.manualHours] ?? 0;
  else if (a.size === "51-200" || a.size === "200+") processBottlenecks -= 16;
  if (a.system === "spreadsheets") processBottlenecks -= 16;
  if (a.doubleEntry === "yes") processBottlenecks -= 10;
  if (a.closeDays === "6-10") processBottlenecks -= 8;
  if (a.closeDays === "10+") processBottlenecks -= 14;

  // 3. Migration Readiness (Compliance & Platform Risk)
  let migrationReadiness = 100;
  if (path === "migrate-urgent") migrationReadiness -= 40;
  else if (path === "migrate") migrationReadiness -= 20;
  if (hasP("compliance")) migrationReadiness -= a.market === "ua" ? 24 : 18;
  if (hasP("errors")) migrationReadiness -= 18;
  if (hasP("support")) migrationReadiness -= 12;

  // 4. System Architecture (Platform Fit & Scalability)
  let systemArchitecture = 100;
  if (hasP("cost")) systemArchitecture -= 22;
  if (a.system === "sap") systemArchitecture -= 20;
  if (a.system === "quickbooks") systemArchitecture -= 8;
  if (hasP("scaling")) systemArchitecture -= 14;
  if (noIntegrations) systemArchitecture -= 8;
  if (a.system === "spreadsheets") systemArchitecture -= 10;

  return [
    {
      id: "dataConsistency",
      label: lang === "uk" ? "Узгодженість даних" : "Data Consistency",
      value: clampScore(dataConsistency),
    },
    {
      id: "processBottlenecks",
      label: lang === "uk" ? "Вузькі місця процесів" : "Process Bottlenecks",
      value: clampScore(processBottlenecks),
    },
    {
      id: "migrationReadiness",
      label: lang === "uk" ? "Готовність до міграції" : "Migration Readiness",
      value: clampScore(migrationReadiness),
    },
    {
      id: "systemArchitecture",
      label: lang === "uk" ? "Архітектура системи" : "System Architecture",
      value: clampScore(systemArchitecture),
    },
  ];
}

function buildBenchmark(a: Answers, lang: Lang): string {
  const r = STR[lang].report;
  let txt = r.benchmarkBase;
  if (a.closeDays === "6-10" || a.closeDays === "10+") {
    const dayLabel = STR[lang].labels.metric.closeDays[a.closeDays];
    txt += r.benchmarkClose.replace("{days}", dayLabel);
  }
  return txt;
}

function buildPlan(a: Answers, path: PathKind, lang: Lang): Stage[] {
  const P = STR[lang].plan;
  const st = P.stages;

  // Build the integrations stage from the tools the buyer actually uses.
  const connectable = a.integrations.filter((i) => i !== "none");
  const intItems =
    connectable.length > 0
      ? connectable.map(
          (id) =>
            P.connectVerb +
            STR[lang].labels.integration[
              id as keyof (typeof STR)["en"]["labels"]["integration"]
            ],
        )
      : [P.integrateFallback];

  let chosen: { title: string; items: string[] }[];
  switch (path) {
    case "optimize":
      chosen = [
        st.audit,
        st.stabilize,
        { title: st.integrate.title, items: intItems },
        st.optimize,
        st.support,
      ];
      break;
    case "implement":
      chosen = [
        st.discovery,
        st.setup,
        st.implementData,
        { title: st.integrate.title, items: intItems },
        st.golive,
        st.support,
      ];
      break;
    default: // migrate-urgent | migrate | replace
      chosen = [
        st.discovery,
        st.setup,
        st.migrateData,
        { title: st.integrate.title, items: intItems },
        st.golive,
        st.support,
      ];
  }

  return chosen.map((c, i) => ({ n: i + 1, title: c.title, items: c.items }));
}

function buildPackages(lang: Lang): Pkg[] {
  return STR[lang].packages.map((p) => ({
    id: p.id as Pkg["id"],
    name: p.name,
    tagline: p.tagline,
    deliverables: p.deliverables,
    priceFrom: p.priceFrom,
    priceNote: (p as { priceNote?: string }).priceNote,
    perMonth: p.perMonth,
    timeline: p.timeline,
  }));
}
