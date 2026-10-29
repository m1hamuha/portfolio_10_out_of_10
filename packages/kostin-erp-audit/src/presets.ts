import type { Preset } from "./types";

export const PRESETS: Preset[] = [
  {
    id: "legacy-1c",
    name: "Legacy 1C Enterprise",
    badge: "Sanctions Risk",
    badgeColor: "red",
    description:
      "Trapped on legacy 1C/BAS in Ukraine with active sanctions risk, disconnected databases, and 10+ days close.",
    answers: {
      system: "1c",
      market: "ua",
      size: "51-200",
      integrations: ["bank"],
      manualHours: "40+",
      volume: "2000+",
      closeDays: "10+",
      doubleEntry: "yes",
      pains: ["manual", "compliance", "support", "disconnected", "scaling"],
      painText: "Sanctioned 1C system, unable to get updates, critical compliance risk.",
    },
  },
  {
    id: "spreadsheets-chaos",
    name: "Spreadsheets Chaos",
    badge: "Data Leakage",
    badgeColor: "red",
    description:
      "Growing EU company operating on fragmented spreadsheets with manual reconciliations and inventory errors.",
    answers: {
      system: "spreadsheets",
      market: "eu",
      size: "21-50",
      integrations: ["none"],
      manualHours: "15-40",
      volume: "500-2000",
      closeDays: "6-10",
      doubleEntry: "yes",
      pains: ["manual", "disconnected", "reporting", "errors"],
      painText: "Data scattered across multiple spreadsheets, numbers constantly mismatch.",
    },
  },
  {
    id: "quickbooks-outgrown",
    name: "QuickBooks Outgrown",
    badge: "Scale Bottleneck",
    badgeColor: "amber",
    description:
      "US scaling business outgrowing QuickBooks limitations in inventory valuation, multi-entity, and operations.",
    answers: {
      system: "quickbooks",
      market: "us",
      size: "21-50",
      integrations: ["bank", "ecommerce"],
      manualHours: "15-40",
      volume: "500-2000",
      closeDays: "6-10",
      doubleEntry: "yes",
      pains: ["scaling", "disconnected", "reporting", "manual"],
      painText: "QuickBooks cannot handle our inventory sync and multi-warehouse operations.",
    },
  },
  {
    id: "optimized-odoo",
    name: "Optimized Odoo Modern",
    badge: "High Performance",
    badgeColor: "green",
    description:
      "Modern enterprise running Odoo, looking for automation tuning, bank feeds, and custom workflow polish.",
    answers: {
      system: "odoo",
      market: "eu",
      size: "21-50",
      integrations: ["bank", "ecommerce", "crm", "einvoice"],
      manualHours: "lt5",
      volume: "500-2000",
      closeDays: "1-2",
      doubleEntry: "no",
      pains: [],
      painText: "Core Odoo operational, seeking advanced module optimization.",
    },
  },
];
