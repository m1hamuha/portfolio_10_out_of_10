/* ============================================================
   PAYMENT CONFIG: paste your real PayPal values here.

   Until these are filled in, the site stays fully working:
   the PayPal buttons show a calm "use bank transfer" message
   and the bank-transfer option is always available. Nothing
   breaks and no buyer ever sees an error.

   See README.md -> "Payment setup" for exactly where to find
   each value inside your PayPal dashboard.
   ============================================================ */

// 1) PayPal Client ID (LIVE).
//    PayPal Dashboard -> Apps & Credentials -> Live ->
//    (create or open your app) -> copy "Client ID".
export const paypalClientId = "PAYPAL_CLIENT_ID_PLACEHOLDER";

// 2) Subscription Plan ID for "Support & care" (240 EUR / month).
//    PayPal Dashboard -> Pay & Get Paid -> Subscriptions ->
//    create a Product, then a 240 EUR / month Plan ->
//    copy the Plan ID (it starts with "P-").
export const supportPlanId = "PAYPAL_SUPPORT_PLAN_ID_PLACEHOLDER";

// 3) OPTIONAL ready-made PayPal payment links, one per one-time
//    package. PayPal Dashboard -> Pay & Get Paid -> More ->
//    Payment Links / PayPal.me. If a link is set, a "Pay with
//    PayPal" button is shown as an extra option. Leave empty to
//    rely only on the buttons above.
export const paymentLinks: { implementation?: string; custom?: string } = {
  implementation: "",
  custom: "",
};

// Currency for the buttons. The owner is in the EU and PayPal is
// the main rail, so this is EUR.
export const currency = "EUR";

/* ---- helpers (no need to edit below) ---- */

const PLACEHOLDER = /PLACEHOLDER/i;

export function isPaypalConfigured(): boolean {
  return !!paypalClientId && !PLACEHOLDER.test(paypalClientId);
}

export function isSupportPlanConfigured(): boolean {
  return !!supportPlanId && !PLACEHOLDER.test(supportPlanId);
}

export function paymentLinkFor(
  id: "implementation" | "custom" | "support",
): string | undefined {
  if (id === "support") return undefined;
  const v = paymentLinks[id];
  return v && v.trim() ? v.trim() : undefined;
}
