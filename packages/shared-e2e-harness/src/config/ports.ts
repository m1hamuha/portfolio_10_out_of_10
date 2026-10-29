export interface AppPortConfig {
  readonly marginpulse: number;
  readonly invoiceAutopilot: number;
  readonly slotsaver: number;
  readonly kostinErpAudit: number;
  readonly eudrAssistant: number;
  readonly saasCrmErp: number;
  readonly fintechDashboard: number;
}

export const APP_PORTS: AppPortConfig = {
  marginpulse: Number(process.env.PORT_MARGINPULSE || 5173),
  invoiceAutopilot: Number(process.env.PORT_INVOICE_AUTOPILOT || 5174),
  slotsaver: Number(process.env.PORT_SLOTSAVER || 5175),
  kostinErpAudit: Number(process.env.PORT_KOSTIN_ERP_AUDIT || 5176),
  eudrAssistant: Number(process.env.PORT_EUDR_ASSISTANT || 3000),
  saasCrmErp: Number(process.env.PORT_SAAS_CRM_ERP || 3002),
  fintechDashboard: Number(process.env.PORT_FINTECH_DASHBOARD || 5178),
} as const;

export const APP_URLS = {
  marginpulse: `http://localhost:${APP_PORTS.marginpulse}`,
  invoiceAutopilot: `http://localhost:${APP_PORTS.invoiceAutopilot}`,
  slotsaver: `http://localhost:${APP_PORTS.slotsaver}`,
  kostinErpAudit: `http://localhost:${APP_PORTS.kostinErpAudit}`,
  eudrAssistant: `http://localhost:${APP_PORTS.eudrAssistant}`,
  saasCrmErp: `http://localhost:${APP_PORTS.saasCrmErp}`,
  fintechDashboard: `http://localhost:${APP_PORTS.fintechDashboard}`,
} as const;

export type AppName = keyof typeof APP_URLS;
