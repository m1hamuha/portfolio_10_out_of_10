// Domain model for the ERP / Business Systems Health Audit.

export type Lang = "en" | "uk";

export type Severity = "high" | "med" | "low";

// What the business runs today.
export type SystemId =
  | "odoo"
  | "1c"
  | "bas"
  | "quickbooks"
  | "sap"
  | "spreadsheets"
  | "other";

export type MarketId = "us" | "eu" | "ua" | "other";

export type SizeId = "1-5" | "6-20" | "21-50" | "51-200" | "200+";

// Quantifying metrics that power the "impact in numbers" estimate.
export type ManualHoursId = "lt5" | "5-15" | "15-40" | "40+";
export type VolumeId = "lt100" | "100-500" | "500-2000" | "2000+";
export type CloseDaysId = "1-2" | "3-5" | "6-10" | "10+";
export type YesNoId = "yes" | "no";

// The recommended direction the report points to.
export type PathKind =
  | "migrate-urgent" // 1C/BAS in Ukraine: legal ban, mandatory migration
  | "migrate" // 1C/BAS in a foreign market: wrong fit, plan a migration
  | "implement" // spreadsheets / nothing: first real ERP
  | "replace" // SAP / QuickBooks: consolidate onto Odoo
  | "optimize"; // already on Odoo: improve and extend

export interface Answers {
  system: SystemId | "";
  market: MarketId | "";
  size: SizeId | "";
  integrations: string[]; // ids; may include "none"
  // Quantifying metrics (optional; they drive the impact estimate).
  manualHours: ManualHoursId | ""; // team hours/week on manual entry & reconciliation
  volume: VolumeId | ""; // orders / invoices per month
  closeDays: CloseDaysId | ""; // days to close the books each month
  doubleEntry: YesNoId | ""; // same data keyed into more than one system?
  pains: string[]; // ids
  painText: string; // free text
}

export interface Risk {
  id: string;
  title: string;
  severity: Severity;
  what: string; // plain-language: what it means
  why: string; // why it matters / the consequence
}

export interface Stage {
  n: number;
  title: string;
  items: string[];
}

export interface Recommendation {
  title: string;
  body: string;
}

export interface Pkg {
  id: "implementation" | "custom" | "support";
  name: string;
  tagline: string;
  deliverables: string[];
  priceFrom: number; // EUR
  priceNote?: string; // e.g. "typical project EUR 3,000 to 8,000" / "or EUR 45/hr"
  perMonth?: boolean;
  timeline: string;
}

// Area sub-score IDs (4 architectural sub-scores + legacy aliases)
export type SubScoreId =
  | "dataConsistency"
  | "processBottlenecks"
  | "migrationReadiness"
  | "systemArchitecture"
  | "data"
  | "automation"
  | "compliance"
  | "cost";

// A labeled area sub-score (0..100) shown as a small bar.
export interface SubScore {
  id: SubScoreId;
  label: string;
  value: number;
}

// 1-Click preset definition for employer demonstrations
export interface Preset {
  id: string;
  name: string;
  badge: string;
  badgeColor?: "red" | "amber" | "green";
  description: string;
  answers: Answers;
}

// Executive Export Contract (PROJECT.md)
export interface ExecutiveExportService<TInput, TOutput> {
  generate(input: TInput): Promise<TOutput>;
  download(output: TOutput, filename: string): void;
}

// Quantified impact estimate, derived from the metric answers.
export interface Impact {
  weeklyHours: number; // est. team hours/week on manual work
  monthlyHours: number; // hours/month lost to manual work
  hourlyRate: number; // stated fully loaded labour assumption (EUR)
  monthlyCost: number; // $ cost of that manual work / month
  savingsPct: number; // 0..1 share Odoo automation can remove
  savedHoursMonth: number; // hours/month recoverable
  savedCostMonth: number; // $ / month recoverable
  savedCostYear: number; // $ / year recoverable
}

export interface Report {
  score: number; // 0..100 health score
  zone: "red" | "amber" | "green";
  zoneLabel: string;
  verdict: string; // one-line headline verdict
  summary: string; // 2-4 sentence summary
  profileLine: string; // "1C · Ukraine · 21 to 50 users"
  pathKind: PathKind;
  recommendation: Recommendation;
  subScores: SubScore[]; // 4 area scores
  impact: Impact; // quantified impact / savings estimate
  benchmark: string; // "businesses your size on Odoo typically…"
  risks: Risk[]; // sorted high to low
  plan: Stage[];
  packages: Pkg[];
  recommendedPackage: Pkg["id"];
}
