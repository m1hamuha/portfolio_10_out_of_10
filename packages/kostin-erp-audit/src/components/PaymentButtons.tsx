import { useEffect, useRef, useState } from "react";
import type { Pkg } from "../types";
import { useStr } from "../i18n";
import {
  paypalClientId,
  supportPlanId,
  currency,
  isPaypalConfigured,
  isSupportPlanConfigured,
  paymentLinkFor,
} from "../paymentConfig";

/* Lazy-load the PayPal JS SDK once per namespace. One-time payments
   and subscriptions need different SDK parameters, so each uses its
   own namespace and is only loaded when that kind of button is shown. */
const sdkCache: Record<string, Promise<any>> = {};

function loadPayPal(namespace: string, params: string): Promise<any> {
  if (namespace in sdkCache) return sdkCache[namespace];
  sdkCache[namespace] = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, any>;
    if (w[namespace]) return resolve(w[namespace]);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.setAttribute("data-namespace", namespace);
    script.onload = () => {
      const ns = (window as unknown as Record<string, any>)[namespace];
      if (ns) resolve(ns);
      else reject(new Error("paypal sdk missing"));
    };
    script.onerror = () => reject(new Error("paypal sdk failed"));
    document.head.appendChild(script);
  });
  return sdkCache[namespace];
}

type State = "loading" | "ready" | "fallback";

export function PaymentButtons({
  pkg,
  onApproved,
}: {
  pkg: Pkg;
  onApproved: (kind: "order" | "subscription", ref: string) => void;
}) {
  const b = useStr().buy;
  const hostRef = useRef<HTMLDivElement>(null);
  const isSub = pkg.id === "support";
  const link = paymentLinkFor(pkg.id);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;

    const configured =
      isPaypalConfigured() && (!isSub || isSupportPlanConfigured());
    if (!configured) {
      setState("fallback");
      return;
    }
    setState("loading");

    const namespace = isSub ? "ppSubs" : "ppOneTime";
    const params = isSub
      ? `client-id=${encodeURIComponent(
          paypalClientId,
        )}&vault=true&intent=subscription&currency=${currency}&components=buttons`
      : `client-id=${encodeURIComponent(
          paypalClientId,
        )}&currency=${currency}&intent=capture&components=buttons`;

    loadPayPal(namespace, params)
      .then((paypal: any) => {
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = "";

        const config = isSub
          ? {
              style: { layout: "vertical", color: "blue", shape: "pill", label: "subscribe" },
              createSubscription: (_d: any, actions: any) =>
                actions.subscription.create({ plan_id: supportPlanId }),
              onApprove: (data: any) =>
                onApproved("subscription", data.subscriptionID || "subscription"),
              onError: () => !cancelled && setState("fallback"),
            }
          : {
              style: { layout: "vertical", color: "blue", shape: "pill", label: "pay" },
              createOrder: (_d: any, actions: any) =>
                actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      description: pkg.name,
                      amount: {
                        value: String(pkg.priceFrom),
                        currency_code: currency,
                      },
                    },
                  ],
                }),
              onApprove: async (_d: any, actions: any) => {
                const order = await actions.order.capture();
                onApproved("order", order?.id || "order");
              },
              onError: () => !cancelled && setState("fallback"),
            };

        const buttons = paypal.Buttons(config);
        if (buttons.isEligible && !buttons.isEligible()) {
          setState("fallback");
          return;
        }
        buttons
          .render(hostRef.current)
          .then(() => !cancelled && setState("ready"))
          .catch(() => !cancelled && setState("fallback"));
      })
      .catch(() => !cancelled && setState("fallback"));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg.id]);

  return (
    <div>
      <p className="text-[0.95rem] font-semibold text-ink-2">
        {isSub ? b.subNote : b.oneTimeNote}
      </p>

      {/* Smart Buttons mount here */}
      <div ref={hostRef} className="mt-3 min-h-[3rem]" />

      {state === "loading" && (
        <p className="mt-1 text-[0.95rem] text-ink-2">{b.payLoading}</p>
      )}

      {state === "fallback" && (
        <div className="mt-1 rounded-xl border border-line bg-paper px-4 py-3">
          <p className="text-[0.98rem] font-semibold text-ink">
            {b.paypalUnconfigured}
          </p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 font-display text-[1rem] font-bold text-white hover:bg-accent-ink"
            >
              {b.payWithLink}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
