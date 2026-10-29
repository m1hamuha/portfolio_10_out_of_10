export const PERFORMANCE_BUDGETS = {
  /** Maximum allowable cold page load duration in milliseconds (AC 44) */
  COLD_LOAD_MAX_MS: 1500,

  /** Maximum allowable client-side processing duration for 1,000 orders in milliseconds (AC 45) */
  ROW_PROCESSING_1K_MAX_MS: 300,

  /** Maximum allowable external network egress bytes for client-side analyzers */
  ALLOWED_EXTERNAL_EGRESS_BYTES: 0,

  /** Maximum allowable unhandled console error messages */
  MAX_CONSOLE_ERRORS: 0,

  /** Maximum allowable unhandled console warning messages */
  MAX_CONSOLE_WARNINGS: 0,
} as const;
