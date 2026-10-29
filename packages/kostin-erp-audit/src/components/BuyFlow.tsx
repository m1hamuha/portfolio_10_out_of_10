import { useEffect, useRef, useState } from "react";
import type { Pkg, Report } from "../types";
import { useStr, formatEur } from "../i18n";
import { track } from "../analyticsConfig";
import { Button, CheckIcon, ArrowIcon, cx } from "./ui";
import { PaymentButtons } from "./PaymentButtons";

const OWNER_EMAIL = "kostinmihail40@gmail.com";

type Status = "idle" | "sending" | "error";

function priceTagFor(p: Pkg, perMonthWord: string): string {
  return formatEur(p.priceFrom) + (p.perMonth ? perMonthWord : "");
}

/* The buy flow, shown in a modal. It opens on a clean plan chooser
   (3 symmetric cards, value ladder: cheapest entry first), then once
   the buyer picks a plan it shows the "what happens next" pipeline,
   payment (PayPal or bank transfer), and a short intake form.
   `initial` may be null (open on the chooser) or a pre-picked plan. */
export function BuyFlow({
  initial,
  report,
  onClose,
}: {
  initial: Pkg | null;
  report: Report;
  onClose: () => void;
}) {
  const s = useStr();
  const b = s.buy;
  const [selected, setSelected] = useState<Pkg | null>(initial);
  const [done, setDone] = useState(false);
  const [paid, setPaid] = useState(false);

  // Fire plan_chosen once per distinct plan selection.
  const trackedPlan = useRef<string | null>(null);
  useEffect(() => {
    if (selected && trackedPlan.current !== selected.id) {
      trackedPlan.current = selected.id;
      track("plan_chosen", { plan: selected.id, price: selected.priceFrom });
    }
  }, [selected]);

  // Lock background scroll + close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function changePlan() {
    setSelected(null);
    setPaid(false);
    setDone(false);
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={selected ? b.modalKicker : b.chooseKicker}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-4 w-full max-w-2xl rounded-xl2 bg-paper shadow-lift">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-xl2 border-b border-line bg-ink px-6 py-5 text-white md:px-8">
          <div className="flex min-w-0 items-start gap-3">
            {selected && (
              <button
                onClick={changePlan}
                aria-label={b.changePlan}
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <BackIcon className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="font-display text-[0.8rem] font-bold uppercase tracking-wider text-white/60">
                {selected ? b.modalKicker : b.chooseKicker}
              </p>
              <h2 className="mt-1 font-display text-[1.4rem] font-extrabold leading-tight tracking-tight text-white md:text-[1.7rem]">
                {selected ? selected.name : b.chooseTitle}
              </h2>
              <p className="mt-0.5 text-[1rem] font-semibold text-white/80">
                {selected
                  ? `${s.report.fromWord} ${priceTagFor(selected, b.perMonth)}`
                  : b.chooseSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={b.close}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-7">
          {!selected ? (
            <PlanChooser report={report} onChoose={setSelected} />
          ) : (
            <>
              {/* Pipeline: reassures the buyer */}
              <Pipeline activeDone={done} paid={paid} />

              {done ? (
                <DonePanel onClose={onClose} />
              ) : (
                <div className="mt-8 grid gap-8">
                  <PaySection pkg={selected} report={report} paid={paid} onPaid={() => setPaid(true)} onBankDone={() => setDone(true)} />
                  <IntakeSection pkg={selected} report={report} onDone={() => setDone(true)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* The plan chooser: three equal, symmetric cards in a value ladder
   (cheapest entry first). Reserved badge slot keeps every card aligned. */
function PlanChooser({
  report,
  onChoose,
}: {
  report: Report;
  onChoose: (p: Pkg) => void;
}) {
  const s = useStr();
  const b = s.buy;
  const plans = [...report.packages].sort((a, c) => a.priceFrom - c.priceFrom);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {plans.map((p) => {
        const isRec = p.id === report.recommendedPackage;
        const isEntry = p.id === "support";
        return (
          <div
            key={p.id}
            className={cx(
              "flex h-full flex-col rounded-xl2 border bg-surface p-5 shadow-card",
              isRec ? "border-2 border-accent ring-2 ring-accent/15" : "border-line",
            )}
          >
            {/* Badge slot: fixed height so all cards line up */}
            <div className="mb-3.5 h-7">
              {isRec ? (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 py-1 font-display text-[0.72rem] font-bold uppercase tracking-wide text-white">
                  <ArrowIcon className="h-3.5 w-3.5" />
                  {s.report.recommendedBadge}
                </span>
              ) : isEntry ? (
                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-accent-soft px-3 py-1 font-display text-[0.72rem] font-bold uppercase tracking-wide text-accent-ink">
                  {b.startHere}
                </span>
              ) : null}
            </div>

            <h3 className="font-display text-[1.18rem] font-extrabold leading-tight text-ink">
              {p.name}
            </h3>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[0.9rem] font-semibold text-ink-2">
                {s.report.fromWord}
              </span>
              <span className="tnum font-display text-[1.85rem] font-extrabold leading-none text-ink">
                {formatEur(p.priceFrom)}
              </span>
              {p.perMonth && (
                <span className="font-display text-[1rem] font-bold text-ink-2">
                  {s.report.perMonthWord}
                </span>
              )}
            </div>

            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-2">
              {p.tagline}
            </p>

            {isEntry && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[0.92rem] font-bold text-accent-ink">
                <CheckIcon className="h-3.5 w-3.5" />
                {b.cancelAnytime}
              </p>
            )}

            <div className="mt-auto pt-5">
              <Button onClick={() => onChoose(p)} size="md" className="w-full">
                {isEntry ? b.startWithSupport : b.chooseBtn}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pipeline({ activeDone, paid }: { activeDone: boolean; paid: boolean }) {
  const b = useStr().buy;
  return (
    <ol className="grid gap-3">
      {b.steps.map((st, i) => {
        const complete = activeDone || (i === 0 && paid);
        return (
          <li key={i} className="flex items-start gap-3.5">
            <span
              className={cx(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[0.95rem] font-extrabold",
                complete ? "bg-ok text-white" : "bg-accent-soft text-accent",
              )}
            >
              {complete ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-display text-[1.05rem] font-bold leading-snug text-ink">
                {st.t}
              </p>
              <p className="text-[0.98rem] leading-relaxed text-ink-2">{st.d}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PaySection({
  pkg,
  report,
  paid,
  onPaid,
  onBankDone,
}: {
  pkg: Pkg;
  report: Report;
  paid: boolean;
  onPaid: () => void;
  onBankDone: () => void;
}) {
  const b = useStr().buy;
  const [bankOpen, setBankOpen] = useState(false);

  async function notifyPaid(kind: "order" | "subscription", ref: string) {
    onPaid();
    // Best-effort: tell the owner a payment came in. Never blocks the UI.
    try {
      await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: b.paidSubject,
          Package: pkg.name,
          Amount: formatEur(pkg.priceFrom) + (pkg.perMonth ? b.perMonth : ""),
          Type: kind,
          Reference: ref,
        }),
      });
    } catch {
      /* ignore: confirmation is already shown to the buyer */
    }
  }

  return (
    <section>
      <h3 className="font-display text-[1.2rem] font-extrabold tracking-tight text-ink">
        {b.payTitle}
      </h3>

      {paid ? (
        <div className="mt-3 rounded-xl2 border-2 border-ok/40 bg-surface p-5">
          <p className="font-display text-[1.1rem] font-extrabold text-ink">
            {b.paidTitle}
          </p>
          <p className="mt-1 text-[1rem] leading-relaxed text-ink">{b.paidBody}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl2 border border-line bg-surface p-5">
          <PaymentButtons pkg={pkg} onApproved={notifyPaid} />

          <div className="mt-4 border-t border-line pt-4">
            {!bankOpen ? (
              <button
                onClick={() => setBankOpen(true)}
                className="font-display text-[1rem] font-bold text-accent hover:text-accent-ink"
              >
                {b.bankToggle}
              </button>
            ) : (
              <BankForm pkg={pkg} report={report} onDone={onBankDone} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function BankForm({
  pkg,
  report,
  onDone,
}: {
  pkg: Pkg;
  report: Report;
  onDone: () => void;
}) {
  const b = useStr().buy;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: b.bankSubject,
          Package: pkg.name,
          Price: formatEur(pkg.priceFrom) + (pkg.perMonth ? b.perMonth : ""),
          Name: name || "-",
          Email: email,
          Company: company || "-",
          Audit_score: `${report.score}/100`,
        }),
      });
      if (!res.ok) throw new Error("bad status");
      onDone();
    } catch {
      setStatus("error");
    }
  }

  const mailto =
    `mailto:${OWNER_EMAIL}?subject=` +
    encodeURIComponent(b.bankSubject) +
    "&body=" +
    encodeURIComponent(`${b.bankName}: ${name}\n${b.bankEmail}: ${email}\n${b.bankCompany}: ${company}\n${pkg.name}`);

  return (
    <form onSubmit={submit} className="grid gap-3">
      <p className="text-[1rem] font-semibold leading-relaxed text-ink">
        {b.bankIntro}
      </p>
      <p className="text-[0.95rem] leading-relaxed text-ink-2">{b.bankHow}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniField label={b.bankName} value={name} onChange={setName} autoComplete="name" />
        <MiniField label={b.bankEmail} value={email} onChange={setEmail} required autoComplete="email" placeholder={b.fEmailPh} />
      </div>
      <MiniField label={b.bankCompany} value={company} onChange={setCompany} autoComplete="organization" />
      <Button type="submit" size="md" disabled={!email.trim() || status === "sending"}>
        {status === "sending" ? b.bankSubmitting : b.bankSubmit}
      </Button>
      {status === "error" && (
        <p className="text-[0.95rem] font-medium text-risk-high">
          {b.errorPrefix}
          <a className="font-bold underline" href={mailto}>
            {b.errorLink}
          </a>
          .
        </p>
      )}
    </form>
  );
}

function IntakeSection({
  pkg,
  report,
  onDone,
}: {
  pkg: Pkg;
  report: Report;
  onDone: () => void;
}) {
  const b = useStr().buy;
  const [company, setCompany] = useState("");
  const [system, setSystem] = useState("");
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: b.intakeSubject,
          Package: pkg.name,
          Company: company || "-",
          Current_system: system || "-",
          Main_goal: goal || "-",
          Name: name,
          Email: email,
          Audit_score: `${report.score}/100 (${report.zoneLabel})`,
          Recommended_path: report.recommendation.title,
        }),
      });
      if (!res.ok) throw new Error("bad status");
      onDone();
    } catch {
      setStatus("error");
    }
  }

  const mailto =
    `mailto:${OWNER_EMAIL}?subject=` +
    encodeURIComponent(b.intakeSubject) +
    "&body=" +
    encodeURIComponent(
      `${b.fName}: ${name}\n${b.fEmail}: ${email}\n${b.fCompany}: ${company}\n${b.fSystem}: ${system}\n${b.fGoal}: ${goal}\n${pkg.name}`,
    );

  return (
    <section>
      <h3 className="font-display text-[1.2rem] font-extrabold tracking-tight text-ink">
        {b.intakeTitle}
      </h3>
      <p className="mt-1 text-[1rem] leading-relaxed text-ink-2">{b.intakeSubtitle}</p>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniField label={b.fCompany} value={company} onChange={setCompany} placeholder={b.fCompanyPh} autoComplete="organization" />
          <MiniField label={b.fSystem} value={system} onChange={setSystem} placeholder={b.fSystemPh} />
        </div>
        <label className="block">
          <span className="mb-1.5 block font-display text-[0.98rem] font-bold text-ink">
            {b.fGoal}
          </span>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder={b.fGoalPh}
            className="w-full resize-y rounded-xl border-2 border-line bg-paper px-4 py-2.5 text-[1.02rem] text-ink placeholder:text-ink-2/70 focus:border-accent focus:outline-none"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniField label={b.fName} value={name} onChange={setName} required placeholder={b.fNamePh} autoComplete="name" />
          <MiniField label={b.fEmail} value={email} onChange={setEmail} required placeholder={b.fEmailPh} autoComplete="email" />
        </div>
        <Button type="submit" disabled={!email.trim() || !name.trim() || status === "sending"}>
          {status === "sending" ? b.intakeSubmitting : b.intakeSubmit}
        </Button>
        {status === "error" && (
          <p className="text-[0.95rem] font-medium text-risk-high">
            {b.errorPrefix}
            <a className="font-bold underline" href={mailto}>
              {b.errorLink}
            </a>
            .
          </p>
        )}
      </form>
    </section>
  );
}

function DonePanel({ onClose }: { onClose: () => void }) {
  const b = useStr().buy;
  return (
    <div className="mt-8 rounded-xl2 border-2 border-ok/40 bg-surface p-6 text-center md:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok text-white">
        <CheckIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-[1.5rem] font-extrabold text-ink">
        {b.doneTitle}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[1.08rem] leading-relaxed text-ink">
        {b.doneBody}
      </p>
      <div className="mt-6">
        <Button size="md" onClick={onClose}>
          {b.close}
        </Button>
      </div>
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[0.98rem] font-bold text-ink">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-line bg-paper px-4 py-2.5 text-[1.02rem] text-ink placeholder:text-ink-2/70 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
