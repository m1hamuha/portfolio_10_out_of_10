/* ============================================================
   ANALYTICS CONFIG: paste your tracking IDs here.

   This powers your ad measurement. Until you paste an ID, the
   site stays fully working and loads NOTHING extra: each tracker
   only loads when its ID is filled in, so empty = no-op, no
   errors, no network calls, no cookies.

   See README.md -> "Analytics / ad tracking" for where to find
   each ID.
   ============================================================ */

// 1) GOOGLE ANALYTICS 4 (GA4) Measurement ID.
//    Looks like "G-XXXXXXXXXX".
//    Google Analytics -> Admin -> Data streams -> your web stream
//    -> copy "Measurement ID". Leave "" to keep GA4 off.
export const GA4_MEASUREMENT_ID: string = "";

// 2) META (FACEBOOK) PIXEL ID.
//    A long number, e.g. "1234567890123456".
//    Meta Events Manager -> Data sources -> your Pixel -> Settings
//    -> copy the "Pixel ID". Leave "" to keep the Meta Pixel off.
export const META_PIXEL_ID: string = "";

/* ---- below this line: no need to edit ---- */

/* The events we fire. Kept to a small, meaningful set so the
   owner can build clean ad audiences and conversions. */
export type AnalyticsEvent =
  | "audit_started"
  | "audit_completed"
  | "audit_preset_selected"
  | "lead_captured"
  | "plan_chosen"
  | "begin_checkout";

// Map our events to Meta's standard events where one fits, so ad
// optimization (Lead / InitiateCheckout) works out of the box.
const META_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  lead_captured: "Lead",
  begin_checkout: "InitiateCheckout",
  plan_chosen: "AddToCart",
};

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function gaEnabled(): boolean {
  return !!GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID.trim().startsWith("G-");
}

function metaEnabled(): boolean {
  return !!META_PIXEL_ID && /^\d{6,}$/.test(META_PIXEL_ID.trim());
}

let started = false;

/* Load the tracker snippets, once, only for IDs that are set. */
export function initAnalytics(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  if (gaEnabled()) {
    const id = GA4_MEASUREMENT_ID.trim();
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  if (metaEnabled()) {
    const id = META_PIXEL_ID.trim();
    /* Standard Meta Pixel bootstrap. */
    const n: Fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue!.push(args);
    } as Fbq;
    if (!window._fbq) window._fbq = n;
    n.queue = [];
    window.fbq = n;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", id);
    window.fbq("track", "PageView");
  }
}

/* Fire one event to whatever trackers are configured. Safe no-op
   when nothing is set up yet. */
export function track(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (window.gtag) window.gtag("event", event, params || {});
  if (window.fbq) {
    const std = META_STANDARD[event];
    if (std) window.fbq("track", std, params || {});
    else window.fbq("trackCustom", event, params || {});
  }
}
