/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the "Request a profit audit" form POSTs. Optional. */
  readonly VITE_LEAD_ENDPOINT?: string
  /** Fallback contact email used (mailto) when no endpoint is configured. */
  readonly VITE_CONTACT_EMAIL?: string
}
