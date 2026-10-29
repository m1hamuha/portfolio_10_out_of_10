import type { Answers, Lang } from "./types";
import { STR } from "./i18n";

export interface Option {
  id: string;
  label: string;
  hint?: string;
}

export interface SingleStep {
  kind: "single";
  key: keyof Answers;
  title: string;
  subtitle?: string;
  options: Option[];
}

export interface MultiStep {
  kind: "multi";
  key: keyof Answers;
  title: string;
  subtitle?: string;
  options: Option[];
  noneId?: string; // selecting this clears the others
}

export interface PainStep {
  kind: "pains";
  title: string;
  subtitle?: string;
  options: Option[];
  textLabel: string;
  textPlaceholder: string;
}

// One screen bundling several short numeric pickers (one row each),
// so the questionnaire stays about 2-3 min while capturing impact signals.
export interface MetricGroup {
  key: keyof Answers;
  label: string;
  options: Option[];
}

export interface MetricsStep {
  kind: "metrics";
  title: string;
  subtitle?: string;
  groups: MetricGroup[];
}

export type Step = SingleStep | MultiStep | PainStep | MetricsStep;

const SYSTEM_ORDER = [
  "odoo",
  "1c",
  "bas",
  "quickbooks",
  "sap",
  "spreadsheets",
  "other",
] as const;
const MARKET_ORDER = ["us", "eu", "ua", "other"] as const;
const SIZE_ORDER = ["1-5", "6-20", "21-50", "51-200", "200+"] as const;
const INTEGRATION_ORDER = [
  "bank",
  "ecommerce",
  "crm",
  "einvoice",
  "none",
] as const;
const PAIN_ORDER = [
  "manual",
  "disconnected",
  "reporting",
  "scaling",
  "errors",
  "compliance",
  "support",
  "cost",
] as const;

const MANUAL_HOURS_ORDER = ["lt5", "5-15", "15-40", "40+"] as const;
const VOLUME_ORDER = ["lt100", "100-500", "500-2000", "2000+"] as const;
const CLOSE_DAYS_ORDER = ["1-2", "3-5", "6-10", "10+"] as const;
const YESNO_ORDER = ["no", "yes"] as const;

export function getSteps(lang: Lang): Step[] {
  const s = STR[lang];
  const L = s.labels;
  return [
    {
      kind: "single",
      key: "system",
      title: s.quiz.steps.system.title,
      subtitle: s.quiz.steps.system.subtitle,
      options: SYSTEM_ORDER.map((id) => ({
        id,
        label: L.system[id],
        hint: L.systemHint[id],
      })),
    },
    {
      kind: "single",
      key: "market",
      title: s.quiz.steps.market.title,
      subtitle: s.quiz.steps.market.subtitle,
      options: MARKET_ORDER.map((id) => ({ id, label: L.market[id] })),
    },
    {
      kind: "single",
      key: "size",
      title: s.quiz.steps.size.title,
      subtitle: s.quiz.steps.size.subtitle,
      options: SIZE_ORDER.map((id) => ({ id, label: L.size[id] })),
    },
    {
      kind: "multi",
      key: "integrations",
      title: s.quiz.steps.integrations.title,
      subtitle: s.quiz.steps.integrations.subtitle,
      noneId: "none",
      options: INTEGRATION_ORDER.map((id) => ({ id, label: L.integration[id] })),
    },
    {
      kind: "metrics",
      title: s.quiz.steps.metrics.title,
      subtitle: s.quiz.steps.metrics.subtitle,
      groups: [
        {
          key: "manualHours",
          label: s.quiz.steps.metrics.manualHoursLabel,
          options: MANUAL_HOURS_ORDER.map((id) => ({
            id,
            label: L.metric.manualHours[id],
          })),
        },
        {
          key: "volume",
          label: s.quiz.steps.metrics.volumeLabel,
          options: VOLUME_ORDER.map((id) => ({ id, label: L.metric.volume[id] })),
        },
      ],
    },
    {
      kind: "metrics",
      title: lang === "uk" ? "Закриття періоду та дублювання даних" : "Reconciliation & Data Redundancy",
      subtitle:
        lang === "uk"
          ? "Швидкість закриття місяця та повторне введення даних"
          : "Closing speed and redundant double-keying across software",
      groups: [
        {
          key: "closeDays",
          label: s.quiz.steps.metrics.closeDaysLabel,
          options: CLOSE_DAYS_ORDER.map((id) => ({
            id,
            label: L.metric.closeDays[id],
          })),
        },
        {
          key: "doubleEntry",
          label: s.quiz.steps.metrics.doubleEntryLabel,
          options: YESNO_ORDER.map((id) => ({ id, label: L.metric.yesno[id] })),
        },
      ],
    },
    {
      kind: "pains",
      title: s.quiz.steps.pains.title,
      subtitle: s.quiz.steps.pains.subtitle,
      textLabel: s.quiz.steps.pains.textLabel,
      textPlaceholder: s.quiz.steps.pains.textPlaceholder,
      options: PAIN_ORDER.map((id) => ({ id, label: L.pain[id] })),
    },
  ];
}

export const emptyAnswers: Answers = {
  system: "",
  market: "",
  size: "",
  integrations: [],
  manualHours: "",
  volume: "",
  closeDays: "",
  doubleEntry: "",
  pains: [],
  painText: "",
};
